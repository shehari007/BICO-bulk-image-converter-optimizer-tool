import { cpus } from 'node:os'
import { join } from 'node:path'
import { Worker } from 'node:worker_threads'
import { uid } from '@shared/utils'
import { createLogger } from './logger'
import type {
  WorkerInbound,
  WorkerJobRequest,
  WorkerJobResponse,
  WorkerOutbound,
  WorkerPreviewRequest,
  WorkerPreviewResponse
} from '@shared/types'

const log = createLogger('pool')

interface PendingTask {
  jobId: string
  message: WorkerInbound
  transfer: ArrayBuffer[]
  resolve: (value: WorkerJobResponse | WorkerPreviewResponse) => void
  reject: (error: Error) => void
  /** Preview requests jump the queue so the UI stays responsive mid run. */
  priority: number
}

interface Lane {
  index: number
  worker: Worker
  current: PendingTask | null
  completed: number
  alive: boolean
}

export interface PoolOptions {
  size: number
  vipsConcurrency: number
  cacheMemoryMb: number
}

export interface PoolInfo {
  size: number
  sharp: string
  libvips: string
}

/**
 * A fixed size pool of worker threads, each owning its own sharp instance.
 *
 * Running sharp on the main thread would block IPC and the window would stop
 * repainting during a batch. Running it in the renderer, which is what v2 did,
 * blocked the UI thread directly. Worker threads keep both free, and because
 * libvips releases the JavaScript thread while it works, throughput scales with
 * physical cores rather than being serialised behind one event loop.
 */
export class WorkerPool {
  private readonly lanes: Lane[] = []
  private readonly queue: PendingTask[] = []
  private readonly workerPath: string
  private options: PoolOptions
  private paused = false
  private destroyed = false
  private info: PoolInfo
  private readyResolvers: (() => void)[] = []

  constructor(options: Partial<PoolOptions> = {}) {
    this.options = {
      size: resolvePoolSize(options.size ?? 0),
      vipsConcurrency: options.vipsConcurrency ?? 0,
      cacheMemoryMb: options.cacheMemoryMb ?? 256
    }
    this.workerPath = join(__dirname, 'workers', 'image.worker.js')
    this.info = { size: this.options.size, sharp: 'unknown', libvips: 'unknown' }

    for (let i = 0; i < this.options.size; i += 1) {
      this.spawn(i)
    }

    log.info(`started ${this.options.size} image workers`)
  }

  get poolInfo(): PoolInfo {
    return { ...this.info, size: this.lanes.filter((lane) => lane.alive).length }
  }

  get queueDepth(): number {
    return this.queue.length
  }

  get activeCount(): number {
    return this.lanes.reduce((sum, lane) => sum + (lane.current ? 1 : 0), 0)
  }

  /** Resolves once at least one worker has reported its sharp version. */
  whenReady(): Promise<void> {
    if (this.info.sharp !== 'unknown') return Promise.resolve()
    return new Promise((resolve) => {
      this.readyResolvers.push(resolve)
    })
  }

  private spawn(index: number): void {
    if (this.destroyed) return

    const worker = new Worker(this.workerPath)
    const lane: Lane = { index, worker, current: null, completed: 0, alive: true }

    worker.on('message', (message: WorkerOutbound) => {
      this.handleMessage(lane, message)
    })

    worker.on('error', (error) => {
      log.error(`worker ${index} crashed`, error)
      this.failCurrent(lane, error instanceof Error ? error : new Error(String(error)))
      this.replace(lane)
    })

    worker.on('exit', (code) => {
      if (!lane.alive || this.destroyed) return
      log.warn(`worker ${index} exited unexpectedly with code ${code}`)
      this.failCurrent(lane, new Error(`image worker exited with code ${code}`))
      this.replace(lane)
    })

    const configure: WorkerInbound = {
      kind: 'configure',
      payload: {
        vipsConcurrency: this.options.vipsConcurrency,
        cacheMemoryMb: this.options.cacheMemoryMb
      }
    }
    worker.postMessage(configure)

    const existing = this.lanes.findIndex((candidate) => candidate.index === index)
    if (existing >= 0) {
      this.lanes[existing] = lane
    } else {
      this.lanes.push(lane)
    }
  }

  /**
   * A crashed worker is replaced once so a single malformed image cannot
   * permanently shrink the pool. The task it was holding is failed rather than
   * retried, because a crash usually means that specific input is the problem.
   */
  private replace(lane: Lane): void {
    if (this.destroyed) return
    lane.alive = false
    void lane.worker.terminate().catch(() => undefined)
    setTimeout(() => {
      if (this.destroyed) return
      this.spawn(lane.index)
      this.drain()
    }, 100)
  }

  private failCurrent(lane: Lane, error: Error): void {
    const task = lane.current
    lane.current = null
    if (task) task.reject(error)
  }

  private handleMessage(lane: Lane, message: WorkerOutbound): void {
    if (message.kind === 'ready') {
      if (this.info.sharp === 'unknown') {
        this.info = {
          size: this.options.size,
          sharp: message.payload.sharp,
          libvips: message.payload.libvips
        }
        const resolvers = this.readyResolvers
        this.readyResolvers = []
        for (const resolve of resolvers) resolve()
      }
      return
    }

    const task = lane.current
    lane.current = null
    lane.completed += 1

    if (task) {
      task.resolve(message.payload)
    }

    this.drain()
  }

  private enqueue(
    message: WorkerInbound,
    transfer: ArrayBuffer[],
    priority: number,
    jobId: string
  ): Promise<WorkerJobResponse | WorkerPreviewResponse> {
    if (this.destroyed) {
      return Promise.reject(new Error('worker pool has been shut down'))
    }

    return new Promise((resolve, reject) => {
      const task: PendingTask = { jobId, message, transfer, resolve, reject, priority }

      // Higher priority first, otherwise first in first out. A linear insert is
      // fine because the queue is short: only unstarted work sits here.
      const at = this.queue.findIndex((candidate) => candidate.priority < priority)
      if (at === -1) this.queue.push(task)
      else this.queue.splice(at, 0, task)

      this.drain()
    })
  }

  run(request: WorkerJobRequest): Promise<WorkerJobResponse> {
    const transfer = request.prepared ? [request.prepared.pixels] : []
    return this.enqueue(
      { kind: 'job', payload: request },
      transfer,
      0,
      request.jobId
    ) as Promise<WorkerJobResponse>
  }

  preview(request: WorkerPreviewRequest): Promise<WorkerPreviewResponse> {
    return this.enqueue(
      { kind: 'preview', payload: request },
      [],
      10,
      request.jobId
    ) as Promise<WorkerPreviewResponse>
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
    this.drain()
  }

  /** Drops everything still waiting. Work already inside a worker finishes. */
  clearQueue(): void {
    const dropped = this.queue.splice(0, this.queue.length)
    for (const task of dropped) {
      task.reject(new Error('cancelled'))
    }
  }

  private drain(): void {
    if (this.destroyed) return

    while (this.queue.length > 0) {
      // Previews are allowed through while the run is paused, because pausing a
      // conversion should not also freeze the settings preview.
      const next = this.queue[0]
      if (!next) break
      if (this.paused && next.priority === 0) break

      const lane = this.lanes.find((candidate) => candidate.alive && candidate.current === null)
      if (!lane) break

      this.queue.shift()
      lane.current = next
      try {
        lane.worker.postMessage(next.message, next.transfer)
      } catch (error) {
        lane.current = null
        next.reject(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  async reconfigure(options: Partial<PoolOptions>): Promise<void> {
    const nextSize = resolvePoolSize(options.size ?? this.options.size)
    const needsRestart =
      nextSize !== this.options.size ||
      (options.vipsConcurrency ?? this.options.vipsConcurrency) !== this.options.vipsConcurrency ||
      (options.cacheMemoryMb ?? this.options.cacheMemoryMb) !== this.options.cacheMemoryMb

    this.options = {
      size: nextSize,
      vipsConcurrency: options.vipsConcurrency ?? this.options.vipsConcurrency,
      cacheMemoryMb: options.cacheMemoryMb ?? this.options.cacheMemoryMb
    }

    if (!needsRestart) return

    log.info(`reconfiguring pool to ${nextSize} workers`)
    await this.destroy()
    this.destroyed = false
    this.lanes.length = 0
    for (let i = 0; i < nextSize; i += 1) this.spawn(i)
  }

  async destroy(): Promise<void> {
    this.destroyed = true
    this.clearQueue()
    const lanes = this.lanes.slice()
    await Promise.all(
      lanes.map(async (lane) => {
        lane.alive = false
        try {
          const shutdown: WorkerInbound = { kind: 'shutdown' }
          lane.worker.postMessage(shutdown)
        } catch {
          // The worker may already be gone, which is exactly what we want.
        }
        await lane.worker.terminate().catch(() => undefined)
      })
    )
  }
}

/**
 * Leaves one core for the compositor and the main process.
 *
 * libvips already spreads a single image across threads, so oversubscribing the
 * pool past the core count makes a batch slower, not faster: the workers start
 * fighting each other for the same cache lines.
 */
export function resolvePoolSize(requested: number): number {
  if (requested > 0) return Math.min(requested, 32)
  const cores = cpus().length || 4
  return Math.max(2, Math.min(cores - 1, 12))
}

export function newJobId(): string {
  return uid('job')
}
