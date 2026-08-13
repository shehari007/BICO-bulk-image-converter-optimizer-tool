import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { extensionToInputFormat } from '@shared/formats'
import { errorMessage } from '@shared/utils'
import { decodeJp2, isJp2Extension } from '../codecs/jp2'
import { decodeJxl, isJxlExtension } from '../codecs/jxl'
import { createLogger } from './logger'
import type { Sharp, SharpOptions } from 'sharp'
import type {
  ExifEntry,
  InputFormat,
  ProbeResult,
  SourceFile,
  ThumbnailResult
} from '@shared/types'

const log = createLogger('inspect')

/**
 * Opens a file for inspection, decoding the two bundled codecs first.
 *
 * No prebuilt sharp binary has a loader for JPEG XL or JPEG 2000, so a file the
 * app wrote itself would otherwise fail to probe and show a broken thumbnail in
 * its own queue.
 */
async function openForInspection(file: SourceFile, options: SharpOptions): Promise<Sharp> {
  const decode = isJxlExtension(file.ext) ? decodeJxl : isJp2Extension(file.ext) ? decodeJp2 : null
  if (!decode) return sharp(file.path, options)

  const decoded = await decode(await readFile(file.path))
  return sharp(decoded.data, {
    raw: { width: decoded.width, height: decoded.height, channels: 4 },
    limitInputPixels: false
  })
}

/**
 * Probing and thumbnailing run on the main thread rather than in the pool.
 *
 * That is safe because every sharp call here is asynchronous and libvips does
 * its work on the libuv thread pool, so the JavaScript thread is never blocked.
 * Keeping them out of the conversion pool matters more: a user scrolling the
 * queue would otherwise starve the workers that are actually converting.
 */

const probeCache = new Map<string, ProbeResult>()
const thumbnailCache = new Map<string, ThumbnailResult>()

/** Bounded so importing a hundred thousand files cannot exhaust memory. */
const THUMBNAIL_CACHE_LIMIT = 600

export async function probeFile(file: SourceFile): Promise<ProbeResult | null> {
  const cached = probeCache.get(file.id)
  if (cached) return cached

  try {
    const opened = await openForInspection(file, { limitInputPixels: false, failOn: 'none' })
    const metadata = await opened.metadata()

    const result: ProbeResult = {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
      format: normaliseFormat(metadata.format, file.ext),
      space: metadata.space ?? 'unknown',
      channels: metadata.channels ?? 0,
      depth: metadata.depth ?? 'uchar',
      density: metadata.density ?? 72,
      hasAlpha: metadata.hasAlpha ?? false,
      hasProfile: Boolean(metadata.icc),
      isAnimated: (metadata.pages ?? 1) > 1,
      pages: metadata.pages ?? 1,
      orientation: metadata.orientation ?? 1,
      isProgressive: metadata.isProgressive ?? false
    }

    probeCache.set(file.id, result)
    return result
  } catch (error) {
    log.debug(`could not probe ${file.name}: ${errorMessage(error)}`)
    return null
  }
}

function normaliseFormat(format: string | undefined, ext: string): InputFormat {
  if (!format) return extensionToInputFormat(ext)
  switch (format) {
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'avif':
    case 'gif':
    case 'tiff':
    case 'heif':
    case 'jxl':
    case 'svg':
      return format
    case 'raw':
      // A file BICO decoded itself reaches sharp as raw pixels, so the reported
      // container describes the hand off rather than the file. The extension is
      // the only thing left that still knows what was actually opened.
      return isJxlExtension(ext) || isJp2Extension(ext) ? extensionToInputFormat(ext) : 'raw'
    default:
      return extensionToInputFormat(ext)
  }
}

/**
 * Renders a queue thumbnail as a WebP data URL.
 *
 * WebP rather than PNG because a 96 pixel thumbnail lands around 2 KB instead of
 * 20 KB, and the queue can easily hold several hundred of them at once in the
 * renderer's memory.
 */
export async function thumbnailFor(
  file: SourceFile,
  size: number
): Promise<ThumbnailResult | null> {
  const key = `${file.id}:${size}`
  const cached = thumbnailCache.get(key)
  if (cached) return cached

  try {
    const opened = await openForInspection(file, {
      limitInputPixels: false,
      failOn: 'none',
      // Sequential reading keeps peak memory to a few scanlines when the source
      // is a very large progressive JPEG or a striped TIFF.
      sequentialRead: true
    })

    const { data, info } = await opened
      .rotate()
      .resize({
        width: size,
        height: size,
        fit: 'cover',
        position: 'centre',
        fastShrinkOnLoad: true
      })
      .webp({ quality: 70, effort: 0 })
      .toBuffer({ resolveWithObject: true })

    const result: ThumbnailResult = {
      dataUrl: `data:image/webp;base64,${data.toString('base64')}`,
      width: info.width,
      height: info.height
    }

    if (thumbnailCache.size >= THUMBNAIL_CACHE_LIMIT) {
      // Simple first in first out eviction. The queue is scrolled linearly, so
      // recency ordering would not buy much over insertion ordering here.
      const oldest = thumbnailCache.keys().next()
      if (!oldest.done) thumbnailCache.delete(oldest.value)
    }
    thumbnailCache.set(key, result)
    return result
  } catch (error) {
    log.debug(`could not thumbnail ${file.name}: ${errorMessage(error)}`)
    return null
  }
}

const EXIF_GROUPS: Record<string, string> = {
  Make: 'Camera',
  Model: 'Camera',
  LensModel: 'Camera',
  Software: 'Camera',
  ISO: 'Exposure',
  FNumber: 'Exposure',
  ExposureTime: 'Exposure',
  FocalLength: 'Exposure',
  ExposureBiasValue: 'Exposure',
  Flash: 'Exposure',
  MeteringMode: 'Exposure',
  WhiteBalance: 'Exposure',
  DateTimeOriginal: 'Capture',
  CreateDate: 'Capture',
  ModifyDate: 'Capture',
  OffsetTime: 'Capture',
  latitude: 'Location',
  longitude: 'Location',
  GPSAltitude: 'Location',
  Artist: 'Rights',
  Copyright: 'Rights',
  ImageDescription: 'Rights',
  Orientation: 'Image',
  XResolution: 'Image',
  YResolution: 'Image',
  ColorSpace: 'Image'
}

/**
 * Reads the metadata block for the inspector panel.
 *
 * exifr is used instead of sharp here because sharp only hands back the raw
 * EXIF buffer, and parsing that correctly across the maker note dialects that
 * cameras actually emit is not something worth reimplementing.
 */
export async function exifFor(file: SourceFile): Promise<ExifEntry[]> {
  try {
    const exifr = await import('exifr')
    const parse = exifr.default?.parse ?? exifr.parse
    const data: unknown = await parse(file.path, {
      tiff: true,
      exif: true,
      gps: true,
      // Interop and thumbnail blocks add noise without telling the user
      // anything they cannot already see.
      interop: false,
      translateValues: true,
      reviveValues: true
    })

    if (typeof data !== 'object' || data === null) return []

    const entries: ExifEntry[] = []
    for (const [tag, value] of Object.entries(data as Record<string, unknown>)) {
      if (value === null || value === undefined) continue
      if (typeof value === 'object' && !(value instanceof Date)) continue

      entries.push({
        group: EXIF_GROUPS[tag] ?? 'Other',
        tag,
        value: value instanceof Date ? value.toISOString() : String(value)
      })
    }

    const order = ['Camera', 'Exposure', 'Capture', 'Image', 'Location', 'Rights', 'Other']
    entries.sort((a, b) => {
      const groupDelta = order.indexOf(a.group) - order.indexOf(b.group)
      return groupDelta !== 0 ? groupDelta : a.tag.localeCompare(b.tag)
    })

    return entries
  } catch (error) {
    log.debug(`could not read metadata for ${file.name}: ${errorMessage(error)}`)
    return []
  }
}

export function clearInspectionCaches(): void {
  probeCache.clear()
  thumbnailCache.clear()
}
