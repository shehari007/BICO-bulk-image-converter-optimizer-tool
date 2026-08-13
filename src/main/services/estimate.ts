/**
 * Pre run output size prediction.
 *
 * The queue shows a projected output size before anything is converted, and the
 * only inputs available at that point are the source file size, its pixel count
 * and the settings. Nothing here decodes an image or touches the disk, so the
 * whole module is pure and every number it produces can be traced back through
 * the constants below.
 *
 * The model is deliberately simple: bytes are pixels multiplied by a bytes per
 * pixel figure, and every setting that matters is a multiplier on that figure.
 * That keeps the estimate honest about what it is. It predicts the right order
 * of magnitude and tracks the direction of every slider correctly, which is
 * what a progress readout needs. It is not a substitute for the live preview,
 * which measures a real encode of the real content.
 */

import { FORMATS, baselineIsLossy } from '@shared/formats'
import { clamp } from '@shared/utils'
import type { ConversionSettings, OutputFormat, ResizeSettings, VariantSpec } from '@shared/types'

type ConcreteFormat = Exclude<OutputFormat, 'original'>

/**
 * The quality the bytes per pixel figures in FORMATS are quoted at.
 *
 * Everything the quality curve does is relative to this point, so the curve
 * evaluates to exactly one here and the registry values pass through untouched.
 */
const QUALITY_REFERENCE = 80

/**
 * The one calibration point the curve is fitted to: quality 100 costs roughly
 * 2.6 times what quality 50 costs on the same image.
 */
const QUALITY_HIGH = 100
const QUALITY_LOW = 50
const QUALITY_HIGH_OVER_LOW = 2.6

/**
 * Growth rate of the exponential fitted through that point.
 *
 * Compressed size grows geometrically rather than linearly with quality, which
 * is why an exponential is the right shape: each additional quality point costs
 * a fixed percentage more rather than a fixed number of bytes. Solving
 * exp(k * (high - low) / 100) = ratio for k gives the constant below, so
 * changing the calibration point above is all it takes to refit the curve.
 */
const QUALITY_GROWTH = (100 * Math.log(QUALITY_HIGH_OVER_LOW)) / (QUALITY_HIGH - QUALITY_LOW)

/**
 * How much lossless mode costs against the same format's lossy figure.
 *
 * Lossless coding keeps every detail the quantiser would have discarded, which
 * on photographic content lands near four times the size. Formats that are
 * lossless to begin with are excluded from this, see losslessMultiplier.
 */
const LOSSLESS_MULTIPLIER = 4

/** Near lossless WebP sits between the two, closer to the lossless end. */
const NEAR_LOSSLESS_MULTIPLIER = 2.2

/**
 * How far the effort slider can move the result, either way.
 *
 * Effort buys search time inside the encoder, not a different representation,
 * so it trims a few percent rather than changing the order of magnitude. The
 * swing is applied either side of each format's own default effort, see
 * effortFactor.
 */
const EFFORT_SWING = 0.08

/**
 * Bytes of container, header and index that every file pays regardless of size.
 *
 * Without this a one pixel icon would be estimated at almost nothing, which
 * makes the running total for a folder of small assets read far too low.
 */
const CONTAINER_OVERHEAD_BYTES = 600

/**
 * Deflate efficiency on indexed image data, derived rather than guessed.
 *
 * A truecolour PNG carries three bytes per pixel before compression and the
 * registry says it lands at FORMATS.png.estimatedBpp afterwards, so the ratio
 * between them is what deflate achieves on this kind of data. Palette mode
 * changes the bytes going in, not how well they compress, so the same ratio
 * carries over.
 */
const DEFLATE_RATIO = FORMATS.png.estimatedBpp / 3

/**
 * Aspect ratio assumed when a strategy needs edge lengths and only the pixel
 * count is known.
 *
 * Four by three is the modal aspect across camera and phone output, and the
 * error it introduces is second order next to the quality curve: it reaches
 * only the single edge strategies, and it reaches those through a square root.
 */
const ASSUMED_ASPECT = 4 / 3

/** One source file, as much of it as the estimate needs. */
export interface EstimateSource {
  /** Size on disk in bytes. */
  bytes: number
  /** Width times height. Zero when the file has not been probed yet. */
  pixels: number
}

/**
 * Cost multiplier for a quality setting, relative to QUALITY_REFERENCE.
 *
 * Monotonic and smooth across the whole 1 to 100 range, so dragging the slider
 * moves the estimate continuously instead of stepping between buckets.
 */
export function qualityFactor(quality: number): number {
  const q = clamp(quality, 1, 100)
  return Math.exp((QUALITY_GROWTH * (q - QUALITY_REFERENCE)) / 100)
}

/**
 * Effort multiplier, anchored on each format's own default effort.
 *
 * The registry figures describe a format at its defaults, so the default effort
 * has to evaluate to exactly one or the anchor would drift. The swing is then
 * applied either side of it, reaching its full extent at both ends of whatever
 * range that format exposes.
 */
function effortFactor(format: ConcreteFormat, effort: number): number {
  const range = FORMATS[format].effort
  if (!range) return 1
  const chosen = clamp(effort, range.min, range.max)
  const span = chosen <= range.default ? range.default - range.min : range.max - range.default
  if (span <= 0) return 1
  return 1 - (EFFORT_SWING * (chosen - range.default)) / span
}

/**
 * Bits an indexed image spends on one pixel.
 *
 * An indexed image stores ceil(log2(colours)) bits per pixel, so halving the
 * palette saves a bit per pixel rather than half the file. That is why dropping
 * from 256 to 128 colours disappoints people, and why this has to be
 * logarithmic rather than proportional.
 */
function paletteIndexBits(colours: number): number {
  return Math.ceil(Math.log2(clamp(Math.round(colours), 2, 256)))
}

/** The lossless penalty, or one when it does not apply. */
function losslessMultiplier(format: ConcreteFormat, settings: ConversionSettings): number {
  if (!FORMATS[format].lossless) return 1
  if (settings.lossless) return baselineIsLossy(format, settings) ? LOSSLESS_MULTIPLIER : 1
  if (format === 'webp' && settings.nearLossless) return NEAR_LOSSLESS_MULTIPLIER
  return 1
}

/** True when the quality slider has no effect on this format's output size. */
function qualityIsInert(format: ConcreteFormat, settings: ConversionSettings): boolean {
  if (settings.lossless && FORMATS[format].lossless) return true
  return !baselineIsLossy(format, settings)
}

/**
 * Fraction of the source pixels that survive the resize.
 *
 * Returns one for a no op, less than one for a reduction and more than one when
 * the settings genuinely ask for an enlargement. Strategies that pin a single
 * edge need to know how long that edge is, which is where ASSUMED_ASPECT comes
 * in: only the pixel count is available here, so the edges are reconstructed
 * from it.
 */
export function resizePixelRatio(resize: ResizeSettings, sourcePixels: number): number {
  if (sourcePixels <= 0) return 1

  const sourceWidth = Math.sqrt(sourcePixels * ASSUMED_ASPECT)
  const sourceHeight = sourcePixels / sourceWidth
  const longEdge = Math.max(sourceWidth, sourceHeight)
  const shortEdge = Math.min(sourceWidth, sourceHeight)

  const width = resize.width !== null && resize.width > 0 ? resize.width : null
  const height = resize.height !== null && resize.height > 0 ? resize.height : null

  // Ratios are areas, so an edge ratio has to be squared before it is used.
  const fromEdge = (target: number, source: number): number => (target / source) ** 2

  let ratio: number
  switch (resize.strategy) {
    case 'exact':
      // Both edges pinned is the only case the fit picker reaches. `inside` and
      // `outside` keep the aspect ratio, so they land on a single edge ratio
      // rather than on the box; the other three fill the box exactly, by
      // stretching, cropping or padding.
      if (width !== null && height !== null) {
        if (resize.fit === 'inside' || resize.fit === 'outside') {
          const byWidth = width / sourceWidth
          const byHeight = height / sourceHeight
          const scale =
            resize.fit === 'outside' ? Math.max(byWidth, byHeight) : Math.min(byWidth, byHeight)
          ratio = scale ** 2
        } else {
          ratio = (width * height) / sourcePixels
        }
      } else if (width !== null) ratio = fromEdge(width, sourceWidth)
      else if (height !== null) ratio = fromEdge(height, sourceHeight)
      else ratio = 1
      break
    case 'width':
      ratio = width === null ? 1 : fromEdge(width, sourceWidth)
      break
    case 'height':
      ratio = height === null ? 1 : fromEdge(height, sourceHeight)
      break
    case 'longest':
      ratio = width === null ? 1 : fromEdge(width, longEdge)
      break
    case 'shortest':
      ratio = width === null ? 1 : fromEdge(width, shortEdge)
      break
    case 'percentage':
      ratio = (clamp(resize.percentage, 1, 1000) / 100) ** 2
      break
    case 'megapixels':
      ratio = (Math.max(0.01, resize.megapixels) * 1e6) / sourcePixels
      break
    case 'none':
    default:
      return 1
  }

  if (resize.withoutEnlargement) ratio = Math.min(ratio, 1)
  if (resize.withoutReduction) ratio = Math.max(ratio, 1)
  return clamp(ratio, 0, 1000)
}

/** The resize a variant performs, expressed against the primary settings. */
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

/**
 * Reconstructs a pixel count for a file that has not been probed.
 *
 * Files enter the queue before their headers are read, so the estimate has to
 * work from the file size alone until the probe lands. Treating an unprobed
 * file as a typical JPEG is the least wrong assumption available, and it only
 * governs the first moments after a drop.
 */
function assumePixels(sourceBytes: number): number {
  return Math.max(1, sourceBytes / FORMATS.jpeg.estimatedBpp)
}

/**
 * Bytes per pixel for one rendition, before the pixel count is applied.
 *
 * `original` is the interesting case: the target container is whatever the
 * source already was, so instead of a registry figure the source's own measured
 * bytes per pixel is used. That is a far better predictor than any table, since
 * it already reflects this specific image's content and how hard it was to
 * compress the first time round.
 */
function bytesPerPixel(
  format: OutputFormat,
  quality: number,
  settings: ConversionSettings,
  sourceBytes: number,
  sourcePixels: number
): number {
  if (format === 'original') {
    const observed = sourcePixels > 0 ? sourceBytes / sourcePixels : FORMATS.jpeg.estimatedBpp
    return observed * qualityFactor(quality)
  }

  const caps = FORMATS[format]

  // GIF is palette only, so its registry figure is already an indexed one and
  // is quoted at a full 256 entry palette. Narrowing the palette narrows the
  // index, and the registry figure scales with it.
  if (format === 'gif') return caps.estimatedBpp * (paletteIndexBits(settings.gifColours) / 8)

  // PNG's registry figure is the truecolour one, so palette mode has to be
  // derived: indices at the index width, compressed at the ratio deflate
  // achieves on image data, which the registry itself pins down.
  if (format === 'png' && settings.pngPalette) {
    return (paletteIndexBits(settings.pngColours) / 8) * DEFLATE_RATIO
  }

  let bpp =
    caps.estimatedBpp * losslessMultiplier(format, settings) * effortFactor(format, settings.effort)

  if (!qualityIsInert(format, settings)) {
    bpp *= qualityFactor(quality)
  }

  return bpp
}

/** One rendition's predicted size, before the skipIfLarger rule is applied. */
function renditionBytes(
  format: OutputFormat,
  quality: number,
  resize: ResizeSettings,
  settings: ConversionSettings,
  sourceBytes: number,
  sourcePixels: number
): number {
  const pixels = sourcePixels * resizePixelRatio(resize, sourcePixels)
  const bpp = bytesPerPixel(format, quality, settings, sourceBytes, sourcePixels)
  return Math.max(0, pixels * bpp) + CONTAINER_OVERHEAD_BYTES
}

/**
 * Predicts the bytes one source file will contribute to a run.
 *
 * The total covers every rendition the settings produce, the primary output and
 * each enabled variant, because that is what a run actually writes and what the
 * queue total is asking about.
 *
 * Two output rules are modelled on top of the raw prediction. A size target
 * pulls the estimate down towards its budget, bounded below by what the search
 * can reach at its own minimum quality, since the search cannot go past the
 * floor the user set. skipIfLarger removes a rendition entirely rather than
 * capping it, because a file that would have grown is not written at all.
 */
export function estimateOutputBytes(
  sourceBytes: number,
  sourcePixels: number,
  settings: ConversionSettings
): number {
  if (!Number.isFinite(sourceBytes) || sourceBytes <= 0) return 0
  const pixels = sourcePixels > 0 ? sourcePixels : assumePixels(sourceBytes)

  const renditions: { format: OutputFormat; quality: number; resize: ResizeSettings }[] = [
    { format: settings.format, quality: settings.quality, resize: settings.resize }
  ]
  for (const variant of settings.variants) {
    if (!variant.enabled) continue
    renditions.push({
      format: variant.format ?? settings.format,
      quality: variant.quality ?? settings.quality,
      resize: variantResize(settings.resize, variant)
    })
  }

  let total = 0
  for (const rendition of renditions) {
    let bytes = renditionBytes(
      rendition.format,
      rendition.quality,
      rendition.resize,
      settings,
      sourceBytes,
      pixels
    )

    if (settings.smart.sizeTarget !== 'off') {
      const budget = Math.max(0, settings.smart.targetKb * 1024)
      const floor = renditionBytes(
        rendition.format,
        settings.smart.minQuality,
        rendition.resize,
        settings,
        sourceBytes,
        pixels
      )
      bytes = clamp(budget, Math.min(floor, bytes), bytes)
    }

    if (settings.output.skipIfLarger && bytes > sourceBytes) continue
    total += bytes
  }

  return Math.round(total)
}

/**
 * Sums estimateOutputBytes across a queue.
 *
 * Kept separate from the per file function so the two can be audited against
 * each other: the run total is nothing more than the sum of its parts, with no
 * extra assumptions folded in.
 */
export function estimateRunBytes(
  files: readonly EstimateSource[],
  settings: ConversionSettings
): number {
  let total = 0
  for (const file of files) {
    total += estimateOutputBytes(file.bytes, file.pixels, settings)
  }
  return total
}
