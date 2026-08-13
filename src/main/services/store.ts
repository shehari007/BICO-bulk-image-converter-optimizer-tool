import { app } from 'electron'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createLogger } from './logger'
import { deepMerge } from '@shared/utils'
import type { DeepPartial } from '@shared/types'

const log = createLogger('store')

/**
 * A tiny JSON store.
 *
 * A dedicated dependency was deliberately avoided here: the only requirements
 * are atomic writes and a merge against defaults on read, both of which are a
 * few lines. Every write goes to a temporary file first and is then renamed,
 * because rename is atomic on all three target platforms. A crash mid write
 * therefore leaves the previous good file intact rather than a truncated one.
 */
export class JsonStore<T extends object> {
  private readonly file: string
  private readonly defaults: T
  private cache: T | null = null
  private writeTimer: ReturnType<typeof setTimeout> | null = null

  constructor(fileName: string, defaults: T) {
    this.file = join(app.getPath('userData'), fileName)
    this.defaults = defaults
  }

  get path(): string {
    return this.file
  }

  read(): T {
    if (this.cache) return this.cache

    try {
      const raw = readFileSync(this.file, 'utf8')
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('stored value is not an object')
      }
      // Merging against defaults means a field introduced in a later version
      // gets a value instead of arriving as undefined in strict mode code.
      this.cache = deepMerge(this.defaults, parsed as DeepPartial<T>)
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code !== 'ENOENT') {
        log.warn(`could not read ${this.file}, falling back to defaults`)
      }
      this.cache = structuredClone(this.defaults)
    }

    return this.cache
  }

  write(value: T): T {
    this.cache = value
    this.scheduleFlush()
    return value
  }

  merge(patch: DeepPartial<T>): T {
    return this.write(deepMerge(this.read(), patch))
  }

  /**
   * Writes are coalesced on a short timer. The preferences store is touched on
   * every slider drag, and doing a synchronous disk write per pixel of travel
   * is visible as UI stutter.
   */
  private scheduleFlush(): void {
    if (this.writeTimer) clearTimeout(this.writeTimer)
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null
      this.flush()
    }, 250)
  }

  flush(): void {
    if (!this.cache) return
    if (this.writeTimer) {
      clearTimeout(this.writeTimer)
      this.writeTimer = null
    }

    const temp = `${this.file}.tmp`
    try {
      mkdirSync(dirname(this.file), { recursive: true })
      writeFileSync(temp, JSON.stringify(this.cache, null, 2), 'utf8')
      renameSync(temp, this.file)
    } catch (error) {
      log.error(`failed to persist ${this.file}`, error)
    }
  }
}
