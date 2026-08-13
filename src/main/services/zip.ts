// archiver 8 is published as an ES module only, which cannot be required from
// the CommonJS main bundle, so the 7.x line is pinned deliberately.
import archiver from 'archiver'
import { createWriteStream, type WriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { clamp } from '@shared/utils'
import { createLogger } from './logger'

const log = createLogger('zip')

/**
 * Streams converted images into a ZIP as they finish.
 *
 * v2 collected every output in memory and only then built the archive, which
 * meant a batch of large TIFFs could exhaust the heap before a single byte hit
 * the disk. Here the archive is opened up front and each entry is appended and
 * flushed as it arrives, so peak memory is one image rather than the whole run.
 */
export class ZipWriter {
  private readonly archive: archiver.Archiver
  private readonly output: WriteStream
  private readonly closed: Promise<void>
  private entryCount = 0
  private failed: Error | null = null
  private readonly usedNames = new Set<string>()

  private constructor(path: string, compressionLevel: number) {
    this.output = createWriteStream(path)
    this.archive = archiver('zip', {
      zlib: { level: clamp(Math.round(compressionLevel), 0, 9) },
      // Already compressed formats gain nothing from deflate, and forcing it
      // burns CPU that the encoders need. Store mode is chosen per entry below.
      forceZip64: false
    })

    this.closed = new Promise<void>((resolve, reject) => {
      this.output.on('close', () => resolve())
      this.output.on('error', (error: Error) => reject(error))
      this.archive.on('error', (error: Error) => {
        this.failed = error
        reject(error)
      })
      this.archive.on('warning', (warning: Error) => {
        // ENOENT warnings are non fatal in archiver but always indicate a bug
        // on our side, so they are surfaced rather than ignored.
        log.warn(`archiver warning: ${warning.message}`)
      })
    })

    this.archive.pipe(this.output)
  }

  static async create(path: string, compressionLevel: number): Promise<ZipWriter> {
    await mkdir(dirname(path), { recursive: true })
    return new ZipWriter(path, compressionLevel)
  }

  get count(): number {
    return this.entryCount
  }

  /**
   * Appends one file. Names already present get a numeric suffix, because a ZIP
   * with duplicate entries extracts unpredictably across tools.
   */
  append(name: string, data: Buffer | Uint8Array): void {
    if (this.failed) return

    let unique = name
    if (this.usedNames.has(unique)) {
      const dot = name.lastIndexOf('.')
      const stem = dot > 0 ? name.slice(0, dot) : name
      const ext = dot > 0 ? name.slice(dot) : ''
      let counter = 1
      do {
        unique = `${stem}-${counter}${ext}`
        counter += 1
      } while (this.usedNames.has(unique))
    }
    this.usedNames.add(unique)

    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)
    this.archive.append(buffer, { name: unique, store: isAlreadyCompressed(unique) })
    this.entryCount += 1
  }

  /** Finishes the archive and resolves once the file handle is fully closed. */
  async finalize(): Promise<number> {
    if (this.failed) throw this.failed
    await this.archive.finalize()
    await this.closed
    return this.archive.pointer()
  }

  /** Aborts the archive, used when a run is cancelled before it produced output. */
  async abort(): Promise<void> {
    try {
      this.archive.abort()
    } catch {
      // Already torn down, nothing to do.
    }
    await new Promise<void>((resolve) => {
      this.output.close(() => resolve())
    })
  }
}

const STORED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.heif',
  '.heic',
  '.jxl'
])

/** Deflating an already compressed image wastes CPU for well under one percent. */
function isAlreadyCompressed(name: string): boolean {
  const dot = name.lastIndexOf('.')
  if (dot < 0) return false
  return STORED_EXTENSIONS.has(name.slice(dot).toLowerCase())
}
