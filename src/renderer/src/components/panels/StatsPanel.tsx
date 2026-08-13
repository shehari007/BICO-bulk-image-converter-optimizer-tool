import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  App as AntApp,
  Button,
  Card,
  Drawer,
  Empty,
  Popconfirm,
  Skeleton,
  Space,
  Tag,
  Typography
} from 'antd'
import {
  BarChartOutlined,
  CalculatorOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  FileImageOutlined,
  HddOutlined,
  LineChartOutlined,
  ReloadOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { formatCapabilities, OUTPUT_FORMAT_IDS } from '@shared/formats'
import { DAILY_RETENTION_DAYS, dayKey, deriveStats, EMPTY_STATS } from '@shared/stats'
import type { LifetimeStats } from '@shared/stats'
import type { OutputFormat } from '@shared/types'
import { useFormatBytes, useLocale, useT, type Translate } from '../../i18n'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { Glyph, type GlyphTone } from '../Glyph'
import { BarRow } from '../charts/BarRow'
import { Donut, type DonutSegment } from '../charts/Donut'
import { Sparkline } from '../charts/Sparkline'

const { Text, Title } = Typography

const DAY_MS = 86400000

/** Every container that can appear in the breakdown, in a stable order. */
const ALL_OUTPUT_FORMATS: OutputFormat[] = [...OUTPUT_FORMAT_IDS, 'original']

type NumberFormatter = (value: number, options?: Intl.NumberFormatOptions) => string

interface DayPoint {
  key: string
  at: number
  images: number
}

interface FormatRow {
  format: OutputFormat
  images: number
  saved: number
}

/**
 * A duration in the active locale.
 *
 * The shared formatter builds its string from raw template literals, which is
 * fine in a log line and wrong in the interface: Arabic renders its own digits,
 * and the unit order belongs to the translator rather than to this file.
 */
function durationLabel(ms: number, t: Translate, n: NumberFormatter): string {
  if (!Number.isFinite(ms) || ms <= 0) return t('time.seconds', { seconds: n(0) })
  if (ms < 1000) return t('time.milliseconds', { ms: n(Math.round(ms)) })

  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return t('time.hoursMinutes', { hours: n(hours), minutes: n(minutes) })
  if (minutes > 0) return t('time.minutesSeconds', { minutes: n(minutes), seconds: n(seconds) })
  return t('time.seconds', { seconds: n(seconds) })
}

/** Percentages go through Intl so the digits and the symbol both localise. */
function percentLabel(percent: number, n: NumberFormatter): string {
  const safe = Number.isFinite(percent) ? percent : 0
  return n(safe / 100, { style: 'percent', maximumFractionDigits: 1 })
}

/**
 * One entry per day across the whole retention window, quiet days included.
 *
 * Anchoring at midday rather than midnight keeps a daylight saving jump from
 * pushing a bucket into the neighbouring day, which would silently shift the
 * entire chart by one column twice a year.
 */
function buildDays(stats: LifetimeStats): DayPoint[] {
  const anchor = new Date()
  anchor.setHours(12, 0, 0, 0)

  const days: DayPoint[] = []
  for (let offset = DAILY_RETENTION_DAYS - 1; offset >= 0; offset -= 1) {
    const at = anchor.getTime() - offset * DAY_MS
    const key = dayKey(at)
    days.push({ key, at, images: stats.daily[key]?.images ?? 0 })
  }
  return days
}

function buildFormats(stats: LifetimeStats): FormatRow[] {
  const rows: FormatRow[] = []
  for (const format of ALL_OUTPUT_FORMATS) {
    const images = stats.byFormat[format] ?? 0
    if (images <= 0) continue
    rows.push({ format, images, saved: stats.savedByFormat[format] ?? 0 })
  }
  return rows.sort((a, b) => b.images - a.images)
}

/* ================================================================== */
/* Building blocks                                                     */
/* ================================================================== */

export interface HeadlineTileProps {
  icon: React.ReactNode
  tone: GlyphTone
  value: string
  label: string
}

/** One of the four big figures. Deliberately large, because that is the point. */
export function HeadlineTile(props: HeadlineTileProps): React.JSX.Element {
  const { icon, tone, value, label } = props

  return (
    <div
      style={{
        padding: '14px 16px',
        border: '1px solid var(--bico-border)',
        borderRadius: 14,
        background: 'var(--bico-surface-raised)',
        minWidth: 0
      }}
    >
      <Glyph icon={icon} tone={tone} size="sm" />
      <div
        className="bico-truncate"
        title={value}
        style={{
          // Scales with the window so a seven digit total still fits its tile
          // when the app is squeezed down to 720 pixels.
          fontSize: 'clamp(19px, 2.6vw, 26px)',
          fontWeight: 700,
          lineHeight: 1.15,
          marginBlockStart: 10,
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {value}
      </div>
      <div
        className="bico-truncate"
        style={{
          fontSize: 11,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--bico-text-muted)',
          marginBlockStart: 4
        }}
      >
        {label}
      </div>
    </div>
  )
}

export interface StatsSectionProps {
  icon: React.ReactNode
  tone: GlyphTone
  title: string
  hint?: string
  children: React.ReactNode
}

export function StatsSection(props: StatsSectionProps): React.JSX.Element {
  const { icon, tone, title, hint, children } = props

  return (
    <Card
      size="small"
      variant="outlined"
      title={
        <Space size={8} align="center">
          <Glyph icon={icon} tone={tone} size="sm" />
          <span>{title}</span>
        </Space>
      }
    >
      {hint ? (
        <Text
          type="secondary"
          style={{ fontSize: 12, display: 'block', marginBlockEnd: 14, lineHeight: 1.55 }}
        >
          {hint}
        </Text>
      ) : null}
      {children}
    </Card>
  )
}

/* ================================================================== */
/* Sections                                                            */
/* ================================================================== */

export interface StatsSliceProps {
  stats: LifetimeStats
}

export function HeadlineGrid(props: StatsSliceProps): React.JSX.Element {
  const { stats } = props
  const t = useT()
  const { n } = useLocale()
  const formatBytes = useFormatBytes()

  const savedBytes = stats.bytesIn - stats.bytesOut
  const grew = savedBytes < 0

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(146px, 1fr))',
        gap: 10
      }}
    >
      <HeadlineTile
        icon={<FileImageOutlined />}
        tone="accent"
        value={n(stats.imagesConverted)}
        label={
          stats.imagesConverted === 1 ? t('stats.headline.imagesOne') : t('stats.headline.images')
        }
      />
      <HeadlineTile
        icon={<HddOutlined />}
        tone="green"
        value={formatBytes(Math.abs(savedBytes))}
        label={grew ? t('stats.headline.added') : t('stats.headline.saved')}
      />
      <HeadlineTile
        icon={<ClockCircleOutlined />}
        tone="violet"
        value={durationLabel(stats.durationMs, t, n)}
        label={t('stats.headline.time')}
      />
      <HeadlineTile
        icon={<RocketOutlined />}
        tone="amber"
        value={n(stats.runs)}
        label={stats.runs === 1 ? t('stats.headline.runsOne') : t('stats.headline.runs')}
      />
    </div>
  )
}

export function ActivityCard(props: StatsSliceProps): React.JSX.Element {
  const { stats } = props
  const t = useT()
  const { n, d, direction } = useLocale()

  const days = useMemo(() => buildDays(stats), [stats])

  const peak = days.reduce<DayPoint | null>(
    (best, day) => (best === null || day.images > best.images ? day : best),
    null
  )
  const total = days.reduce((sum, day) => sum + day.images, 0)
  const first = days[0]
  const last = days[days.length - 1]

  const dayLabel = (at: number): string => d(at, { month: 'short', day: 'numeric' })

  const description =
    total > 0 && peak
      ? t('stats.activity.chart', {
          date: d(peak.at, { dateStyle: 'medium' }),
          images: n(peak.images),
          total: n(total)
        })
      : t('stats.activity.chartQuiet')

  return (
    <StatsSection
      icon={<LineChartOutlined />}
      tone="cyan"
      title={t('stats.activity.title')}
      hint={t('stats.activity.hint')}
    >
      <Sparkline
        values={days.map((day) => day.images)}
        description={description}
        rtl={direction === 'rtl'}
        height={68}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          marginBlockStart: 8,
          fontSize: 11,
          color: 'var(--bico-text-muted)'
        }}
      >
        <span>{first ? dayLabel(first.at) : ''}</span>
        <span>{last ? dayLabel(last.at) : ''}</span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBlockStart: 8,
          fontSize: 12
        }}
      >
        <span>
          {peak && peak.images > 0
            ? t(peak.images === 1 ? 'stats.activity.peakOne' : 'stats.activity.peak', {
                date: dayLabel(peak.at),
                images: n(peak.images)
              })
            : t('stats.activity.quiet')}
        </span>
        <Text type="secondary">
          {t('stats.activity.windowTotal', {
            images:
              total === 1
                ? t('stats.formats.imagesOne')
                : t('stats.formats.images', { images: n(total) })
          })}
        </Text>
      </div>
    </StatsSection>
  )
}

export function FormatsCard(props: StatsSliceProps): React.JSX.Element {
  const { stats } = props
  const t = useT()
  const { n, direction } = useLocale()
  const formatBytes = useFormatBytes()

  const rows = useMemo(() => buildFormats(stats), [stats])
  const largest = rows[0]?.images ?? 0

  return (
    <StatsSection
      icon={<BarChartOutlined />}
      tone="orange"
      title={t('stats.formats.title')}
      hint={t('stats.formats.hint')}
    >
      {rows.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('stats.formats.empty')}
        </Text>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row, index) => {
            const capabilities = formatCapabilities(row.format)
            const label = capabilities ? capabilities.label : t('stats.formats.original')
            const images =
              row.images === 1
                ? t('stats.formats.imagesOne')
                : t('stats.formats.images', { images: n(row.images) })
            const saved =
              row.saved < 0
                ? t('stats.formats.added', { bytes: formatBytes(Math.abs(row.saved)) })
                : t('stats.formats.saved', { bytes: formatBytes(row.saved) })

            return (
              <BarRow
                key={row.format}
                label={label}
                value={images}
                secondary={saved}
                ratio={largest > 0 ? row.images / largest : 0}
                description={t('stats.formats.bar', {
                  format: label,
                  images: n(row.images),
                  saved
                })}
                color="var(--bico-accent)"
                // One hue graded by rank, because every bar measures the same
                // quantity. Separate hues would imply a difference that is not
                // there, and the row label already names the container.
                intensity={Math.max(1 - index * 0.1, 0.42)}
                rtl={direction === 'rtl'}
              />
            )
          })}
        </div>
      )}
    </StatsSection>
  )
}

export function BackendCard(props: StatsSliceProps): React.JSX.Element {
  const { stats } = props
  const t = useT()
  const { n, direction } = useLocale()

  const gpu = stats.byBackend.gpu
  const cpu = stats.byBackend.cpu
  const total = gpu + cpu
  const gpuShare = total > 0 ? (gpu / total) * 100 : 0

  const segments: DonutSegment[] = [
    {
      id: 'gpu',
      label: t('backend.gpu'),
      value: gpu,
      color: 'var(--bico-gpu)',
      display: t('stats.backend.images', { images: n(gpu) }),
      share: percentLabel(gpuShare, n)
    },
    {
      id: 'cpu',
      label: t('backend.cpu'),
      value: cpu,
      color: 'var(--bico-cpu)',
      display: t('stats.backend.images', { images: n(cpu) }),
      share: percentLabel(total > 0 ? (cpu / total) * 100 : 0, n)
    }
  ]

  return (
    <StatsSection
      icon={<ThunderboltOutlined />}
      tone="violet"
      title={t('stats.backend.title')}
      hint={t('stats.backend.hint')}
    >
      {total === 0 ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('stats.backend.empty')}
        </Text>
      ) : (
        <Donut
          segments={segments}
          centreValue={percentLabel(gpuShare, n)}
          centreLabel={t('stats.backend.centre')}
          description={t('stats.backend.chart', {
            gpu: n(gpu),
            cpu: n(cpu),
            share: percentLabel(gpuShare, n)
          })}
          rtl={direction === 'rtl'}
        />
      )}
    </StatsSection>
  )
}

export function BestRunCard(props: StatsSliceProps): React.JSX.Element {
  const { stats } = props
  const t = useT()
  const { n, d } = useLocale()
  const formatBytes = useFormatBytes()

  const best = stats.best

  return (
    <StatsSection icon={<TrophyOutlined />} tone="amber" title={t('stats.best.title')}>
      {best === null ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('stats.best.none')}
        </Text>
      ) : (
        <div>
          <Title
            level={4}
            style={{ margin: 0, color: 'var(--bico-success)', fontVariantNumeric: 'tabular-nums' }}
          >
            {t('stats.best.saved', { bytes: formatBytes(best.savedBytes) })}
          </Title>
          <div style={{ marginBlockStart: 6, fontSize: 13 }}>
            {best.images === 1
              ? t('stats.best.detailOne', {
                  format: formatCapabilities(best.format)?.label ?? t('stats.formats.original'),
                  date: d(best.at, { dateStyle: 'medium' })
                })
              : t('stats.best.detail', {
                  images: n(best.images),
                  format: formatCapabilities(best.format)?.label ?? t('stats.formats.original'),
                  date: d(best.at, { dateStyle: 'medium' })
                })}
          </div>
          <Tag color="success" style={{ marginInlineEnd: 0, marginBlockStart: 10 }}>
            {t('stats.best.percent', { percent: percentLabel(best.savedPercent, n) })}
          </Tag>
        </div>
      )}
    </StatsSection>
  )
}

export function DerivedCard(props: StatsSliceProps): React.JSX.Element {
  const { stats } = props
  const t = useT()
  const { n } = useLocale()
  const formatBytes = useFormatBytes()

  const figures = deriveStats(stats)

  return (
    <StatsSection
      icon={<CalculatorOutlined />}
      tone="teal"
      title={t('stats.derived.title')}
      hint={t('stats.derived.hint')}
    >
      <dl className="bico-kv">
        <dt>{t('stats.derived.averageSaving')}</dt>
        <dd>{percentLabel(figures.averageSavedPercent, n)}</dd>

        <dt>{t('stats.derived.imagesPerRun')}</dt>
        <dd>{n(figures.imagesPerRun, { maximumFractionDigits: 1 })}</dd>

        <dt>{t('stats.derived.msPerImage')}</dt>
        <dd>{t('time.milliseconds', { ms: n(Math.round(figures.averageMsPerImage)) })}</dd>

        <dt>{t('stats.derived.gpuShare')}</dt>
        <dd>{percentLabel(figures.gpuShare, n)}</dd>

        <dt>{t('stats.derived.activeDays')}</dt>
        <dd>
          {figures.activeDays === 1
            ? t('stats.derived.activeDaysValueOne')
            : t('stats.derived.activeDaysValue', { days: n(figures.activeDays) })}
        </dd>

        <dt>{t('stats.derived.volume')}</dt>
        <dd>
          {t('stats.derived.volumeValue', {
            read: formatBytes(stats.bytesIn),
            written: formatBytes(stats.bytesOut)
          })}
        </dd>

        <dt>{t('stats.derived.failed')}</dt>
        <dd>{n(stats.imagesFailed)}</dd>

        <dt>{t('stats.derived.skipped')}</dt>
        <dd>{n(stats.imagesSkipped)}</dd>
      </dl>
    </StatsSection>
  )
}

/* ================================================================== */
/* The panel                                                           */
/* ================================================================== */

export interface StatsPanelProps {
  open: boolean
  onClose: () => void
}

/**
 * The lifetime counter, which the app never resets on its own.
 *
 * Read on demand rather than mirrored into the store: it changes once per run
 * and is only ever looked at deliberately, so keeping ninety daily buckets
 * resident for the whole session would cost more than the round trip does.
 */
export function StatsPanel(props: StatsPanelProps): React.JSX.Element {
  const { open, onClose } = props
  const { message } = AntApp.useApp()
  const { width } = useBreakpoint()
  const t = useT()
  const { d, direction } = useLocale()

  // Null means the file has never been read, which is what the skeleton keys
  // off. A zeroed record is a real answer and gets the empty state instead.
  const [stats, setStats] = useState<LifetimeStats | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    void window.bico.stats
      .read()
      .then((next) => {
        if (!cancelled) setStats(next)
      })
      .catch(() => {
        if (cancelled) return
        setStats(EMPTY_STATS)
        void message.error(t('stats.load.failed'))
      })

    return () => {
      cancelled = true
    }
  }, [open, message, t])

  const handleRefresh = useCallback(() => {
    setBusy(true)
    void window.bico.stats
      .read()
      .then(setStats)
      .catch(() => {
        void message.error(t('stats.load.failed'))
      })
      .finally(() => setBusy(false))
  }, [message, t])

  const handleReset = useCallback(() => {
    void window.bico.stats
      .reset()
      .then((next) => {
        setStats(next)
        void message.success(t('stats.reset.done'))
      })
      .catch(() => {
        void message.error(t('stats.reset.failed'))
      })
  }, [message, t])

  const nothingToReset = stats === null || stats.runs === 0

  const body =
    stats === null ? (
      <Skeleton active paragraph={{ rows: 8 }} />
    ) : stats.runs === 0 ? (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div style={{ maxWidth: 420, marginInline: 'auto' }}>
            <div style={{ fontWeight: 600, marginBlockEnd: 6 }}>{t('stats.empty.title')}</div>
            <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
              {t('stats.empty.description')}
            </Text>
          </div>
        }
      />
    ) : (
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {stats.since > 0
            ? t('stats.since', { date: d(stats.since, { dateStyle: 'long' }) })
            : t('stats.sinceUnknown')}
        </Text>

        <HeadlineGrid stats={stats} />
        <ActivityCard stats={stats} />
        <FormatsCard stats={stats} />
        <BackendCard stats={stats} />
        <BestRunCard stats={stats} />
        <DerivedCard stats={stats} />
      </Space>
    )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      // The panel belongs on the inline end of the window, which is the left
      // edge once the interface is flipped for a right to left language.
      placement={direction === 'rtl' ? 'left' : 'right'}
      title={t('stats.title')}
      width={Math.min(680, Math.max(320, width - 48))}
      extra={
        <Space size={8}>
          <Button size="small" icon={<ReloadOutlined />} onClick={handleRefresh} loading={busy}>
            {t('stats.action.refresh')}
          </Button>
          <Popconfirm
            title={t('stats.reset.title')}
            description={
              <div style={{ maxWidth: 280, lineHeight: 1.55 }}>{t('stats.reset.description')}</div>
            }
            okText={t('stats.reset.ok')}
            okButtonProps={{ danger: true }}
            cancelText={t('stats.reset.cancel')}
            onConfirm={handleReset}
            disabled={nothingToReset}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={nothingToReset}>
              {t('stats.action.reset')}
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      {open ? body : null}
    </Drawer>
  )
}
