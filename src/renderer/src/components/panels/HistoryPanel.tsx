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
  Typography,
  theme
} from 'antd'
import {
  ClockCircleOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  PictureOutlined,
  ReloadOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { formatCapabilities } from '@shared/formats'
import { percentOf } from '@shared/utils'
import type { HistoryEntry, OutputTarget, RunSummary } from '@shared/types'
import { Glyph } from '../Glyph'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useFormatBytes, useLocale, useT, type Translate, type TranslationKey } from '../../i18n'

const { Text } = Typography

interface HistoryPanelProps {
  open: boolean
  onClose: () => void
}

const OPEN_LABEL_KEY: Record<OutputTarget, TranslationKey> = {
  folder: 'history.open.folder',
  zip: 'history.open.zip',
  'in-place': 'history.open.inPlace'
}

/**
 * Durations with translated unit suffixes.
 *
 * The shared helper hard codes the English letters, which is fine for a log line
 * but not for a label the user reads, so the panel assembles its own from the
 * `time.*` templates and the locale's own digits.
 */
function durationLabel(ms: number, t: Translate, n: (value: number) => string): string {
  if (!Number.isFinite(ms) || ms < 0) return t('time.seconds', { seconds: n(0) })
  if (ms < 1000) return t('time.milliseconds', { ms: n(Math.round(ms)) })

  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return t('time.hoursMinutes', { hours: n(hours), minutes: n(minutes) })
  if (minutes > 0) return t('time.minutesSeconds', { minutes: n(minutes), seconds: n(seconds) })
  return t('time.seconds', { seconds: n(seconds) })
}

function formatLabel(summary: RunSummary, t: Translate): string {
  return formatCapabilities(summary.format)?.label ?? t('history.formatOriginal')
}

/**
 * Newest first regardless of the order the file happens to be in, so a hand
 * edited or migrated history never reads backwards.
 */
async function loadHistory(): Promise<HistoryEntry[]> {
  const stored = await window.bico.history.list()
  return [...stored].sort((a, b) => b.summary.finishedAt - a.summary.finishedAt)
}

/**
 * The run log.
 *
 * History is written by the main process and read here on demand rather than
 * mirrored into the store, because it is only ever looked at deliberately and
 * keeping fifty run summaries resident would cost more than the fetch does.
 */
export function HistoryPanel(props: HistoryPanelProps): React.JSX.Element {
  const { open, onClose } = props
  const { message, modal } = AntApp.useApp()
  const { token } = theme.useToken()
  const { width } = useBreakpoint()
  const t = useT()
  const { n, d, direction } = useLocale()
  const bytes = useFormatBytes()

  // Null means the list has never been read, which is what the skeleton keys
  // off. An empty array is a real answer and gets the empty state instead.
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    void loadHistory()
      .then((next) => {
        if (!cancelled) setEntries(next)
      })
      .catch(() => {
        if (!cancelled) setEntries([])
      })

    return () => {
      cancelled = true
    }
  }, [open])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    void loadHistory()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setRefreshing(false))
  }, [])

  const handleClear = useCallback(() => {
    void window.bico.history
      .clear()
      .then(() => {
        setEntries([])
        message.success(t('history.toast.cleared'))
      })
      .catch(() => message.error(t('history.toast.clearFailed')))
  }, [message, t])

  const handleOpen = useCallback(
    (target: string) => {
      if (!target) {
        void message.info(t('history.toast.noLocation'))
        return
      }
      void window.bico.system.openPath(target)
    },
    [message, t]
  )

  const showErrors = useCallback(
    (summary: RunSummary) => {
      modal.info({
        title:
          summary.errors.length === 1
            ? t('history.errors.titleOne')
            : t('history.errors.titleMany', { count: n(summary.errors.length) }),
        width: 520,
        content: (
          <div className="bico-scroll-y bico-selectable" style={{ maxHeight: 320, marginTop: 8 }}>
            {summary.errors.map((error) => (
              <div key={`${error.fileId}-${error.message}`} style={{ marginBottom: 8 }}>
                <div className="bico-truncate">{error.fileName}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {error.message}
                </Text>
              </div>
            ))}
          </div>
        )
      })
    },
    [modal, n, t]
  )

  const totals = useMemo(() => {
    return (entries ?? []).reduce(
      (accumulated, entry) => ({
        runs: accumulated.runs + 1,
        images: accumulated.images + entry.summary.processed,
        saved: accumulated.saved + entry.summary.savedBytes
      }),
      { runs: 0, images: 0, saved: 0 }
    )
  }, [entries])

  const isEmpty = entries === null || entries.length === 0

  const body =
    entries === null ? (
      <Skeleton active paragraph={{ rows: 6 }} />
    ) : entries.length === 0 ? (
      <Empty description={<span>{t('history.empty')}</span>} />
    ) : (
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <div className="bico-stats">
          <div className="bico-stat">
            <Glyph size="lg" tone="violet" icon={<HistoryOutlined />} />
            <div className="bico-stat-body">
              <div className="bico-stat-value">{n(totals.runs)}</div>
              <div className="bico-stat-label">{t('history.summary.runs')}</div>
            </div>
          </div>
          <div className="bico-stat">
            <Glyph size="lg" tone="cyan" icon={<PictureOutlined />} />
            <div className="bico-stat-body">
              <div className="bico-stat-value">{n(totals.images)}</div>
              <div className="bico-stat-label">{t('history.summary.images')}</div>
            </div>
          </div>
          <div className="bico-stat">
            <Glyph size="lg" tone="green" icon={<DatabaseOutlined />} />
            <div className="bico-stat-body">
              <div className="bico-stat-value">{bytes(totals.saved)}</div>
              <div className="bico-stat-label">{t('history.summary.saved')}</div>
            </div>
          </div>
        </div>

        {entries.map((entry) => {
          const summary = entry.summary
          const backendTotal = summary.gpuCount + summary.cpuCount
          const gpuShare = percentOf(summary.gpuCount, backendTotal)
          const finishedAt =
            Number.isFinite(summary.finishedAt) && summary.finishedAt > 0
              ? d(summary.finishedAt, { dateStyle: 'medium', timeStyle: 'short' })
              : t('history.finishTimeUnknown')

          return (
            <Card
              key={entry.id}
              size="small"
              variant="outlined"
              className="bico-fade-in"
              title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Glyph bare size="sm" tone="slate" icon={<ClockCircleOutlined />} />
                  <span className="bico-truncate">{finishedAt}</span>
                </span>
              }
              extra={<Tag style={{ marginInlineEnd: 0 }}>{formatLabel(summary, t)}</Tag>}
            >
              <div style={{ marginBottom: 8, minWidth: 0 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('history.preset', {
                    name: summary.presetName || t('history.presetCustom')
                  })}
                </Text>
              </div>

              <Space size={[6, 6]} wrap style={{ marginBottom: 10 }}>
                <Tag color="success" style={{ marginInlineEnd: 0 }}>
                  {t('history.tag.processed', { count: n(summary.processed) })}
                </Tag>
                {summary.failed > 0 ? (
                  <Tag color="error" style={{ marginInlineEnd: 0 }}>
                    {t('history.tag.failed', { count: n(summary.failed) })}
                  </Tag>
                ) : null}
                {summary.skipped > 0 ? (
                  <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                    {t('history.tag.skipped', { count: n(summary.skipped) })}
                  </Tag>
                ) : null}
                <Tag style={{ marginInlineEnd: 0 }}>{durationLabel(summary.durationMs, t, n)}</Tag>
                {summary.cancelled ? (
                  <Tag color="orange" icon={<WarningOutlined />} style={{ marginInlineEnd: 0 }}>
                    {t('history.tag.stoppedEarly')}
                  </Tag>
                ) : null}
              </Space>

              <dl className="bico-kv" style={{ marginBottom: 10 }}>
                <dt>{t('history.field.saved')}</dt>
                <dd>
                  <Text
                    strong
                    style={{
                      color: summary.savedBytes > 0 ? token.colorSuccess : token.colorWarning
                    }}
                  >
                    {bytes(summary.savedBytes)}
                  </Text>{' '}
                  <Text type="secondary">
                    {t('history.savedPercent', {
                      percent: n(summary.savedPercent, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1
                      })
                    })}
                  </Text>
                </dd>
                <dt>{t('history.field.size')}</dt>
                <dd>
                  {t('history.sizeChange', {
                    before: bytes(summary.bytesIn),
                    after: bytes(summary.bytesOut)
                  })}
                </dd>
                <dt>{t('history.field.location')}</dt>
                <dd className="bico-mono bico-selectable" style={{ fontSize: 12 }}>
                  {/* A path can open on a separator, which is neutral, so it is
                      isolated rather than reordered by an Arabic paragraph. */}
                  {summary.outputLocation ? (
                    <bdi dir="ltr">{summary.outputLocation}</bdi>
                  ) : (
                    t('history.notRecorded')
                  )}
                </dd>
              </dl>

              <div style={{ marginBottom: 10 }}>
                {/*
                  The legend has to be painted from the same variables as the
                  bar below it. Ant's preset hues are seed constants, so a purple
                  and blue chip would disagree with the lane colours in five of
                  the eight themes, and a legend that does not match the thing it
                  labels is worse than none.
                */}
                <Space size={[6, 6]} wrap style={{ marginBottom: 4 }}>
                  <Tag
                    style={{
                      marginInlineEnd: 0,
                      color: 'var(--bico-gpu)',
                      background: 'color-mix(in srgb, var(--bico-gpu) 16%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--bico-gpu) 32%, transparent)'
                    }}
                  >
                    {t('history.tag.onGpu', { count: n(summary.gpuCount) })}
                  </Tag>
                  <Tag
                    style={{
                      marginInlineEnd: 0,
                      color: 'var(--bico-cpu)',
                      background: 'color-mix(in srgb, var(--bico-cpu) 16%, transparent)',
                      borderColor: 'color-mix(in srgb, var(--bico-cpu) 32%, transparent)'
                    }}
                  >
                    {t('history.tag.onCpu', { count: n(summary.cpuCount) })}
                  </Tag>
                </Space>
                {backendTotal > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      height: 6,
                      borderRadius: 3,
                      overflow: 'hidden',
                      background: token.colorFillQuaternary
                    }}
                  >
                    {/* The palette publishes a lane colour per theme. Ant's
                        preset hues are seed constants and would paint the same
                        two colours in all eight of them. */}
                    <div style={{ width: `${gpuShare}%`, background: 'var(--bico-gpu)' }} />
                    <div style={{ width: `${100 - gpuShare}%`, background: 'var(--bico-cpu)' }} />
                  </div>
                ) : null}
              </div>

              <Space size={8} wrap>
                <Button
                  size="small"
                  icon={<Glyph bare size="sm" tone="amber" icon={<FolderOpenOutlined />} />}
                  onClick={() => handleOpen(summary.outputLocation)}
                >
                  {t(OPEN_LABEL_KEY[summary.outputTarget])}
                </Button>
                {summary.reportPath ? (
                  <Button
                    size="small"
                    icon={<Glyph bare size="sm" tone="teal" icon={<FileTextOutlined />} />}
                    onClick={() => handleOpen(summary.reportPath ?? '')}
                  >
                    {t('history.open.report')}
                  </Button>
                ) : null}
                {summary.errors.length > 0 ? (
                  <Button size="small" danger type="text" onClick={() => showErrors(summary)}>
                    {t('history.action.seeFailures')}
                  </Button>
                ) : null}
              </Space>
            </Card>
          )
        })}
      </Space>
    )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      // The panel belongs on the inline end of the window, which is the left
      // edge once the interface is flipped for a right to left language.
      placement={direction === 'rtl' ? 'left' : 'right'}
      size={Math.min(560, Math.max(320, width - 48))}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Glyph size="sm" tone="violet" icon={<HistoryOutlined />} />
          <span className="bico-truncate">{t('history.title')}</span>
        </span>
      }
      extra={
        <Space size={8}>
          <Button
            size="small"
            icon={<Glyph bare size="sm" tone="cyan" icon={<ReloadOutlined />} />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            {t('history.action.refresh')}
          </Button>
          <Popconfirm
            title={t('history.clear.confirmTitle')}
            description={t('history.clear.confirmBody')}
            okText={t('history.clear.confirmOk')}
            okButtonProps={{ danger: true }}
            cancelText={t('history.clear.confirmCancel')}
            onConfirm={handleClear}
            disabled={isEmpty}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={isEmpty}>
              {t('action.clear')}
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      {open ? body : null}
    </Drawer>
  )
}
