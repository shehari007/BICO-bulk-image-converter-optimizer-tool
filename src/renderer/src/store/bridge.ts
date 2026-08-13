import { QUEUE_THUMBNAIL_SIZE, useAppStore } from './useAppStore'
import type { LogRecord } from '@shared/types'

/** Ring buffer of recent log lines for the diagnostics panel. */
const LOG_LIMIT = 400
const logBuffer: LogRecord[] = []
const logSubscribers = new Set<(records: readonly LogRecord[]) => void>()

export function recentLogs(): readonly LogRecord[] {
  return logBuffer
}

export function subscribeLogs(listener: (records: readonly LogRecord[]) => void): () => void {
  logSubscribers.add(listener)
  return () => logSubscribers.delete(listener)
}

/**
 * Thumbnails are fetched a few at a time.
 *
 * Importing ten thousand files and firing ten thousand concurrent IPC calls
 * would saturate the channel and stall every other message, including the run
 * progress the user is actually watching. A small semaphore keeps the queue
 * filling in visible order without ever monopolising the bridge.
 */
class ThumbnailLoader {
  private readonly pending: string[] = []
  private readonly seen = new Set<string>()
  private active = 0
  private readonly limit = 4

  enqueue(fileId: string): void {
    if (this.seen.has(fileId)) return
    this.seen.add(fileId)
    this.pending.push(fileId)
    this.pump()
  }

  reset(): void {
    this.pending.length = 0
    this.seen.clear()
  }

  private pump(): void {
    while (this.active < this.limit && this.pending.length > 0) {
      const fileId = this.pending.shift()
      if (!fileId) return
      this.active += 1

      void Promise.all([
        window.bico.files.thumbnail(fileId, QUEUE_THUMBNAIL_SIZE),
        window.bico.files.probe(fileId)
      ])
        .then(([thumbnail, probe]) => {
          const store = useAppStore.getState()
          store.setThumbnail(fileId, thumbnail?.dataUrl ?? null)
          store.setProbe(fileId, probe)
        })
        .catch(() => {
          // A file that cannot be read still belongs in the queue, it just
          // shows the placeholder icon and fails loudly when the run reaches it.
          useAppStore.getState().setThumbnail(fileId, null)
        })
        .finally(() => {
          this.active -= 1
          this.pump()
        })
    }
  }
}

export const thumbnailLoader = new ThumbnailLoader()

/**
 * Connects the main process event stream to the store.
 *
 * Called once from the app root. Returns a disposer so React strict mode's
 * double mount in development does not leave a duplicate set of listeners
 * behind, which would double count every progress update.
 */
export function connectBridge(): () => void {
  const store = useAppStore.getState()

  const disposers = [
    window.bico.on.jobUpdate((update) => {
      useAppStore.getState().applyJobUpdate(update)
    }),

    window.bico.on.runProgress((progress) => {
      useAppStore.getState().setProgress(progress)
    }),

    window.bico.on.runComplete((summary) => {
      const state = useAppStore.getState()
      state.setSummary(summary)
      state.setPanel('summary')

      if (state.prefs.openOutputWhenDone && summary.outputLocation) {
        void window.bico.system.openPath(summary.outputLocation)
      }
    }),

    window.bico.on.log((record) => {
      logBuffer.push(record)
      if (logBuffer.length > LOG_LIMIT) logBuffer.splice(0, logBuffer.length - LOG_LIMIT)
      for (const listener of logSubscribers) listener(logBuffer)
    }),

    window.bico.on.watchStatus((status) => {
      useAppStore.getState().setWatchStatus(status)
    }),

    window.bico.on.openFiles((paths) => {
      void importPaths(paths)
    })
  ]

  // Preferences and presets are read once at startup. Both are small and the
  // main process is the source of truth for them.
  void window.bico.prefs.load().then((prefs) => useAppStore.getState().setPrefs(prefs))
  void window.bico.presets.list().then((presets) => useAppStore.getState().setPresets(presets))
  void window.bico.system.info().then((info) => useAppStore.getState().setSystem(info))

  store.setSidebarOpen(window.innerWidth >= 1024)
  window.bico.ready()

  return () => {
    for (const dispose of disposers) dispose()
  }
}

/** Shared entry point for every way files enter the queue. */
export async function importPaths(paths: readonly string[]): Promise<number> {
  if (paths.length === 0) return 0

  const result = await window.bico.files.add([...paths], { recursive: true, minBytes: 64 })
  const store = useAppStore.getState()
  store.addFiles(result.files)

  for (const file of result.files) thumbnailLoader.enqueue(file.id)

  return result.files.length
}

/** Persists a preference change to disk and to the store in one step. */
export function savePrefs(patch: Parameters<typeof window.bico.prefs.save>[0]): void {
  useAppStore.getState().patchPrefs(patch)
  void window.bico.prefs.save(patch)
}
