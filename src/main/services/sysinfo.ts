import { app } from 'electron'
import { arch, cpus, freemem, platform, release, totalmem, version } from 'node:os'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createLogger } from './logger'
import { logFilePath } from './logger'
import type { ChromiumGpuReport, SystemInfo } from '@shared/types'

const log = createLogger('sysinfo')

/**
 * Maps a BICO format id onto the libvips loader that actually implements it.
 *
 * The important case is AVIF: sharp exposes no `avif` entry at all, because AV1
 * still images are written through the HEIF codec. Asking for `sharp.format.avif`
 * therefore reports AVIF as unsupported on a build where it works perfectly,
 * which is exactly the kind of wrong answer the About panel exists to avoid.
 */
const CODEC_ALIASES: Record<string, string> = {
  jpeg: 'jpeg',
  png: 'png',
  webp: 'webp',
  avif: 'heif',
  tiff: 'tiff',
  gif: 'gif',
  heif: 'heif',
  svg: 'svg'
}

const TRACKED_CODECS = Object.keys(CODEC_ALIASES)

interface CodecSupport {
  input?: { buffer?: boolean; file?: boolean; stream?: boolean }
  output?: { buffer?: boolean; file?: boolean; stream?: boolean }
}

interface SharpModule {
  versions: Record<string, string>
  format: Record<string, CodecSupport | undefined>
  simd: () => boolean
  concurrency: (value?: number) => number
}

let cached: SystemInfo | null = null

/**
 * sharp is loaded lazily and only in the main process.
 *
 * Importing it at module scope would pull the native addon in during startup and
 * add tens of milliseconds to the time before the window appears, for data that
 * is only needed once the user opens the About dialog.
 */
async function loadSharp(): Promise<SharpModule | null> {
  try {
    const module = (await import('sharp')) as unknown as { default?: SharpModule } & SharpModule
    return module.default ?? module
  } catch (error) {
    log.warn(`sharp could not be inspected: ${String(error)}`)
    return null
  }
}

export async function collectSystemInfo(refresh = false): Promise<SystemInfo> {
  if (cached && !refresh) {
    // Memory readings go stale immediately, so they are always re sampled even
    // when the rest of the report is served from the cache.
    cached.os.freeMemoryMb = Math.round(freemem() / 1024 / 1024)
    return cached
  }

  const sharp = await loadSharp()
  const formats: SystemInfo['imaging']['formats'] = {}

  if (sharp) {
    for (const codec of TRACKED_CODECS) {
      const loader = CODEC_ALIASES[codec] ?? codec
      const entry = sharp.format[loader]
      formats[codec] = {
        // File based reading is enough for input, since every source is opened
        // from a path. Output always goes through a buffer.
        input: Boolean(entry?.input?.buffer) || Boolean(entry?.input?.file),
        output: Boolean(entry?.output?.buffer)
      }
    }
  }

  // Neither of these comes from libvips at all. BICO carries its own
  // WebAssembly build of libjxl, and of ImageMagick for JPEG 2000, precisely
  // because no prebuilt sharp binary includes either codec, so asking sharp
  // about them would report what the app actually ships as missing.
  formats.jxl = { input: true, output: true }
  formats.jp2 = { input: true, output: true }

  const cpuList = cpus()

  cached = {
    app: {
      name: 'BICO',
      version: app.getVersion(),
      packaged: app.isPackaged,
      buildDate: __BUILD_DATE__,
      locale: app.getLocale()
    },
    runtime: {
      electron: process.versions.electron ?? 'unknown',
      chrome: process.versions.chrome ?? 'unknown',
      node: process.versions.node ?? 'unknown',
      v8: process.versions.v8 ?? 'unknown',
      abi: process.versions.modules ?? 'unknown'
    },
    os: {
      platform: platform(),
      arch: arch(),
      release: release(),
      version: version(),
      cpuModel: cpuList[0]?.model.trim() ?? 'unknown',
      cpuCores: cpuList.length,
      totalMemoryMb: Math.round(totalmem() / 1024 / 1024),
      freeMemoryMb: Math.round(freemem() / 1024 / 1024)
    },
    imaging: {
      sharp: sharp?.versions.sharp ?? 'unavailable',
      libvips: sharp?.versions.vips ?? 'unavailable',
      simd: sharp ? safeSimd(sharp) : false,
      concurrency: sharp ? sharp.concurrency() : 0,
      formats
    },
    paths: {
      userData: app.getPath('userData'),
      logs: logFilePath(),
      temp: tmpdir(),
      presets: join(app.getPath('userData'), 'presets.json')
    }
  }

  return cached
}

function safeSimd(sharp: SharpModule): boolean {
  try {
    return sharp.simd()
  } catch {
    // Older builds throw rather than returning false when SIMD is unavailable.
    return false
  }
}

/**
 * Chromium's own view of the graphics stack.
 *
 * This is the authoritative answer to "is hardware acceleration actually on",
 * because WebGPU can report an adapter while Chromium has quietly blocklisted
 * the driver and fallen back to software rendering.
 */
export async function collectGpuReport(): Promise<ChromiumGpuReport> {
  try {
    const info = (await app.getGPUInfo('complete')) as Record<string, unknown>
    const auxAttributes = (info.auxAttributes ?? {}) as Record<string, unknown>
    const devices = Array.isArray(info.gpuDevice)
      ? (info.gpuDevice as Record<string, unknown>[])
      : []
    const active = devices.find((device) => device.active === true) ?? devices[0] ?? {}

    const featureStatus: Record<string, string> = {}
    const status = app.getGPUFeatureStatus()
    for (const [key, value] of Object.entries(status)) {
      featureStatus[key] = String(value)
    }

    return {
      vendor: describeVendor(active.vendorId),
      device: String(active.deviceId ?? 'unknown'),
      driver: String(active.driverVersion ?? auxAttributes.driverVersion ?? 'unknown'),
      deviceString: String(auxAttributes.glRenderer ?? active.deviceString ?? 'unknown'),
      featureStatus,
      raw: JSON.stringify(info, null, 2)
    }
  } catch (error) {
    log.warn(`Chromium GPU report unavailable: ${String(error)}`)
    return {
      vendor: 'unknown',
      device: 'unknown',
      driver: 'unknown',
      deviceString: 'unknown',
      featureStatus: {},
      raw: ''
    }
  }
}

/** PCI vendor ids for the three desktop graphics vendors that matter here. */
function describeVendor(vendorId: unknown): string {
  const id = typeof vendorId === 'number' ? vendorId : Number(vendorId)
  switch (id) {
    case 0x10de:
      return 'NVIDIA'
    case 0x1002:
    case 0x1022:
      return 'AMD'
    case 0x8086:
      return 'Intel'
    case 0x106b:
      return 'Apple'
    default:
      return Number.isFinite(id) ? `0x${id.toString(16)}` : 'unknown'
  }
}
