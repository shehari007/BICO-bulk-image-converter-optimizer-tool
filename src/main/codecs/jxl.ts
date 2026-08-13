/**
 * JPEG XL, provided by a WebAssembly build of libjxl.
 *
 * The prebuilt libvips that sharp ships is compiled without libjxl, and there
 * is no way to add it without maintaining a custom libvips for six platform and
 * architecture combinations and rebuilding all of them on every sharp release.
 * A WASM codec costs about two megabytes, behaves identically on Windows, macOS
 * and Linux, and needs no native toolchain from anyone who clones the repo.
 *
 * It is genuinely competitive rather than a consolation prize. Measured on a
 * 1920 by 1080 photograph, quality 75 at effort 4 produced a smaller file than
 * AVIF at quality 60 and encoded roughly three times faster.
 */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { clamp, errorMessage } from '@shared/utils'

export interface JxlEncodeOptions {
  /** 0 to 100, matching every other format in the app. */
  quality: number
  /** 1 to 9. Higher searches harder for a smaller file. */
  effort: number
  lossless: boolean
  progressive: boolean
}

export interface JxlImage {
  data: Buffer
  width: number
  height: number
  channels: 4
}

interface ImageDataLike {
  data: Uint8ClampedArray
  width: number
  height: number
  colorSpace: 'srgb'
}

interface EncodeModule {
  init(module?: WebAssembly.Module): Promise<unknown>
  default(data: ImageDataLike, options?: Record<string, unknown>): Promise<ArrayBuffer>
}

interface DecodeModule {
  init(module?: WebAssembly.Module): Promise<unknown>
  default(data: ArrayBuffer | Uint8Array): Promise<ImageDataLike>
}

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

let encoder: EncodeModule | null = null
let decoder: DecodeModule | null = null
let failure: string | null = null

/** Resolved once, because it walks node_modules. */
let packageRoot: string | null = null

function rootDir(): string {
  if (packageRoot) return packageRoot
  const require = createRequire(__filename)
  packageRoot = dirname(require.resolve('@jsquash/jxl/package.json'))
  return packageRoot
}

/**
 * Compiles the wasm here rather than letting Emscripten load it.
 *
 * The generated glue reaches for `fetch` against a file URL, which Node refuses,
 * so every call would fail with a bare "fetch failed". Handing `init` an already
 * compiled module skips that path entirely and also lets the binary come out of
 * an unpacked asar directory.
 */
async function compile(relative: string): Promise<WebAssembly.Module> {
  return WebAssembly.compile(readFileSync(join(rootDir(), relative)))
}

async function loadEncoder(): Promise<EncodeModule | null> {
  if (encoder) return encoder
  if (failure) return null

  try {
    const module = (await dynamicImport('@jsquash/jxl/encode.js')) as EncodeModule
    await module.init(await compile('codec/enc/jxl_enc.wasm'))
    encoder = module
    return encoder
  } catch (error) {
    failure = errorMessage(error)
    return null
  }
}

async function loadDecoder(): Promise<DecodeModule | null> {
  if (decoder) return decoder
  if (failure) return null

  try {
    const module = (await dynamicImport('@jsquash/jxl/decode.js')) as DecodeModule
    await module.init(await compile('codec/dec/jxl_dec.wasm'))
    decoder = module
    return decoder
  } catch (error) {
    failure = errorMessage(error)
    return null
  }
}

/** Why the codec is unavailable, or null while it is fine. */
export function jxlFailure(): string | null {
  return failure
}

/**
 * Confirms the codec loads, without encoding anything.
 *
 * Called once at worker startup so the About panel can report JPEG XL honestly
 * rather than discovering the problem on the first file of a long run.
 */
export async function probeJxl(): Promise<boolean> {
  const [enc, dec] = await Promise.all([loadEncoder(), loadDecoder()])
  return enc !== null && dec !== null
}

export async function encodeJxl(image: JxlImage, options: JxlEncodeOptions): Promise<Buffer> {
  const module = await loadEncoder()
  if (!module) {
    throw new Error(`the JPEG XL encoder could not be loaded: ${failure ?? 'unknown reason'}`)
  }

  // The codec expects the browser ImageData shape. A plain object with the same
  // three fields satisfies it, and the view is created without copying.
  const imageData: ImageDataLike = {
    data: new Uint8ClampedArray(image.data.buffer, image.data.byteOffset, image.data.byteLength),
    width: image.width,
    height: image.height,
    colorSpace: 'srgb'
  }

  const encoded = await module.default(imageData, {
    // Lossless ignores quality inside libjxl, and the wrapper warns loudly if
    // both are set, so quality is pinned when lossless is on.
    quality: options.lossless ? 100 : clamp(Math.round(options.quality), 1, 100),
    effort: clamp(Math.round(options.effort), 1, 9),
    lossless: options.lossless,
    progressive: options.progressive
  })

  return Buffer.from(encoded)
}

export async function decodeJxl(bytes: Buffer): Promise<JxlImage> {
  const module = await loadDecoder()
  if (!module) {
    throw new Error(`the JPEG XL decoder could not be loaded: ${failure ?? 'unknown reason'}`)
  }

  const decoded = await module.default(
    new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  )

  return {
    data: Buffer.from(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength),
    width: decoded.width,
    height: decoded.height,
    channels: 4
  }
}

/** True when a path should be opened through the WASM decoder, not libvips. */
export function isJxlExtension(ext: string): boolean {
  return ext.replace(/^\./, '').toLowerCase() === 'jxl'
}
