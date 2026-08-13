import { DAILY_RETENTION_DAYS, EMPTY_STATS, dayKey, type LifetimeStats } from '@shared/stats'
import { JsonStore } from './store'
import type { RunSummary } from '@shared/types'

const store = new JsonStore<LifetimeStats>('stats.json', EMPTY_STATS)

/**
 * Folds a finished run into the lifetime totals.
 *
 * Only completed images count towards the byte figures. Counting a failure as
 * zero bytes out would report it as a hundred percent saving, which is exactly
 * the kind of flattering nonsense this panel exists to avoid.
 */
export function recordStats(summary: RunSummary): LifetimeStats {
  const current = store.read()
  const key = dayKey(summary.finishedAt)
  const bucket = current.daily[key] ?? { images: 0, bytesIn: 0, bytesOut: 0 }

  const savedBytes = summary.savedBytes
  const previousBest = current.best

  const next: LifetimeStats = {
    version: 1,
    since: current.since === 0 ? summary.startedAt : current.since,
    runs: current.runs + 1,
    imagesConverted: current.imagesConverted + summary.processed,
    imagesFailed: current.imagesFailed + summary.failed,
    imagesSkipped: current.imagesSkipped + summary.skipped,
    bytesIn: current.bytesIn + summary.bytesIn,
    bytesOut: current.bytesOut + summary.bytesOut,
    durationMs: current.durationMs + summary.durationMs,
    byBackend: {
      cpu: current.byBackend.cpu + summary.cpuCount,
      gpu: current.byBackend.gpu + summary.gpuCount
    },
    byFormat: {
      ...current.byFormat,
      [summary.format]: (current.byFormat[summary.format] ?? 0) + summary.processed
    },
    savedByFormat: {
      ...current.savedByFormat,
      [summary.format]: (current.savedByFormat[summary.format] ?? 0) + savedBytes
    },
    daily: {
      ...current.daily,
      [key]: {
        images: bucket.images + summary.processed,
        bytesIn: bucket.bytesIn + summary.bytesIn,
        bytesOut: bucket.bytesOut + summary.bytesOut
      }
    },
    best:
      savedBytes > (previousBest?.savedBytes ?? 0)
        ? {
            at: summary.finishedAt,
            images: summary.processed,
            savedBytes,
            savedPercent: summary.savedPercent,
            format: summary.format
          }
        : previousBest
  }

  store.write(prune(next))
  store.flush()
  return store.read()
}

/**
 * Drops day buckets past the retention window.
 *
 * The totals above already include them, so nothing is lost from the headline
 * numbers. Only the activity chart forgets, which keeps the file bounded no
 * matter how long the app has been in use.
 */
function prune(stats: LifetimeStats): LifetimeStats {
  const keys = Object.keys(stats.daily)
  if (keys.length <= DAILY_RETENTION_DAYS) return stats

  const kept = keys.sort().slice(-DAILY_RETENTION_DAYS)
  const daily: LifetimeStats['daily'] = {}
  for (const key of kept) {
    const bucket = stats.daily[key]
    if (bucket) daily[key] = bucket
  }
  return { ...stats, daily }
}

export function readStats(): LifetimeStats {
  return store.read()
}

export function resetStats(): LifetimeStats {
  store.write(structuredClone(EMPTY_STATS))
  store.flush()
  return store.read()
}
