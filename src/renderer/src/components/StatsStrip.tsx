// One non component export, and it is the duration formatter the run summary
// shares with this strip. Duplicating it would let two screens disagree about
// how long the same run took.
/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DatabaseOutlined,
  FileImageOutlined,
  HddOutlined,
  SwapOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { formatCapabilities } from '@shared/formats'
import { savingsPercent } from '@shared/utils'
import { useAppStore } from '../store/useAppStore'
import { formatCopyKey, useFormatBytes, useLocale, useT } from '../i18n'
import { Glyph } from './Glyph'
import type { GlyphTone } from './Glyph'

/** Long enough that dragging the quality slider never queues a round trip. */
const ESTIMATE_DEBOUNCE_MS = 400

/**
 * A duration in the active language.
 *
 * The shared formatter hard codes `h`, `m` and `s`, which are English
 * abbreviations written in Latin digits. This one reads its units out of the
 * dictionary and its digits out of the locale.
 */
export function useRunDuration(): (ms: number) => string {
  const t = useT()
  const { n } = useLocale()

  return useCallback(
    (ms: number) => {
      if (!Number.isFinite(ms) || ms < 0) return t('time.seconds', { seconds: n(0) })
      if (ms < 1000) return t('time.milliseconds', { ms: n(Math.round(ms)) })

      const totalSeconds = Math.floor(ms / 1000)
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60

      if (hours > 0) return t('time.hoursMinutes', { hours: n(hours), minutes: n(minutes) })
      if (minutes > 0) {
        return t('time.minutesSeconds', { minutes: n(minutes), seconds: n(seconds) })
      }
      return t('time.seconds', { seconds: n(seconds) })
    },
    [n, t]
  )
}

export interface StatCardProps {
  icon: React.ReactNode
  /** Picks the glyph colour. Each tile takes a different one so the row scans. */
  tone: GlyphTone
  value: React.ReactNode
  label: string
  /** Native tooltip for values the card has to truncate. */
  hint?: string
}

export function StatCard(props: StatCardProps): React.JSX.Element {
  return (
    <div className="bico-stat" title={props.hint}>
      <Glyph icon={props.icon} tone={props.tone} size="lg" />
      <div className="bico-stat-body">
        <div className="bico-stat-value">{props.value}</div>
        <div className="bico-stat-label">{props.label}</div>
      </div>
    </div>
  )
}

/**
 * The four numbers that answer "what is about to happen" at a glance.
 *
 * The output estimate is the only value here that costs anything to produce, so
 * it is debounced and the previous answer stays on screen until a new one
 * arrives. Blanking the card on every keystroke would make the strip flicker
 * through zero while the user is still choosing a quality.
 */
export function StatsStrip(): React.JSX.Element {
  const t = useT()
  const { n } = useLocale()
  const formatBytes = useFormatBytes()
  const runDuration = useRunDuration()

  const items = useAppStore((state) => state.items)
  const settings = useAppStore((state) => state.settings)
  const progress = useAppStore((state) => state.progress)

  const fileIds = useMemo(() => items.map((item) => item.file.id), [items])
  const sourceBytes = useMemo(
    () => items.reduce((total, item) => total + item.file.size, 0),
    [items]
  )

  const [estimate, setEstimate] = useState(0)
  const ticket = useRef(0)

  useEffect(() => {
    // Nothing to price, and nothing is on screen either, so the previous value
    // is left alone rather than cleared. That is what keeps the card from
    // flashing through zero on the way to the next answer.
    if (fileIds.length === 0) return

    // A ticket rather than a boolean, because a slow estimate for a large queue
    // can still be in flight when a faster one for the same queue resolves.
    const current = ticket.current + 1
    ticket.current = current

    const timer = setTimeout(() => {
      window.bico.convert
        .estimate(fileIds, settings)
        .then((bytes) => {
          if (ticket.current === current) setEstimate(bytes)
        })
        .catch(() => undefined)
    }, ESTIMATE_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [fileIds, settings])

  if (items.length === 0) return <></>

  const running =
    progress !== null &&
    (progress.state === 'running' || progress.state === 'paused' || progress.state === 'finishing')

  const capabilities = formatCapabilities(settings.format)
  const saved = savingsPercent(sourceBytes, estimate)
  const savedTone = saved >= 0 ? 'var(--bico-success)' : 'var(--bico-danger)'
  const savedPercent = n(Math.abs(Math.round(saved)))

  return (
    <div className="bico-stats bico-fade-in">
      <StatCard
        icon={<FileImageOutlined />}
        tone="accent"
        value={n(items.length)}
        label={t(items.length === 1 ? 'stats.queued.one' : 'stats.queued.many')}
      />

      <StatCard
        icon={<DatabaseOutlined />}
        tone="cyan"
        value={formatBytes(sourceBytes)}
        label={t('stats.sourceSize')}
      />

      <StatCard
        icon={<SwapOutlined />}
        tone="violet"
        value={capabilities ? capabilities.label : t('stats.targetFormat.original')}
        label={
          capabilities
            ? t(formatCopyKey(capabilities.id, 'tagline'))
            : t('stats.targetFormat.originalTagline')
        }
        hint={
          capabilities
            ? t(formatCopyKey(capabilities.id, 'description'))
            : t('stats.targetFormat.originalHint')
        }
      />

      {running ? (
        <StatCard
          icon={<ThunderboltOutlined />}
          tone="amber"
          value={t('stats.throughput.value', {
            rate: n(progress.throughputMbps, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            })
          })}
          label={t('stats.throughput.label', { duration: runDuration(progress.etaMs) })}
        />
      ) : (
        <StatCard
          icon={<HddOutlined />}
          tone="green"
          value={
            estimate > 0 ? (
              <>
                {formatBytes(estimate)}{' '}
                <span style={{ color: savedTone, fontSize: 13, fontWeight: 550 }}>
                  {t(saved >= 0 ? 'stats.estimate.smaller' : 'stats.estimate.larger', {
                    percent: savedPercent
                  })}
                </span>
              </>
            ) : (
              t('stats.estimate.pending')
            )
          }
          label={t('stats.estimate.label')}
        />
      )}
    </div>
  )
}
