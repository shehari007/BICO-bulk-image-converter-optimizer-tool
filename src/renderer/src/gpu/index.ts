import type { BicoApi, Unsubscribe } from '@shared/api'
import type { GpuStatus, PerformanceSettings } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/defaults'
import { errorMessage } from '@shared/utils'
import { disabledStatus, probeAdapterList, statusFromProbes, webGpu } from './device'
import { GpuLaneManager } from './lanes'
import type { LaneTelemetry } from './lanes'

/**
 * The GPU runtime, as the renderer app sees it.
 *
 * Start it once during boot and forget about it. From then on the main process
 * drives everything: it pushes a task over `EVENT.gpuTask`, a lane runs it, and
 * the result goes back through `postResult`. The React tree only ever reads
 * telemetry from here, it never issues GPU work itself.
 *
 * Every path through this module is survivable. A machine with no WebGPU, a
 * blocklisted driver, a GPU process that dies mid run: all of them end with a
 * published status explaining the situation and an app that keeps working on
 * the CPU.
 */

export type { LaneTelemetry } from './lanes'
export { GpuCapabilityError } from './pipeline'
export { probeAdapters } from './device'

/** How often the counters inside the published status are refreshed. */
const STATUS_PUBLISH_INTERVAL_MS = 1000

let manager: GpuLaneManager | null = null
let unsubscribeTask: Unsubscribe | null = null
let publishTimer: ReturnType<typeof setTimeout> | null = null
let starting: Promise<GpuStatus> | null = null
let status: GpuStatus = disabledStatus('The GPU runtime has not started')

/**
 * Reaches the preload bridge without depending on a global declaration.
 *
 * The renderer is contextIsolated, so `window.bico` is injected at runtime and
 * is genuinely absent in a unit test or a stray browser tab. Narrowing from
 * unknown keeps this file compiling on its own terms either way.
 */
function bridge(): BicoApi | null {
  const host = globalThis as unknown as { bico?: BicoApi }
  return host.bico ?? null
}

function publish(next: GpuStatus): void {
  status = next
  bridge()?.gpu.publishStatus(next)
}

/**
 * Refreshes the counters on a timer rather than after every image.
 *
 * A busy run finishes several images a second per lane, and each publish is an
 * IPC message plus a React render. One second is far below what a human reads
 * as lag and cuts the message rate by an order of magnitude.
 */
function schedulePublish(): void {
  if (publishTimer !== null || !manager) return
  publishTimer = setTimeout(() => {
    publishTimer = null
    if (!manager) return
    const counters = manager.counters()
    publish({
      ...status,
      adapters: manager.adapters(),
      processed: counters.processed,
      fallbacks: counters.fallbacks
    })
  }, STATUS_PUBLISH_INTERVAL_MS)
}

/**
 * Probes the machine, opens the lanes and starts listening for work.
 *
 * Safe to call more than once: a second call while the first is still probing
 * joins it, and a call after startup returns the status already published.
 */
export function startGpuRuntime(settings?: PerformanceSettings): Promise<GpuStatus> {
  if (manager) return Promise.resolve(status)
  if (starting) return starting

  const performanceSettings = settings ?? DEFAULT_SETTINGS.performance
  starting = boot(performanceSettings).finally(() => {
    starting = null
  })
  return starting
}

async function boot(settings: PerformanceSettings): Promise<GpuStatus> {
  // The whole feature is optional. Publishing the refusal is not: the settings
  // panel needs a reason to show, and the main process needs to know that every
  // image belongs on a sharp worker.
  if (!webGpu()) {
    publish(disabledStatus('WebGPU is not available, every image will use the CPU pipeline'))
    return status
  }

  try {
    const probes = await probeAdapterList()
    const probed = statusFromProbes(probes)

    if (settings.backend === 'cpu') {
      // The adapters are still reported so the diagnostics panel can show what
      // the machine has, but no lane is opened.
      publish({ ...probed, enabled: false, reason: 'The CPU backend is selected in settings' })
      return status
    }

    if (!probed.enabled) {
      publish(probed)
      return status
    }

    const lanes = new GpuLaneManager()
    await lanes.start(probes, settings)

    if (!lanes.available) {
      lanes.stop()
      publish({
        ...probed,
        enabled: false,
        reason: 'No GPU lane could open a device, falling back to the CPU pipeline'
      })
      return status
    }

    manager = lanes
    attachTaskListener(lanes)
    publish({ ...probed, adapters: lanes.adapters(), enabled: true })
    return status
  } catch (error) {
    publish(disabledStatus(`The GPU runtime failed to start: ${errorMessage(error)}`))
    return status
  }
}

/**
 * Wires the main process task stream into the lanes.
 *
 * `submit` never rejects, so there is no catch here by design: whatever comes
 * back, success or failure, is posted straight to the main process, which is
 * what keeps a stalled image impossible.
 */
function attachTaskListener(lanes: GpuLaneManager): void {
  const api = bridge()
  if (!api) return

  unsubscribeTask = api.on.gpuTask((task) => {
    void lanes.submit(task).then((result) => {
      api.gpu.postResult(result)
      schedulePublish()
    })
  })
}

/** Per lane statistics for the diagnostics panel. Empty when not running. */
export function getGpuTelemetry(): LaneTelemetry[] {
  return manager?.telemetry() ?? []
}

/** The most recently published status, without touching the GPU again. */
export function getGpuStatus(): GpuStatus {
  return status
}

/** Tears the runtime down. Outstanding tasks resolve as failures first. */
export function stopGpuRuntime(): void {
  if (publishTimer !== null) {
    clearTimeout(publishTimer)
    publishTimer = null
  }
  unsubscribeTask?.()
  unsubscribeTask = null

  const lanes = manager
  manager = null
  if (!lanes) return

  lanes.stop()
  publish({
    ...status,
    enabled: false,
    adapters: lanes.adapters(),
    reason: 'The GPU runtime was stopped'
  })
}
