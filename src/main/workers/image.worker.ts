/**
 * The sharp image pipeline, running on a worker thread.
 *
 * electron.vite.config.ts builds this file as a second CommonJS entry point,
 * emitted to out/main/workers/image.worker.js. The main process spawns one
 * instance per CPU lane with node worker_threads and talks to it over
 * parentPort using the message envelopes declared at the top of this file.
 *
 * Nothing in here touches Electron. The worker only knows about a source path,
 * a ConversionSettings object and where the bytes should end up, which keeps it
 * testable from a plain node script.
 */

import { Buffer } from 'node:buffer'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { parentPort } from 'node:worker_threads'

import sharp from 'sharp'
import type {
  AvifOptions,
  GifOptions,
  HeifOptions,
  JpegOptions,
  OutputInfo,
  OverlayOptions,
  PngOptions,
  Region,
  ResizeOptions,
  Sharp,
  SharpOptions,
  TiffOptions,
  WebpOptions,
  WriteableMetadata
} from 'sharp'

import { PREVIEW_MAX_EDGE } from '@shared/defaults'
import { FORMATS, baselineIsLossy, extensionToInputFormat, outputExtension } from '@shared/formats'
import { resolveTemplate, sanitizeSegment } from '@shared/naming'
import { clamp, errorMessage, parseColor } from '@shared/utils'
import { decodeJp2, encodeJp2, isJp2Extension, type Jp2EncodeOptions } from '../codecs/jp2'
import { decodeJxl, encodeJxl, isJxlExtension, type JxlEncodeOptions } from '../codecs/jxl'
import type {
  AdjustSettings,
  ChromaSubsampling,
  ConversionSettings,
  CropSettings,
  FitMode,
  GravityPosition,
  JobOutput,
  MetadataPolicy,
  MetadataSettings,
  OutputFormat,
  PreviewFallback,
  ResizeSettings,
  SourceFile,
  VariantSpec,
  WatermarkSettings,
  WorkerInbound,
  WorkerJobRequest,
  WorkerJobResponse,
  WorkerOutbound,
  WorkerPreviewRequest,
  WorkerPreviewResponse
} from '@shared/types'

/* Small shared helpers */

/**
 * One entry the main process has to append to the shared archive.
 *
 * The worker never opens the ZIP itself, because every lane in the run writes
 * into the same one and only a single writer can own it.
 */
type ZipEntry = WorkerJobResponse['buffers'][number]

/**
 * Detaches encoded bytes into a transferable ArrayBuffer.
 *
 * Node hands out Buffers that are windows onto a shared allocation pool, so
 * passing `.buffer` straight across would ship the whole pool and expose
 * whatever else happened to be sharing it. Copying is both the correct and the
 * safe answer, and it only happens on the ZIP path.
 */
function toArrayBuffer(data: Buffer): ArrayBuffer {
  const copy = new ArrayBuffer(data.byteLength)
  new Uint8Array(copy).set(data)
  return copy
}

type ConcreteFormat = Exclude<OutputFormat, 'original'>

/** Rasterisation target for inputs that have no writer of their own. */
const RASTER_FALLBACK: ConcreteFormat = 'png'

/** How many quality probes the size search is allowed to spend per output. */
const SIZE_SEARCH_ITERATIONS = 7

/** Upper bound on the `name-1`, `name-2` walk before giving up on a free name. */
const MAX_COLLISION_ATTEMPTS = 9999

/** Mid grey in an 8 bit channel, the pivot the contrast multiplier turns about. */
const MID_GREY = 128

interface RawImage {
  data: Buffer
  width: number
  height: number
  /** Always 3 or 4: the staging step normalises into sRGB with optional alpha. */
  channels: 3 | 4
}

interface Size {
  width: number
  height: number
}

/**
 * Picks the container that will actually be written.
 *
 * `original` means "whatever the source was", which only works for the
 * containers BICO can also write. SVG, camera raw and anything unrecognised
 * have no writer, so they rasterise to PNG rather than failing the job.
 */
export function resolveTargetFormat(requested: OutputFormat, sourceExt: string): ConcreteFormat {
  if (requested !== 'original') return requested
  switch (extensionToInputFormat(sourceExt)) {
    case 'jpeg':
      return 'jpeg'
    case 'png':
      return 'png'
    case 'webp':
      return 'webp'
    case 'avif':
      return 'avif'
    case 'tiff':
      return 'tiff'
    case 'gif':
      return 'gif'
    case 'heif':
      return 'heif'
    case 'jxl':
      return 'jxl'
    case 'jp2':
      return 'jp2'
    default:
      return RASTER_FALLBACK
  }
}

function fromRaw(image: RawImage): Sharp {
  return sharp(image.data, {
    raw: { width: image.width, height: image.height, channels: image.channels }
  })
}

/**
 * Runs a pipeline to uncompressed pixels so later stages can be replayed
 * cheaply. The sRGB conversion is what lets the raw descriptor be typed as
 * three or four bands: without it a greyscale intermediate would come back as
 * one band and the reload would silently misread the buffer.
 */
async function materialise(pipeline: Sharp): Promise<RawImage> {
  const { data, info } = await pipeline
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height, channels: info.channels === 4 ? 4 : 3 }
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target)
    return true
  } catch {
    return false
  }
}

/* Orientation */

/**
 * A member of the symmetry group of the rectangle, in the only shape sharp can
 * express: an optional left to right mirror followed by a quarter turn.
 *
 * Everything the transform panel offers, EXIF orientation included, collapses
 * into one of these eight values, which matters because sharp accepts exactly
 * one rotation per pipeline.
 */
interface Orientation {
  /** Mirror left to right. sharp always applies this before the rotation. */
  flop: boolean
  /** Clockwise rotation in degrees: 0, 90, 180 or 270. */
  angle: number
}

const NO_ORIENTATION: Orientation = { flop: false, angle: 0 }

function normaliseAngle(angle: number): number {
  const wrapped = angle % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

/**
 * Returns the single orientation equivalent to applying `base` and then `next`.
 *
 * Mirroring conjugates rotation, so a flop that happens after a turn of k
 * degrees is the same as a turn of minus k degrees after a flop. That identity
 * is the whole rule: without a mirror the angles simply add, and with one the
 * accumulated angle is subtracted instead.
 */
function composeOrientation(base: Orientation, next: Orientation): Orientation {
  if (!next.flop) {
    return { flop: base.flop, angle: normaliseAngle(base.angle + next.angle) }
  }
  return { flop: !base.flop, angle: normaliseAngle(next.angle - base.angle) }
}

const FLIP_VERTICAL: Orientation = { flop: true, angle: 180 }
const FLOP_HORIZONTAL: Orientation = { flop: true, angle: 0 }

/**
 * The EXIF orientation tag reduced to the same canonical pair.
 *
 * The eight cases mirror the table libvips itself uses. Values outside 1 to 8,
 * and the missing tag, all mean "leave the pixels alone".
 */
function exifOrientation(tag: number | undefined): Orientation {
  switch (tag) {
    case 2: // Mirrored left to right.
      return FLOP_HORIZONTAL
    case 3: // Upside down.
      return { flop: false, angle: 180 }
    case 4: // Mirrored top to bottom.
      return FLIP_VERTICAL
    case 5: // Mirrored, then a quarter turn anticlockwise.
      return { flop: true, angle: 270 }
    case 6: // A quarter turn clockwise.
      return { flop: false, angle: 90 }
    case 7: // Mirrored, then a quarter turn clockwise.
      return { flop: true, angle: 90 }
    case 8: // A quarter turn anticlockwise.
      return { flop: false, angle: 270 }
    default:
      return NO_ORIENTATION
  }
}

/**
 * Folds EXIF orientation and the user transform into one rotation.
 *
 * sharp cannot express these as separate steps. Calling rotate() with no
 * argument sets an "use the EXIF tag" flag that a later rotate(90) overwrites,
 * so the explicit angle is silently lost, and flip and flop are always applied
 * before the rotation regardless of the order they were chained in. Composing
 * the whole transform ourselves and emitting a single flop plus a single
 * rotate is the only way to honour both the tag and the panel.
 */
function planOrientation(settings: ConversionSettings, exifTag: number | undefined): Orientation {
  const { autoOrient, rotate, flipVertical, flipHorizontal } = settings.transform

  let plan = autoOrient ? exifOrientation(exifTag) : NO_ORIENTATION
  plan = composeOrientation(plan, { flop: false, angle: normaliseAngle(rotate) })
  if (flipVertical) plan = composeOrientation(plan, FLIP_VERTICAL)
  if (flipHorizontal) plan = composeOrientation(plan, FLOP_HORIZONTAL)
  return plan
}

function applyOrientation(pipeline: Sharp, plan: Orientation): Sharp {
  let next = pipeline
  if (plan.flop) next = next.flop()
  if (plan.angle !== 0) next = next.rotate(plan.angle)
  return next
}

/** Dimensions after a quarter turn, which swaps the axes. */
function orientedSize(size: Size, plan: Orientation): Size {
  return plan.angle === 90 || plan.angle === 270 ? { width: size.height, height: size.width } : size
}

/* Crop */

/**
 * Resolves the crop rectangle in the coordinate space the user drew it in.
 *
 * The preview shows the image after orientation, so the rectangle is expressed
 * against the oriented size, and the region is clamped into that box rather
 * than thrown out: a stale rectangle from a differently sized file should crop
 * as much as it can instead of failing the whole job.
 */
function resolveCropRegion(crop: CropSettings, size: Size): Region | null {
  if (size.width <= 0 || size.height <= 0) return null

  if (crop.mode === 'manual') {
    if (crop.width <= 0 || crop.height <= 0) return null
    const left = Math.round(clamp(crop.left, 0, size.width - 1))
    const top = Math.round(clamp(crop.top, 0, size.height - 1))
    const width = Math.round(clamp(crop.width, 1, size.width - left))
    const height = Math.round(clamp(crop.height, 1, size.height - top))
    if (width === size.width && height === size.height) return null
    return { left, top, width, height }
  }

  if (crop.mode === 'aspect') {
    if (!Number.isFinite(crop.aspectRatio) || crop.aspectRatio <= 0) return null
    // The largest rectangle of the requested shape that still fits, centred.
    const byWidth = Math.min(size.width, size.height * crop.aspectRatio)
    const width = Math.max(1, Math.round(byWidth))
    const height = Math.max(1, Math.round(width / crop.aspectRatio))
    if (width >= size.width && height >= size.height) return null
    return {
      left: Math.max(0, Math.round((size.width - width) / 2)),
      top: Math.max(0, Math.round((size.height - height) / 2)),
      width: Math.min(width, size.width),
      height: Math.min(height, size.height)
    }
  }

  return null
}

/**
 * Applies the crop stage and reports the size the rest of the pipeline sees.
 *
 * Two sharp ordering rules are load bearing here. A pending rotation is moved
 * ahead of the extract automatically, which is what puts the region into
 * oriented space, but a lone flop is not, so when the plan is a pure mirror the
 * region is mirrored instead. Trim is content driven, so the size it leaves
 * behind is unknowable until the pipeline actually runs.
 */
function applyCrop(
  pipeline: Sharp,
  crop: CropSettings,
  plan: Orientation,
  size: Size
): { pipeline: Sharp; size: Size; sizeIsExact: boolean } {
  if (!crop.enabled) return { pipeline, size, sizeIsExact: true }

  if (crop.mode === 'trim') {
    const threshold = clamp(crop.trimThreshold, 0, 100)
    return { pipeline: pipeline.trim({ threshold }), size, sizeIsExact: false }
  }

  const region = resolveCropRegion(crop, size)
  if (!region) return { pipeline, size, sizeIsExact: true }

  const mirrorOnly = plan.flop && plan.angle === 0
  const applied: Region = mirrorOnly
    ? { ...region, left: Math.max(0, size.width - region.left - region.width) }
    : region

  return {
    pipeline: pipeline.extract(applied),
    size: { width: region.width, height: region.height },
    sizeIsExact: true
  }
}

/* Resize */

/**
 * Translates the gravity picker into something sharp accepts.
 *
 * The two content aware strategies are cover only, so anywhere else they fall
 * back to a centred crop rather than making sharp throw.
 */
function resolvePosition(position: GravityPosition, fit: FitMode): number | string {
  if (position === 'entropy') return fit === 'cover' ? sharp.strategy.entropy : 'centre'
  if (position === 'attention') return fit === 'cover' ? sharp.strategy.attention : 'centre'
  return position
}

function positiveOrNull(value: number | null): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : null
}

/**
 * Turns a resize strategy into sharp resize options, or null for a no op.
 *
 * `longest` and `shortest` are expressed as a square box with a fit of inside
 * or outside rather than as a computed scale factor. That is exact whatever the
 * aspect ratio, and it keeps working when a preceding trim has changed the size
 * out from under us. `percentage` and `megapixels` genuinely need the incoming
 * dimensions, so they are the two strategies a content driven trim can only
 * approximate.
 */
function planResize(resize: ResizeSettings, current: Size): ResizeOptions | null {
  const shared: ResizeOptions = {
    kernel: resize.kernel,
    withoutEnlargement: resize.withoutEnlargement,
    withoutReduction: resize.withoutReduction,
    background: parseColor(resize.background)
  }

  const width = positiveOrNull(resize.width)
  const height = positiveOrNull(resize.height)

  switch (resize.strategy) {
    case 'none':
      return null

    case 'exact': {
      if (width === null && height === null) return null
      // Both edges pinned is the one case where the fit and gravity pickers
      // decide anything, because only then can the box disagree with the image.
      return {
        ...shared,
        width: width ?? undefined,
        height: height ?? undefined,
        fit: resize.fit,
        position: resolvePosition(resize.position, resize.fit)
      }
    }

    case 'width':
      return width === null ? null : { ...shared, width }

    case 'height':
      return height === null ? null : { ...shared, height }

    case 'longest':
      return width === null ? null : { ...shared, width, height: width, fit: 'inside' }

    case 'shortest':
      return width === null ? null : { ...shared, width, height: width, fit: 'outside' }

    case 'percentage': {
      const factor = clamp(resize.percentage, 1, 1000) / 100
      if (factor === 1) return null
      return {
        ...shared,
        width: Math.max(1, Math.round(current.width * factor)),
        height: Math.max(1, Math.round(current.height * factor)),
        fit: 'fill'
      }
    }

    case 'megapixels': {
      const targetPixels = Math.max(0.01, resize.megapixels) * 1e6
      const currentPixels = current.width * current.height
      if (currentPixels <= 0) return null
      const factor = Math.sqrt(targetPixels / currentPixels)
      return {
        ...shared,
        width: Math.max(1, Math.round(current.width * factor)),
        height: Math.max(1, Math.round(current.height * factor)),
        fit: 'fill'
      }
    }

    default:
      return null
  }
}

/**
 * Predicts the size a resize will produce, without running it.
 *
 * Only the animated path needs this: there the pipeline cannot be flattened to
 * pixels without collapsing the frame strip, so the watermark has to be placed
 * against a computed size rather than a measured one. Everywhere else the
 * measured size from the staging step is used instead, because it is exact.
 */
function predictResize(size: Size, options: ResizeOptions): Size {
  if (size.width <= 0 || size.height <= 0) return size

  const width = options.width
  const height = options.height
  let scale: number

  if (typeof width === 'number' && typeof height === 'number') {
    if (options.fit === 'fill' || options.fit === 'cover' || options.fit === 'contain') {
      return { width, height }
    }
    const byWidth = width / size.width
    const byHeight = height / size.height
    scale = options.fit === 'outside' ? Math.max(byWidth, byHeight) : Math.min(byWidth, byHeight)
  } else if (typeof width === 'number') {
    scale = width / size.width
  } else if (typeof height === 'number') {
    scale = height / size.height
  } else {
    return size
  }

  if (options.withoutEnlargement) scale = Math.min(scale, 1)
  if (options.withoutReduction) scale = Math.max(scale, 1)

  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale))
  }
}

/** The resize a variant asks for, expressed against the primary resize settings. */
function variantResize(base: ResizeSettings, variant: VariantSpec): ResizeSettings {
  if (variant.strategy === 'none') return { ...base, strategy: 'none' }
  if (variant.strategy === 'percentage') {
    return { ...base, strategy: 'percentage', percentage: variant.value }
  }
  return {
    ...base,
    strategy: variant.strategy,
    width: variant.value,
    height: variant.strategy === 'height' ? variant.value : base.height
  }
}

/* Colour adjustments */

/** Sepia as a luminance preserving channel mix, the matrix photo editors use. */
const SEPIA_MATRIX: [[number, number, number], [number, number, number], [number, number, number]] =
  [
    [0.393, 0.769, 0.189],
    [0.349, 0.686, 0.168],
    [0.272, 0.534, 0.131]
  ]

/**
 * Applies every enabled colour adjustment, in the order a photo editor would.
 *
 * Every value is clamped into the range libvips accepts before it is handed
 * over, because sharp validates eagerly and throws on anything outside: a
 * slider left at zero would otherwise fail the file instead of doing nothing.
 */
function applyAdjustments(pipeline: Sharp, adjust: AdjustSettings): Sharp {
  let next = pipeline

  if (adjust.grayscale) next = next.grayscale()

  // modulate rejects an empty object, and passing a neutral value is not the
  // same as passing nothing for hue, so only genuine changes are forwarded.
  const modulation: { brightness?: number; saturation?: number; hue?: number; lightness?: number } =
    {}
  if (adjust.brightness !== 1) modulation.brightness = clamp(adjust.brightness, 0.01, 10)
  if (adjust.saturation !== 1) modulation.saturation = clamp(adjust.saturation, 0, 10)
  if (adjust.hue !== 0) modulation.hue = Math.round(clamp(adjust.hue, -360, 360))
  if (adjust.lightness !== 0) modulation.lightness = clamp(adjust.lightness, -100, 100)
  if (Object.keys(modulation).length > 0) next = next.modulate(modulation)

  if (adjust.contrast !== 1) {
    // Scaling about mid grey rather than about black: the offset is what keeps
    // a neutral midtone neutral while the ends of the range spread apart.
    const gain = clamp(adjust.contrast, 0, 5)
    next = next.linear(gain, MID_GREY * (1 - gain))
  }

  if (adjust.invert) next = next.negate({ alpha: false })
  if (adjust.tint) next = next.tint(parseColor(adjust.tintColor))
  if (adjust.sepia) next = next.recomb(SEPIA_MATRIX)
  if (adjust.gamma) next = next.gamma(clamp(adjust.gammaValue, 1, 3))

  if (adjust.normalize) {
    const lower = clamp(adjust.normalizeLower, 0, 99)
    const upper = clamp(adjust.normalizeUpper, lower + 1, 100)
    next = next.normalise({ lower, upper })
  }

  if (adjust.clahe) {
    next = next.clahe({
      width: Math.max(1, Math.round(adjust.claheWidth)),
      height: Math.max(1, Math.round(adjust.claheHeight)),
      maxSlope: Math.round(clamp(adjust.claheMaxSlope, 0, 100))
    })
  }

  if (adjust.median) next = next.median(Math.round(clamp(adjust.medianSize, 1, 1000)))
  if (adjust.blur) next = next.blur(clamp(adjust.blurSigma, 0.3, 1000))

  if (adjust.sharpen) {
    next = next.sharpen({
      sigma: clamp(adjust.sharpenSigma, 0.01, 10),
      m1: clamp(adjust.sharpenM1, 0, 1_000_000),
      m2: clamp(adjust.sharpenM2, 0, 1_000_000)
    })
  }

  if (adjust.flatten) next = next.flatten({ background: parseColor(adjust.flattenColor) })

  return next
}

/* Watermark */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Average glyph advance as a fraction of the point size.
 *
 * SVG has no way to ask how wide a string will render, so the canvas is sized
 * from this estimate. It is deliberately generous: an oversized canvas is
 * invisible once composited, whereas an undersized one clips the text.
 */
const GLYPH_ADVANCE_RATIO = 0.62

/** Line box height as a fraction of the point size, ascender to descender. */
const LINE_HEIGHT_RATIO = 1.4

/**
 * Renders the watermark text into a standalone SVG.
 *
 * The text is centred in its own canvas and rotated about that centre, and the
 * canvas is sized to the rotated bounding box, so any rotation stays fully
 * inside the overlay instead of being cut off at the edges.
 */
function buildTextOverlay(watermark: WatermarkSettings): Buffer {
  const fontSize = Math.max(1, Math.round(watermark.fontSize))
  const lines = watermark.text.split(/\r?\n/)
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 1)

  const textWidth = Math.max(fontSize, longest * fontSize * GLYPH_ADVANCE_RATIO)
  const textHeight = lines.length * fontSize * LINE_HEIGHT_RATIO

  const radians = (watermark.rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))
  const boxWidth = Math.ceil(textWidth * cos + textHeight * sin)
  const boxHeight = Math.ceil(textWidth * sin + textHeight * cos)

  const centreX = boxWidth / 2
  const centreY = boxHeight / 2
  const { r, g, b, alpha } = parseColor(watermark.color)

  const firstBaseline = centreY - ((lines.length - 1) * fontSize * LINE_HEIGHT_RATIO) / 2
  const spans = lines
    .map((line, index) => {
      const y = firstBaseline + index * fontSize * LINE_HEIGHT_RATIO
      return `<text x="${centreX}" y="${y}" text-anchor="middle" dominant-baseline="central">${escapeXml(line)}</text>`
    })
    .join('')

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${boxWidth}" height="${boxHeight}" ` +
    `viewBox="0 0 ${boxWidth} ${boxHeight}">` +
    `<g transform="rotate(${watermark.rotation} ${centreX} ${centreY})" ` +
    `font-family="${escapeXml(watermark.fontFamily)}" font-size="${fontSize}" ` +
    `fill="rgb(${r},${g},${b})" fill-opacity="${alpha}">` +
    `${spans}</g></svg>`

  return Buffer.from(svg, 'utf8')
}

/**
 * Scales the overlay alpha so the watermark sits at the requested opacity.
 *
 * linear() takes one coefficient per band, so multiplying only the fourth band
 * leaves the colours untouched and dims the coverage, which is what compositing
 * then interprets as translucency.
 */
async function applyOverlayOpacity(overlay: Buffer, opacity: number): Promise<Buffer> {
  const factor = clamp(opacity, 0, 100) / 100
  if (factor >= 1) return overlay
  return sharp(overlay).ensureAlpha().linear([1, 1, 1, factor], [0, 0, 0, 0]).png().toBuffer()
}

/** Composite gravity for a picker value, ignoring the two crop only strategies. */
function overlayGravity(position: GravityPosition): string {
  return position === 'entropy' || position === 'attention' ? 'centre' : position
}

/**
 * Places the overlay against the base, honouring the edge margins.
 *
 * Margins only make sense on the edges a gravity actually touches, so a north
 * east watermark is pushed in from the top and the right while a centred one
 * ignores them entirely.
 */
function placeOverlay(
  position: GravityPosition,
  base: Size,
  overlay: Size,
  marginX: number,
  marginY: number
): { top: number; left: number } {
  const maxLeft = Math.max(0, base.width - overlay.width)
  const maxTop = Math.max(0, base.height - overlay.height)
  const centreLeft = Math.round(maxLeft / 2)
  const centreTop = Math.round(maxTop / 2)
  const nearLeft = Math.round(clamp(marginX, 0, maxLeft))
  const farLeft = maxLeft - nearLeft
  const nearTop = Math.round(clamp(marginY, 0, maxTop))
  const farTop = maxTop - nearTop

  switch (position) {
    case 'north':
      return { top: nearTop, left: centreLeft }
    case 'northeast':
      return { top: nearTop, left: farLeft }
    case 'east':
      return { top: centreTop, left: farLeft }
    case 'southeast':
      return { top: farTop, left: farLeft }
    case 'south':
      return { top: farTop, left: centreLeft }
    case 'southwest':
      return { top: farTop, left: nearLeft }
    case 'west':
      return { top: centreTop, left: nearLeft }
    case 'northwest':
      return { top: nearTop, left: nearLeft }
    default:
      return { top: centreTop, left: centreLeft }
  }
}

/**
 * Builds the composite descriptor for the configured watermark.
 *
 * The overlay is rasterised here rather than handed to sharp as a path, because
 * both the opacity multiply and the "never larger than the base" guard need
 * real pixels and real dimensions. Compositing an overlay bigger than the base
 * is a hard error in libvips, so an oversized watermark is shrunk to fit.
 */
async function buildWatermarkComposite(
  watermark: WatermarkSettings,
  base: Size
): Promise<OverlayOptions | null> {
  if (watermark.kind === 'none') return null

  let source: Buffer
  if (watermark.kind === 'text') {
    if (watermark.text.trim().length === 0) return null
    source = buildTextOverlay(watermark)
  } else {
    if (watermark.imagePath.trim().length === 0) return null
    source = await readFile(watermark.imagePath)
  }

  // Only image watermarks scale with the output. Text is sized by its point
  // size, which is what makes a caption stay legible across mixed inputs.
  let overlay = sharp(source).ensureAlpha()
  if (watermark.kind === 'image') {
    const targetWidth = Math.max(1, Math.round((base.width * clamp(watermark.scale, 1, 100)) / 100))
    overlay = overlay.resize({ width: targetWidth, fit: 'inside', withoutEnlargement: false })
    if (watermark.rotation % 360 !== 0) {
      overlay = overlay.rotate(watermark.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    }
  }

  let rendered = await overlay.png().toBuffer({ resolveWithObject: true })
  if (rendered.info.width > base.width || rendered.info.height > base.height) {
    const shrunk = await sharp(rendered.data)
      .resize({ width: base.width, height: base.height, fit: 'inside' })
      .png()
      .toBuffer({ resolveWithObject: true })
    rendered = shrunk
  }

  const data = await applyOverlayOpacity(rendered.data, watermark.opacity)

  if (watermark.tile) {
    return { input: data, tile: true, gravity: overlayGravity(watermark.position), blend: 'over' }
  }

  const placed = placeOverlay(
    watermark.position,
    base,
    { width: rendered.info.width, height: rendered.info.height },
    watermark.marginX,
    watermark.marginY
  )
  return { input: data, top: placed.top, left: placed.left, blend: 'over' }
}

/**
 * Spreads one overlay across every frame of a multi page output.
 *
 * libvips lays an animation out as a single tall strip of frames, and a
 * composite is placed against that strip, so one descriptor lands on the first
 * frame alone and the rest of the animation plays unmarked. Repeating the same
 * overlay once per page at the page relative offset is what puts it on all of
 * them. A tiled overlay already repeats across the whole strip, so it is left
 * exactly as it is.
 */
function repeatPerPage(
  composite: OverlayOptions,
  pages: number,
  pageHeight: number
): OverlayOptions[] {
  if (pages <= 1 || composite.tile === true || pageHeight <= 0) return [composite]
  const top = composite.top ?? 0
  return Array.from({ length: pages }, (_frame, page) => ({
    ...composite,
    top: top + page * pageHeight
  }))
}

/* Metadata */

/** EXIF tag numbers for the two fields the keep copyright policy preserves. */
const EXIF_TAG_ARTIST = 0x013b
const EXIF_TAG_COPYRIGHT = 0x8298

/** EXIF type 2, a NUL terminated ASCII string. */
const EXIF_TYPE_ASCII = 2

/**
 * Pulls the artist and copyright strings out of a raw EXIF blob.
 *
 * sharp can keep all metadata or none of it, so the keep copyright policy has
 * to read the two tags itself and write them back explicitly. Only IFD0 is
 * walked, because that is the directory both tags live in, and every offset is
 * bounds checked so a truncated or hostile blob returns empty strings instead
 * of throwing inside the conversion.
 */
function readCopyrightTags(exif: Buffer | undefined): { copyright: string; artist: string } {
  const empty = { copyright: '', artist: '' }
  if (!exif || exif.length < 8) return empty

  // libvips hands back the payload with the JPEG APP1 marker still attached.
  const start = exif.toString('ascii', 0, 4) === 'Exif' ? 6 : 0
  if (exif.length < start + 8) return empty

  const byteOrder = exif.toString('ascii', start, start + 2)
  const little = byteOrder === 'II'
  if (!little && byteOrder !== 'MM') return empty

  const readU16 = (at: number): number => (little ? exif.readUInt16LE(at) : exif.readUInt16BE(at))
  const readU32 = (at: number): number => (little ? exif.readUInt32LE(at) : exif.readUInt32BE(at))

  const ifdOffset = start + readU32(start + 4)
  if (ifdOffset + 2 > exif.length) return empty

  const entryCount = readU16(ifdOffset)
  const found = { copyright: '', artist: '' }

  for (let index = 0; index < entryCount; index += 1) {
    const entry = ifdOffset + 2 + index * 12
    if (entry + 12 > exif.length) break

    const tag = readU16(entry)
    if (tag !== EXIF_TAG_ARTIST && tag !== EXIF_TAG_COPYRIGHT) continue
    if (readU16(entry + 2) !== EXIF_TYPE_ASCII) continue

    const count = readU32(entry + 4)
    if (count === 0 || count > exif.length) continue

    // Values of four bytes or fewer are stored inline in the entry itself.
    const valueAt = count <= 4 ? entry + 8 : start + readU32(entry + 8)
    if (valueAt < 0 || valueAt + count > exif.length) continue

    const text = exif
      .toString('ascii', valueAt, valueAt + count)
      .replace(/\0.*$/, '')
      .trim()
    if (text.length === 0) continue
    if (tag === EXIF_TAG_ARTIST) found.artist = text
    else found.copyright = text
  }

  return found
}

/**
 * True when a policy carries metadata over from whatever the pipeline was fed.
 *
 * These are the two policies a raw staging buffer silently defeats: raw pixels
 * arrive with no EXIF and no ICC profile, so keepMetadata and keepIccProfile
 * have nothing left to keep. The other two rebuild everything they write from
 * the probed EXIF blob instead, and survive the round trip unchanged.
 */
function policyInheritsMetadata(policy: MetadataPolicy): boolean {
  return policy === 'keep' || policy === 'keep-icc'
}

/**
 * Applies the metadata policy using sharp's modern keep methods.
 *
 * The keepMetadata family replaced withMetadata precisely because it separates
 * the decision to keep from the decision to write, which is what lets keep icc
 * carry a colour profile without dragging the EXIF along with it. withExif
 * replaces the EXIF block outright and withExifMerge layers on top of what was
 * there, so the two of them express "only these fields" and "these fields as
 * well" without any further filtering.
 *
 * Density is the one setting sharp still exposes only through withMetadata,
 * which forcibly widens the keep mask to everything. Honouring it under a
 * stripping policy would leak the metadata the user asked to remove, so it is
 * applied through the TIFF resolution tags where the encoder offers them and
 * through withMetadata only when the policy already keeps everything.
 *
 * `orientationBaked` says the rotation the source described is already in the
 * pixels, so the tag that described it has to be brought back to upright or
 * every viewer that honours it turns the image a second time.
 */
function applyMetadataPolicy(
  pipeline: Sharp,
  metadata: MetadataSettings,
  sourceExif: Buffer | undefined,
  orientationBaked: boolean
): Sharp {
  let next = pipeline

  const copyright = metadata.copyright.trim()
  const artist = metadata.artist.trim()

  switch (metadata.policy) {
    case 'keep': {
      next = next.keepMetadata()
      const merged: Record<string, string> = {}
      if (copyright) merged.Copyright = copyright
      if (artist) merged.Artist = artist
      if (Object.keys(merged).length > 0) next = next.withExifMerge({ IFD0: merged })

      // withMetadata is the only call on sharp 0.35 that rewrites the
      // Orientation tag. libvips serialises the value it carries on the image
      // itself, which overrules anything withExifMerge names, so the merge
      // route silently leaves the stale tag in place.
      const writeable: WriteableMetadata = {}
      if (metadata.setDensity && metadata.density > 0) {
        writeable.density = Math.round(metadata.density)
      }
      if (orientationBaked) writeable.orientation = 1
      if (Object.keys(writeable).length > 0) next = next.withMetadata(writeable)
      break
    }

    case 'keep-icc':
      next = next.keepIccProfile()
      break

    case 'keep-copyright': {
      const inherited = readCopyrightTags(sourceExif)
      const kept: Record<string, string> = {}
      const finalCopyright = copyright || inherited.copyright
      const finalArtist = artist || inherited.artist
      if (finalCopyright) kept.Copyright = finalCopyright
      if (finalArtist) kept.Artist = finalArtist
      // withExif implies keepExif, so naming only these two drops the rest.
      if (Object.keys(kept).length > 0) next = next.withExif({ IFD0: kept })
      break
    }

    case 'strip':
      break

    default:
      break
  }

  if (metadata.iccProfile.trim().length > 0) {
    next = next.withIccProfile(metadata.iccProfile.trim())
  }

  return next
}

/* Encoder options */

type EncodeOptions =
  | { readonly format: 'jpeg'; readonly options: JpegOptions }
  | { readonly format: 'png'; readonly options: PngOptions }
  | { readonly format: 'webp'; readonly options: WebpOptions }
  | { readonly format: 'avif'; readonly options: AvifOptions }
  | { readonly format: 'tiff'; readonly options: TiffOptions }
  | { readonly format: 'gif'; readonly options: GifOptions }
  | { readonly format: 'heif'; readonly options: HeifOptions }
  | { readonly format: 'jxl'; readonly options: JxlEncodeOptions }
  | { readonly format: 'jp2'; readonly options: Jp2EncodeOptions }

/** Clamps the effort slider into the range the chosen encoder understands. */
function effortFor(format: ConcreteFormat, effort: number): number | undefined {
  const range = FORMATS[format].effort
  if (!range) return undefined
  return Math.round(clamp(effort, range.min, range.max))
}

/** AVIF and HEIF only distinguish full chroma from 4:2:0. */
function binaryChroma(subsampling: ChromaSubsampling): '4:4:4' | '4:2:0' {
  return subsampling === '4:2:0' ? '4:2:0' : '4:4:4'
}

/**
 * Maps the settings object onto the encoder options for one container.
 *
 * `quality` is passed separately rather than read from the settings because the
 * size search and per variant overrides both need to move it without cloning
 * the whole settings object.
 */
export function buildEncodeOptions(
  settings: ConversionSettings,
  format: ConcreteFormat,
  quality: number
): EncodeOptions {
  const q = Math.round(clamp(quality, 1, 100))
  const effort = effortFor(format, settings.effort)
  const lossless = settings.lossless && FORMATS[format].lossless

  switch (format) {
    case 'jpeg':
      return {
        format: 'jpeg',
        options: {
          quality: q,
          progressive: settings.progressive,
          chromaSubsampling: settings.chromaSubsampling,
          trellisQuantisation: settings.trellisQuantisation,
          overshootDeringing: settings.overshootDeringing,
          optimiseScans: settings.optimiseScans,
          // mozjpeg is applied last inside sharp and turns the three switches
          // above on wholesale, so it is a superset rather than a peer of them.
          mozjpeg: settings.mozjpeg,
          force: true
        }
      }

    case 'png': {
      // quality, colours, dither and effort are palette quantiser controls, and
      // sharp turns palette mode on as soon as any of them is present. Sending
      // them unconditionally would quietly posterise every truecolour PNG.
      const options: PngOptions = {
        progressive: settings.progressive,
        compressionLevel: Math.round(clamp(settings.pngCompressionLevel, 0, 9)),
        adaptiveFiltering: settings.pngAdaptiveFiltering,
        force: true
      }
      if (settings.pngPalette) {
        options.palette = true
        options.quality = q
        options.colours = Math.round(clamp(settings.pngColours, 2, 256))
        options.dither = clamp(settings.pngDither, 0, 1)
        options.effort = effort
      }
      return { format: 'png', options }
    }

    case 'webp':
      return {
        format: 'webp',
        options: {
          quality: q,
          alphaQuality: Math.round(clamp(settings.alphaQuality, 0, 100)),
          lossless,
          nearLossless: !lossless && settings.nearLossless,
          smartSubsample: settings.smartSubsample,
          effort,
          force: true
        }
      }

    case 'avif':
      return {
        format: 'avif',
        options: {
          quality: q,
          lossless,
          effort,
          chromaSubsampling: binaryChroma(settings.chromaSubsampling),
          force: true
        }
      }

    case 'tiff': {
      const options: TiffOptions = {
        quality: q,
        compression: settings.tiffCompression,
        predictor: settings.tiffPredictor,
        pyramid: settings.tiffPyramid,
        // sharp only accepts the reduced depths here: eight bits is the native
        // width, expressed by saying nothing rather than by asking for it.
        bitdepth: settings.tiffBitdepth === 8 ? undefined : settings.tiffBitdepth,
        force: true
      }
      if (settings.metadata.setDensity && settings.metadata.density > 0) {
        // TIFF carries resolution in its own tags, so print density survives
        // here even when the metadata policy is stripping everything else.
        const perMillimetre = settings.metadata.density / 25.4
        options.xres = perMillimetre
        options.yres = perMillimetre
        options.resolutionUnit = 'inch'
      }
      return { format: 'tiff', options }
    }

    case 'gif':
      return {
        format: 'gif',
        options: {
          colours: Math.round(clamp(settings.gifColours, 2, 256)),
          dither: clamp(settings.gifDither, 0, 1),
          effort,
          loop: Math.round(clamp(settings.gifLoop, 0, 65535)),
          force: true
        }
      }

    case 'heif':
      return {
        format: 'heif',
        options: {
          quality: q,
          lossless,
          effort,
          chromaSubsampling: binaryChroma(settings.chromaSubsampling),
          // The prebuilt libvips ships libheif without an HEVC encoder, so AV1
          // is the only compression this container can actually be written with.
          compression: 'av1',
          force: true
        }
      }

    case 'jxl':
      // libvips has no JPEG XL support in any prebuilt sharp binary, so this one
      // container is encoded by the bundled WebAssembly build of libjxl instead.
      // The options are carried through the same union and consumed by
      // encodeRendition rather than by a sharp method.
      return {
        format: 'jxl',
        options: {
          quality: q,
          effort: effort ?? 4,
          lossless,
          progressive: settings.progressive
        }
      }

    case 'jp2':
      // Same story as JPEG XL: no prebuilt libvips carries OpenJPEG, so this
      // container is written by the bundled WebAssembly build of ImageMagick.
      // The quality number is remapped inside that codec, because the delegate
      // reads it as a signal to noise target rather than as a percentage.
      return { format: 'jp2', options: { quality: q, lossless } }

    default:
      return { format: 'png', options: { force: true } }
  }
}

/** Every container libvips itself can write, which is all but the bundled two. */
type NativeEncodeOptions = Exclude<EncodeOptions, { format: 'jxl' | 'jp2' }>

/**
 * Produces the encoded bytes for one rendition.
 *
 * Everything except JPEG XL and JPEG 2000 is written by libvips. Those two
 * leave the sharp pipeline as raw RGBA and go through the WebAssembly codecs
 * BICO bundles for them, which is the reason this indirection exists at all
 * rather than a direct call to a sharp method.
 */
async function runEncode(
  pipeline: Sharp,
  spec: EncodeOptions
): Promise<{ data: Buffer; info: OutputInfo }> {
  if (spec.format !== 'jxl' && spec.format !== 'jp2') {
    return applyEncodeOptions(pipeline, spec).toBuffer({ resolveWithObject: true })
  }

  const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const image = { data, width: info.width, height: info.height, channels: 4 as const }
  const encoded =
    spec.format === 'jxl'
      ? await encodeJxl(image, spec.options)
      : await encodeJp2(image, spec.options)

  // The raw info already carries the correct dimensions. Only the byte count
  // and the container name describe the raw buffer rather than the result.
  return { data: encoded, info: { ...info, size: encoded.length, format: spec.format } }
}

function applyEncodeOptions(pipeline: Sharp, spec: NativeEncodeOptions): Sharp {
  switch (spec.format) {
    case 'jpeg':
      return pipeline.jpeg(spec.options)
    case 'png':
      return pipeline.png(spec.options)
    case 'webp':
      return pipeline.webp(spec.options)
    case 'avif':
      return pipeline.avif(spec.options)
    case 'tiff':
      return pipeline.tiff(spec.options)
    case 'gif':
      return pipeline.gif(spec.options)
    case 'heif':
      return pipeline.heif(spec.options)
  }
}

/* Size targeting */

interface Encoded {
  data: Buffer
  info: OutputInfo
  /** The quality that actually produced these bytes. */
  quality: number
}

/**
 * True when moving the quality slider changes the output size at all.
 *
 * The configuration dependent cases live in the shared predicate so the size
 * search and the pre run estimator cannot drift apart: whenever one of them
 * says the slider is inert the other has to agree, or the search spends seven
 * full encodes proving that nothing moved.
 */
function hasQualityLever(format: ConcreteFormat, settings: ConversionSettings): boolean {
  if (settings.lossless && FORMATS[format].lossless) return false
  return baselineIsLossy(format, settings)
}

/**
 * Binary searches the quality slider until the encoded size fits the budget.
 *
 * A sharp pipeline is spent once it has produced output, so the caller passes a
 * factory instead of a pipeline and every probe asks for a fresh one. Normally
 * that factory replays a staged raw buffer, which is what turns a size targeted
 * run from eight decodes per image into one, but a caller that cannot stage can
 * hand over a factory that decodes again and still get a search.
 *
 * `max-bytes` returns the highest quality that stays inside the budget, and
 * falls back to the smallest encode it saw when even the floor overshoots.
 * `target-bytes` instead returns whichever probe landed closest to the budget,
 * above or below, because that mode is aiming at a size rather than a ceiling.
 */
async function encodeToBudget(
  makePipeline: () => Sharp,
  settings: ConversionSettings,
  format: ConcreteFormat,
  decorate: (pipeline: Sharp) => Sharp
): Promise<Encoded> {
  const budget = Math.max(1, Math.round(settings.smart.targetKb * 1024))
  const floor = Math.round(clamp(settings.smart.minQuality, 1, 100))
  const ceiling = Math.round(clamp(settings.smart.maxQuality, floor, 100))

  const encodeAt = async (quality: number): Promise<Encoded> => {
    const spec = buildEncodeOptions(settings, format, quality)
    const { data, info } = await runEncode(decorate(makePipeline()), spec)
    return { data, info, quality }
  }

  let low = floor
  let high = ceiling
  let bestUnder: Encoded | null = null
  let smallest: Encoded | null = null
  let closest: Encoded | null = null

  for (let step = 0; step < SIZE_SEARCH_ITERATIONS && low <= high; step += 1) {
    const probe = Math.round((low + high) / 2)
    const attempt = await encodeAt(probe)

    if (!smallest || attempt.data.length < smallest.data.length) smallest = attempt
    if (
      !closest ||
      Math.abs(attempt.data.length - budget) < Math.abs(closest.data.length - budget)
    ) {
      closest = attempt
    }

    if (attempt.data.length <= budget) {
      bestUnder = attempt
      low = probe + 1
    } else {
      high = probe - 1
    }
  }

  if (settings.smart.sizeTarget === 'target-bytes' && closest) return closest
  if (bestUnder) return bestUnder
  if (smallest) return smallest
  return encodeAt(floor)
}

/* Output naming and writing */

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Directory segments below the output root, as chosen by the structure picker.
 *
 * Mirror walks the path the file had relative to the folder that was dropped,
 * with every segment sanitised and any traversal component dropped so a source
 * tree can never write outside the output root.
 */
function outputSegments(
  settings: ConversionSettings,
  file: SourceFile,
  format: ConcreteFormat,
  now: Date
): string[] {
  switch (settings.output.structure) {
    case 'mirror': {
      const relative = dirname(file.relPath)
      if (relative === '.' || relative === '' || relative === file.relPath) return []
      return relative
        .split(/[\\/]/)
        .filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
        .map(sanitizeSegment)
    }
    case 'by-format':
      return [format]
    case 'by-date':
      return [`${now.getFullYear()}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}`]
    case 'flat':
    default:
      return []
  }
}

/** The code node reports when an exclusive create finds the name taken. */
function isAlreadyExists(error: unknown): boolean {
  return typeof error === 'object' && error !== null && Reflect.get(error, 'code') === 'EEXIST'
}

/**
 * Writes one rendition where the collision policy says it belongs, and reports
 * the path, or null when an existing file is to be left alone.
 *
 * Rename claims each candidate with an exclusive create rather than testing for
 * a free name and writing afterwards. Several lanes run at once and nothing
 * stops another one taking the name in between the two, which silently loses an
 * output. Walking the suffix on EEXIST is the same walk as before, except that
 * winning the race and creating the file are now one step. The walk is bounded,
 * so a directory already holding ten thousand collisions gives up rather than
 * looping forever.
 */
async function writeRendition(
  directory: string,
  base: string,
  extension: string,
  data: Buffer,
  settings: ConversionSettings
): Promise<string | null> {
  const first = join(directory, `${base}.${extension}`)

  if (settings.output.collision === 'overwrite') {
    await writeFile(first, data)
    return first
  }

  if (settings.output.collision === 'skip') {
    if (await pathExists(first)) return null
    await writeFile(first, data)
    return first
  }

  for (let suffix = 0; suffix <= MAX_COLLISION_ATTEMPTS; suffix += 1) {
    const candidate = suffix === 0 ? first : join(directory, `${base}-${suffix}.${extension}`)
    try {
      await writeFile(candidate, data, { flag: 'wx' })
      return candidate
    } catch (error) {
      if (!isAlreadyExists(error)) throw error
    }
  }
  throw new Error(`No free filename for ${base}.${extension} in ${directory}`)
}

/* Job execution */

/** One rendition to produce: the primary output, or one enabled variant. */
interface RenderTarget {
  format: ConcreteFormat
  quality: number
  resize: ResizeSettings
  /** Filename suffix contributed by a variant, empty for the primary. */
  suffix: string
  /** Human readable name reported back in JobOutput. */
  label: string
}

function buildRenderTargets(settings: ConversionSettings, file: SourceFile): RenderTarget[] {
  const primaryFormat = resolveTargetFormat(settings.format, file.ext)
  const targets: RenderTarget[] = [
    {
      format: primaryFormat,
      quality: settings.quality,
      resize: settings.resize,
      suffix: '',
      label: 'primary'
    }
  ]

  for (const variant of settings.variants) {
    if (!variant.enabled) continue
    targets.push({
      format: variant.format ? resolveTargetFormat(variant.format, file.ext) : primaryFormat,
      quality: variant.quality ?? settings.quality,
      resize: variantResize(settings.resize, variant),
      suffix: variant.suffix,
      label: variant.label || variant.id
    })
  }

  return targets
}

/** Opens the source with the reader options the settings ask for. */
/**
 * Bytes ready to hand to sharp, and how to interpret them.
 *
 * `raw` is set only for containers libvips cannot read, where this module has
 * already decoded the file itself and is passing pixels through.
 */
interface DecodedSource {
  buffer: Buffer
  raw: { width: number; height: number; channels: 4 } | null
}

/**
 * Reads a source file, decoding it first when libvips has no loader for it.
 *
 * JPEG XL and JPEG 2000 are the two such formats. Reading them matters as much
 * as writing them: an app that produces files it cannot then reopen is a trap,
 * and the queue would reject its own output.
 */
async function readSource(path: string, ext: string): Promise<DecodedSource> {
  const bytes = await readFile(path)

  const decode = isJxlExtension(ext) ? decodeJxl : isJp2Extension(ext) ? decodeJp2 : null
  if (!decode) return { buffer: bytes, raw: null }

  const decoded = await decode(bytes)
  return {
    buffer: decoded.data,
    raw: { width: decoded.width, height: decoded.height, channels: 4 }
  }
}

function openSource(
  source: DecodedSource,
  settings: ConversionSettings,
  format: ConcreteFormat
): Sharp {
  const maxPixels = settings.performance.maxPixels

  if (source.raw) {
    // Already decoded, so none of the reader options apply.
    return sharp(source.buffer, { raw: source.raw, limitInputPixels: false })
  }

  const options: SharpOptions = {
    animated: settings.animated && FORMATS[format].animation,
    limitInputPixels: maxPixels > 0 ? maxPixels : false,
    sequentialRead: true,
    // A partially corrupt file should still produce whatever decoded cleanly,
    // because a bulk run that stops on one bad scan line is worse than useless.
    failOn: 'none'
  }
  return sharp(source.buffer, options)
}

interface RenderedOutput {
  data: Buffer
  width: number
  height: number
  format: ConcreteFormat
  quality: number
  suffix: string
  label: string
}

/** Everything a render target shares with every other rendition of one file. */
interface RenderBase {
  /** Hands out a fresh pipeline positioned at the end of the shared decode. */
  make: () => Sharp
  /** Size of one frame after orientation and crop, not of the frame strip. */
  size: Size
  /** Frames in the output. One for a still. */
  pages: number
  /** Raw staging is safe: nothing animated and no inherited metadata to lose. */
  canStage: boolean
  /** The source EXIF blob, for the copyright policy. */
  exif: Buffer | undefined
  /** The source orientation is already in the pixels, so its tag is stale. */
  orientationBaked: boolean
}

/**
 * Runs one render target from the shared base through to encoded bytes.
 *
 * Resize, padding and adjustments all run per target rather than once, because
 * every one of them is resolution dependent: sharpening a thumbnail with the
 * radius that suited the full size image is the classic way to make a variant
 * set look inconsistent.
 */
async function renderTarget(
  base: RenderBase,
  target: RenderTarget,
  settings: ConversionSettings
): Promise<RenderedOutput> {
  const resize = planResize(target.resize, base.size)
  let size = resize ? predictResize(base.size, resize) : base.size

  const padding = Math.max(0, Math.round(settings.transform.padding))
  if (padding > 0) size = { width: size.width + padding * 2, height: size.height + padding * 2 }

  // Held as a function rather than applied once, because a search that cannot
  // stage has to replay these stages from a fresh decode on every probe.
  const shape = (input: Sharp): Sharp => {
    let next = input
    if (resize) next = next.resize(resize)
    if (padding > 0) {
      next = next.extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: parseColor(settings.transform.paddingColor)
      })
    }
    return applyAdjustments(next, settings.adjust)
  }

  const watermarkActive = settings.watermark.kind !== 'none'
  const searchActive =
    settings.smart.sizeTarget !== 'off' && hasQualityLever(target.format, settings)

  let pipeline = shape(base.make())

  // The watermark wants the real output size to place itself, and the size
  // search wants pixels it can re encode without decoding again. Both are paid
  // for with the same staging step, and neither is paid for when unused.
  let staged: RawImage | null = null
  if (base.canStage && (watermarkActive || searchActive)) {
    staged = await materialise(pipeline)
    pipeline = fromRaw(staged)
    size = { width: staged.width, height: staged.height }
  }

  let overlays: OverlayOptions[] | null = null
  if (watermarkActive) {
    const composite = await buildWatermarkComposite(settings.watermark, size)
    if (composite) {
      overlays = repeatPerPage(composite, base.pages, size.height)
      pipeline = pipeline.composite(overlays)
      // Re stage so the size search probes the watermarked pixels rather than
      // repeating the composite on every one of its iterations.
      if (searchActive && staged) {
        staged = await materialise(pipeline)
        pipeline = fromRaw(staged)
      }
    }
  }

  // A staged buffer already holds the overlay by this point, so replaying it
  // would composite the watermark twice.
  const makeProbe = (): Sharp => {
    if (staged) return fromRaw(staged)
    const rebuilt = shape(base.make())
    return overlays ? rebuilt.composite(overlays) : rebuilt
  }

  const decorate = (input: Sharp): Sharp =>
    applyMetadataPolicy(input, settings.metadata, base.exif, base.orientationBaked)

  let encoded: Encoded
  if (searchActive) {
    encoded = await encodeToBudget(makeProbe, settings, target.format, decorate)
  } else {
    const spec = buildEncodeOptions(settings, target.format, target.quality)
    const { data, info } = await runEncode(decorate(pipeline), spec)
    encoded = { data, info, quality: target.quality }
  }

  return {
    data: encoded.data,
    width: encoded.info.width,
    height: encoded.info.height,
    format: target.format,
    quality: encoded.quality,
    suffix: target.suffix,
    label: target.label
  }
}

/**
 * Places one encoded rendition, either on disk or into the zip payload list.
 *
 * The bytes exist before the name does, which is deliberate: the width and
 * height tokens in the filename template describe the file that was actually
 * produced, and skipIfLarger can be answered without writing anything first.
 */
async function deliverOutput(
  rendered: RenderedOutput,
  request: WorkerJobRequest,
  now: Date
): Promise<{ output: JobOutput | null; buffer: ZipEntry | null }> {
  const { file, settings } = request

  if (settings.output.skipIfLarger && rendered.data.length > file.size) {
    return { output: null, buffer: null }
  }

  // Swapping the format in for the naming call keeps the {format}, {ext} and
  // {quality} tokens describing this rendition rather than the primary one.
  const namingSettings: ConversionSettings = {
    ...settings,
    format: rendered.format,
    quality: rendered.quality
  }
  const base = resolveTemplate(settings.output.template, {
    file,
    settings: namingSettings,
    presetName: request.presetName,
    index: request.index,
    total: request.total,
    width: rendered.width,
    height: rendered.height,
    variant: rendered.suffix,
    now
  })
  const extension = outputExtension(rendered.format, file.ext)
  const segments = outputSegments(settings, file, rendered.format, now)

  if (settings.output.target === 'zip') {
    // The archive is shared by every lane, so the worker hands the bytes back
    // and the main process owns the single writer.
    const name = [...segments, `${base}.${extension}`].join('/')
    return {
      output: {
        path: name,
        variant: rendered.label,
        bytes: rendered.data.length,
        width: rendered.width,
        height: rendered.height
      },
      buffer: { name, data: toArrayBuffer(rendered.data) }
    }
  }

  const directory =
    settings.output.target === 'in-place' ? file.dir : join(settings.output.folder, ...segments)
  await mkdir(directory, { recursive: true })

  const written = await writeRendition(directory, base, extension, rendered.data, settings)
  if (written === null) return { output: null, buffer: null }

  return {
    output: {
      path: written,
      variant: rendered.label,
      bytes: rendered.data.length,
      width: rendered.width,
      height: rendered.height
    },
    buffer: null
  }
}

/**
 * Converts one file into every rendition the settings ask for.
 *
 * The stage name is tracked as the pipeline advances so a failure can say where
 * it happened. A user staring at "Invalid parameter" learns nothing, whereas
 * "failed while compositing the watermark" points straight at the panel to fix.
 */
async function runJob(request: WorkerJobRequest): Promise<WorkerJobResponse> {
  const startedAt = Date.now()
  const { file, settings } = request
  let stage = 'opening the file'

  const result: WorkerJobResponse = {
    jobId: request.jobId,
    ok: false,
    outputs: [],
    originalSize: file.size,
    outputSize: 0,
    durationMs: 0,
    skipped: false,
    error: null,
    buffers: []
  }

  try {
    if (settings.output.target === 'folder' && settings.output.folder.trim().length === 0) {
      throw new Error('No output folder has been chosen')
    }

    const now = new Date()
    const targets = buildRenderTargets(settings, file)
    const primary = targets[0]
    if (!primary) throw new Error('No output format resolved for this file')

    if (request.preEncoded) {
      // A GPU lane wrote the container as well as the pixels, which Chromium
      // can do for the browser encodable formats. There is nothing left to
      // process, so the worker only has to find the bytes a home.
      stage = 'writing the output the GPU encoded'
      const delivered = await deliverOutput(
        {
          data: Buffer.from(request.preEncoded.data),
          width: request.preEncoded.width,
          height: request.preEncoded.height,
          format: primary.format,
          quality: primary.quality,
          suffix: '',
          label: 'primary'
        },
        request,
        now
      )
      if (delivered.output) {
        result.outputs.push(delivered.output)
        result.outputSize += delivered.output.bytes
      }
      if (delivered.buffer) result.buffers.push(delivered.buffer)
      result.ok = true
      result.skipped = result.outputs.length === 0
      result.durationMs = Date.now() - startedAt
      return result
    }

    // A sharp pipeline is consumed when it produces output, so every rendition
    // asks the factory for its own. What the factory hands back is the whole
    // performance story: a decoded buffer when staging is possible, and a fresh
    // decode of the source bytes when it is not.
    let makeBase: () => Sharp
    let baseSize: Size
    let canStage: boolean
    let sourceExif: Buffer | undefined
    let pages = 1
    let orientationBaked = false

    if (request.prepared) {
      // The GPU lane already ran geometry and colour and handed back straight,
      // that is unpremultiplied, RGBA. Steps a through h are therefore already
      // done and only metadata and encoding are left.
      stage = 'reading the pixels handed over by the GPU'
      const prepared = request.prepared
      const pixels = Buffer.from(prepared.pixels)
      const raw: RawImage = {
        data: pixels,
        width: prepared.width,
        height: prepared.height,
        channels: prepared.channels
      }
      makeBase = () => fromRaw(raw)
      baseSize = { width: prepared.width, height: prepared.height }
      canStage = true
    } else {
      stage = 'reading the file'
      const source = await readSource(file.path, file.ext)

      stage = 'probing the image header'
      const probe = await openSource(source, settings, primary.format).metadata()
      sourceExif = probe.exif
      const animated =
        settings.animated && FORMATS[primary.format].animation && (probe.pages ?? 1) > 1
      pages = animated ? Math.max(1, probe.pages ?? 1) : 1

      // An animated reader hands back every frame as one tall strip, so
      // probe.height is the page count times the frame height. Resize and the
      // multi page extract both resolve against a single frame inside libvips,
      // which makes the per frame height the only size a plan can be built
      // from: using the strip would scale every size dependent strategy by the
      // page count.
      const frameHeight = animated
        ? (probe.pageHeight ?? Math.round((probe.height ?? 0) / pages))
        : (probe.height ?? 0)
      const declared: Size = { width: probe.width ?? 0, height: frameHeight }

      stage = 'orienting and cropping'
      const plan = planOrientation(settings, probe.orientation)
      // Once the rotation the tag described is in the pixels, the tag itself is
      // stale and a metadata policy that keeps it would rotate the image twice.
      orientationBaked = (plan.flop || plan.angle !== 0) && (probe.orientation ?? 1) !== 1
      const oriented = orientedSize(declared, plan)
      const decodeBase = (): { pipeline: Sharp; size: Size; sizeIsExact: boolean } =>
        applyCrop(
          applyOrientation(openSource(source, settings, primary.format), plan),
          settings.transform.crop,
          plan,
          oriented
        )

      const first = decodeBase()
      baseSize = first.size

      // Flattening to pixels collapses an animation into one tall strip of
      // frames, so an animated source keeps decoding from the original bytes.
      // Raw pixels also arrive stripped of everything a keep policy would have
      // carried over, so those policies decode again rather than lose it.
      canStage = !animated && !policyInheritsMetadata(settings.metadata.policy)

      // Staging the shared base is worth a full raw buffer in two cases: when
      // several renditions would otherwise each decode the file again, and when
      // a trim has left the size unknown and the resize strategy needs it.
      if (canStage && (targets.length > 1 || !first.sizeIsExact)) {
        stage = 'decoding the image'
        const shared = await materialise(first.pipeline)
        baseSize = { width: shared.width, height: shared.height }
        makeBase = () => fromRaw(shared)
      } else {
        let consumed = false
        makeBase = () => {
          if (!consumed) {
            consumed = true
            return first.pipeline
          }
          return decodeBase().pipeline
        }
      }
    }

    const renderBase: RenderBase = {
      make: makeBase,
      size: baseSize,
      pages,
      canStage,
      exif: sourceExif,
      orientationBaked
    }

    for (const [position, target] of targets.entries()) {
      stage = position === 0 ? 'rendering the image' : `rendering the ${target.label} variant`
      const rendered = await renderTarget(renderBase, target, settings)

      stage = 'writing the output'
      const delivered = await deliverOutput(rendered, request, now)
      if (delivered.output) {
        result.outputs.push(delivered.output)
        result.outputSize += delivered.output.bytes
      }
      if (delivered.buffer) result.buffers.push(delivered.buffer)
    }

    result.ok = true
    // Nothing landed, so every rendition was either larger than its source or
    // blocked by a file that was already there. That is a skip, not a failure.
    result.skipped = result.outputs.length === 0
    result.durationMs = Date.now() - startedAt
    return result
  } catch (error) {
    result.ok = false
    result.error = `Failed while ${stage}: ${errorMessage(error)}`
    result.durationMs = Date.now() - startedAt
    return result
  }
}

/* Preview */

function dataUrl(mimeType: string, data: Buffer): string {
  return `data:${mimeType};base64,${data.toString('base64')}`
}

/**
 * Renders the live preview for one file.
 *
 * The full pipeline runs exactly as a conversion would and only the last step
 * differs: the result is scaled into the preview box before it is encoded, so
 * the user is looking at real artefacts from the real encoder rather than a
 * resized version of a full size render. The size readout is then scaled back
 * up by the pixel ratio, which holds well because compression cost per pixel is
 * roughly stable across a change of scale on the same content.
 */
async function runPreview(request: WorkerPreviewRequest): Promise<WorkerPreviewResponse> {
  const startedAt = Date.now()
  const maxEdge = request.maxEdge > 0 ? Math.round(request.maxEdge) : PREVIEW_MAX_EDGE
  const settings = request.settings

  const result: WorkerPreviewResponse = {
    jobId: request.jobId,
    ok: false,
    dataUrl: '',
    originalDataUrl: '',
    width: 0,
    height: 0,
    encodedBytes: 0,
    originalBytes: 0,
    estimatedBytes: 0,
    durationMs: 0,
    error: null,
    fallback: null
  }

  try {
    const source = await readSource(request.path, request.path.split('.').pop() ?? '')
    // Measured on disk rather than from the source buffer, because readSource
    // hands back decoded RGBA for the containers libvips cannot open. Taking
    // its length would report an uncompressed frame as the original file size
    // and turn the savings readout into a large invented number.
    result.originalBytes = (await stat(request.path)).size

    const format = resolveTargetFormat(settings.format, extname(request.path))

    // A preview is a still, so the reader is pinned to the first frame. Letting
    // it decode every page would render an animation as one tall frame strip.
    const stillSettings: ConversionSettings = { ...settings, animated: false }

    const probe = await openSource(source, stillSettings, format).metadata()
    const declared: Size = { width: probe.width ?? 0, height: probe.height ?? 0 }

    const plan = planOrientation(settings, probe.orientation)
    const orientationBaked = (plan.flop || plan.angle !== 0) && (probe.orientation ?? 1) !== 1
    const oriented = orientedSize(declared, plan)
    const cropped = applyCrop(
      applyOrientation(openSource(source, stillSettings, format), plan),
      settings.transform.crop,
      plan,
      oriented
    )

    const target: RenderTarget = {
      format,
      quality: settings.quality,
      resize: settings.resize,
      suffix: '',
      label: 'preview'
    }

    // Run the configured pipeline, then shrink the finished image into the
    // preview box. withoutEnlargement keeps a small source from being blown up
    // into a misleadingly soft preview.
    let pipeline = cropped.pipeline
    const resize = planResize(target.resize, cropped.size)
    if (resize) pipeline = pipeline.resize(resize)

    const padding = Math.max(0, Math.round(settings.transform.padding))
    if (padding > 0) {
      pipeline = pipeline.extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: parseColor(settings.transform.paddingColor)
      })
    }

    pipeline = applyAdjustments(pipeline, settings.adjust)

    // sharp holds one resize per pipeline, so chaining the preview box onto the
    // configured resize replaces it instead of following it, which would drop
    // the resize panel out of the preview entirely. Handing the finished render
    // to a second pipeline keeps both, and it makes the full resolution size a
    // measurement rather than a prediction, so the extrapolation below collapses
    // to exactly one whenever the box does not bite.
    const rendered = await materialise(pipeline)
    const fullSize: Size = { width: rendered.width, height: rendered.height }
    const staged =
      fullSize.width > maxEdge || fullSize.height > maxEdge
        ? await materialise(
            fromRaw(rendered).resize({
              width: maxEdge,
              height: maxEdge,
              fit: 'inside',
              withoutEnlargement: true
            })
          )
        : rendered

    const composite =
      settings.watermark.kind === 'none'
        ? null
        : await buildWatermarkComposite(settings.watermark, staged)

    // Rebuilt on demand rather than held, because a sharp pipeline is spent the
    // moment it produces output and the fallback has to encode the same
    // watermarked, metadata carrying image the first attempt was handed.
    const makePreview = (): Sharp => {
      const base = fromRaw(staged)
      const marked = composite ? base.composite([composite]) : base
      return applyMetadataPolicy(marked, settings.metadata, probe.exif, orientationBaked)
    }

    // Encoding in the target format is the point of the preview, but a libvips
    // build without the codec must not take the whole preview down with it.
    let encodedFormat: ConcreteFormat = format
    let fallback: PreviewFallback | null = null
    let encoded: { data: Buffer; info: OutputInfo }
    try {
      const spec = buildEncodeOptions(settings, format, settings.quality)
      encoded = await runEncode(makePreview(), spec)
    } catch (error) {
      // The substitution is reported rather than swallowed: without it the
      // panel presents a PNG byte count under the name of the format the user
      // asked for, which reads as a wildly wrong size prediction.
      encodedFormat = RASTER_FALLBACK
      fallback = { format: RASTER_FALLBACK, reason: errorMessage(error) }
      const spec = buildEncodeOptions(settings, RASTER_FALLBACK, settings.quality)
      encoded = await runEncode(makePreview(), spec)
    }

    const original = await sharp(
      source.buffer,
      source.raw
        ? { raw: source.raw, limitInputPixels: false }
        : {
            limitInputPixels:
              settings.performance.maxPixels > 0 ? settings.performance.maxPixels : false,
            failOn: 'none'
          }
    )
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer()

    // Extrapolated against the size the configured pipeline actually produces,
    // not against the source: a downscale would otherwise inflate the readout
    // by the whole resize ratio.
    const previewPixels = encoded.info.width * encoded.info.height
    const fullPixels = fullSize.width * fullSize.height

    result.ok = true
    result.dataUrl = dataUrl(FORMATS[encodedFormat].mimeType, encoded.data)
    result.originalDataUrl = dataUrl(FORMATS.webp.mimeType, original)
    result.width = encoded.info.width
    result.height = encoded.info.height
    result.encodedBytes = encoded.data.length
    result.estimatedBytes =
      previewPixels > 0 ? Math.round(encoded.data.length * (fullPixels / previewPixels)) : 0
    result.fallback = fallback
  } catch (error) {
    result.ok = false
    result.error = errorMessage(error)
  }

  result.durationMs = Date.now() - startedAt
  return result
}

/* Message loop */

const port = parentPort
if (!port) {
  throw new Error('image.worker must be started as a node worker thread')
}

// An arrow rather than a declaration so the null check above still applies:
// a hoisted function could in principle run before the guard did.
const post = (message: WorkerOutbound): void => {
  port.postMessage(message)
}

/**
 * Applies the libvips tuning the pool decided on.
 *
 * Each worker gets its own libvips thread pool, so leaving the default in place
 * would multiply the machine core count by the worker count and spend the whole
 * gain on context switching.
 */
function configure(options: { vipsConcurrency: number; cacheMemoryMb: number }): void {
  if (options.vipsConcurrency >= 0) sharp.concurrency(Math.round(options.vipsConcurrency))
  if (options.cacheMemoryMb > 0) sharp.cache({ memory: Math.round(options.cacheMemoryMb) })
  else sharp.cache(false)
}

/**
 * Screens an incoming message down to the four envelopes this worker answers.
 *
 * The main process is the only sender and the payloads are already typed on its
 * side, so the kind tag is the only thing worth checking at runtime. Anything
 * else is dropped rather than crashing a lane that is mid run.
 */
function asInbound(value: unknown): WorkerInbound | null {
  if (typeof value !== 'object' || value === null) return null
  const kind = Reflect.get(value, 'kind')
  if (kind === 'job' || kind === 'preview' || kind === 'configure' || kind === 'shutdown') {
    return value as WorkerInbound
  }
  return null
}

port.on('message', (raw: unknown) => {
  const message = asInbound(raw)
  if (!message) return

  switch (message.kind) {
    case 'job':
      // Every failure mode inside runJob is already turned into an ok false
      // reply, so the only thing left to guard is the reply itself.
      void runJob(message.payload).then(
        (payload) => post({ kind: 'job', payload }),
        (error: unknown) => {
          post({
            kind: 'job',
            payload: {
              jobId: message.payload.jobId,
              ok: false,
              outputs: [],
              originalSize: message.payload.file.size,
              outputSize: 0,
              durationMs: 0,
              skipped: false,
              error: errorMessage(error),
              buffers: []
            }
          })
        }
      )
      break

    case 'preview':
      void runPreview(message.payload).then(
        (payload) => post({ kind: 'preview', payload }),
        (error: unknown) => {
          post({
            kind: 'preview',
            payload: {
              jobId: message.payload.jobId,
              ok: false,
              dataUrl: '',
              originalDataUrl: '',
              width: 0,
              height: 0,
              encodedBytes: 0,
              originalBytes: 0,
              estimatedBytes: 0,
              durationMs: 0,
              error: errorMessage(error),
              fallback: null
            }
          })
        }
      )
      break

    case 'configure':
      configure(message.payload)
      break

    case 'shutdown':
      port.close()
      break

    default:
      break
  }
})

post({
  kind: 'ready',
  payload: { sharp: sharp.versions.sharp ?? 'unknown', libvips: sharp.versions.vips }
})
