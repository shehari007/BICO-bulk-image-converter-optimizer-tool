import { join } from 'node:path'
import { isBrowserEncodable } from '@shared/formats'
import { errorMessage, toMbps, uid } from '@shared/utils'
import { createLogger } from './logger'
import { getFiles, sourceUrl } from './files'
import { gpuBridge } from './gpu-bridge'
import { ZipWriter } from './zip'
import { writeCsvReport } from './report'
import type { WorkerPool } from './pool'
import type {
  BackendUsed,
  ConversionSettings,
  ConvertRequest,
  GpuRoute,
  JobOutput,
  JobUpdate,
  RunError,
  RunProgress,
  RunState,
  RunSummary,
  SourceFile,
  WorkerJobRequest
} from '@shared/types'

const log = createLogger('scheduler')

export interface SchedulerEvents {
  onJob(update: JobUpdate): void
  onProgress(progress: RunProgress): void
  onComplete(summary: RunSummary): void
}

interface FileResult {
  file: SourceFile
  ok: boolean
  skipped: boolean
  backend: BackendUsed
  device: string
  outputs: JobOutput[]
  originalSize: number
  outputSize: number
  durationMs: number
  error: string | null
}

interface ActiveRun {
  id: string
  files: SourceFile[]
  settings: ConversionSettings
  presetName: string
  startedAt: number
  state: RunState
  nextIndex: number
  completed: number
  failed: number
  skipped: number
  bytesIn: number
  bytesOut: number
  gpuCount: number
  cpuCount: number
  errors: RunError[]
  zip: ZipWriter | null
  zipPath: string
  results: FileResult[]
  activeDevices: Set<string>
  /** Resolves when every dispatched file has settled. */
  finished: Promise<void>
  settle: () => void
  cancelRequested: boolean
  pauseGate: Promise<void>
  releasePause: (() => void) | null
}

/**
 * Owns exactly one conversion run at a time.
 *
 * Files are pulled from a shared cursor by whichever lane frees up first,
 * rather than being partitioned up front. Static partitioning looks tidier but
 * performs badly here, because image cost varies by an order of magnitude
 * within a single folder and one lane would finish long before the others.
 */
class Scheduler {
  private run: ActiveRun | null = null
  private pool: WorkerPool | null = null
  private events: SchedulerEvents | null = null
  private progressTimer: ReturnType<typeof setInterval> | null = null

  bind(pool: WorkerPool, events: SchedulerEvents): void {
    this.pool = pool
    this.events = events
  }

  get isRunning(): boolean {
    return this.run !== null && this.run.state !== 'done' && this.run.state !== 'cancelled'
  }

  get currentState(): RunState {
    return this.run?.state ?? 'idle'
  }

  async start(request: ConvertRequest): Promise<string> {
    if (this.isRunning) {
      throw new Error('a conversion is already running')
    }

    const pool = this.pool
    const events = this.events
    if (!pool || !events) throw new Error('the scheduler has not been bound to a worker pool')

    const files = getFiles(request.fileIds)
    if (files.length === 0) throw new Error('no readable files were selected')

    const settings = request.settings
    const runId = uid('run')

    let zip: ZipWriter | null = null
    let zipPath = ''
    if (settings.output.target === 'zip') {
      zipPath =
        settings.output.zipPath ||
        join(settings.output.folder || process.cwd(), `bico-${Date.now()}.zip`)
      zip = await ZipWriter.create(zipPath, settings.output.zipCompressionLevel)
    }

    let settle: () => void = () => undefined
    const finished = new Promise<void>((resolve) => {
      settle = resolve
    })

    const run: ActiveRun = {
      id: runId,
      files,
      settings,
      presetName: request.presetName,
      startedAt: Date.now(),
      state: 'running',
      nextIndex: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      bytesIn: 0,
      bytesOut: 0,
      gpuCount: 0,
      cpuCount: 0,
      errors: [],
      zip,
      zipPath,
      results: [],
      activeDevices: new Set(),
      finished,
      settle,
      cancelRequested: false,
      pauseGate: Promise.resolve(),
      releasePause: null
    }

    this.run = run
    gpuBridge.resetCounters()

    log.info(
      `run ${runId} started: ${files.length} files, format ${settings.format}, ` +
        `backend ${settings.performance.backend}, target ${settings.output.target}`
    )

    this.startProgressTicker()
    void this.execute(run, pool, events)

    return runId
  }

  /** Spins up the lanes and waits for them all to drain. */
  private async execute(run: ActiveRun, pool: WorkerPool, events: SchedulerEvents): Promise<void> {
    const gpuLanes = this.gpuLaneCount(run.settings)

    // Choosing the GPU explicitly has to mean it, so no CPU preferring lanes are
    // opened alongside it. Leaving them in place is what made a forced GPU run
    // still send most of the batch to sharp: every lane pulls from the same
    // cursor, so eleven CPU lanes simply won the race. Images the GPU cannot
    // take still fall back per image inside the lane, and a machine with no
    // usable adapter falls back to the full pool.
    const forceGpu = run.settings.performance.backend === 'gpu' && gpuLanes > 0
    const cpuLanes = forceGpu ? 0 : pool.poolInfo.size
    const laneCount = Math.max(1, cpuLanes + gpuLanes)

    log.info(`run ${run.id} dispatching across ${cpuLanes} CPU lanes and ${gpuLanes} GPU lanes`)

    const lanes: Promise<void>[] = []
    for (let i = 0; i < laneCount; i += 1) {
      const preferGpu = i < gpuLanes
      lanes.push(this.laneLoop(run, pool, events, preferGpu, i))
    }

    await Promise.all(lanes)
    await this.finish(run, events)
  }

  private gpuLaneCount(settings: ConversionSettings): number {
    if (settings.performance.backend === 'cpu') return 0
    return gpuBridge.capacity()
  }

  /** One lane repeatedly claims the next file until the queue is empty. */
  private async laneLoop(
    run: ActiveRun,
    pool: WorkerPool,
    events: SchedulerEvents,
    preferGpu: boolean,
    laneIndex: number
  ): Promise<void> {
    for (;;) {
      if (run.cancelRequested) return
      await run.pauseGate
      if (run.cancelRequested) return

      const index = run.nextIndex
      if (index >= run.files.length) return
      run.nextIndex += 1

      const file = run.files[index]
      if (!file) return

      const result = await this.processOne(run, pool, file, index, preferGpu, laneIndex)
      this.record(run, result, index, events)
    }
  }

  /**
   * Runs one file, choosing a backend and falling back to the CPU on any GPU
   * failure. A GPU error is never surfaced to the user: the image simply takes
   * the slower route and the fallback is counted in the diagnostics panel.
   */
  private async processOne(
    run: ActiveRun,
    pool: WorkerPool,
    file: SourceFile,
    index: number,
    preferGpu: boolean,
    laneIndex: number
  ): Promise<FileResult> {
    const started = Date.now()
    const settings = run.settings

    const route = preferGpu ? this.gpuRouteFor(settings, file) : null

    if (route) {
      const laneId = `gpu-${laneIndex}`
      run.activeDevices.add(laneId)
      const task = await gpuBridge.submit({
        runId: run.id,
        fileId: file.id,
        sourceUrl: sourceUrl(file.id),
        route,
        settings,
        laneId
      })
      run.activeDevices.delete(laneId)

      if (task.ok) {
        const request = this.buildWorkerRequest(run, file, index)
        if (task.route === 'full' && task.encoded) {
          request.preEncoded = { data: task.encoded, width: task.width, height: task.height }
        } else if (task.pixels) {
          request.prepared = {
            pixels: task.pixels,
            width: task.width,
            height: task.height,
            channels: 4
          }
        }

        try {
          const response = await pool.run(request)
          run.gpuCount += 1
          return this.toResult(run, file, response, 'gpu', task.device, started)
        } catch (error) {
          // The write step failed rather than the GPU step, so there is nothing
          // to gain from a CPU retry: report it.
          return {
            file,
            ok: false,
            skipped: false,
            backend: 'gpu',
            device: task.device,
            outputs: [],
            originalSize: file.size,
            outputSize: 0,
            durationMs: Date.now() - started,
            error: errorMessage(error)
          }
        }
      }

      log.debug(`file ${file.name} fell back to CPU: ${task.error}`)
    }

    const deviceLabel = `cpu-${laneIndex}`
    run.activeDevices.add(deviceLabel)
    try {
      const response = await pool.run(this.buildWorkerRequest(run, file, index))
      run.cpuCount += 1
      return this.toResult(run, file, response, 'cpu', deviceLabel, started)
    } catch (error) {
      return {
        file,
        ok: false,
        skipped: false,
        backend: 'cpu',
        device: deviceLabel,
        outputs: [],
        originalSize: file.size,
        outputSize: 0,
        durationMs: Date.now() - started,
        error: errorMessage(error)
      }
    } finally {
      run.activeDevices.delete(deviceLabel)
    }
  }

  private buildWorkerRequest(run: ActiveRun, file: SourceFile, index: number): WorkerJobRequest {
    return {
      jobId: uid('job'),
      file,
      settings: run.settings,
      presetName: run.presetName,
      index,
      total: run.files.length,
      prepared: null,
      preEncoded: null
    }
  }

  /**
   * Decides whether an image is worth sending to a GPU lane, and how far the
   * GPU can take it.
   *
   * The `full` route means Chromium can also write the target container, so the
   * image never returns as raw pixels. That is only safe when nothing later in
   * the pipeline needs a real decoder: metadata retention, a byte size search
   * and extra size variants all have to happen in sharp.
   */
  private gpuRouteFor(settings: ConversionSettings, file: SourceFile): GpuRoute | null {
    if (!gpuBridge.isUsable()) return null
    if (settings.performance.backend === 'cpu') return null

    // Animated sources have to stay on the CPU: createImageBitmap only ever
    // hands back the first frame, which would silently drop the animation.
    if (settings.animated && (file.ext === 'gif' || file.ext === 'webp' || file.ext === 'avif')) {
      return null
    }
    // createImageBitmap cannot open any of these, so a GPU lane would have
    // nothing to work on. JPEG XL is in the list even though BICO can read it,
    // because that decoder lives in the worker pool and not in the browser.
    if (file.ext === 'tif' || file.ext === 'tiff' || file.ext === 'jxl') {
      return null
    }

    const canEncodeInBrowser =
      isBrowserEncodable(settings.format) &&
      settings.variants.length === 0 &&
      settings.smart.sizeTarget === 'off' &&
      settings.metadata.policy === 'strip' &&
      !settings.metadata.setDensity

    if (canEncodeInBrowser) return 'full'
    if (settings.performance.gpuAssistedEncode) return 'assist'
    return null
  }

  /**
   * Folds a worker reply into a per file result, and drains any ZIP entries it
   * carried. The run is passed in rather than read off the instance so a reply
   * can never be attributed to a different run than the one that asked for it.
   */
  private toResult(
    run: ActiveRun,
    file: SourceFile,
    response: {
      ok: boolean
      skipped: boolean
      outputs: JobOutput[]
      outputSize: number
      error: string | null
      buffers?: { name: string; data: ArrayBuffer }[]
    },
    backend: BackendUsed,
    device: string,
    started: number
  ): FileResult {
    if (run.zip && response.buffers) {
      for (const entry of response.buffers) {
        run.zip.append(entry.name, Buffer.from(entry.data))
      }
    }

    return {
      file,
      ok: response.ok,
      skipped: response.skipped,
      backend,
      device,
      outputs: response.outputs,
      originalSize: file.size,
      outputSize: response.outputSize,
      durationMs: Date.now() - started,
      error: response.error
    }
  }

  private record(run: ActiveRun, result: FileResult, index: number, events: SchedulerEvents): void {
    run.results.push(result)

    if (result.skipped) {
      run.skipped += 1
    } else if (result.ok) {
      run.completed += 1
      run.bytesIn += result.originalSize
      run.bytesOut += result.outputSize
    } else {
      run.failed += 1
      run.errors.push({
        fileId: result.file.id,
        fileName: result.file.name,
        message: result.error ?? 'unknown error'
      })
    }

    const update: JobUpdate = {
      runId: run.id,
      fileId: result.file.id,
      index,
      total: run.files.length,
      state: result.skipped ? 'skipped' : result.ok ? 'done' : 'failed',
      backend: result.backend,
      device: result.device,
      originalSize: result.originalSize,
      outputSize: result.outputSize,
      durationMs: result.durationMs,
      outputs: result.outputs,
      error: result.error
    }

    events.onJob(update)
  }

  private buildProgress(run: ActiveRun): RunProgress {
    const settled = run.completed + run.failed + run.skipped
    const elapsedMs = Date.now() - run.startedAt
    const imagesPerSecond = elapsedMs > 0 ? settled / (elapsedMs / 1000) : 0
    const remaining = Math.max(0, run.files.length - settled)

    return {
      runId: run.id,
      state: run.state,
      completed: run.completed,
      failed: run.failed,
      skipped: run.skipped,
      total: run.files.length,
      percent: run.files.length > 0 ? (settled / run.files.length) * 100 : 0,
      bytesIn: run.bytesIn,
      bytesOut: run.bytesOut,
      throughputMbps: toMbps(run.bytesIn, elapsedMs),
      imagesPerSecond,
      etaMs: imagesPerSecond > 0 ? (remaining / imagesPerSecond) * 1000 : 0,
      elapsedMs,
      activeDevices: [...run.activeDevices]
    }
  }

  /**
   * Progress is pushed on a timer rather than after every file. A run over ten
   * thousand small images would otherwise post ten thousand IPC messages and
   * spend more time repainting the progress bar than converting.
   */
  private startProgressTicker(): void {
    this.stopProgressTicker()
    this.progressTimer = setInterval(() => {
      const run = this.run
      const events = this.events
      if (!run || !events) return
      events.onProgress(this.buildProgress(run))
    }, 200)
  }

  private stopProgressTicker(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer)
      this.progressTimer = null
    }
  }

  private async finish(run: ActiveRun, events: SchedulerEvents): Promise<void> {
    run.state = 'finishing'
    events.onProgress(this.buildProgress(run))

    let outputLocation = run.settings.output.folder

    if (run.zip) {
      try {
        if (run.cancelRequested && run.completed === 0) {
          await run.zip.abort()
          outputLocation = ''
        } else {
          await run.zip.finalize()
          outputLocation = run.zipPath
        }
      } catch (error) {
        log.error('failed to close the archive', error)
        run.errors.push({ fileId: '', fileName: run.zipPath, message: errorMessage(error) })
      }
    } else if (run.settings.output.target === 'in-place') {
      outputLocation = run.files[0]?.dir ?? ''
    }

    let reportPath: string | null = null
    if (run.settings.output.writeReport) {
      try {
        reportPath = await writeCsvReport(run.id, outputLocation, run.results)
      } catch (error) {
        log.warn(`could not write the run report: ${errorMessage(error)}`)
      }
    }

    const finishedAt = Date.now()
    const summary: RunSummary = {
      runId: run.id,
      startedAt: run.startedAt,
      finishedAt,
      durationMs: finishedAt - run.startedAt,
      total: run.files.length,
      processed: run.completed,
      failed: run.failed,
      skipped: run.skipped,
      bytesIn: run.bytesIn,
      bytesOut: run.bytesOut,
      savedBytes: run.bytesIn - run.bytesOut,
      savedPercent: run.bytesIn > 0 ? ((run.bytesIn - run.bytesOut) / run.bytesIn) * 100 : 0,
      format: run.settings.format,
      presetName: run.presetName,
      outputTarget: run.settings.output.target,
      outputLocation,
      reportPath,
      gpuCount: run.gpuCount,
      cpuCount: run.cpuCount,
      cancelled: run.cancelRequested,
      errors: run.errors
    }

    run.state = run.cancelRequested ? 'cancelled' : 'done'
    this.stopProgressTicker()
    events.onProgress(this.buildProgress(run))
    events.onComplete(summary)

    log.info(
      `run ${run.id} finished in ${summary.durationMs}ms: ${summary.processed} processed, ` +
        `${summary.failed} failed, ${summary.skipped} skipped, ` +
        `${summary.gpuCount} on GPU, ${summary.cpuCount} on CPU`
    )

    run.settle()
    this.run = null
  }

  pause(): void {
    const run = this.run
    if (!run || run.state !== 'running') return
    run.state = 'paused'
    run.pauseGate = new Promise<void>((resolve) => {
      run.releasePause = resolve
    })
    this.pool?.pause()
    log.info(`run ${run.id} paused`)
  }

  resume(): void {
    const run = this.run
    if (!run || run.state !== 'paused') return
    run.state = 'running'
    run.releasePause?.()
    run.releasePause = null
    run.pauseGate = Promise.resolve()
    this.pool?.resume()
    log.info(`run ${run.id} resumed`)
  }

  /**
   * Cancellation is cooperative. Work already inside a worker is allowed to
   * finish so partial output is never left half written, but no new file is
   * claimed once the flag is set.
   */
  cancel(): void {
    const run = this.run
    if (!run) return
    run.cancelRequested = true
    run.state = 'finishing'
    run.releasePause?.()
    run.releasePause = null
    run.pauseGate = Promise.resolve()
    this.pool?.resume()
    this.pool?.clearQueue()
    log.info(`run ${run.id} cancellation requested`)
  }

  /** Used on quit so the archive is closed before the process exits. */
  async waitForIdle(): Promise<void> {
    const run = this.run
    if (!run) return
    await run.finished
  }
}

export const scheduler = new Scheduler()
