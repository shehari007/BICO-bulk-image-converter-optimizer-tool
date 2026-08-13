import { HISTORY_LIMIT } from '@shared/defaults'
import { uid } from '@shared/utils'
import { JsonStore } from './store'
import type { HistoryEntry, RunSummary } from '@shared/types'

interface HistoryFile {
  entries: HistoryEntry[]
}

const store = new JsonStore<HistoryFile>('history.json', { entries: [] })

/**
 * Keeps a rolling window of completed runs.
 *
 * Only the summary is retained, never the file list. A run over fifty thousand
 * images would otherwise grow the history file without bound, and the per file
 * detail is already available in the optional CSV report.
 */
export function recordRun(summary: RunSummary): HistoryEntry[] {
  const current = store.read()
  const entry: HistoryEntry = { id: uid('h'), summary }
  const entries = [entry, ...current.entries].slice(0, HISTORY_LIMIT)
  store.write({ entries })
  return entries
}

export function listHistory(): HistoryEntry[] {
  return store.read().entries
}

export function clearHistory(): void {
  store.write({ entries: [] })
  store.flush()
}
