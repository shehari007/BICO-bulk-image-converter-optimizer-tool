import type { ConversionSettings, GravityPosition, ResizeKernel } from '@shared/types'
import { GPU_MAX_PIXELS } from '@shared/defaults'
import { clamp, parseColorFloat } from '@shared/utils'
import type { OutputStorageFormat } from './shaders'
import {
  COLOR_STAGE,
  COLOR_OPS_WGSL,
  GAUSSIAN_WGSL,
  HISTOGRAM_BINS,
  HISTOGRAM_WGSL,
  KERNEL_CODE,
  NORMALIZE_WGSL,
  ORIENT_WGSL,
  RESAMPLE_WGSL,
  SHADER_FLAG,
  UNSHARP_WGSL,
  WATERMARK_WGSL,
  WORKGROUP_EDGE,
  withOutputFormat
} from './shaders'

/**
 * Composes the shaders into one execution per image.
 *
 * Two things dominate GPU imaging performance, and both are addressed here.
 * The first is allocation: creating textures, buffers and pipelines per image
 * costs far more than the filtering does, so everything expensive is pooled and
 * every pipeline is compiled once per device. The second is submission: each
 * `queue.submit` carries a fixed cost and a round trip through the GPU process,
 * so all of an image's passes go into a single command encoder.
 */

/* ================================================================== */
/* Errors                                                              */
/* ================================================================== */

/**
 * Raised when this image cannot run on a GPU lane at all.
 *
 * The lane manager treats it as a clean instruction to retry the image on the
 * CPU, so it must be thrown before any output is produced, never halfway.
 */
export class GpuCapabilityError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'GpuCapabilityError'
    this.code = code
  }
}

/* ================================================================== */
/* Tunables                                                            */
/* ================================================================== */

/**
 * Largest reduction a single resample stage performs per axis.
 *
 * Filter support widens with the reduction factor, so a 30x downscale in one
 * step would need 90 lanczos3 taps per axis and every one of them is a texture
 * load. Chaining stages at 8x costs one extra pair of passes and keeps the
 * inner loop inside the tap budget the shader was written for.
 */
const MAX_REDUCTION_PER_STAGE = 8

/** Rounding applied to pooled texture sizes below `EXACT_SIZE_THRESHOLD`. */
const SIZE_CLASS = 256

/**
 * Above this edge length textures are pooled at their exact size.
 *
 * Rounding a 6000 pixel edge up to the next class wastes tens of megabytes for
 * a hit rate close to zero, because large sources are rarely the same size
 * twice. Small surfaces, thumbnails and previews and web sized outputs, repeat
 * constantly and are worth the rounding.
 */
const EXACT_SIZE_THRESHOLD = 2048

/** Ceiling on pooled bytes. Anything released beyond it is destroyed instead. */
const POOL_BYTE_BUDGET = 384 * 1024 * 1024

/** `copyTextureToBuffer` requires each row to start on a 256 byte boundary. */
const BYTES_PER_ROW_ALIGNMENT = 256

/** Every uniform in this file fits in one 256 byte slot, so there is one class. */
const UNIFORM_SLOT_BYTES = 256

const SOURCE_USAGE =
  GPUTextureUsage.TEXTURE_BINDING |
  GPUTextureUsage.COPY_DST |
  GPUTextureUsage.COPY_SRC |
  GPUTextureUsage.RENDER_ATTACHMENT

const WORK_USAGE = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING

const FINAL_USAGE = WORK_USAGE | GPUTextureUsage.COPY_SRC

/* ================================================================== */
/* Geometry planning                                                   */
/* ================================================================== */

interface Size {
  readonly w: number
  readonly h: number
}

interface Rect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export interface GeometryPlan {
  readonly cropX: number
  readonly cropY: number
  readonly cropW: number
  readonly cropH: number
  /** Destination size of every resample stage, in order. Never empty. */
  readonly stages: readonly Size[]
  readonly flipH: boolean
  readonly flipV: boolean
  /** Clockwise rotation in ninety degree steps. */
  readonly quarterTurns: number
  /** Where the rotated image sits inside the final canvas. */
  readonly padX: number
  readonly padY: number
  readonly canvas: Size
  /**
   * The box a `contain` fit reserved, in final canvas texels. Null when the fit
   * produced no letterbox.
   *
   * The letterbox and the padding border are separate regions painted in
   * separate colours, so the orient pass needs the rectangle to tell them
   * apart: inside this box but outside the image is letterbox, outside it is
   * border.
   */
  readonly letterbox: Rect | null
  readonly needsResample: boolean
  readonly needsGeometryPass: boolean
}

/** Maps the settings kernel name onto the code the resample shader expects. */
function kernelCode(kernel: ResizeKernel): number {
  switch (kernel) {
    case 'nearest':
      return KERNEL_CODE.nearest
    case 'cubic':
      return KERNEL_CODE.cubic
    case 'mitchell':
      return KERNEL_CODE.mitchell
    case 'lanczos2':
      return KERNEL_CODE.lanczos2
    case 'lanczos3':
    default:
      return KERNEL_CODE.lanczos3
  }
}

/** Horizontal and vertical anchors of a gravity, each in the 0 to 1 range. */
function gravityAnchor(position: GravityPosition): { x: number; y: number } {
  switch (position) {
    case 'north':
      return { x: 0.5, y: 0 }
    case 'northeast':
      return { x: 1, y: 0 }
    case 'east':
      return { x: 1, y: 0.5 }
    case 'southeast':
      return { x: 1, y: 1 }
    case 'south':
      return { x: 0.5, y: 1 }
    case 'southwest':
      return { x: 0, y: 1 }
    case 'west':
      return { x: 0, y: 0.5 }
    case 'northwest':
      return { x: 0, y: 0 }
    // `entropy` and `attention` pick their anchor from image content, which
    // needs a saliency pass this pipeline does not run. Centring is the honest
    // approximation, and it is what sharp falls back to for a uniform image.
    case 'center':
    case 'entropy':
    case 'attention':
    default:
      return { x: 0.5, y: 0.5 }
  }
}

/** Requested output box. A null axis means derive it from the aspect ratio. */
function requestedBox(
  settings: ConversionSettings,
  srcW: number,
  srcH: number
): { w: number | null; h: number | null } {
  const { resize } = settings
  const width = resize.width
  const height = resize.height
  // `longest` and `shortest` carry their single edge length in `width`, with
  // `height` accepted as a fallback so an older persisted setting still works.
  const edge = width ?? height ?? 0

  switch (resize.strategy) {
    case 'exact':
      return { w: width, h: height }
    case 'width':
      return { w: width, h: null }
    case 'height':
      return { w: null, h: height }
    case 'longest':
      return srcW >= srcH ? { w: edge, h: null } : { w: null, h: edge }
    case 'shortest':
      return srcW <= srcH ? { w: edge, h: null } : { w: null, h: edge }
    case 'percentage': {
      const factor = Math.max(resize.percentage, 1) / 100
      return { w: Math.round(srcW * factor), h: Math.round(srcH * factor) }
    }
    case 'megapixels': {
      const target = Math.max(resize.megapixels, 0.01) * 1_000_000
      const factor = Math.sqrt(target / Math.max(srcW * srcH, 1))
      return { w: Math.round(srcW * factor), h: Math.round(srcH * factor) }
    }
    case 'none':
    default:
      return { w: null, h: null }
  }
}

function positiveInt(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 1 ? Math.round(value) : fallback
}

/**
 * Splits a resize into stages that each stay inside the shader tap budget.
 *
 * The intermediate sizes are placed geometrically rather than by repeated
 * halving, so every stage reduces by the same factor and no stage lands on an
 * awkward fractional scale that the last stage then has to undo.
 */
function planStages(from: Size, to: Size): Size[] {
  const worst = Math.max(from.w / Math.max(to.w, 1), from.h / Math.max(to.h, 1))
  if (worst <= MAX_REDUCTION_PER_STAGE) return [to]

  const count = Math.ceil(Math.log(worst) / Math.log(MAX_REDUCTION_PER_STAGE))
  const stages: Size[] = []
  for (let i = 1; i <= count; i += 1) {
    const t = i / count
    stages.push({
      w: Math.max(1, Math.round(from.w * Math.pow(to.w / from.w, t))),
      h: Math.max(1, Math.round(from.h * Math.pow(to.h / from.h, t)))
    })
  }
  return stages
}

/**
 * Turns the resize, crop, rotate and padding settings into pixel coordinates.
 *
 * Everything geometric is decided here, before a single GPU resource is
 * touched, so an impossible request fails as a capability error rather than
 * halfway through a command encoder.
 */
export function planGeometry(
  settings: ConversionSettings,
  srcW: number,
  srcH: number
): GeometryPlan {
  const { crop } = settings.transform

  if (crop.enabled && crop.mode === 'trim') {
    // Trim measures the border colour of the decoded image, which is a
    // reduction this pipeline does not run.
    throw new GpuCapabilityError('crop-trim', 'Border trim is only available on the CPU path')
  }

  let cropX = 0
  let cropY = 0
  let cropW = srcW
  let cropH = srcH

  if (crop.enabled && crop.mode === 'manual') {
    cropX = clamp(Math.round(crop.left), 0, srcW - 1)
    cropY = clamp(Math.round(crop.top), 0, srcH - 1)
    cropW = crop.width > 0 ? clamp(Math.round(crop.width), 1, srcW - cropX) : srcW - cropX
    cropH = crop.height > 0 ? clamp(Math.round(crop.height), 1, srcH - cropY) : srcH - cropY
  } else if (crop.enabled && crop.mode === 'aspect') {
    const ratio = crop.aspectRatio > 0 ? crop.aspectRatio : srcW / Math.max(srcH, 1)
    if (srcW / srcH > ratio) {
      cropW = Math.max(1, Math.round(srcH * ratio))
      cropH = srcH
    } else {
      cropW = srcW
      cropH = Math.max(1, Math.round(srcW / ratio))
    }
    const anchor = gravityAnchor(settings.resize.position)
    cropX = Math.round((srcW - cropW) * anchor.x)
    cropY = Math.round((srcH - cropH) * anchor.y)
  }

  const { resize } = settings
  const box = requestedBox(settings, cropW, cropH)
  let targetW = cropW
  let targetH = cropH
  let letterbox: Size | null = null

  if (box.w !== null && box.h !== null) {
    const boxW = positiveInt(box.w, cropW)
    const boxH = positiveInt(box.h, cropH)
    const scaleX = boxW / cropW
    const scaleY = boxH / cropH

    switch (resize.fit) {
      case 'fill':
        targetW = boxW
        targetH = boxH
        break
      case 'outside': {
        const scale = Math.max(scaleX, scaleY)
        targetW = Math.max(1, Math.round(cropW * scale))
        targetH = Math.max(1, Math.round(cropH * scale))
        break
      }
      case 'cover': {
        // Cover fills the box exactly, so the surplus is removed from the
        // source rectangle instead of being scaled away. Cropping before the
        // resample means the discarded pixels are never filtered at all.
        const scale = Math.max(scaleX, scaleY)
        const keepW = Math.min(cropW, Math.max(1, Math.round(boxW / scale)))
        const keepH = Math.min(cropH, Math.max(1, Math.round(boxH / scale)))
        const anchor = gravityAnchor(resize.position)
        cropX += Math.round((cropW - keepW) * anchor.x)
        cropY += Math.round((cropH - keepH) * anchor.y)
        cropW = keepW
        cropH = keepH
        targetW = boxW
        targetH = boxH
        break
      }
      case 'contain': {
        const scale = Math.min(scaleX, scaleY)
        targetW = Math.max(1, Math.round(cropW * scale))
        targetH = Math.max(1, Math.round(cropH * scale))
        letterbox = { w: boxW, h: boxH }
        break
      }
      case 'inside':
      default: {
        const scale = Math.min(scaleX, scaleY)
        targetW = Math.max(1, Math.round(cropW * scale))
        targetH = Math.max(1, Math.round(cropH * scale))
        break
      }
    }
  } else if (box.w !== null) {
    const boxW = positiveInt(box.w, cropW)
    targetW = boxW
    targetH = Math.max(1, Math.round((cropH * boxW) / cropW))
  } else if (box.h !== null) {
    const boxH = positiveInt(box.h, cropH)
    targetH = boxH
    targetW = Math.max(1, Math.round((cropW * boxH) / cropH))
  }

  // These two clamps are checked against the crop rectangle, not the original
  // file, because the crop is what is actually being scaled.
  if (resize.withoutEnlargement && (targetW > cropW || targetH > cropH)) {
    const scale = Math.min(cropW / targetW, cropH / targetH)
    targetW = Math.max(1, Math.round(targetW * scale))
    targetH = Math.max(1, Math.round(targetH * scale))
  }
  if (resize.withoutReduction && (targetW < cropW || targetH < cropH)) {
    const scale = Math.max(cropW / targetW, cropH / targetH)
    targetW = Math.max(1, Math.round(targetW * scale))
    targetH = Math.max(1, Math.round(targetH * scale))
  }

  const needsResample =
    targetW !== cropW ||
    targetH !== cropH ||
    cropX !== 0 ||
    cropY !== 0 ||
    cropW !== srcW ||
    cropH !== srcH

  const stages = planStages({ w: cropW, h: cropH }, { w: targetW, h: targetH })

  const quarterTurns = (settings.transform.rotate / 90) % 4
  const rotatedW = quarterTurns % 2 === 0 ? targetW : targetH
  const rotatedH = quarterTurns % 2 === 0 ? targetH : targetW

  // A letterbox box rotates with the image, so a request to contain inside
  // 800 by 600 and rotate a quarter turn produces 600 by 800.
  const boxAfterRotation =
    letterbox === null
      ? null
      : quarterTurns % 2 === 0
        ? letterbox
        : { w: letterbox.h, h: letterbox.w }

  const padding = Math.max(0, Math.round(settings.transform.padding))
  const innerW = Math.max(rotatedW, boxAfterRotation?.w ?? 0)
  const innerH = Math.max(rotatedH, boxAfterRotation?.h ?? 0)
  const flipH = settings.transform.flipHorizontal
  const flipV = settings.transform.flipVertical

  const plan: GeometryPlan = {
    cropX,
    cropY,
    cropW,
    cropH,
    stages,
    flipH,
    flipV,
    quarterTurns,
    padX: Math.round((innerW - rotatedW) / 2) + padding,
    padY: Math.round((innerH - rotatedH) / 2) + padding,
    canvas: { w: innerW + padding * 2, h: innerH + padding * 2 },
    letterbox: boxAfterRotation === null ? null : { x: padding, y: padding, w: innerW, h: innerH },
    needsResample,
    // A flip is carried by this pass too, so asking for one has to be enough to
    // schedule it. Without that a run that only mirrors produces the source
    // image untouched.
    needsGeometryPass:
      quarterTurns !== 0 || padding > 0 || boxAfterRotation !== null || flipH || flipV
  }
  return plan
}

/* ================================================================== */
/* Resource pools                                                      */
/* ================================================================== */

function sizeClass(edge: number): number {
  if (edge > EXACT_SIZE_THRESHOLD) return edge
  return Math.max(SIZE_CLASS, Math.ceil(edge / SIZE_CLASS) * SIZE_CLASS)
}

function bytesPerTexel(format: GPUTextureFormat): number {
  return format === 'rgba16float' ? 8 : 4
}

interface PooledTexture {
  readonly texture: GPUTexture
  readonly key: string
  readonly bytes: number
}

/**
 * Free lists of textures and buffers, keyed by what makes them interchangeable.
 *
 * Compute shaders here take their extent from a uniform rather than from
 * `textureDimensions`, so a surface larger than the image is perfectly usable.
 * That is what makes a size class work at all: a 1300 by 700 output borrows the
 * same 1536 by 768 texture a 1500 by 800 output used a moment earlier.
 *
 * The pool is bounded. Once it holds `POOL_BYTE_BUDGET` a released resource is
 * destroyed rather than kept, which stops a run of increasingly large images
 * from retaining every intermediate size it ever touched.
 */
class ResourcePool {
  private readonly textures = new Map<string, GPUTexture[]>()
  private readonly buffers = new Map<string, GPUBuffer[]>()
  private pooledBytes = 0

  constructor(private readonly device: GPUDevice) {}

  acquireTexture(
    width: number,
    height: number,
    format: GPUTextureFormat,
    usage: GPUTextureUsageFlags
  ): PooledTexture {
    const w = sizeClass(width)
    const h = sizeClass(height)
    const key = `${w}x${h}:${format}:${usage}`
    const bytes = w * h * bytesPerTexel(format)

    const free = this.textures.get(key)
    const reused = free?.pop()
    if (reused) {
      this.pooledBytes -= bytes
      return { texture: reused, key, bytes }
    }

    const texture = this.device.createTexture({
      label: `bico-${key}`,
      size: { width: w, height: h },
      format,
      usage
    })
    return { texture, key, bytes }
  }

  releaseTexture(entry: PooledTexture): void {
    if (this.pooledBytes + entry.bytes > POOL_BYTE_BUDGET) {
      entry.texture.destroy()
      return
    }
    const free = this.textures.get(entry.key)
    if (free) {
      free.push(entry.texture)
    } else {
      this.textures.set(entry.key, [entry.texture])
    }
    this.pooledBytes += entry.bytes
  }

  acquireBuffer(size: number, usage: GPUBufferUsageFlags, label: string): GPUBuffer {
    // Buffers round up hard: a readback staging buffer is the largest single
    // allocation in the pipeline and its size varies continuously with the
    // output dimensions, so exact sizing would never hit the free list. Small
    // requests, which in practice means uniforms, land in a single slot class.
    const bytes =
      size <= UNIFORM_SLOT_BYTES
        ? UNIFORM_SLOT_BYTES
        : Math.ceil(size / (1024 * 1024)) * 1024 * 1024
    const key = `${bytes}:${usage}`

    const free = this.buffers.get(key)
    const reused = free?.pop()
    if (reused) {
      this.pooledBytes -= bytes
      return reused
    }
    return this.device.createBuffer({ label: `bico-${label}-${key}`, size: bytes, usage })
  }

  releaseBuffer(buffer: GPUBuffer): void {
    const key = `${buffer.size}:${buffer.usage}`
    if (this.pooledBytes + buffer.size > POOL_BYTE_BUDGET) {
      buffer.destroy()
      return
    }
    const free = this.buffers.get(key)
    if (free) {
      free.push(buffer)
    } else {
      this.buffers.set(key, [buffer])
    }
    this.pooledBytes += buffer.size
  }

  destroy(): void {
    for (const list of this.textures.values()) {
      for (const texture of list) texture.destroy()
    }
    for (const list of this.buffers.values()) {
      for (const buffer of list) buffer.destroy()
    }
    this.textures.clear()
    this.buffers.clear()
    this.pooledBytes = 0
  }
}

/* ================================================================== */
/* Surfaces                                                            */
/* ================================================================== */

/**
 * A texture plus what its texel values currently mean.
 *
 * Passes read these two booleans to decide whether to decode sRGB and whether
 * to premultiply, which is what lets the same shader serve as the first pass,
 * a middle pass and the last pass of a chain.
 */
interface Surface {
  readonly pooled: PooledTexture
  readonly width: number
  readonly height: number
  /** True while the values are still sRGB encoded rather than linear light. */
  readonly encoded: boolean
  /** True while alpha is straight rather than premultiplied. */
  readonly straight: boolean
}

function inputFlags(surface: Surface): number {
  let flags = 0
  if (surface.encoded) flags |= SHADER_FLAG.decodeSrgb
  if (surface.straight) flags |= SHADER_FLAG.premultiplyIn
  return flags
}

const FINAL_OUTPUT_FLAGS = SHADER_FLAG.encodeSrgb | SHADER_FLAG.unpremultiplyOut

/* ================================================================== */
/* Uniform writers                                                     */
/* ================================================================== */

/**
 * Scratch used to build every uniform before it is uploaded.
 *
 * WGSL uniform layout rules put vec2 on an eight byte boundary and vec4 on a
 * sixteen byte one, so each writer below states its offsets explicitly. Getting
 * one of them wrong produces plausible looking garbage rather than an error,
 * which is why they are all in one place next to the structs they mirror.
 */
class UniformScratch {
  private readonly bytes = new ArrayBuffer(UNIFORM_SLOT_BYTES)
  private readonly view = new DataView(this.bytes)

  u32(offset: number, value: number): void {
    this.view.setUint32(offset, value >>> 0, true)
  }

  i32(offset: number, value: number): void {
    this.view.setInt32(offset, value | 0, true)
  }

  f32(offset: number, value: number): void {
    this.view.setFloat32(offset, value, true)
  }

  vec4(offset: number, value: readonly [number, number, number, number]): void {
    this.f32(offset, value[0])
    this.f32(offset + 4, value[1])
    this.f32(offset + 8, value[2])
    this.f32(offset + 12, value[3])
  }

  /** Returns the slot, zeroing it afterwards so the next pass starts clean. */
  take(length: number): ArrayBuffer {
    const copy = this.bytes.slice(0, length)
    new Uint8Array(this.bytes).fill(0)
    return copy
  }
}

/* ================================================================== */
/* Pipeline                                                            */
/* ================================================================== */

export interface PipelineResult {
  /** Tightly packed straight RGBA, ready for an encoder or for sharp. */
  readonly pixels: Uint8Array
  readonly width: number
  readonly height: number
}

/** Produces the watermark overlay once the output size is known. */
export type OverlayFactory = (width: number, height: number) => Promise<ImageBitmap | null>

type LayoutKind = 'oneSource' | 'twoSource' | 'histogram'

/** One recorded pass, named the way `planPasses` orders them. */
type PassName = 'normalize' | 'resample' | 'color' | 'blur' | 'sharpen' | 'watermark' | 'orient'

/** Which optional passes one settings object actually asks for. */
interface PassSet {
  readonly color: number
  readonly blur: boolean
  readonly sharpen: boolean
  readonly normalize: boolean
  readonly watermark: boolean
}

export class GpuPipeline {
  private readonly pool: ResourcePool
  private readonly modules = new Map<string, GPUShaderModule>()
  private readonly pipelines = new Map<string, GPUComputePipeline>()
  private readonly layouts = new Map<string, GPUBindGroupLayout>()
  private readonly scratch = new UniformScratch()
  private disposed = false

  constructor(private readonly device: GPUDevice) {
    this.pool = new ResourcePool(device)
  }

  /**
   * Refuses images the device cannot hold before any work starts.
   *
   * `GPU_MAX_PIXELS` is the app wide ceiling and the adapter limit is the hard
   * one. Both are checked against the source and against the output, because a
   * modest source scaled up can still overflow the texture dimension.
   */
  private assertWithinLimits(source: Size, output: Size): void {
    const maxEdge = this.device.limits.maxTextureDimension2D
    if (source.w * source.h > GPU_MAX_PIXELS) {
      throw new GpuCapabilityError(
        'too-many-pixels',
        `Source is ${source.w} by ${source.h}, above the ${GPU_MAX_PIXELS} pixel GPU ceiling`
      )
    }
    if (output.w * output.h > GPU_MAX_PIXELS) {
      throw new GpuCapabilityError(
        'too-many-pixels',
        `Output is ${output.w} by ${output.h}, above the ${GPU_MAX_PIXELS} pixel GPU ceiling`
      )
    }
    const widest = Math.max(source.w, source.h, output.w, output.h)
    if (widest > maxEdge) {
      throw new GpuCapabilityError(
        'texture-too-large',
        `Edge of ${widest} exceeds the adapter limit of ${maxEdge}`
      )
    }
  }

  private layout(kind: LayoutKind, format: OutputStorageFormat): GPUBindGroupLayout {
    const key = `${kind}:${format}`
    const cached = this.layouts.get(key)
    if (cached) return cached

    const visibility = GPUShaderStage.COMPUTE
    const entries: GPUBindGroupLayoutEntry[] = [
      { binding: 0, visibility, buffer: { type: 'uniform' } },
      { binding: 1, visibility, texture: { sampleType: 'unfilterable-float' } }
    ]

    if (kind === 'histogram') {
      entries.push({ binding: 2, visibility, buffer: { type: 'storage' } })
    } else if (kind === 'twoSource') {
      entries.push({ binding: 2, visibility, texture: { sampleType: 'unfilterable-float' } })
      entries.push({ binding: 3, visibility, storageTexture: { access: 'write-only', format } })
    } else {
      entries.push({ binding: 2, visibility, storageTexture: { access: 'write-only', format } })
    }

    const layout = this.device.createBindGroupLayout({ label: `bico-layout-${key}`, entries })
    this.layouts.set(key, layout)
    return layout
  }

  /**
   * Compiles a pass once and keeps it for the life of the device.
   *
   * The output format is part of the key because a bind group layout pins the
   * storage texture format, so the intermediate and final variants of a shader
   * are genuinely different pipelines.
   */
  private pipelineFor(
    name: string,
    source: string,
    kind: LayoutKind,
    format: OutputStorageFormat
  ): GPUComputePipeline {
    const key = `${name}:${format}`
    const cached = this.pipelines.get(key)
    if (cached) return cached

    let module = this.modules.get(key)
    if (!module) {
      module = this.device.createShaderModule({
        label: `bico-module-${key}`,
        code: withOutputFormat(source, format)
      })
      this.modules.set(key, module)
    }

    const pipeline = this.device.createComputePipeline({
      label: `bico-pipeline-${key}`,
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.layout(kind, format)]
      }),
      compute: { module, entryPoint: 'main' }
    })
    this.pipelines.set(key, pipeline)
    return pipeline
  }

  private uniformBuffer(data: ArrayBuffer, retire: GPUBuffer[]): GPUBuffer {
    const buffer = this.pool.acquireBuffer(
      UNIFORM_SLOT_BYTES,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      'uniform'
    )
    // Each pass gets its own slot on purpose. `writeBuffer` lands on the queue
    // ahead of the command buffer that is submitted afterwards, so two passes
    // sharing one uniform buffer would both read whichever value was written
    // last: a bug that looks like the first pass silently doing nothing.
    this.device.queue.writeBuffer(buffer, 0, data)
    retire.push(buffer)
    return buffer
  }

  private dispatch(
    encoder: GPUCommandEncoder,
    pipeline: GPUComputePipeline,
    bindGroup: GPUBindGroup,
    size: Size,
    label: string
  ): void {
    const pass = encoder.beginComputePass({ label })
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.dispatchWorkgroups(Math.ceil(size.w / WORKGROUP_EDGE), Math.ceil(size.h / WORKGROUP_EDGE))
    pass.end()
  }

  /** Allocates the destination for a pass and records the swap of surfaces. */
  private nextSurface(
    size: Size,
    isFinal: boolean,
    held: PooledTexture[]
  ): { surface: Surface; format: OutputStorageFormat } {
    const format: OutputStorageFormat = isFinal ? 'rgba8unorm' : 'rgba16float'
    const pooled = this.pool.acquireTexture(
      size.w,
      size.h,
      format,
      isFinal ? FINAL_USAGE : WORK_USAGE
    )
    held.push(pooled)
    return {
      surface: {
        pooled,
        width: size.w,
        height: size.h,
        encoded: isFinal,
        straight: isFinal
      },
      format
    }
  }

  /**
   * Runs one image end to end.
   *
   * The returned pixels are straight, non premultiplied RGBA in sRGB, which is
   * both what a canvas encoder expects and what sharp wants when it is handed
   * raw input, so the same buffer serves the full and assist routes.
   */
  async process(
    bitmap: ImageBitmap,
    settings: ConversionSettings,
    overlayFactory: OverlayFactory | null
  ): Promise<PipelineResult> {
    if (this.disposed) throw new GpuCapabilityError('disposed', 'The GPU pipeline was destroyed')

    const plan = planGeometry(settings, bitmap.width, bitmap.height)
    this.assertWithinLimits({ w: bitmap.width, h: bitmap.height }, plan.canvas)

    const held: PooledTexture[] = []
    const retiredBuffers: GPUBuffer[] = []
    let overlay: ImageBitmap | null = null
    let staging: GPUBuffer | null = null

    try {
      const uploaded = this.upload(bitmap, held)
      const passes = this.describePasses(settings)

      // The overlay is composited before the rotation and the border, so it is
      // sized against the image at that point rather than against the final
      // canvas. The last resample stage is that size whether or not anything
      // was actually resized.
      const composite = plan.stages[plan.stages.length - 1] ?? plan.canvas
      overlay =
        passes.watermark && overlayFactory ? await overlayFactory(composite.w, composite.h) : null
      if (passes.watermark && !overlay) {
        throw new GpuCapabilityError('watermark', 'The watermark overlay could not be rasterised')
      }

      const steps = this.planPasses(plan, passes, overlay !== null)
      // Normalize leads the list, so what follows it is what the single
      // encoder below records, and an empty tail makes normalize itself the
      // pass that has to produce the final surface.
      const chain = passes.normalize ? steps.slice(1) : steps

      // Normalize needs the histogram before its own uniform can be written,
      // which is the one place a second submit is unavoidable. It runs first so
      // the rest of the chain still fits in a single encoder.
      let current = uploaded
      if (passes.normalize) {
        current = await this.runNormalize(
          current,
          settings,
          chain.length === 0,
          held,
          retiredBuffers
        )
      }

      const encoder = this.device.createCommandEncoder({ label: 'bico-image' })
      const result = this.encodeChain(
        encoder,
        current,
        settings,
        plan,
        chain,
        passes,
        overlay,
        held,
        retiredBuffers
      )

      // The copy below reads an rgba8unorm texture that carries COPY_SRC, which
      // is what every pass allocates when it knows it is the last one. A
      // working surface reaching this point would mean the pass list and the
      // readback disagree, and the copy would be invalid rather than wrong.
      if (!result.encoded || !result.straight) {
        throw new GpuCapabilityError(
          'unfinished-surface',
          'The GPU chain did not leave the image in its final representation'
        )
      }

      const rowBytes = plan.canvas.w * 4
      const paddedRowBytes = Math.ceil(rowBytes / BYTES_PER_ROW_ALIGNMENT) * BYTES_PER_ROW_ALIGNMENT
      staging = this.pool.acquireBuffer(
        paddedRowBytes * plan.canvas.h,
        GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        'readback'
      )

      encoder.copyTextureToBuffer(
        { texture: result.pooled.texture },
        { buffer: staging, bytesPerRow: paddedRowBytes, rowsPerImage: plan.canvas.h },
        { width: plan.canvas.w, height: plan.canvas.h }
      )

      // One submit for the whole image. Every pass above is already recorded
      // into this encoder, so the GPU sees a single dependency chain.
      this.device.queue.submit([encoder.finish()])

      const pixels = await this.readBack(staging, plan.canvas, rowBytes, paddedRowBytes)

      return { pixels, width: plan.canvas.w, height: plan.canvas.h }
    } finally {
      // Release before returning, including on the throwing path. A pooled
      // texture that is never released is a leak that only shows up as a device
      // out of memory error several hundred images later. The staging buffer is
      // the largest allocation of them all, so it is tracked outside the try and
      // cleared here to make a second release impossible.
      if (staging !== null) {
        this.pool.releaseBuffer(staging)
        staging = null
      }
      overlay?.close()
      for (const buffer of retiredBuffers) this.pool.releaseBuffer(buffer)
      for (const texture of held) this.pool.releaseTexture(texture)
    }
  }

  /** Copies the decoded bitmap into a texture. Straight alpha, sRGB encoded. */
  private upload(bitmap: ImageBitmap, held: PooledTexture[]): Surface {
    const pooled = this.pool.acquireTexture(bitmap.width, bitmap.height, 'rgba8unorm', SOURCE_USAGE)
    held.push(pooled)
    // `rgba8unorm` rather than the srgb variant: the shaders decode explicitly
    // so that every pass agrees on where the conversion happens, and the srgb
    // view would apply it a second time.
    this.device.queue.copyExternalImageToTexture(
      { source: bitmap, flipY: false },
      { texture: pooled.texture, premultipliedAlpha: false },
      { width: bitmap.width, height: bitmap.height }
    )
    return { pooled, width: bitmap.width, height: bitmap.height, encoded: true, straight: true }
  }

  /** Which optional passes this settings object actually asks for. */
  private describePasses(settings: ConversionSettings): PassSet {
    const a = settings.adjust
    let color = 0
    if (a.flatten) color |= COLOR_STAGE.flatten
    if (a.brightness !== 1 || a.saturation !== 1 || a.hue !== 0 || a.lightness !== 0) {
      color |= COLOR_STAGE.modulate
    }
    if (a.tint) color |= COLOR_STAGE.tint
    if (a.sepia) color |= COLOR_STAGE.sepia
    if (a.grayscale) color |= COLOR_STAGE.grayscale
    if (a.contrast !== 1) color |= COLOR_STAGE.contrast
    if (a.gamma) color |= COLOR_STAGE.gamma
    if (a.invert) color |= COLOR_STAGE.invert

    if (a.clahe || a.median) {
      // Neither has a shader here. Falling back keeps the output identical to
      // what the CPU path would have produced rather than silently dropping an
      // adjustment the user asked for.
      throw new GpuCapabilityError('unsupported-adjust', 'CLAHE and median are CPU only')
    }
    if (settings.watermark.kind === 'image') {
      // An image watermark lives on disk and the worker has no file access, so
      // there is nothing to composite.
      throw new GpuCapabilityError('watermark-image', 'Image watermarks are CPU only')
    }

    return {
      color,
      blur: a.blur && a.blurSigma > 0,
      sharpen: a.sharpen && a.sharpenSigma > 0,
      normalize: a.normalize,
      watermark: settings.watermark.kind === 'text' && settings.watermark.text.trim().length > 0
    }
  }

  /**
   * Every pass this image runs, in order.
   *
   * Order mirrors the CPU pipeline: geometry first so the expensive per pixel
   * work runs at the output resolution, then colour, then the spatial filters,
   * then the overlay, and finally the rotation and border. Normalize leads all
   * of them because its histogram has to reach the host before its own uniform
   * can be written.
   *
   * The whole list is decided up front because the tail is what tells each pass
   * whether it is the one that has to write the final surface, and normalize is
   * part of that decision even though it is submitted separately.
   */
  private planPasses(plan: GeometryPlan, passes: PassSet, hasOverlay: boolean): PassName[] {
    const steps: PassName[] = []
    if (passes.normalize) steps.push('normalize')
    if (plan.needsResample) steps.push('resample')
    if (passes.color !== 0) steps.push('color')
    if (passes.blur) steps.push('blur')
    if (passes.sharpen) steps.push('sharpen')
    if (passes.watermark && hasOverlay) steps.push('watermark')
    if (plan.needsGeometryPass) steps.push('orient')
    return steps
  }

  /** Records the passes that follow normalize into a single encoder. */
  private encodeChain(
    encoder: GPUCommandEncoder,
    source: Surface,
    settings: ConversionSettings,
    plan: GeometryPlan,
    remaining: readonly PassName[],
    passes: PassSet,
    overlay: ImageBitmap | null,
    held: PooledTexture[],
    retired: GPUBuffer[]
  ): Surface {
    if (remaining.length === 0) {
      // Nothing to do but change container. The uploaded texture is already the
      // final image, so this costs one upload and one download and no compute.
      return source
    }

    let current = source
    let index = 0
    const isLast = (): boolean => index === remaining.length - 1

    for (const step of remaining) {
      switch (step) {
        case 'resample':
          current = this.encodeResample(encoder, current, settings, plan, isLast(), held, retired)
          break
        case 'color':
          current = this.encodeColor(
            encoder,
            current,
            settings,
            passes.color,
            isLast(),
            held,
            retired
          )
          break
        case 'blur':
          current = this.encodeBlur(
            encoder,
            current,
            settings.adjust.blurSigma,
            isLast(),
            held,
            retired
          )
          break
        case 'sharpen':
          current = this.encodeSharpen(encoder, current, settings, isLast(), held, retired)
          break
        case 'watermark':
          if (overlay) {
            current = this.encodeWatermark(
              encoder,
              current,
              settings,
              overlay,
              isLast(),
              held,
              retired
            )
          }
          break
        case 'orient':
        default:
          current = this.encodeOrient(encoder, current, settings, plan, isLast(), held, retired)
          break
      }
      index += 1
    }

    return current
  }

  private encodeResample(
    encoder: GPUCommandEncoder,
    source: Surface,
    settings: ConversionSettings,
    plan: GeometryPlan,
    isLast: boolean,
    held: PooledTexture[],
    retired: GPUBuffer[]
  ): Surface {
    const kernel = kernelCode(settings.resize.kernel)
    let current = source
    let originX = plan.cropX
    let originY = plan.cropY
    let extentW = plan.cropW
    let extentH = plan.cropH

    for (let stage = 0; stage < plan.stages.length; stage += 1) {
      const target = plan.stages[stage]
      if (!target) continue
      const lastStage = stage === plan.stages.length - 1

      // Horizontal, then vertical, with the intermediate carrying the new width
      // and the old height.
      const intermediate = this.encodeResampleAxis(encoder, current, {
        axis: 0,
        originX,
        originY,
        extentW,
        extentH,
        dst: { w: target.w, h: extentH },
        scale: target.w / extentW,
        kernel,
        isFinal: false,
        held,
        retired
      })

      current = this.encodeResampleAxis(encoder, intermediate, {
        axis: 1,
        originX: 0,
        originY: 0,
        extentW: target.w,
        extentH,
        dst: { w: target.w, h: target.h },
        scale: target.h / extentH,
        kernel,
        isFinal: isLast && lastStage,
        held,
        retired
      })

      originX = 0
      originY = 0
      extentW = target.w
      extentH = target.h
    }

    return current
  }

  private encodeResampleAxis(
    encoder: GPUCommandEncoder,
    source: Surface,
    args: {
      axis: 0 | 1
      originX: number
      originY: number
      extentW: number
      extentH: number
      dst: Size
      scale: number
      kernel: number
      isFinal: boolean
      held: PooledTexture[]
      retired: GPUBuffer[]
    }
  ): Surface {
    const { surface, format } = this.nextSurface(args.dst, args.isFinal, args.held)

    // At unit scale every kernel collapses to the identity, and nearest reaches
    // it with one tap instead of six, so an axis that is not being resized
    // costs almost nothing.
    // A mirror belongs to the geometry pass, which runs on the finished canvas
    // and so composes with the rotation the way the CPU pipeline composes them.
    // Flipping here as well would apply the mirror twice.
    const kernel = args.scale === 1 ? KERNEL_CODE.nearest : args.kernel
    const flags = inputFlags(source) | (args.isFinal ? FINAL_OUTPUT_FLAGS : 0)

    this.scratch.u32(0, args.originX)
    this.scratch.u32(4, args.originY)
    this.scratch.u32(8, args.extentW)
    this.scratch.u32(12, args.extentH)
    this.scratch.u32(16, args.dst.w)
    this.scratch.u32(20, args.dst.h)
    this.scratch.f32(24, args.scale)
    this.scratch.u32(28, kernel)
    this.scratch.u32(32, args.axis)
    this.scratch.u32(36, flags)
    const uniform = this.uniformBuffer(this.scratch.take(40), args.retired)

    const pipeline = this.pipelineFor('resample', RESAMPLE_WGSL, 'oneSource', format)
    const bindGroup = this.device.createBindGroup({
      layout: this.layout('oneSource', format),
      entries: [
        { binding: 0, resource: { buffer: uniform } },
        { binding: 1, resource: source.pooled.texture.createView() },
        { binding: 2, resource: surface.pooled.texture.createView() }
      ]
    })

    this.dispatch(encoder, pipeline, bindGroup, args.dst, `resample-${args.axis}`)
    return surface
  }

  private encodeColor(
    encoder: GPUCommandEncoder,
    source: Surface,
    settings: ConversionSettings,
    stages: number,
    isLast: boolean,
    held: PooledTexture[],
    retired: GPUBuffer[]
  ): Surface {
    const size: Size = { w: source.width, h: source.height }
    const { surface, format } = this.nextSurface(size, isLast, held)
    const a = settings.adjust
    const flags = inputFlags(source) | (isLast ? FINAL_OUTPUT_FLAGS : 0)

    // Both colours reach the shader in linear light, because that is the space
    // every stage in it works in.
    const tint = parseColorFloat(a.tintColor)
    const flatten = parseColorFloat(a.flattenColor)

    this.scratch.u32(0, size.w)
    this.scratch.u32(4, size.h)
    this.scratch.u32(8, flags)
    this.scratch.u32(12, stages)
    this.scratch.f32(16, a.brightness)
    this.scratch.f32(20, a.saturation)
    this.scratch.f32(24, (a.hue * Math.PI) / 180)
    this.scratch.f32(28, a.lightness)
    this.scratch.f32(32, a.contrast)
    this.scratch.f32(36, a.gammaValue > 0 ? a.gammaValue : 1)
    this.scratch.vec4(48, srgbToLinearTuple(tint))
    this.scratch.vec4(64, srgbToLinearTuple(flatten))
    const uniform = this.uniformBuffer(this.scratch.take(80), retired)

    const pipeline = this.pipelineFor('color', COLOR_OPS_WGSL, 'oneSource', format)
    const bindGroup = this.device.createBindGroup({
      layout: this.layout('oneSource', format),
      entries: [
        { binding: 0, resource: { buffer: uniform } },
        { binding: 1, resource: source.pooled.texture.createView() },
        { binding: 2, resource: surface.pooled.texture.createView() }
      ]
    })

    this.dispatch(encoder, pipeline, bindGroup, size, 'color')
    return surface
  }

  /** Two gaussian passes, horizontal then vertical. */
  private encodeBlur(
    encoder: GPUCommandEncoder,
    source: Surface,
    sigma: number,
    isLast: boolean,
    held: PooledTexture[],
    retired: GPUBuffer[]
  ): Surface {
    const size: Size = { w: source.width, h: source.height }
    // Three sigma covers the kernel, and the radius is clamped so a runaway
    // sigma cannot turn into a million tap loop.
    const radius = clamp(Math.ceil(sigma * 3), 1, 128)

    const horizontal = this.encodeBlurAxis(
      encoder,
      source,
      sigma,
      radius,
      0,
      size,
      false,
      held,
      retired
    )
    return this.encodeBlurAxis(encoder, horizontal, sigma, radius, 1, size, isLast, held, retired)
  }

  private encodeBlurAxis(
    encoder: GPUCommandEncoder,
    source: Surface,
    sigma: number,
    radius: number,
    axis: 0 | 1,
    size: Size,
    isFinal: boolean,
    held: PooledTexture[],
    retired: GPUBuffer[]
  ): Surface {
    const { surface, format } = this.nextSurface(size, isFinal, held)
    const flags = inputFlags(source) | (isFinal ? FINAL_OUTPUT_FLAGS : 0)

    this.scratch.u32(0, size.w)
    this.scratch.u32(4, size.h)
    this.scratch.f32(8, Math.max(sigma, 0.1))
    this.scratch.i32(12, radius)
    this.scratch.u32(16, axis)
    this.scratch.u32(20, flags)
    const uniform = this.uniformBuffer(this.scratch.take(24), retired)

    const pipeline = this.pipelineFor('blur', GAUSSIAN_WGSL, 'oneSource', format)
    const bindGroup = this.device.createBindGroup({
      layout: this.layout('oneSource', format),
      entries: [
        { binding: 0, resource: { buffer: uniform } },
        { binding: 1, resource: source.pooled.texture.createView() },
        { binding: 2, resource: surface.pooled.texture.createView() }
      ]
    })

    this.dispatch(encoder, pipeline, bindGroup, size, `blur-${axis}`)
    return surface
  }

  /**
   * Blurs a private copy and subtracts it from the original.
   *
   * The blurred copy is a throwaway intermediate, so it is always allocated at
   * the working format even when the sharpen itself is the final pass.
   */
  private encodeSharpen(
    encoder: GPUCommandEncoder,
    source: Surface,
    settings: ConversionSettings,
    isLast: boolean,
    held: PooledTexture[],
    retired: GPUBuffer[]
  ): Surface {
    const a = settings.adjust
    const size: Size = { w: source.width, h: source.height }
    const radius = clamp(Math.ceil(a.sharpenSigma * 3), 1, 128)

    const blurredX = this.encodeBlurAxis(
      encoder,
      source,
      a.sharpenSigma,
      radius,
      0,
      size,
      false,
      held,
      retired
    )
    const blurred = this.encodeBlurAxis(
      encoder,
      blurredX,
      a.sharpenSigma,
      radius,
      1,
      size,
      false,
      held,
      retired
    )

    const { surface, format } = this.nextSurface(size, isLast, held)
    const flags = inputFlags(source) | (isLast ? FINAL_OUTPUT_FLAGS : 0)

    this.scratch.u32(0, size.w)
    this.scratch.u32(4, size.h)
    this.scratch.f32(8, a.sharpenM1)
    this.scratch.f32(12, a.sharpenM2)
    // libvips fixes the flat versus jagged threshold at 2 Lab units and the
    // brighten and darken limits at 10 and 20. sharp exposes none of them.
    this.scratch.f32(16, 2)
    this.scratch.f32(20, 10)
    this.scratch.f32(24, 20)
    this.scratch.u32(28, flags)
    // The blurred copy is a working intermediate, so it is already linear and
    // premultiplied and needs no conversion on load.
    this.scratch.u32(32, 0)
    const uniform = this.uniformBuffer(this.scratch.take(40), retired)

    const pipeline = this.pipelineFor('sharpen', UNSHARP_WGSL, 'twoSource', format)
    const bindGroup = this.device.createBindGroup({
      layout: this.layout('twoSource', format),
      entries: [
        { binding: 0, resource: { buffer: uniform } },
        { binding: 1, resource: source.pooled.texture.createView() },
        { binding: 2, resource: blurred.pooled.texture.createView() },
        { binding: 3, resource: surface.pooled.texture.createView() }
      ]
    })

    this.dispatch(encoder, pipeline, bindGroup, size, 'sharpen')
    return surface
  }

  private encodeWatermark(
    encoder: GPUCommandEncoder,
    source: Surface,
    settings: ConversionSettings,
    overlay: ImageBitmap,
    isLast: boolean,
    held: PooledTexture[],
    retired: GPUBuffer[]
  ): Surface {
    const size: Size = { w: source.width, h: source.height }
    const { surface, format } = this.nextSurface(size, isLast, held)

    const overlayTexture = this.pool.acquireTexture(
      overlay.width,
      overlay.height,
      'rgba8unorm',
      SOURCE_USAGE
    )
    held.push(overlayTexture)
    this.device.queue.copyExternalImageToTexture(
      { source: overlay, flipY: false },
      { texture: overlayTexture.texture, premultipliedAlpha: false },
      { width: overlay.width, height: overlay.height }
    )

    const mark = settings.watermark
    const anchor = gravityAnchor(mark.position)
    const freeX = Math.max(0, size.w - overlay.width - mark.marginX * 2)
    const freeY = Math.max(0, size.h - overlay.height - mark.marginY * 2)
    const offsetX = Math.round(mark.marginX + freeX * anchor.x)
    const offsetY = Math.round(mark.marginY + freeY * anchor.y)

    // Tiles are spaced by the overlay plus the margin, so the margin controls
    // the gap between repeats as well as the inset of a single placement.
    const pitchX = overlay.width + Math.max(0, mark.marginX)
    const pitchY = overlay.height + Math.max(0, mark.marginY)

    const flags = inputFlags(source) | (isLast ? FINAL_OUTPUT_FLAGS : 0)
    const overlayFlags = SHADER_FLAG.decodeSrgb | SHADER_FLAG.premultiplyIn

    this.scratch.u32(0, size.w)
    this.scratch.u32(4, size.h)
    this.scratch.u32(8, overlay.width)
    this.scratch.u32(12, overlay.height)
    this.scratch.i32(16, offsetX)
    this.scratch.i32(20, offsetY)
    this.scratch.u32(24, pitchX)
    this.scratch.u32(28, pitchY)
    this.scratch.f32(32, clamp(mark.opacity, 0, 100) / 100)
    this.scratch.u32(36, mark.tile ? 1 : 0)
    this.scratch.u32(40, flags)
    this.scratch.u32(44, overlayFlags)
    const uniform = this.uniformBuffer(this.scratch.take(48), retired)

    const pipeline = this.pipelineFor('watermark', WATERMARK_WGSL, 'twoSource', format)
    const bindGroup = this.device.createBindGroup({
      layout: this.layout('twoSource', format),
      entries: [
        { binding: 0, resource: { buffer: uniform } },
        { binding: 1, resource: source.pooled.texture.createView() },
        { binding: 2, resource: overlayTexture.texture.createView() },
        { binding: 3, resource: surface.pooled.texture.createView() }
      ]
    })

    this.dispatch(encoder, pipeline, bindGroup, size, 'watermark')
    return surface
  }

  private encodeOrient(
    encoder: GPUCommandEncoder,
    source: Surface,
    settings: ConversionSettings,
    plan: GeometryPlan,
    isLast: boolean,
    held: PooledTexture[],
    retired: GPUBuffer[]
  ): Surface {
    const { surface, format } = this.nextSurface(plan.canvas, isLast, held)
    // This pass owns the mirror, because it is the only one that sees the
    // finished canvas and so applies it after the rotation, which is the order
    // the CPU pipeline composes the two in.
    const flip =
      (plan.flipH ? SHADER_FLAG.flipHorizontal : 0) | (plan.flipV ? SHADER_FLAG.flipVertical : 0)
    const flags = inputFlags(source) | flip | (isLast ? FINAL_OUTPUT_FLAGS : 0)

    // Two regions, two colours: `contain` fills the box it reserved with the
    // resize background, and the transform border around it keeps the padding
    // colour.
    const border = premultipliedLinear(settings.transform.paddingColor)
    const letterbox = premultipliedLinear(settings.resize.background)
    const box = plan.letterbox

    this.scratch.u32(0, source.width)
    this.scratch.u32(4, source.height)
    this.scratch.u32(8, plan.canvas.w)
    this.scratch.u32(12, plan.canvas.h)
    this.scratch.u32(16, plan.padX)
    this.scratch.u32(20, plan.padY)
    // An empty box leaves every texel outside the image to the border, which is
    // what every fit other than `contain` asks for.
    this.scratch.u32(24, box?.x ?? 0)
    this.scratch.u32(28, box?.y ?? 0)
    this.scratch.u32(32, box?.w ?? 0)
    this.scratch.u32(36, box?.h ?? 0)
    this.scratch.u32(40, plan.quarterTurns)
    this.scratch.u32(44, flags)
    this.scratch.vec4(48, border)
    this.scratch.vec4(64, letterbox)
    const uniform = this.uniformBuffer(this.scratch.take(80), retired)

    const pipeline = this.pipelineFor('orient', ORIENT_WGSL, 'oneSource', format)
    const bindGroup = this.device.createBindGroup({
      layout: this.layout('oneSource', format),
      entries: [
        { binding: 0, resource: { buffer: uniform } },
        { binding: 1, resource: source.pooled.texture.createView() },
        { binding: 2, resource: surface.pooled.texture.createView() }
      ]
    })

    this.dispatch(encoder, pipeline, bindGroup, plan.canvas, 'orient')
    return surface
  }

  /**
   * Measures the lightness histogram, picks the percentile bounds, then applies
   * the stretch.
   *
   * This is the one operation that cannot fit in a single submit: the uniform
   * of the second pass is a function of the result of the first, so the counts
   * have to come back to the host in between. The readback is one kilobyte and
   * the percentile search over 256 bins is a few microseconds, which is far
   * cheaper than a GPU side scan and a second dispatch would be.
   */
  private async runNormalize(
    source: Surface,
    settings: ConversionSettings,
    isLast: boolean,
    held: PooledTexture[],
    retired: GPUBuffer[]
  ): Promise<Surface> {
    const size: Size = { w: source.width, h: source.height }
    const binBytes = HISTOGRAM_BINS * 4

    const bins = this.pool.acquireBuffer(
      binBytes,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      'histogram'
    )
    const readback = this.pool.acquireBuffer(
      binBytes,
      GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      'histogram-read'
    )

    try {
      this.scratch.u32(0, size.w)
      this.scratch.u32(4, size.h)
      this.scratch.u32(8, inputFlags(source))
      const uniform = this.uniformBuffer(this.scratch.take(16), retired)

      const encoder = this.device.createCommandEncoder({ label: 'bico-histogram' })
      // A pooled buffer holds the previous image's counts, so clearing is not
      // optional.
      encoder.clearBuffer(bins, 0, binBytes)

      const histogramPipeline = this.pipelineFor(
        'histogram',
        HISTOGRAM_WGSL,
        'histogram',
        'rgba16float'
      )
      const bindGroup = this.device.createBindGroup({
        layout: this.layout('histogram', 'rgba16float'),
        entries: [
          { binding: 0, resource: { buffer: uniform } },
          { binding: 1, resource: source.pooled.texture.createView() },
          { binding: 2, resource: { buffer: bins, size: binBytes } }
        ]
      })
      this.dispatch(encoder, histogramPipeline, bindGroup, size, 'histogram')
      encoder.copyBufferToBuffer(bins, 0, readback, 0, binBytes)
      this.device.queue.submit([encoder.finish()])

      await readback.mapAsync(GPUMapMode.READ, 0, binBytes)
      const counts = new Uint32Array(readback.getMappedRange(0, binBytes).slice(0))
      readback.unmap()

      const bounds = percentileBounds(
        counts,
        settings.adjust.normalizeLower,
        settings.adjust.normalizeUpper
      )

      const applyEncoder = this.device.createCommandEncoder({ label: 'bico-normalize' })
      // Normalize is the whole chain when nothing else was asked for, and then
      // it has to leave behind the surface the readback copies from: rgba8unorm
      // with COPY_SRC, sRGB encoded and straight, not a working texture.
      const { surface, format } = this.nextSurface(size, isLast, held)

      this.scratch.u32(0, size.w)
      this.scratch.u32(4, size.h)
      this.scratch.f32(8, bounds.low)
      this.scratch.f32(12, bounds.high)
      this.scratch.u32(16, inputFlags(source) | (isLast ? FINAL_OUTPUT_FLAGS : 0))
      const applyUniform = this.uniformBuffer(this.scratch.take(32), retired)

      const applyPipeline = this.pipelineFor('normalize', NORMALIZE_WGSL, 'oneSource', format)
      const applyBind = this.device.createBindGroup({
        layout: this.layout('oneSource', format),
        entries: [
          { binding: 0, resource: { buffer: applyUniform } },
          { binding: 1, resource: source.pooled.texture.createView() },
          { binding: 2, resource: surface.pooled.texture.createView() }
        ]
      })
      this.dispatch(applyEncoder, applyPipeline, applyBind, size, 'normalize')
      this.device.queue.submit([applyEncoder.finish()])

      return surface
    } finally {
      this.pool.releaseBuffer(bins)
      this.pool.releaseBuffer(readback)
    }
  }

  /** Maps the staging buffer and drops the row padding the copy required. */
  private async readBack(
    staging: GPUBuffer,
    size: Size,
    rowBytes: number,
    paddedRowBytes: number
  ): Promise<Uint8Array> {
    const total = paddedRowBytes * size.h
    await staging.mapAsync(GPUMapMode.READ, 0, total)
    const mapped = new Uint8Array(staging.getMappedRange(0, total))

    let pixels: Uint8Array
    if (rowBytes === paddedRowBytes) {
      // The mapped range dies at unmap, so this copy is not optional.
      pixels = mapped.slice(0, rowBytes * size.h)
    } else {
      pixels = new Uint8Array(rowBytes * size.h)
      for (let row = 0; row < size.h; row += 1) {
        const from = row * paddedRowBytes
        pixels.set(mapped.subarray(from, from + rowBytes), row * rowBytes)
      }
    }

    staging.unmap()
    return pixels
  }

  /** Releases every GPU resource this pipeline owns. Safe to call twice. */
  destroy(): void {
    if (this.disposed) return
    this.disposed = true
    this.pool.destroy()
    this.modules.clear()
    this.pipelines.clear()
    this.layouts.clear()
  }
}

/* ================================================================== */
/* Helpers                                                             */
/* ================================================================== */

/** The sRGB decode, applied on the host to colours headed for a shader. */
function srgbToLinearTuple(
  color: readonly [number, number, number, number]
): [number, number, number, number] {
  const decode = (c: number): number =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return [decode(color[0]), decode(color[1]), decode(color[2]), color[3]]
}

/**
 * A settings colour in the representation a pass shader stores directly.
 *
 * The premultiply happens here rather than in the shader because these colours
 * are written into the destination as already composited texels.
 */
function premultipliedLinear(color: string): [number, number, number, number] {
  const [r, g, b, a] = srgbToLinearTuple(parseColorFloat(color))
  return [r * a, g * a, b * a, a]
}

/**
 * Finds the lightness values at the requested percentiles.
 *
 * Walking the cumulative distribution is exact to the bin width, which at 256
 * bins is well below what an 8 bit output can represent, so nothing is lost by
 * not interpolating inside a bin.
 */
export function percentileBounds(
  counts: Uint32Array,
  lowerPercent: number,
  upperPercent: number
): { low: number; high: number } {
  let total = 0
  for (let i = 0; i < counts.length; i += 1) total += counts[i] ?? 0
  if (total === 0) return { low: 0, high: 1 }

  const lowTarget = (clamp(lowerPercent, 0, 100) / 100) * total
  const highTarget = (clamp(upperPercent, 0, 100) / 100) * total

  let running = 0
  let low = 0
  let high = counts.length - 1
  let foundLow = false

  for (let i = 0; i < counts.length; i += 1) {
    running += counts[i] ?? 0
    if (!foundLow && running >= lowTarget) {
      low = i
      foundLow = true
    }
    if (running >= highTarget) {
      high = i
      break
    }
  }

  if (high <= low) high = Math.min(counts.length - 1, low + 1)
  return { low: low / counts.length, high: (high + 1) / counts.length }
}
