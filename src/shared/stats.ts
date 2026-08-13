import type { BackendUsed, OutputFormat } from './types'

/**
 * Lifetime totals, kept across restarts.
 *
 * Separate from the run history, which holds the last fifty runs in full. This
 * is the running tally that never resets, so the numbers keep meaning something
 * after the history window has rolled over.
 */
export interface LifetimeStats {
  /** Schema version, so a future change can migrate rather than discard. */
  version: 1
  /** Unix milliseconds of the first recorded run. */
  since: number
  runs: number
  imagesConverted: number
  imagesFailed: number
  imagesSkipped: number
  bytesIn: number
  bytesOut: number
  /** Total time spent converting, in milliseconds. */
  durationMs: number
  /** Images completed on each backend. */
  byBackend: Record<BackendUsed, number>
  /** Images written, counted per output container. */
  byFormat: Partial<Record<OutputFormat, number>>
  /** Bytes saved per output container, so the panel can rank them honestly. */
  savedByFormat: Partial<Record<OutputFormat, number>>
  /** One bucket per day, keyed YYYY-MM-DD, for the activity chart. */
  daily: Record<string, DailyBucket>
  /** The single largest saving seen, for the highlight tile. */
  best: BestRun | null
}

export interface DailyBucket {
  images: number
  bytesIn: number
  bytesOut: number
}

export interface BestRun {
  at: number
  images: number
  savedBytes: number
  savedPercent: number
  format: OutputFormat
}

export const EMPTY_STATS: LifetimeStats = {
  version: 1,
  since: 0,
  runs: 0,
  imagesConverted: 0,
  imagesFailed: 0,
  imagesSkipped: 0,
  bytesIn: 0,
  bytesOut: 0,
  durationMs: 0,
  byBackend: { cpu: 0, gpu: 0 },
  byFormat: {},
  savedByFormat: {},
  daily: {},
  best: null
}

/** Days retained in the activity chart. Older buckets are folded into the totals. */
export const DAILY_RETENTION_DAYS = 90

/** Local calendar day key. Deliberately local, since the chart is about the user's day. */
export function dayKey(at: number): string {
  const date = new Date(at)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Derived figures the panel shows but the file does not store. */
export interface StatsDerived {
  savedBytes: number
  savedPercent: number
  averageSavedPercent: number
  imagesPerRun: number
  averageMsPerImage: number
  gpuShare: number
  activeDays: number
}

export function deriveStats(stats: LifetimeStats): StatsDerived {
  const savedBytes = stats.bytesIn - stats.bytesOut
  const totalBackend = stats.byBackend.cpu + stats.byBackend.gpu

  return {
    savedBytes,
    savedPercent: stats.bytesIn > 0 ? (savedBytes / stats.bytesIn) * 100 : 0,
    averageSavedPercent: stats.bytesIn > 0 ? (savedBytes / stats.bytesIn) * 100 : 0,
    imagesPerRun: stats.runs > 0 ? stats.imagesConverted / stats.runs : 0,
    averageMsPerImage: stats.imagesConverted > 0 ? stats.durationMs / stats.imagesConverted : 0,
    gpuShare: totalBackend > 0 ? (stats.byBackend.gpu / totalBackend) * 100 : 0,
    activeDays: Object.keys(stats.daily).length
  }
}
