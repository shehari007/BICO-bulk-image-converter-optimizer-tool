import type { ConversionSettings, FormatCapabilities, InputFormat, OutputFormat } from './types'

/**
 * What each output container can actually do.
 *
 * The settings panel reads this table to decide which controls to show, the
 * estimator reads `estimatedBpp` to predict output size before a run starts,
 * and the GPU scheduler reads `browserEncodable` to decide whether an image
 * can complete entirely on a GPU lane.
 */
export const FORMATS: Record<Exclude<OutputFormat, 'original'>, FormatCapabilities> = {
  jpeg: {
    id: 'jpeg',
    label: 'JPEG',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    quality: true,
    lossless: false,
    alpha: false,
    animation: false,
    progressive: true,
    effort: null,
    chroma: true,
    metadata: true,
    hdr: false,
    estimatedBpp: 0.55,
    browserEncodable: true
  },
  png: {
    id: 'png',
    label: 'PNG',
    extension: 'png',
    mimeType: 'image/png',
    quality: false,
    lossless: true,
    alpha: true,
    animation: true,
    progressive: true,
    effort: { min: 1, max: 10, default: 7 },
    chroma: false,
    metadata: true,
    hdr: false,
    estimatedBpp: 1.8,
    browserEncodable: true
  },
  webp: {
    id: 'webp',
    label: 'WebP',
    extension: 'webp',
    mimeType: 'image/webp',
    quality: true,
    lossless: true,
    alpha: true,
    animation: true,
    progressive: false,
    effort: { min: 0, max: 6, default: 4 },
    chroma: false,
    metadata: true,
    hdr: false,
    estimatedBpp: 0.32,
    browserEncodable: true
  },
  avif: {
    id: 'avif',
    label: 'AVIF',
    extension: 'avif',
    mimeType: 'image/avif',
    quality: true,
    lossless: true,
    alpha: true,
    animation: false,
    progressive: false,
    effort: { min: 0, max: 9, default: 4 },
    chroma: true,
    metadata: true,
    hdr: true,
    estimatedBpp: 0.18,
    browserEncodable: false
  },
  tiff: {
    id: 'tiff',
    label: 'TIFF',
    extension: 'tiff',
    mimeType: 'image/tiff',
    quality: true,
    lossless: true,
    alpha: true,
    animation: false,
    progressive: false,
    effort: null,
    chroma: false,
    metadata: true,
    hdr: true,
    estimatedBpp: 3.2,
    browserEncodable: false
  },
  gif: {
    id: 'gif',
    label: 'GIF',
    extension: 'gif',
    mimeType: 'image/gif',
    quality: false,
    lossless: false,
    alpha: true,
    animation: true,
    progressive: false,
    effort: { min: 1, max: 10, default: 7 },
    chroma: false,
    metadata: false,
    hdr: false,
    estimatedBpp: 1.1,
    browserEncodable: false
  },
  heif: {
    id: 'heif',
    label: 'HEIF',
    extension: 'heif',
    mimeType: 'image/heif',
    quality: true,
    lossless: true,
    alpha: true,
    animation: false,
    progressive: false,
    effort: { min: 0, max: 9, default: 4 },
    chroma: true,
    metadata: true,
    hdr: true,
    estimatedBpp: 0.22,
    browserEncodable: false
  },
  jxl: {
    id: 'jxl',
    label: 'JPEG XL',
    extension: 'jxl',
    mimeType: 'image/jxl',
    quality: true,
    lossless: true,
    alpha: true,
    // The bundled encoder takes a single frame, so an animated source would
    // silently lose everything after the first one.
    animation: false,
    progressive: true,
    effort: { min: 1, max: 9, default: 4 },
    chroma: false,
    // The WASM encoder writes pixels only. Claiming otherwise would let the
    // metadata panel promise something no output would ever contain.
    metadata: false,
    hdr: false,
    estimatedBpp: 0.16,
    browserEncodable: false
  },
  jp2: {
    id: 'jp2',
    label: 'JPEG 2000',
    extension: 'jp2',
    mimeType: 'image/jp2',
    quality: true,
    // Verified rather than assumed: a photograph encoded at the top of the
    // scale decoded back bit exact.
    lossless: true,
    alpha: true,
    animation: false,
    progressive: false,
    effort: null,
    chroma: false,
    // The encoder is handed straight RGBA and nothing else, exactly as JPEG XL
    // is, so there is no EXIF and no colour profile left to write out.
    metadata: false,
    hdr: false,
    // Measured at the default quality on a 1920 by 1080 photograph. JPEG 2000
    // really is this expensive; the estimator would mislead if it flattered it.
    estimatedBpp: 1.05,
    browserEncodable: false
  }
}

export const OUTPUT_FORMAT_IDS = Object.keys(FORMATS) as Exclude<OutputFormat, 'original'>[]

/** Extensions accepted on import, matched case insensitively. */
export const READABLE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'jpe',
  'jfif',
  'png',
  'apng',
  'webp',
  'avif',
  'gif',
  'tif',
  'tiff',
  'heic',
  'heif',
  'jxl',
  'jp2',
  'j2k',
  'bmp',
  'ico',
  'svg'
] as const

const EXTENSION_SET = new Set<string>(READABLE_EXTENSIONS)

export function isReadableExtension(ext: string): boolean {
  return EXTENSION_SET.has(ext.replace(/^\./, '').toLowerCase())
}

/** Maps a file extension onto the libvips loader family it belongs to. */
export function extensionToInputFormat(ext: string): InputFormat {
  switch (ext.replace(/^\./, '').toLowerCase()) {
    case 'jpg':
    case 'jpeg':
    case 'jpe':
    case 'jfif':
      return 'jpeg'
    case 'png':
    case 'apng':
      return 'png'
    case 'webp':
      return 'webp'
    case 'avif':
      return 'avif'
    case 'gif':
      return 'gif'
    case 'tif':
    case 'tiff':
      return 'tiff'
    case 'heic':
    case 'heif':
      return 'heif'
    case 'jxl':
      return 'jxl'
    // The raw codestream and the boxed container are both read by the same
    // bundled codec, so they answer to one input format.
    case 'jp2':
    case 'j2k':
      return 'jp2'
    case 'svg':
      return 'svg'
    default:
      return 'unknown'
  }
}

/** Resolves the on disk extension for a chosen output format. */
export function outputExtension(format: OutputFormat, sourceExt: string): string {
  if (format === 'original') return sourceExt.replace(/^\./, '').toLowerCase() || 'jpg'
  return FORMATS[format].extension
}

export function formatCapabilities(format: OutputFormat): FormatCapabilities | null {
  return format === 'original' ? null : FORMATS[format]
}

/**
 * True when this configuration of a container actually quantises, which is the
 * same question as whether the quality slider changes the output size at all.
 *
 * Two formats answer it from their settings rather than from the table above.
 * PNG only quantises in palette mode, and TIFF only carries a quality control
 * while it is holding JPEG tiles; every other compression it offers is
 * lossless. The pre run estimator and the worker's size search both have to
 * answer this identically, or the search spends its whole iteration budget
 * proving that nothing moved while the estimate says the same slider is inert.
 */
export function baselineIsLossy(
  format: Exclude<OutputFormat, 'original'>,
  settings: Pick<ConversionSettings, 'pngPalette' | 'tiffCompression'>
): boolean {
  if (format === 'png') return settings.pngPalette
  if (format === 'tiff') return settings.tiffCompression === 'jpeg'
  return FORMATS[format].quality
}

/**
 * Formats Chromium can encode inside an OffscreenCanvas. Anything outside this
 * set has to come back to sharp for the final encode step.
 */
export function isBrowserEncodable(format: OutputFormat): boolean {
  return format !== 'original' && FORMATS[format].browserEncodable
}
