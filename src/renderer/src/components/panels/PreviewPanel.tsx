import { Fragment, type ReactNode } from 'react'
import { Alert, Drawer, Empty, Skeleton, Space, Tag, Typography } from 'antd'
import {
  ClockCircleOutlined,
  FileImageOutlined,
  FileZipOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  SwapOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { formatCapabilities } from '@shared/formats'
import { savingsPercent } from '@shared/utils'
import type { OutputFormat } from '@shared/types'
import { CompareSlider } from '../CompareSlider'
import { Glyph, type GlyphTone } from '../Glyph'
import { useAppStore } from '../../store/useAppStore'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useLivePreview } from '../../hooks/useLivePreview'
import { useFormatBytes, useLocale, useT, type Translate, type TranslationKey } from '../../i18n'

const { Text, Title } = Typography

interface PreviewPanelProps {
  open: boolean
  onClose: () => void
}

/** Icon sizes Ant Design gives an alert with and without a description. */
const ALERT_ICON_SIZE = 24
const ALERT_ICON_SIZE_BARE = 16

interface DetailRow {
  labelKey: TranslationKey
  tone: GlyphTone
  icon: ReactNode
  value: ReactNode
  mono: boolean
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

function formatLabel(format: OutputFormat, t: Translate): string {
  return formatCapabilities(format)?.label ?? t('preview.formatOriginal')
}

/**
 * Live before and after view of the selected image.
 *
 * The render is driven entirely by `useLivePreview`, which is handed `open` as
 * its enabled flag. A closed drawer therefore costs nothing: no decode, no
 * encode and no traffic across the bridge while the user works elsewhere.
 */
export function PreviewPanel(props: PreviewPanelProps): React.JSX.Element {
  const { open, onClose } = props

  const { width } = useBreakpoint()
  const t = useT()
  const { n, direction } = useLocale()
  const bytes = useFormatBytes()

  const selectedId = useAppStore((state) => state.selectedId)
  const settings = useAppStore((state) => state.settings)
  const item = useAppStore(
    (state) => state.items.find((candidate) => candidate.file.id === state.selectedId) ?? null
  )

  const { result, loading, error } = useLivePreview(selectedId, settings, open)

  const drawerSize = Math.min(720, Math.max(320, width - 48))

  const savings = result ? savingsPercent(result.originalBytes, result.estimatedBytes) : 0
  const grew = savings < 0
  const savingsLabel = n(Math.abs(savings), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })

  const details: DetailRow[] = result
    ? [
        {
          labelKey: 'preview.field.originalSize',
          tone: 'slate',
          icon: <FileImageOutlined />,
          value: bytes(result.originalBytes),
          mono: true
        },
        {
          labelKey: 'preview.field.estimatedOutput',
          tone: 'green',
          icon: <FileZipOutlined />,
          value: bytes(result.estimatedBytes),
          mono: true
        },
        {
          labelKey: 'preview.field.change',
          tone: grew ? 'amber' : 'teal',
          icon: <SwapOutlined />,
          value: (
            <Tag color={grew ? 'warning' : 'success'} style={{ marginInlineEnd: 0 }}>
              {grew
                ? t('preview.change.larger', { percent: savingsLabel })
                : t('preview.change.smaller', { percent: savingsLabel })}
            </Tag>
          ),
          mono: false
        },
        {
          labelKey: 'preview.field.outputFormat',
          tone: 'violet',
          icon: <PictureOutlined />,
          value: formatLabel(result.format, t),
          mono: false
        },
        {
          labelKey: 'preview.field.render',
          tone: 'cyan',
          icon: <ClockCircleOutlined />,
          value: t('preview.renderDetail', {
            width: n(result.width),
            height: n(result.height),
            duration: durationLabel(result.durationMs, t, n)
          }),
          mono: true
        }
      ]
    : []

  return (
    <Drawer
      open={open}
      onClose={onClose}
      // The panel belongs on the inline end of the window, which is the left
      // edge once the interface is flipped for a right to left language.
      placement={direction === 'rtl' ? 'left' : 'right'}
      size={drawerSize}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Glyph size="sm" tone="accent" icon={<PictureOutlined />} />
          <span className="bico-truncate">{t('preview.title')}</span>
        </span>
      }
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 14 } }}
    >
      {!item && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('preview.empty')} />}

      {item && (
        <div style={{ minWidth: 0 }}>
          <Title level={5} className="bico-truncate" style={{ margin: 0 }} title={item.file.path}>
            {item.file.name}
          </Title>
          <Space size={8} wrap style={{ marginTop: 4 }}>
            <Text type="secondary">
              {item.probe
                ? t('preview.dimensions', {
                    width: n(item.probe.width),
                    height: n(item.probe.height)
                  })
                : t('preview.dimensionsPending')}
            </Text>
            <Text type="secondary">{bytes(item.file.size)}</Text>
            {item.probe?.hasAlpha && (
              <Tag style={{ marginInlineEnd: 0 }}>{t('preview.tag.alpha')}</Tag>
            )}
            {item.probe?.isAnimated && (
              <Tag style={{ marginInlineEnd: 0 }}>{t('preview.tag.animated')}</Tag>
            )}
          </Space>
        </div>
      )}

      {item && error && (
        <Alert
          type="error"
          showIcon
          icon={
            <Glyph
              bare
              tone="rose"
              icon={<WarningOutlined />}
              style={{ fontSize: ALERT_ICON_SIZE }}
            />
          }
          title={t('preview.error.title')}
          description={error}
        />
      )}

      {item && !error && loading && !result && (
        <div>
          <Skeleton.Node active style={{ width: '100%', height: 260 }}>
            <Glyph bare size="xl" tone="slate" icon={<PictureOutlined />} />
          </Skeleton.Node>
          <Skeleton active paragraph={{ rows: 3 }} title={false} style={{ marginTop: 16 }} />
        </div>
      )}

      {item && !error && result && (
        <>
          <CompareSlider
            before={result.originalDataUrl}
            after={result.dataUrl}
            alt={item.file.name}
          />

          {result.fallback && (
            <Alert
              type="warning"
              showIcon
              icon={
                <Glyph
                  bare
                  tone="amber"
                  icon={<WarningOutlined />}
                  style={{ fontSize: ALERT_ICON_SIZE }}
                />
              }
              style={{ marginTop: 12 }}
              title={t('preview.fallback.title', {
                shown: formatLabel(result.fallback.format, t),
                requested: formatLabel(result.format, t)
              })}
              description={t('preview.fallback.body', { reason: result.fallback.reason })}
            />
          )}

          <dl className="bico-kv">
            {details.map((row) => (
              <Fragment key={row.labelKey}>
                <dt style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Glyph bare size="sm" tone={row.tone} icon={row.icon} />
                  {t(row.labelKey)}
                </dt>
                <dd className={row.mono ? 'bico-mono' : undefined}>{row.value}</dd>
              </Fragment>
            ))}
          </dl>

          <Alert
            type="info"
            showIcon
            icon={
              <Glyph
                bare
                tone="cyan"
                icon={<InfoCircleOutlined />}
                style={{ fontSize: ALERT_ICON_SIZE_BARE }}
              />
            }
            title={t('preview.estimateNote')}
          />

          {loading && <Text type="secondary">{t('preview.rerendering')}</Text>}
        </>
      )}
    </Drawer>
  )
}
