import type {
  ConversionSettings,
  GpuAdapterInfo,
  GpuTaskRequest,
  GpuTaskResult
} from '@shared/types'
import { FORMATS } from '@shared/formats'
import { clamp, errorMessage } from '@shared/utils'
import { createLaneDevice } from './device'
import { GpuCapabilityError, GpuPipeline } from './pipeline'

/**
 * The dedicated worker behind one GPU lane.
 *
 * It owns exactly one `GPUDevice` and never shares it. That is deliberate:
 * WebGPU work submitted from a thread that is also running React would compete
 * with layout and paint for the main thread, and a device lost event on one
 * adapter must not be able to take the other adapter's lane down with it.
 *
 * The worker also does its own decoding. `createImageBitmap` is Chromium's
 * image decoder, which is multithreaded and hardware assisted for several
 * formats, and reading the file through the `bico-src` scheme means the raw
 * pixels never cross an IPC boundary in either direction.
 *
 * Built as an ES module worker, matching `renderer.worker.format` in
 * electron.vite.config.ts.
 */

/* ================================================================== */
/* Protocol                                                            */
/* ================================================================== */

export interface WorkerInitMessage {
  readonly type: 'init'
  readonly laneId: string
  readonly powerPreference: GPUPowerPreference
  readonly forceFallback: boolean
  readonly fingerprint: string
  readonly textureDimension: number
  readonly bufferBytes: number
}

export interface WorkerTaskMessage {
  readonly type: 'task'
  readonly request: GpuTaskRequest
}

export interface WorkerDisposeMessage {
  readonly type: 'dispose'
}

export type WorkerInbound = WorkerInitMessage | WorkerTaskMessage | WorkerDisposeMessage

export interface WorkerReadyMessage {
  readonly type: 'ready'
  readonly laneId: string
  readonly info: GpuAdapterInfo
  /** False when the adapter opened here is not the one the probe described. */
  readonly fingerprintMatched: boolean
}

export interface WorkerFailedMessage {
  readonly type: 'failed'
  readonly laneId: string
  readonly error: string
}

export interface WorkerResultMessage {
  readonly type: 'result'
  readonly laneId: string
  readonly result: GpuTaskResult
}

/** The device died under us. Everything queued on this lane is now lost. */
export interface WorkerLostMessage {
  readonly type: 'lost'
  readonly laneId: string
  readonly reason: string
}

/**
 * A validation or out of memory error the queue reported.
 *
 * The device is still alive, so this fails one image and leaves the lane
 * running. `lost` is reserved for the device hook, where the lane really is
 * gone.
 */
export interface WorkerUncapturedMessage {
  readonly type: 'uncaptured'
  readonly laneId: string
  /** The task that was running when the error surfaced, empty when idle. */
  readonly taskId: string
  readonly reason: string
}

export type WorkerOutbound =
  | WorkerReadyMessage
  | WorkerFailedMessage
  | WorkerResultMessage
  | WorkerLostMessage
  | WorkerUncapturedMessage

/* ================================================================== */
/* Lane state                                                          */
/* ================================================================== */

/**
 * The slice of the worker global this file uses.
 *
 * Pulling in the whole `webworker` lib would collide with the DOM lib that the
 * rest of the renderer compiles against, and every declaration in it would be
 * duplicated. Naming the two members that are actually needed avoids that
 * without reaching for `any`.
 */
interface WorkerScope {
  postMessage(message: WorkerOutbound, transfer: Transferable[]): void
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerInbound>) => void): void
}

const scope = self as unknown as WorkerScope

let laneId = ''
let deviceLabel = 'gpu'
let pipeline: GpuPipeline | null = null
let device: GPUDevice | null = null
/** Set once the driver drops the device, after which every task fails fast. */
let deviceLost = false
/** The task currently on the device, so an uncaptured error can name a victim. */
let activeTaskId = ''

function post(message: WorkerOutbound, transfer: Transferable[] = []): void {
  scope.postMessage(message, transfer)
}

/** Human readable adapter name for the job table and the run summary. */
function labelFor(info: GpuAdapterInfo): string {
  const parts = [info.vendor, info.architecture].filter((part) => part.length > 0)
  const label = info.description || parts.join(' ')
  return label.length > 0 ? label : 'gpu'
}

/* ================================================================== */
/* Watermark rasterisation                                             */
/* ================================================================== */

/**
 * Draws the text watermark at the size the output actually needs.
 *
 * The scale setting is a percentage of the output width, so the type size can
 * only be resolved once the geometry is known, which is why the pipeline calls
 * back into here rather than being handed a finished bitmap. Rotation is baked
 * in during rasterisation so the composite shader stays a straight lookup.
 */
async function rasteriseWatermark(
  settings: ConversionSettings,
  outputWidth: number
): Promise<ImageBitmap | null> {
  const mark = settings.watermark
  const text = mark.text.trim()
  if (text.length === 0) return null

  const targetWidth = (clamp(mark.scale, 1, 100) / 100) * outputWidth
  const measureCanvas = new OffscreenCanvas(8, 8)
  const measureCtx = measureCanvas.getContext('2d')
  if (!measureCtx) return null

  const baseSize = Math.max(mark.fontSize, 1)
  measureCtx.font = `${baseSize}px ${mark.fontFamily}`
  const baseMetrics = measureCtx.measureText(text)
  const baseWidth = Math.max(baseMetrics.width, 1)

  // Scale the type so the rendered run is the requested fraction of the output.
  const fontSize = Math.max(4, Math.round((baseSize * targetWidth) / baseWidth))

  const scratch = new OffscreenCanvas(8, 8)
  const scratchCtx = scratch.getContext('2d')
  if (!scratchCtx) return null
  scratchCtx.font = `${fontSize}px ${mark.fontFamily}`
  const metrics = scratchCtx.measureText(text)
  const textWidth = Math.ceil(metrics.width)
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2
  const textHeight = Math.ceil(ascent + descent)
  if (textWidth <= 0 || textHeight <= 0) return null

  const radians = (mark.rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  const boxW = Math.max(1, Math.ceil(textWidth * cos + textHeight * sin))
  const boxH = Math.max(1, Math.ceil(textWidth * sin + textHeight * cos))

  const canvas = new OffscreenCanvas(boxW, boxH)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.translate(boxW / 2, boxH / 2)
  ctx.rotate(radians)
  ctx.font = `${fontSize}px ${mark.fontFamily}`
  ctx.fillStyle = mark.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 0)

  // Straight alpha and no colour conversion: the overlay is composited in the
  // same linear space as the image, and the shader does that conversion itself.
  return createImageBitmap(canvas, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
}

/* ================================================================== */
/* Encoding                                                            */
/* ================================================================== */

/** Formats Chromium can write from a canvas, and nothing else. */
const BROWSER_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * Chooses the MIME type for the full route.
 *
 * `original` keeps each file in the format it arrived in, which the worker only
 * learns from the response the `bico-src` scheme served, so that is where the
 * type comes from in that case.
 */
function resolveMimeType(settings: ConversionSettings, sourceType: string): string {
  if (settings.format !== 'original') return FORMATS[settings.format].mimeType
  const normalised = sourceType.split(';')[0]?.trim().toLowerCase() ?? ''
  if (BROWSER_MIME.has(normalised)) return normalised
  throw new GpuCapabilityError(
    'unknown-target',
    `Cannot encode ${normalised || 'an unknown type'} in the browser`
  )
}

/**
 * Refuses the full route when the settings ask for something `convertToBlob`
 * cannot express.
 *
 * That encoder takes a MIME type and a quality number, and nothing else. Every
 * other switch on the settings object would be dropped in silence, so someone
 * asking for lossless WebP would receive a lossy file that looks like a
 * successful conversion. Failing here is what sends the image back to sharp,
 * which does have the options.
 *
 * The subsampling comparison is against 4:2:0 because that is what Chromium
 * writes; asking for anything else means the browser cannot serve the request.
 */
function assertBrowserCanEncode(settings: ConversionSettings, mimeType: string): void {
  const missing: string[] = []

  if (mimeType === 'image/jpeg') {
    if (settings.mozjpeg) missing.push('the MozJPEG encoder')
    if (settings.progressive) missing.push('progressive scans')
    if (settings.chromaSubsampling !== '4:2:0') {
      missing.push(`chroma subsampling ${settings.chromaSubsampling}`)
    }
  } else if (mimeType === 'image/png') {
    if (settings.pngPalette) missing.push('a palette')
    if (settings.progressive) missing.push('interlacing')
  } else if (mimeType === 'image/webp') {
    if (settings.lossless) missing.push('lossless')
    if (settings.nearLossless) missing.push('near lossless')
  }

  if (missing.length > 0) {
    throw new GpuCapabilityError(
      'browser-encoder-options',
      `The browser encoder cannot write ${missing.join(', ')}`
    )
  }
}

/**
 * Encodes straight RGBA into the target container with Chromium's encoder.
 *
 * `putImageData` takes non premultiplied data, which is exactly what the
 * pipeline produced, so no conversion happens here and no precision is lost on
 * semi transparent edges.
 */
async function encodeInBrowser(
  pixels: Uint8Array,
  width: number,
  height: number,
  settings: ConversionSettings,
  mimeType: string
): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d', { willReadFrequently: false })
  if (!ctx) throw new GpuCapabilityError('no-canvas', 'A 2D context could not be created')

  // ImageData wants a clamped array it owns outright, and the readback may be a
  // view into a larger pooled allocation, so this copy is what makes the two
  // representations line up.
  const clamped = new Uint8ClampedArray(width * height * 4)
  clamped.set(pixels.subarray(0, clamped.length))
  ctx.putImageData(new ImageData(clamped, width, height), 0, 0)

  if (mimeType === 'image/jpeg') {
    // JPEG has no alpha. Painting the backdrop behind what is already drawn
    // gives a defined result instead of whatever the encoder decides to do
    // with transparent texels.
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = settings.adjust.flattenColor || '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.globalCompositeOperation = 'source-over'
  }

  const blob = await canvas.convertToBlob({
    type: mimeType,
    quality: clamp(settings.quality, 1, 100) / 100
  })
  return blob.arrayBuffer()
}

/* ================================================================== */
/* Task execution                                                      */
/* ================================================================== */

async function runTask(request: GpuTaskRequest): Promise<void> {
  const started = performance.now()

  if (!pipeline || deviceLost) {
    post({
      type: 'result',
      laneId,
      result: {
        taskId: request.taskId,
        ok: false,
        device: deviceLabel,
        error: deviceLost ? 'The GPU device was lost' : 'The GPU lane is not ready'
      }
    })
    return
  }

  let bitmap: ImageBitmap | null = null
  activeTaskId = request.taskId
  try {
    const response = await fetch(request.sourceUrl)
    if (!response.ok) {
      throw new Error(`Source fetch failed with status ${response.status}`)
    }
    const blob = await response.blob()

    // `from-image` applies the EXIF orientation during decode, which is both
    // free and exactly what autoOrient asks for. `default` colour space
    // conversion brings a wide gamut source into sRGB, which is the space
    // every shader in the pipeline assumes.
    bitmap = await createImageBitmap(blob, {
      premultiplyAlpha: 'none',
      colorSpaceConversion: 'default',
      imageOrientation: request.settings.transform.autoOrient ? 'from-image' : 'none'
    })

    let mimeType = ''
    if (request.route === 'full') {
      mimeType = resolveMimeType(request.settings, blob.type)
      // Before any GPU work, so a refusal costs nothing but the decode.
      assertBrowserCanEncode(request.settings, mimeType)
    }

    const output = await pipeline.process(bitmap, request.settings, (width) =>
      rasteriseWatermark(request.settings, width)
    )

    if (request.route === 'full') {
      const encoded = await encodeInBrowser(
        output.pixels,
        output.width,
        output.height,
        request.settings,
        mimeType
      )
      post(
        {
          type: 'result',
          laneId,
          result: {
            taskId: request.taskId,
            ok: true,
            route: 'full',
            encoded,
            pixels: null,
            width: output.width,
            height: output.height,
            channels: 4,
            device: deviceLabel,
            durationMs: performance.now() - started
          }
        },
        // Transferred, not copied. An encoded 4K JPEG is a few megabytes and a
        // raw RGBA buffer is tens, so a structured clone of either would cost
        // more than the GPU work that produced it.
        [encoded]
      )
      return
    }

    const buffer = toExactBuffer(output.pixels)
    post(
      {
        type: 'result',
        laneId,
        result: {
          taskId: request.taskId,
          ok: true,
          route: 'assist',
          encoded: null,
          pixels: buffer,
          width: output.width,
          height: output.height,
          channels: 4,
          device: deviceLabel,
          durationMs: performance.now() - started
        }
      },
      [buffer]
    )
  } catch (error) {
    // Every failure is a result, never a rejection. The main process is waiting
    // on this task id to decide whether to hand the image to sharp, and a lane
    // that stays silent stalls the whole run.
    post({
      type: 'result',
      laneId,
      result: {
        taskId: request.taskId,
        ok: false,
        device: deviceLabel,
        error: errorMessage(error)
      }
    })
  } finally {
    bitmap?.close()
    // Only when this task is still the one on the device: a lane running two
    // images at once would otherwise clear the id of the newer one.
    if (activeTaskId === request.taskId) activeTaskId = ''
  }
}

/**
 * Hands back an ArrayBuffer that owns exactly these pixels.
 *
 * A pooled readback can produce a view into a larger allocation, and
 * transferring that would move far more memory than the image needs.
 */
function toExactBuffer(pixels: Uint8Array): ArrayBuffer {
  if (pixels.byteOffset === 0 && pixels.byteLength === pixels.buffer.byteLength) {
    return pixels.buffer as ArrayBuffer
  }
  return pixels.slice().buffer as ArrayBuffer
}

/* ================================================================== */
/* Message loop                                                        */
/* ================================================================== */

async function initialise(message: WorkerInitMessage): Promise<void> {
  laneId = message.laneId
  try {
    const lane = await createLaneDevice(
      {
        powerPreference: message.powerPreference,
        forceFallback: message.forceFallback,
        fingerprint: message.fingerprint,
        textureDimension: message.textureDimension,
        bufferBytes: message.bufferBytes
      },
      {
        onLost: (reason) => {
          deviceLost = true
          post({ type: 'lost', laneId, reason })
        },
        onUncapturedError: (error) => {
          // Not fatal on its own: a validation error fails the image that
          // caused it and the device keeps working, so reporting it as a lost
          // device would retire an adapter that is still perfectly usable.
          post({
            type: 'uncaptured',
            laneId,
            taskId: activeTaskId,
            reason: `Uncaptured GPU error: ${error}`
          })
        }
      }
    )

    device = lane.device
    deviceLabel = labelFor(lane.info)
    pipeline = new GpuPipeline(lane.device)
    post({
      type: 'ready',
      laneId,
      info: lane.info,
      fingerprintMatched: lane.fingerprintMatched
    })
  } catch (error) {
    post({ type: 'failed', laneId, error: errorMessage(error) })
  }
}

function dispose(): void {
  pipeline?.destroy()
  pipeline = null
  device?.destroy()
  device = null
}

scope.addEventListener('message', (event: MessageEvent<WorkerInbound>) => {
  const message = event.data
  switch (message.type) {
    case 'init':
      void initialise(message)
      break
    case 'task':
      void runTask(message.request)
      break
    case 'dispose':
    default:
      dispose()
      break
  }
})
