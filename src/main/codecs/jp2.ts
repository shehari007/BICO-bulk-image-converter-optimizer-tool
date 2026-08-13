/**
 * JPEG 2000, provided by a WebAssembly build of ImageMagick.
 *
 * Every prebuilt sharp 0.35 binary carries a libvips compiled without
 * OpenJPEG, so sharp.format.jp2 reports false on all six platform and
 * architecture combinations and there is no encoder behind the name to reach.
 * ImageMagick is the one portable WebAssembly build whose JPEG 2000 delegate
 * actually works, so BICO carries it for this single container.
 *
 * It is not cheap. The binary is fourteen megabytes, initialising it costs
 * roughly sixty milliseconds and it holds a large heap afterwards, so nothing
 * here loads until a JPEG 2000 file is genuinely encountered. Once loaded it
 * stays for the life of the worker, because the cost is all in the startup.
 *
 * Only JPEG 2000 goes through it. ImageMagick advertises JPEG XL as well, but
 * that encoder is degenerate on this build: quality 95 produced 22.5 KB where
 * quality 55 produced 27.9 KB from the same source, so the size moves the wrong
 * way as quality rises. JPEG XL stays on libjxl, in codecs/jxl.ts.
 */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { clamp, errorMessage } from '@shared/utils'
// Types only. A type import emits nothing, so the bundler never sees this and
// the ES module behind it is reached through the runtime import below instead.
import type * as Magick from '@imagemagick/magick-wasm'

export interface Jp2EncodeOptions {
  /** 0 to 100, matching every other format in the app. */
  quality: number
  lossless: boolean
}

export interface Jp2Image {
  data: Buffer
  width: number
  height: number
  channels: 4
}

type MagickModule = typeof Magick

/**
 * The package is published as ES modules only, and this file is bundled to
 * CommonJS so that the sharp native addon can be required. A plain `import()`
 * would be rewritten by the bundler into a `require()` that then fails on an ES
 * module, so the specifier is hidden behind a constructed function that the
 * bundler cannot follow and Node resolves at runtime.
 */
const dynamicImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string
) => Promise<unknown>

let magick: MagickModule | null = null
let failure: string | null = null

/**
 * Held so that two files arriving together share one initialisation.
 *
 * The JPEG XL codec can afford to race its own loader, because its wasm is two
 * megabytes. This one would read fourteen megabytes twice and stand up a second
 * heap to throw away, which is worth one variable to avoid.
 */
let loading: Promise<MagickModule | null> | null = null

async function start(): Promise<MagickModule | null> {
  try {
    const module = (await dynamicImport('@imagemagick/magick-wasm')) as MagickModule

    // Only the ./magick.wasm subpath is exported, so the binary is located
    // through Node's own resolver rather than by walking node_modules for a
    // package root. Handing the bytes over rather than a URL also means the
    // file can sit in an unpacked asar directory without any further ceremony.
    const require = createRequire(__filename)
    const wasm = require.resolve('@imagemagick/magick-wasm/magick.wasm')
    await module.initializeImageMagick(readFileSync(wasm))

    magick = module
    return magick
  } catch (error) {
    failure = errorMessage(error)
    return null
  }
}

async function load(): Promise<MagickModule | null> {
  if (magick) return magick
  if (failure) return null
  loading ??= start()
  return loading
}

/** Why the codec is unavailable, or null while it is fine. */
export function jp2Failure(): string | null {
  return failure
}

/**
 * Confirms the codec loads, without encoding anything.
 *
 * Deliberately not called at worker startup the way the JPEG XL probe is: this
 * module costs a fourteen megabyte read and a large heap, and the overwhelming
 * majority of runs never touch JPEG 2000 at all.
 */
export async function probeJp2(): Promise<boolean> {
  return (await load()) !== null
}

/**
 * The band of distortion targets the app quality slider is spread across.
 *
 * The OpenJPEG delegate reads `quality` as a target peak signal to noise ratio
 * in decibels rather than as a percentage, which is why its curve is so steep
 * and why it saturates. Measured here on a 1920 by 1080 photograph fed in as
 * straight RGBA, output size against the number handed to ImageMagick:
 *
 *   20 to 0.5 KB     25 to 144 KB     30 to 433 KB     35 to 1234 KB
 *   40 to 1996 KB    45 to 2652 KB    50 to 3329 KB    60 to 4155 KB
 *   70 to 4370 KB    82 to 4396 KB   100 to 4398 KB
 *
 * Below 25 the encoder collapses into a few hundred bytes of nothing, and above
 * 45 every step buys invisible fidelity for about a megabyte. Passing the app
 * slider straight through would therefore hand a user sitting on the default
 * quality of 82 a 4.4 MB file for a two megapixel image, with the entire useful
 * range crushed into the bottom quarter of a control that looked linear.
 */
const MIN_DISTORTION_DB = 25
const MAX_DISTORTION_DB = 45

/**
 * The one value the delegate reads as "no distortion target at all". A
 * photograph round tripped through it came back bit exact, so this is the
 * honest home for the lossless switch.
 */
const LOSSLESS_QUALITY = 100

function magickQuality(options: Jp2EncodeOptions): number {
  if (options.lossless) return LOSSLESS_QUALITY
  const slider = clamp(options.quality, 1, 100) / 100
  return Math.round(MIN_DISTORTION_DB + slider * (MAX_DISTORTION_DB - MIN_DISTORTION_DB))
}

export async function encodeJp2(image: Jp2Image, options: Jp2EncodeOptions): Promise<Buffer> {
  const module = await load()
  if (!module) {
    throw new Error(`the JPEG 2000 encoder could not be loaded: ${failure ?? 'unknown reason'}`)
  }

  // Straight, that is unpremultiplied, eight bit RGBA. Nothing else about the
  // source crosses this hand off, which is why the format table promises no
  // metadata: there is none left by the time the encoder sees the image.
  const settings = new module.MagickReadSettings({
    format: module.MagickFormat.Rgba,
    width: image.width,
    height: image.height,
    depth: 8
  })

  const quality = magickQuality(options)

  return module.ImageMagick.read(image.data, settings, (frame): Buffer => {
    frame.quality = quality
    // The callback is handed a view onto the wasm heap that is released the
    // moment it returns, so the bytes are copied out rather than referenced.
    return frame.write(module.MagickFormat.Jp2, (bytes) => Buffer.from(bytes))
  })
}

export async function decodeJp2(bytes: Buffer): Promise<Jp2Image> {
  const module = await load()
  if (!module) {
    throw new Error(`the JPEG 2000 decoder could not be loaded: ${failure ?? 'unknown reason'}`)
  }

  return module.ImageMagick.read(bytes, (frame): Jp2Image => {
    // A JPEG 2000 file may hold sixteen bit samples and may carry no alpha
    // channel at all, while the caller has promised sharp four eight bit bands.
    // Narrowing the depth and adding an opaque alpha only where one is missing
    // produces exactly that. Assigning hasAlpha unconditionally would not: its
    // setter runs the opaque alpha action first, which flattens a real alpha
    // channel to solid before the write ever happens.
    frame.depth = 8
    if (!frame.hasAlpha) frame.hasAlpha = true

    return {
      data: frame.write(module.MagickFormat.Rgba, (raw) => Buffer.from(raw)),
      width: frame.width,
      height: frame.height,
      channels: 4
    }
  })
}

/** Extensions this codec owns, because libvips can open none of them. */
const JP2_EXTENSIONS = new Set(['jp2', 'j2k'])

/** True when a path should be opened through the WASM decoder, not libvips. */
export function isJp2Extension(ext: string): boolean {
  return JP2_EXTENSIONS.has(ext.replace(/^\./, '').toLowerCase())
}
