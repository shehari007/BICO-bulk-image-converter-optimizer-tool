import type { WebContents } from 'electron'
import { EVENT } from '@shared/channels'
import { uid } from '@shared/utils'
import { createLogger } from './logger'
import type {
  ConversionSettings,
  GpuRoute,
  GpuStatus,
  GpuTaskRequest,
  GpuTaskResult
} from '@shared/types'

const log = createLogger('gpu')

const EMPTY_STATUS: GpuStatus = {
  supported: false,
  enabled: false,
  adapters: [],
  reason: 'the renderer has not reported adapter support yet',
  processed: 0,
  fallbacks: 0
}

interface Pending {
  resolve: (result: GpuTaskResult) => void
  timer: ReturnType<typeof setTimeout>
}

/**
 * Main process half of the GPU protocol.
 *
 * WebGPU only exists in the renderer, so the scheduler cannot call it directly.
 * Instead it posts a task over IPC and awaits the reply here. Every path
 * resolves, never rejects: a GPU failure is a routing decision, not an error, so
 * the scheduler simply reruns that image on the CPU pool.
 */
class GpuBridge {
  private target: WebContents | null = null
  private status: GpuStatus = EMPTY_STATUS
  private readonly pending = new Map<string, Pending>()
  private inFlight = 0
  private processed = 0
  private fallbacks = 0

  attach(contents: WebContents): void {
    this.target = contents
  }

  detach(): void {
    this.target = null
    // A reload wipes the GPU runtime, so anything outstanding has to be
    // released or the scheduler waits on a reply that can never arrive.
    for (const [taskId, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.resolve({
        taskId,
        ok: false,
        device: 'renderer',
        error: 'the renderer was reloaded while a GPU task was in flight'
      })
    }
    this.pending.clear()
    this.inFlight = 0
    this.status = EMPTY_STATUS
  }

  publishStatus(status: GpuStatus): void {
    this.status = status
    if (status.supported) {
      const names = status.adapters.map((adapter) => `${adapter.description} (${adapter.kind})`)
      log.info(`renderer reported ${status.adapters.length} adapter(s): ${names.join(', ')}`)
    } else {
      log.info(`GPU acceleration unavailable: ${status.reason}`)
    }
  }

  getStatus(): GpuStatus {
    return { ...this.status, processed: this.processed, fallbacks: this.fallbacks }
  }

  /** How many images may sit on GPU lanes at once. */
  capacity(): number {
    if (!this.isUsable()) return 0
    const lanes = this.status.adapters.filter((adapter) => adapter.active).length
    const effective = lanes > 0 ? lanes : 1
    // Two in flight per lane keeps a lane busy while the previous result is
    // still being encoded, without letting decoded bitmaps pile up in memory.
    return effective * 2
  }

  isUsable(): boolean {
    return this.target !== null && this.status.supported && this.status.enabled
  }

  get busy(): number {
    return this.inFlight
  }

  /**
   * Sends one image to the renderer for GPU processing.
   *
   * The timeout exists because a lost device can leave a worker wedged. Sixty
   * seconds is far longer than any single image should take, so hitting it is
   * always a real fault rather than a slow machine.
   */
  submit(input: {
    runId: string
    fileId: string
    sourceUrl: string
    route: GpuRoute
    settings: ConversionSettings
    laneId: string
  }): Promise<GpuTaskResult> {
    const target = this.target
    const taskId = uid('gpu')

    if (!target || target.isDestroyed()) {
      return Promise.resolve({
        taskId,
        ok: false,
        device: 'none',
        error: 'no renderer is attached to run GPU work'
      })
    }

    const request: GpuTaskRequest = { taskId, ...input }

    return new Promise<GpuTaskResult>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(taskId)
        this.inFlight = Math.max(0, this.inFlight - 1)
        this.fallbacks += 1
        resolve({
          taskId,
          ok: false,
          device: input.laneId,
          error: 'the GPU lane did not respond within 60 seconds'
        })
      }, 60_000)

      this.pending.set(taskId, { resolve, timer })
      this.inFlight += 1

      try {
        target.send(EVENT.gpuTask, request)
      } catch (error) {
        clearTimeout(timer)
        this.pending.delete(taskId)
        this.inFlight = Math.max(0, this.inFlight - 1)
        resolve({
          taskId,
          ok: false,
          device: input.laneId,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    })
  }

  /** Called from the IPC layer when the renderer posts a task result. */
  settle(result: GpuTaskResult): void {
    const pending = this.pending.get(result.taskId)
    if (!pending) {
      // Late arrival after a timeout. Dropping it is correct, the scheduler has
      // already rerun that image on the CPU.
      return
    }
    this.pending.delete(result.taskId)
    clearTimeout(pending.timer)
    this.inFlight = Math.max(0, this.inFlight - 1)

    if (result.ok) this.processed += 1
    else this.fallbacks += 1

    pending.resolve(result)
  }

  resetCounters(): void {
    this.processed = 0
    this.fallbacks = 0
  }
}

export const gpuBridge = new GpuBridge()
