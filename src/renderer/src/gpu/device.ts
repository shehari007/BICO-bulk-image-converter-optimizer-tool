import type { GpuAdapterInfo, GpuAdapterKind, GpuStatus } from '@shared/types'
import { errorMessage } from '@shared/utils'

/**
 * Adapter discovery, device creation and capability probing.
 *
 * WebGPU deliberately refuses to enumerate adapters. The only handle the API
 * gives is `requestAdapter({ powerPreference })`, so discovering a machine with
 * more than one GPU means asking for both preferences and comparing what comes
 * back. On a laptop with an NVIDIA discrete part and an Intel integrated part
 * that returns two different adapters; on a desktop with a single GPU it
 * returns the same one twice, which is why every probe is deduplicated on the
 * adapter identity rather than on the request that produced it.
 */

/** Power preferences probed at startup, in the order they are tried. */
const PROBE_PREFERENCES: readonly GPUPowerPreference[] = ['high-performance', 'low-power']

/**
 * Defaults from the WebGPU specification for the limits this app raises.
 *
 * A device is asked for exactly what the pipeline needs, never for the adapter
 * maximum: a device that requests more than it uses can be refused outright on
 * a constrained adapter, and on a shared machine it reserves address space no
 * one benefits from.
 */
const SPEC_DEFAULT_MAX_TEXTURE_DIMENSION_2D = 8192
const SPEC_DEFAULT_MAX_BUFFER_SIZE = 268_435_456
const SPEC_DEFAULT_MAX_STORAGE_BUFFER_BINDING_SIZE = 134_217_728

/** One adapter the machine actually exposes, with the way to ask for it again. */
export interface AdapterProbe {
  readonly info: GpuAdapterInfo
  /** The preference that produced this adapter, replayed by the worker. */
  readonly powerPreference: GPUPowerPreference
  /** Set when this entry came from the software fallback probe. */
  readonly forceFallback: boolean
  /** Identity tuple, used to detect that a lane opened the wrong adapter. */
  readonly fingerprint: string
}

export interface DeviceRequest {
  readonly powerPreference: GPUPowerPreference
  readonly forceFallback: boolean
  readonly fingerprint: string
  /** Longest texture edge the lane will allocate for any single image. */
  readonly textureDimension: number
  /** Largest single buffer the lane will map for readback. */
  readonly bufferBytes: number
}

export interface DeviceHooks {
  /** Fired once, when the driver drops the device. The lane is dead after this. */
  onLost(reason: string): void
  /** Fired for every validation or out of memory error the queue reports. */
  onUncapturedError(message: string): void
}

export interface LaneDevice {
  readonly device: GPUDevice
  readonly info: GpuAdapterInfo
  /** True when the opened adapter is not the one the scheduler expected. */
  readonly fingerprintMatched: boolean
}

/**
 * Reaches `navigator.gpu` without asserting that it exists.
 *
 * The renderer runs on machines with no WebGPU at all, and on machines where
 * Chromium blocklisted the driver, so this returns null rather than throwing.
 */
export function webGpu(): GPU | null {
  const nav: { gpu?: GPU } = navigator
  return nav.gpu ?? null
}

/** The four strings that identify an adapter, joined into one comparable key. */
function fingerprintOf(info: GPUAdapterInfo): string {
  return [info.vendor, info.architecture, info.device, info.description].join('|')
}

/** Reads a boolean IDL attribute that may or may not exist on this runtime. */
function readBooleanField(source: object, key: string): boolean | null {
  // The attributes live on the prototype as getters, so a spread would see
  // nothing. Indexing through an unknown view is the narrowing that works.
  const value = (source as unknown as Record<string, unknown>)[key]
  return typeof value === 'boolean' ? value : null
}

/**
 * Whether the adapter is Chromium's software rasteriser.
 *
 * The flag moved from `GPUAdapter` onto `GPUAdapterInfo` partway through the
 * specification, and both spellings ship in the wild, so both are read.
 */
function isFallback(adapter: GPUAdapter, info: GPUAdapterInfo): boolean {
  return (
    readBooleanField(info, 'isFallbackAdapter') ??
    readBooleanField(adapter, 'isFallbackAdapter') ??
    false
  )
}

/**
 * Sorts an adapter into one of the four kinds BICO shows in the UI.
 *
 * The vendor and architecture strings Chromium reports are normalised and
 * short, for example `nvidia` plus `ampere` or `intel` plus `gen-12lp`, while
 * `device` and `description` are frequently empty for privacy reasons. Anything
 * this cannot place with confidence is reported as `unknown`: an adapter
 * labelled wrongly would send the scheduler to the slower GPU on every run,
 * which is worse than admitting the classification failed.
 */
export function classifyAdapter(info: GPUAdapterInfo, fallback: boolean): GpuAdapterKind {
  if (fallback) return 'cpu'

  const vendor = info.vendor.toLowerCase()
  const architecture = info.architecture.toLowerCase()
  const detail = `${info.device} ${info.description}`.toLowerCase()
  const all = `${vendor} ${architecture} ${detail}`

  // Software renderers announce themselves clearly in one field or another.
  if (/swiftshader|llvmpipe|basic render|warp|software/.test(all)) return 'cpu'

  if (vendor.includes('nvidia')) {
    // Tegra is the only integrated NVIDIA part, and it never appears on a
    // desktop build of Electron.
    return architecture.includes('tegra') ? 'integrated' : 'discrete'
  }

  if (vendor.includes('apple')) {
    // Apple silicon is unified memory, so it is integrated by construction.
    return 'integrated'
  }

  if (vendor.includes('intel')) {
    // Xe HPG and Xe HPC are the Arc discrete parts. Everything named gen or
    // Xe LP is the integrated block inside the CPU package.
    if (/xe-hp|arc/.test(`${architecture} ${detail}`)) return 'discrete'
    if (/gen-|xe-lp|xe2-lp|uhd|iris|hd graphics/.test(`${architecture} ${detail}`)) {
      return 'integrated'
    }
    return 'unknown'
  }

  if (/amd|ati|advanced micro/.test(vendor)) {
    // AMD ships the same architecture names on discrete cards and on APUs, so
    // the architecture string alone proves nothing here.
    if (/radeon rx|radeon pro|firepro|instinct/.test(detail)) return 'discrete'
    if (/vega \d|radeon graphics|renoir|cezanne|rembrandt|phoenix|raphael/.test(detail)) {
      return 'integrated'
    }
    return 'unknown'
  }

  if (/qualcomm|adreno|arm|mali|imagination|powervr|broadcom/.test(all)) return 'integrated'

  if (/microsoft/.test(vendor)) return 'cpu'

  return 'unknown'
}

/**
 * Produces something worth showing the user.
 *
 * Chrome deliberately leaves `description` empty on most platforms, so relying
 * on it alone puts a blank where the adapter name belongs. Vendor and
 * architecture are far more often populated, and a generic label beats an empty
 * one when neither is.
 */
function adapterLabel(info: GPUAdapterInfo, kind: GpuAdapterKind): string {
  if (info.description) return info.description

  const vendor = info.vendor ? info.vendor.replace(/\b\w/g, (c) => c.toUpperCase()) : ''
  const parts = [vendor, info.architecture, info.device].filter((part) => part.length > 0)
  if (parts.length > 0) return parts.join(' ')

  switch (kind) {
    case 'discrete':
      return 'Discrete graphics adapter'
    case 'integrated':
      return 'Integrated graphics adapter'
    case 'cpu':
      return 'Software renderer'
    default:
      return 'Graphics adapter'
  }
}

/** Builds the shared description of an adapter from its raw WebGPU report. */
function describeAdapter(adapter: GPUAdapter, info: GPUAdapterInfo): GpuAdapterInfo {
  const fallback = isFallback(adapter, info)
  const fingerprint = fingerprintOf(info)
  const kind = classifyAdapter(info, fallback)
  return {
    // The fingerprint is stable across a session and unique per adapter, which
    // is exactly what a lane id has to be.
    id: fingerprint,
    vendor: info.vendor || 'unknown',
    architecture: info.architecture || '',
    device: info.device || '',
    description: adapterLabel(info, kind),
    kind,
    isFallbackAdapter: fallback,
    maxTextureDimension: adapter.limits.maxTextureDimension2D,
    maxBufferSizeMb: Math.round(adapter.limits.maxBufferSize / (1024 * 1024)),
    active: false
  }
}

/**
 * Requests one adapter, tolerating every way the call can decline.
 *
 * A blocklisted driver rejects, a headless session resolves with null, and a
 * mid update GPU process can throw. None of those are exceptional here.
 */
async function requestAdapter(
  gpu: GPU,
  powerPreference: GPUPowerPreference,
  forceFallback: boolean
): Promise<GPUAdapter | null> {
  try {
    return await gpu.requestAdapter({ powerPreference, forceFallbackAdapter: forceFallback })
  } catch {
    return null
  }
}

/**
 * Discovers every distinct adapter the machine will hand out.
 *
 * The software fallback is probed only when both hardware preferences came back
 * empty. Adding a SwiftShader lane next to a working GPU would be slower than
 * the sharp CPU path it is meant to relieve.
 */
export async function probeAdapterList(): Promise<AdapterProbe[]> {
  const gpu = webGpu()
  if (!gpu) return []

  const seen = new Set<string>()
  const probes: AdapterProbe[] = []

  for (const powerPreference of PROBE_PREFERENCES) {
    const adapter = await requestAdapter(gpu, powerPreference, false)
    if (!adapter) continue
    const info = adapter.info
    const fingerprint = fingerprintOf(info)
    if (seen.has(fingerprint)) continue
    seen.add(fingerprint)
    probes.push({
      info: describeAdapter(adapter, info),
      powerPreference,
      forceFallback: false,
      fingerprint
    })
  }

  if (probes.length === 0) {
    const fallbackAdapter = await requestAdapter(gpu, 'low-power', true)
    if (fallbackAdapter) {
      const info = fallbackAdapter.info
      probes.push({
        info: describeAdapter(fallbackAdapter, info),
        powerPreference: 'low-power',
        forceFallback: true,
        fingerprint: fingerprintOf(info)
      })
    }
  }

  return probes
}

/** A status object describing a machine where the GPU path is unavailable. */
export function disabledStatus(reason: string): GpuStatus {
  return { supported: false, enabled: false, adapters: [], reason, processed: 0, fallbacks: 0 }
}

/**
 * Turns a probe result into the status the rest of the app reads.
 *
 * `enabled` is the capability verdict only. Whether lanes actually opened, and
 * whether the user asked for the CPU backend, is decided by the runtime that
 * owns the lane manager.
 */
export function statusFromProbes(probes: readonly AdapterProbe[]): GpuStatus {
  if (probes.length === 0) {
    return disabledStatus('No WebGPU adapter was offered, the driver is likely blocklisted')
  }

  const adapters = probes.map((probe) => probe.info)
  const usable = probes.filter((probe) => probe.info.kind !== 'cpu')
  if (usable.length === 0) {
    return {
      supported: true,
      enabled: false,
      adapters,
      reason: 'Only a software adapter is available, the CPU pipeline is faster',
      processed: 0,
      fallbacks: 0
    }
  }

  return { supported: true, enabled: true, adapters, reason: '', processed: 0, fallbacks: 0 }
}

/**
 * Probes the machine and reports what the GPU backend is able to do.
 *
 * Never throws. A machine with no WebGPU, a blocked driver or a GPU process
 * that died during startup all produce a status with `supported` false and a
 * reason the diagnostics panel can show, and the app carries on with sharp.
 */
export async function probeAdapters(): Promise<GpuStatus> {
  if (!webGpu()) {
    return disabledStatus('WebGPU is not available in this build of Chromium')
  }
  try {
    return statusFromProbes(await probeAdapterList())
  } catch (error) {
    return disabledStatus(`GPU probe failed: ${errorMessage(error)}`)
  }
}

/** Raises a limit to what the pipeline needs without exceeding the adapter. */
function resolveLimit(needed: number, specDefault: number, adapterMax: number): number {
  return Math.min(Math.max(needed, specDefault), adapterMax)
}

/**
 * Opens a device on the adapter a lane was assigned to.
 *
 * Two handlers are attached before the device is handed out, and both matter
 * more than they look. `device.lost` fires on a driver reset, a TDR or a laptop
 * switching graphics while docked; without it every task queued on that device
 * would sit unresolved and the run would appear to hang. `uncapturederror`
 * catches the validation and out of memory failures that the promise based API
 * never surfaces, which is the only way an oversized allocation becomes a CPU
 * fallback instead of a black image.
 */
export async function createLaneDevice(
  request: DeviceRequest,
  hooks: DeviceHooks
): Promise<LaneDevice> {
  const gpu = webGpu()
  if (!gpu) throw new Error('WebGPU is not available on this thread')

  const adapter = await requestAdapter(gpu, request.powerPreference, request.forceFallback)
  if (!adapter) throw new Error(`No adapter answered for ${request.powerPreference}`)

  const info = adapter.info
  const limits = adapter.limits

  const textureDimension = resolveLimit(
    request.textureDimension,
    SPEC_DEFAULT_MAX_TEXTURE_DIMENSION_2D,
    limits.maxTextureDimension2D
  )
  const bufferBytes = resolveLimit(
    request.bufferBytes,
    SPEC_DEFAULT_MAX_BUFFER_SIZE,
    limits.maxBufferSize
  )
  const storageBinding = resolveLimit(
    request.bufferBytes,
    SPEC_DEFAULT_MAX_STORAGE_BUFFER_BINDING_SIZE,
    limits.maxStorageBufferBindingSize
  )

  const device = await adapter.requestDevice({
    label: `bico-lane-${info.vendor || 'gpu'}`,
    requiredLimits: {
      maxTextureDimension2D: textureDimension,
      maxBufferSize: bufferBytes,
      maxStorageBufferBindingSize: storageBinding
    }
  })

  device.onuncapturederror = (event): void => {
    hooks.onUncapturedError(event.error.message || 'Unknown WebGPU error')
  }

  // Deliberately not awaited: this promise settles only when the device dies.
  void device.lost.then((reason) => {
    // A device destroyed on purpose during shutdown reports `destroyed`, which
    // is not a failure and must not be reported as one.
    if (reason.reason === 'destroyed') return
    hooks.onLost(reason.message || 'The GPU device was lost')
  })

  return {
    device,
    info: describeAdapter(adapter, info),
    fingerprintMatched: fingerprintOf(info) === request.fingerprint
  }
}
