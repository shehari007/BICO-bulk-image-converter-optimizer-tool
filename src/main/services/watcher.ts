import { watch, type FSWatcher } from 'node:fs'
import { rename, stat, unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { isReadableExtension } from '@shared/formats'
import { errorMessage } from '@shared/utils'
import { createLogger } from './logger'
import { addPaths } from './files'
import { scheduler } from './scheduler'
import type { ConversionSettings, WatchConfig, WatchStatus } from '@shared/types'

const log = createLogger('watch')

type StatusListener = (status: WatchStatus) => void

const IDLE: WatchStatus = {
  running: false,
  folder: '',
  seen: 0,
  processed: 0,
  lastEvent: '',
  error: ''
}

/**
 * Hot folder automation.
 *
 * Anything dropped into the watched directory is converted with the settings
 * that were active when watching started. The hard part is not noticing the
 * file, it is knowing when the file has finished being written: a large image
 * copied over a network share fires several change events while it is still
 * growing. The settle timer below waits for the size to stop moving before the
 * file is queued, which is the only reliable signal without a lock check.
 */
class FolderWatcher {
  private watcher: FSWatcher | null = null
  private config: WatchConfig | null = null
  private settings: ConversionSettings | null = null
  private status: WatchStatus = { ...IDLE }
  private readonly listeners = new Set<StatusListener>()
  private readonly pending = new Map<
    string,
    { size: number; timer: ReturnType<typeof setTimeout> }
  >()
  private readonly handled = new Set<string>()

  onStatus(listener: StatusListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getStatus(): WatchStatus {
    return { ...this.status }
  }

  private emit(patch: Partial<WatchStatus>): void {
    this.status = { ...this.status, ...patch }
    const snapshot = this.getStatus()
    for (const listener of this.listeners) {
      try {
        listener(snapshot)
      } catch {
        // A failing listener must not stop the watcher.
      }
    }
  }

  start(config: WatchConfig, settings: ConversionSettings): WatchStatus {
    this.stop()

    if (!config.folder) {
      this.emit({ error: 'no folder was selected to watch' })
      return this.getStatus()
    }

    this.config = config
    this.settings = settings
    this.handled.clear()

    try {
      this.watcher = watch(config.folder, { recursive: config.recursive }, (_event, fileName) => {
        if (typeof fileName !== 'string') return
        this.consider(join(config.folder, fileName))
      })

      this.watcher.on('error', (error) => {
        log.error('watcher failed', error)
        this.emit({ error: errorMessage(error), running: false })
      })

      this.status = {
        running: true,
        folder: config.folder,
        seen: 0,
        processed: 0,
        lastEvent: 'watching',
        error: ''
      }
      this.emit({})
      log.info(`watching ${config.folder}${config.recursive ? ' recursively' : ''}`)
    } catch (error) {
      this.emit({ running: false, error: errorMessage(error) })
    }

    return this.getStatus()
  }

  stop(): WatchStatus {
    for (const entry of this.pending.values()) clearTimeout(entry.timer)
    this.pending.clear()

    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
      log.info('stopped watching')
    }

    this.config = null
    this.settings = null
    this.emit({ running: false, lastEvent: 'stopped' })
    return this.getStatus()
  }

  /** Debounces one path until its size has been stable for the settle window. */
  private consider(path: string): void {
    const config = this.config
    if (!config) return
    if (this.handled.has(path)) return

    const ext = path.split('.').pop() ?? ''
    if (!isReadableExtension(ext)) return

    const existing = this.pending.get(path)
    if (existing) clearTimeout(existing.timer)

    const timer = setTimeout(() => {
      void this.settleCheck(path)
    }, config.settleMs)

    this.pending.set(path, { size: existing?.size ?? -1, timer })
    this.emit({ lastEvent: `saw ${basename(path)}` })
  }

  private async settleCheck(path: string): Promise<void> {
    const config = this.config
    if (!config) return

    let size: number
    try {
      const info = await stat(path)
      if (!info.isFile()) {
        this.pending.delete(path)
        return
      }
      size = info.size
    } catch {
      this.pending.delete(path)
      return
    }

    const entry = this.pending.get(path)
    if (entry && entry.size !== size) {
      // Still growing, so give it another settle window.
      entry.size = size
      entry.timer = setTimeout(() => {
        void this.settleCheck(path)
      }, config.settleMs)
      return
    }

    this.pending.delete(path)
    this.handled.add(path)
    await this.process(path)
  }

  private async process(path: string): Promise<void> {
    const config = this.config
    const settings = this.settings
    if (!config || !settings) return

    if (scheduler.isRunning) {
      // Requeue rather than dropping: the run in progress owns the pool, and a
      // second concurrent run would fight it for workers.
      setTimeout(() => {
        this.handled.delete(path)
        this.consider(path)
      }, 2000)
      return
    }

    try {
      const added = await addPaths([path], { recursive: false, minBytes: 1 })
      const file = added.files[0]
      if (!file) return

      this.emit({ seen: this.status.seen + 1, lastEvent: `converting ${file.name}` })

      await scheduler.start({
        fileIds: [file.id],
        settings,
        presetName: 'watch folder'
      })

      this.emit({ processed: this.status.processed + 1, lastEvent: `converted ${file.name}` })
      await this.disposeSource(path, config)
    } catch (error) {
      this.emit({ error: errorMessage(error), lastEvent: `failed on ${basename(path)}` })
    }
  }

  /** Moves or deletes the source once it has been converted, if asked to. */
  private async disposeSource(path: string, config: WatchConfig): Promise<void> {
    try {
      if (config.moveProcessedTo) {
        await rename(path, join(config.moveProcessedTo, basename(path)))
      } else if (config.deleteAfterProcess) {
        await unlink(path)
      }
    } catch (error) {
      log.warn(`could not dispose of ${path}: ${errorMessage(error)}`)
    }
  }
}

export const folderWatcher = new FolderWatcher()
