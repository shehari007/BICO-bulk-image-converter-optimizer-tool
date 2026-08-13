import type {
  GpuAdapterInfo,
  GpuAdapterKind,
  GpuTaskRequest,
  GpuTaskResult,
  PerformanceSettings
} from '@shared/types'
import { GPU_MAX_PIXELS } from '@shared/defaults'
import { errorMessage } from '@shared/utils'
import type { AdapterProbe } from './device'
import type { WorkerInbound, WorkerOutbound } from './gpu.worker'

/**
 * Owns one worker per usable adapter and decides which one runs each image.
 *
 * The contract with the main process is the important part of this file: a task
 * that was accepted always produces a result. A worker that crashes, a device
 * that is lost to a driver reset and a shader that fails validation all resolve
 * as a `GpuTaskFailure`, because the scheduler on the other side reads a failure
 * as retry this image on the CPU. A rejected promise, or one that never settles,
 * would stall the run instead.
 */

/** Nothing on a GPU lane should take this long. Past it the task is failed. */
const TASK_WATCHDOG_MS = 120_000

/** How long a lane is given to open its device before it counts as failed. */
const INIT_TIMEOUT_MS = 15_000

/** Weight of the newest sample in the rolling duration average. */
const DURATION_SMOOTHING = 0.25

export type LaneState = 'starting' | 'ready' | 'rebuilding' | 'dead'

export interface LaneTelemetry {
  readonly laneId: string
  readonly device: string
  readonly kind: GpuAdapterKind
  readonly state: LaneState
  readonly inFlight: number
  readonly completed: number
  readonly failed: number
  /** Exponentially weighted mean task duration, in milliseconds. */
  readonly averageMs: number
  readonly lastError: string
}

interface PendingTask {
  readonly laneId: string
  readonly settle: (result: GpuTaskResult) => void
  readonly watchdog: ReturnType<typeof setTimeout>
}

interface Lane {
  readonly id: string
  readonly probe: AdapterProbe
  info: GpuAdapterInfo
  worker: Worker | null
  state: LaneState
  inFlight: number
  completed: number
  failed: number
  averageMs: number
  lastError: string
  /** A lane is rebuilt at most once, then it stays dead for the session. */
  rebuilt: boolean
}

/**
 * Chooses which adapters get a lane.
 *
 * With `useAllGpus` off, a single lane is the right answer for the common case:
 * two lanes on a laptop means the integrated adapter takes a share of the queue
 * and finishes each of its images several times slower than the discrete one,
 * which lengthens the tail of the run even though the total throughput looks
 * higher. With it on, both run and the least busy routing sorts it out.
 */
export function selectLaneAdapters(
  probes: readonly AdapterProbe[],
  settings: PerformanceSettings
): AdapterProbe[] {
  // A software adapter never earns a lane. It is slower than the sharp pipeline
  // it would be taking work away from.
  const usable = probes.filter((probe) => probe.info.kind !== 'cpu')
  if (usable.length === 0) return []
  if (settings.useAllGpus) return usable.slice()

  const discrete = usable.find((probe) => probe.info.kind === 'discrete')
  if (settings.preferDiscreteGpu && discrete) return [discrete]
  const first = usable[0]
  return first ? [first] : []
}

export class GpuLaneManager {
  private readonly lanes = new Map<string, Lane>()
  private readonly pending = new Map<string, PendingTask>()
  private stopped = false

  /**
   * Brings up one worker per selected adapter.
   *
   * Lanes start in parallel and a lane that fails to open is left dead rather
   * than aborting the others, so a machine where one of two adapters is
   * blocklisted still gets GPU acceleration on the other.
   */
  async start(probes: readonly AdapterProbe[], settings: PerformanceSettings): Promise<void> {
    const selected = selectLaneAdapters(probes, settings)
    await Promise.all(selected.map((probe) => this.openLane(probe)))
  }

  private async openLane(probe: AdapterProbe): Promise<boolean> {
    const existing = this.lanes.get(probe.info.id)
    const lane: Lane = existing ?? {
      id: probe.info.id,
      probe,
      info: { ...probe.info, active: false },
      worker: null,
      state: 'starting',
      inFlight: 0,
      completed: 0,
      failed: 0,
      averageMs: 0,
      lastError: '',
      rebuilt: false
    }
    this.lanes.set(lane.id, lane)

    let worker: Worker
    try {
      // The `new URL` plus `import.meta.url` form is what the bundler rewrites
      // into a real worker entry, and `type: module` matches the renderer
      // worker format set in electron.vite.config.ts.
      worker = new Worker(new URL('./gpu.worker.ts', import.meta.url), {
        type: 'module',
        name: `bico-gpu-${lane.id}`
      })
    } catch (error) {
      lane.state = 'dead'
      lane.lastError = errorMessage(error)
      return false
    }

    lane.worker = worker
    lane.state = 'starting'

    const ready = new Promise<boolean>((resolve) => {
      let settled = false
      const finish = (ok: boolean, reason: string): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (!ok) {
          lane.state = 'dead'
          lane.lastError = reason
        }
        resolve(ok)
      }

      const timer = setTimeout(() => {
        finish(false, 'The GPU lane did not open in time')
      }, INIT_TIMEOUT_MS)

      worker.addEventListener('message', (event: MessageEvent<WorkerOutbound>) => {
        const message = event.data
        switch (message.type) {
          case 'ready':
            lane.info = { ...message.info, id: lane.id, active: true }
            lane.state = 'ready'
            finish(true, '')
            break
          case 'failed':
            finish(false, message.error)
            this.failLane(lane, message.error)
            break
          case 'result':
            this.completeTask(lane, message.result)
            break
          case 'uncaptured':
            // The device survived, so the lane keeps its worker and only the
            // image that provoked the error is failed.
            this.failTask(lane, message.taskId, message.reason)
            break
          case 'lost':
          default:
            finish(false, message.reason)
            this.failLane(lane, message.reason)
            break
        }
      })

      // A worker that throws during module evaluation never answers `init`, so
      // both error events have to be treated as a dead lane.
      worker.addEventListener('error', (event: ErrorEvent) => {
        const reason = event.message || 'The GPU worker crashed'
        finish(false, reason)
        this.failLane(lane, reason)
      })
      worker.addEventListener('messageerror', () => {
        const reason = 'A GPU worker message could not be deserialised'
        finish(false, reason)
        this.failLane(lane, reason)
      })
    })

    // The device is asked for exactly what an image at the app ceiling needs:
    // one readback buffer of GPU_MAX_PIXELS in RGBA, and an edge no longer than
    // the adapter already advertised.
    const init: WorkerInbound = {
      type: 'init',
      laneId: lane.id,
      powerPreference: probe.powerPreference,
      forceFallback: probe.forceFallback,
      fingerprint: probe.fingerprint,
      textureDimension: probe.info.maxTextureDimension,
      bufferBytes: GPU_MAX_PIXELS * 4
    }
    worker.postMessage(init)

    return ready
  }

  /**
   * Kills a lane, rebuilding it once before giving up on the adapter.
   *
   * A device lost event is usually a driver reset, which the same adapter
   * recovers from cleanly. A second failure means something about this machine
   * or this content does not agree with the GPU path, and continuing to send it
   * work would just convert every image into a slow failure and a CPU retry.
   */
  private failLane(lane: Lane, reason: string): void {
    lane.lastError = reason
    lane.info = { ...lane.info, active: false }

    // Everything queued on this lane is gone with the device.
    for (const [taskId, task] of this.pending) {
      if (task.laneId !== lane.id) continue
      this.settle(taskId, {
        taskId,
        ok: false,
        device: lane.info.description || lane.info.vendor,
        error: reason
      })
      lane.failed += 1
    }
    // Nothing is on this device any more. Leaving the depth where it was would
    // make a rebuilt lane look permanently busy, and the least busy routing
    // would never choose it again.
    lane.inFlight = 0

    lane.worker?.terminate()
    lane.worker = null

    if (this.stopped || lane.rebuilt) {
      lane.state = 'dead'
      return
    }

    lane.rebuilt = true
    lane.state = 'rebuilding'
    void this.openLane(lane.probe)
  }

  /**
   * Fails one image without touching the lane.
   *
   * An uncaptured validation error kills the work in flight, not the device, so
   * the per image fallback contract applies: this image goes to sharp and the
   * next one gets a fresh attempt on the same adapter. A task id that is no
   * longer pending means the error surfaced after its image had already
   * finished, and then there is nothing to fail.
   */
  private failTask(lane: Lane, taskId: string, reason: string): void {
    lane.lastError = reason
    const task = this.pending.get(taskId)
    if (!task || task.laneId !== lane.id) return

    lane.inFlight = Math.max(0, lane.inFlight - 1)
    lane.failed += 1
    this.settle(taskId, {
      taskId,
      ok: false,
      device: lane.info.description || lane.info.vendor,
      error: reason
    })
  }

  private completeTask(lane: Lane, result: GpuTaskResult): void {
    const task = this.pending.get(result.taskId)
    lane.inFlight = Math.max(0, lane.inFlight - 1)

    if (result.ok) {
      lane.completed += 1
      // Exponentially weighted so a lane that has just warmed up its shader
      // cache stops being judged on its first, slowest image.
      lane.averageMs =
        lane.averageMs === 0
          ? result.durationMs
          : lane.averageMs * (1 - DURATION_SMOOTHING) + result.durationMs * DURATION_SMOOTHING
    } else {
      lane.failed += 1
      lane.lastError = result.error
    }

    if (task) this.settle(result.taskId, result)
  }

  private settle(taskId: string, result: GpuTaskResult): void {
    const task = this.pending.get(taskId)
    if (!task) return
    this.pending.delete(taskId)
    clearTimeout(task.watchdog)
    task.settle(result)
  }

  /**
   * Picks the lane with the least work outstanding.
   *
   * Depth beats throughput as a signal here because the lanes are not equally
   * fast. Ties break on the rolling average, which sends the next image to the
   * adapter that has been finishing them faster, and that is what keeps a
   * discrete and an integrated lane in proportion without any hand tuning.
   */
  private pickLane(request: GpuTaskRequest): Lane | null {
    const requested = this.lanes.get(request.laneId)
    if (requested && requested.state === 'ready') return requested

    let best: Lane | null = null
    for (const lane of this.lanes.values()) {
      if (lane.state !== 'ready' || !lane.worker) continue
      if (!best) {
        best = lane
        continue
      }
      if (lane.inFlight < best.inFlight) {
        best = lane
      } else if (lane.inFlight === best.inFlight && lane.averageMs < best.averageMs) {
        best = lane
      }
    }
    return best
  }

  /** True while at least one lane can accept work. */
  get available(): boolean {
    for (const lane of this.lanes.values()) {
      if (lane.state === 'ready' && lane.worker) return true
    }
    return false
  }

  /**
   * Sends one task to a lane. Never rejects.
   *
   * The watchdog exists for the case the promise contract cannot otherwise
   * cover: a driver that wedges without reporting a lost device would leave the
   * task pending forever, and the main process has no timeout of its own.
   */
  submit(request: GpuTaskRequest): Promise<GpuTaskResult> {
    return new Promise<GpuTaskResult>((resolve) => {
      if (this.stopped) {
        resolve({
          taskId: request.taskId,
          ok: false,
          device: 'gpu',
          error: 'The GPU runtime is stopped'
        })
        return
      }

      const lane = this.pickLane(request)
      if (!lane || !lane.worker) {
        resolve({
          taskId: request.taskId,
          ok: false,
          device: 'gpu',
          error: 'No GPU lane is available'
        })
        return
      }

      const watchdog = setTimeout(() => {
        lane.inFlight = Math.max(0, lane.inFlight - 1)
        lane.failed += 1
        this.settle(request.taskId, {
          taskId: request.taskId,
          ok: false,
          device: lane.info.description || lane.info.vendor,
          error: `The GPU lane did not answer within ${TASK_WATCHDOG_MS} ms`
        })
      }, TASK_WATCHDOG_MS)

      this.pending.set(request.taskId, { laneId: lane.id, settle: resolve, watchdog })

      lane.inFlight += 1
      const message: WorkerInbound = { type: 'task', request }
      lane.worker.postMessage(message)
    })
  }

  telemetry(): LaneTelemetry[] {
    return [...this.lanes.values()].map((lane) => ({
      laneId: lane.id,
      device: lane.info.description || `${lane.info.vendor} ${lane.info.architecture}`.trim(),
      kind: lane.info.kind,
      state: lane.state,
      inFlight: lane.inFlight,
      completed: lane.completed,
      failed: lane.failed,
      averageMs: Math.round(lane.averageMs),
      lastError: lane.lastError
    }))
  }

  /** Adapter descriptions with `active` reflecting the live lane state. */
  adapters(): GpuAdapterInfo[] {
    return [...this.lanes.values()].map((lane) => ({
      ...lane.info,
      active: lane.state === 'ready'
    }))
  }

  /** Totals for the published status. */
  counters(): { processed: number; fallbacks: number } {
    let processed = 0
    let fallbacks = 0
    for (const lane of this.lanes.values()) {
      processed += lane.completed
      fallbacks += lane.failed
    }
    return { processed, fallbacks }
  }

  /** Terminates every lane and fails anything still outstanding. */
  stop(): void {
    this.stopped = true
    for (const [taskId, task] of this.pending) {
      clearTimeout(task.watchdog)
      this.pending.delete(taskId)
      task.settle({
        taskId,
        ok: false,
        device: 'gpu',
        error: 'The GPU runtime was stopped'
      })
    }
    for (const lane of this.lanes.values()) {
      const dispose: WorkerInbound = { type: 'dispose' }
      lane.worker?.postMessage(dispose)
      lane.worker?.terminate()
      lane.worker = null
      lane.state = 'dead'
      lane.info = { ...lane.info, active: false }
    }
  }
}
