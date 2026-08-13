import { useCallback, useMemo } from 'react'
import { App as AntApp, Button, Collapse, List, Modal, Result, Space, Typography } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CompressOutlined,
  CopyOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  FieldTimeOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  HddOutlined,
  MinusCircleOutlined,
  PercentageOutlined
} from '@ant-design/icons'
import { formatCapabilities } from '@shared/formats'
import { errorMessage, percentOf } from '@shared/utils'
import { useAppStore } from '../store/useAppStore'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useFormatBytes, useLocale, useT } from '../i18n'
import { Glyph } from './Glyph'
import type { GlyphTone } from './Glyph'
import { useRunDuration } from './StatsStrip'
import type { ResultProps } from 'antd'

const { Paragraph, Text } = Typography

interface SummaryModalProps {
  open: boolean
  onClose: () => void
}

interface StatTile {
  label: string
  value: string
  icon: React.JSX.Element
  tone: GlyphTone
}

const SECTION_TITLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8
}

/**
 * The report shown once a run stops.
 *
 * Numbers come from the summary the main process built while it worked rather
 * than from anything recounted here, so what the user reads is exactly what was
 * written to the history file.
 */
export function SummaryModal(props: SummaryModalProps): React.JSX.Element {
  const { open, onClose } = props

  const { message } = AntApp.useApp()
  const { width } = useBreakpoint()
  const t = useT()
  const { n } = useLocale()
  const formatBytes = useFormatBytes()
  const runDuration = useRunDuration()
  const summary = useAppStore((state) => state.summary)

  const tiles = useMemo<StatTile[]>(() => {
    if (!summary) return []

    const average = summary.processed > 0 ? summary.durationMs / summary.processed : 0

    return [
      {
        label: t('summary.tile.converted'),
        value: n(summary.processed),
        icon: <CheckCircleOutlined />,
        tone: 'green'
      },
      {
        label: t('summary.tile.failed'),
        value: n(summary.failed),
        icon: <CloseCircleOutlined />,
        tone: 'rose'
      },
      {
        label: t('summary.tile.skipped'),
        value: n(summary.skipped),
        icon: <MinusCircleOutlined />,
        tone: 'slate'
      },
      {
        label: t('summary.tile.totalTime'),
        value: runDuration(summary.durationMs),
        icon: <ClockCircleOutlined />,
        tone: 'cyan'
      },
      {
        label: t('summary.tile.averagePerImage'),
        value: runDuration(average),
        icon: <FieldTimeOutlined />,
        tone: 'violet'
      },
      {
        label: t('summary.tile.sizeBefore'),
        value: formatBytes(summary.bytesIn),
        icon: <DatabaseOutlined />,
        tone: 'orange'
      },
      {
        label: t('summary.tile.sizeAfter'),
        value: formatBytes(summary.bytesOut),
        icon: <HddOutlined />,
        tone: 'teal'
      },
      {
        label: t('summary.tile.saved'),
        value: formatBytes(Math.max(0, summary.savedBytes)),
        icon: <CompressOutlined />,
        tone: 'amber'
      },
      {
        label: t('summary.tile.savedPercent'),
        value: t('summary.tile.savedPercentValue', {
          percent: n(summary.savedPercent, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          })
        }),
        icon: <PercentageOutlined />,
        tone: 'pink'
      }
    ]
  }, [formatBytes, n, runDuration, summary, t])

  const copyErrors = useCallback(async (): Promise<void> => {
    if (!summary) return
    const text = summary.errors
      .map((failure) => `${failure.fileName}: ${failure.message}`)
      .join('\n')
    try {
      await window.bico.system.copyText(text)
      void message.success(t('summary.errors.copied'))
    } catch (error) {
      void message.error(errorMessage(error))
    }
  }, [message, summary, t])

  if (!summary) {
    return <Modal open={false} footer={null} onCancel={onClose} />
  }

  const status: ResultProps['status'] = summary.cancelled
    ? 'info'
    : summary.failed > 0
      ? 'warning'
      : 'success'

  const title = summary.cancelled
    ? t('summary.result.cancelled')
    : summary.failed > 0
      ? t('summary.result.partial')
      : t('summary.result.success')

  const formatName = formatCapabilities(summary.format)?.label ?? t('summary.format.original')

  const subTitle = summary.cancelled
    ? t('summary.subtitle.cancelled', {
        processed: n(summary.processed),
        total: n(summary.total)
      })
    : summary.failed > 0
      ? t('summary.subtitle.partial', {
          processed: n(summary.processed),
          total: n(summary.total),
          format: formatName,
          failed: n(summary.failed)
        })
      : t('summary.subtitle.success', {
          processed: n(summary.processed),
          format: formatName,
          duration: runDuration(summary.durationMs)
        })

  const laneTotal = summary.gpuCount + summary.cpuCount
  const gpuShare = percentOf(summary.gpuCount, laneTotal)
  const shareText = (value: number): string => n(Math.round(value))

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={t('summary.title')}
      width={Math.min(760, Math.max(320, width - 48))}
      footer={
        <Button type="primary" onClick={onClose}>
          {t('action.close')}
        </Button>
      }
    >
      <Result
        status={status}
        title={title}
        subTitle={subTitle}
        style={{ paddingBlock: '8px 20px', paddingInline: 0 }}
      />

      <div className="bico-stats">
        {tiles.map((tile) => (
          <div className="bico-stat" key={tile.label}>
            <Glyph icon={tile.icon} tone={tile.tone} size="md" />
            <div className="bico-stat-body">
              <div className="bico-stat-value">{tile.value}</div>
              <div className="bico-stat-label">{tile.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBlockStart: 20 }}>
        <div className="bico-section-title" style={SECTION_TITLE}>
          <Glyph bare icon={<DeploymentUnitOutlined />} tone="violet" size="sm" />
          {t('summary.lanes.title')}
        </div>
        {laneTotal === 0 ? (
          <Text type="secondary">{t('summary.lanes.empty')}</Text>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                height: 10,
                borderRadius: 999,
                overflow: 'hidden',
                background: 'var(--bico-surface-overlay)'
              }}
              role="img"
              aria-label={t('summary.lanes.aria', {
                gpu: n(summary.gpuCount),
                cpu: n(summary.cpuCount)
              })}
            >
              <div style={{ flex: `${summary.gpuCount} 0 0`, background: 'var(--bico-gpu)' }} />
              <div style={{ flex: `${summary.cpuCount} 0 0`, background: 'var(--bico-cpu)' }} />
            </div>
            <Space size={16} wrap style={{ marginBlockStart: 8, fontSize: 12 }}>
              <span className="bico-statusbar-item">
                <span className="bico-dot" style={{ background: 'var(--bico-gpu)' }} />
                {t('summary.lanes.gpu', {
                  count: n(summary.gpuCount),
                  percent: shareText(gpuShare)
                })}
              </span>
              <span className="bico-statusbar-item">
                <span className="bico-dot" style={{ background: 'var(--bico-cpu)' }} />
                {t('summary.lanes.cpu', {
                  count: n(summary.cpuCount),
                  percent: shareText(100 - gpuShare)
                })}
              </span>
            </Space>
          </>
        )}
      </div>

      <div style={{ marginBlockStart: 20 }}>
        <div className="bico-section-title" style={SECTION_TITLE}>
          <Glyph bare icon={<FolderOpenOutlined />} tone="green" size="sm" />
          {t('summary.output.title')}
        </div>
        <Paragraph
          className="bico-selectable"
          style={{ marginBlockEnd: 8, overflowWrap: 'anywhere' }}
        >
          {summary.outputLocation ? (
            // A filesystem path is Latin text with its own separators, so it is
            // isolated rather than reordered by an Arabic paragraph around it.
            <span dir="ltr">{summary.outputLocation}</span>
          ) : (
            t('summary.output.unknown')
          )}
        </Paragraph>
        <Space wrap>
          <Button
            icon={<Glyph bare icon={<FolderOpenOutlined />} tone="green" size="md" />}
            disabled={!summary.outputLocation}
            onClick={() => void window.bico.system.openPath(summary.outputLocation)}
          >
            {t('action.open')}
          </Button>
          <Button
            icon={<Glyph bare icon={<FileSearchOutlined />} tone="cyan" size="md" />}
            disabled={!summary.outputLocation}
            onClick={() => void window.bico.system.revealPath(summary.outputLocation)}
          >
            {t('action.showInFolder')}
          </Button>
          {summary.reportPath && (
            <Button
              icon={<Glyph bare icon={<FileTextOutlined />} tone="amber" size="md" />}
              onClick={() => {
                if (summary.reportPath) void window.bico.system.openPath(summary.reportPath)
              }}
            >
              {t('summary.output.openReport')}
            </Button>
          )}
        </Space>
      </div>

      {summary.errors.length > 0 && (
        <Collapse
          size="small"
          style={{ marginBlockStart: 20 }}
          expandIconPlacement="start"
          items={[
            {
              key: 'failures',
              label: (
                <span style={SECTION_TITLE}>
                  <Glyph bare icon={<CloseCircleOutlined />} tone="rose" size="sm" />
                  {summary.errors.length === 1
                    ? t('summary.errors.one')
                    : t('summary.errors.many', { count: n(summary.errors.length) })}
                </span>
              ),
              children: (
                <>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    style={{ marginBlockEnd: 10 }}
                    onClick={() => void copyErrors()}
                  >
                    {t('summary.errors.copy')}
                  </Button>
                  <List
                    size="small"
                    dataSource={summary.errors}
                    rowKey={(failure) => failure.fileId}
                    renderItem={(failure) => (
                      <List.Item>
                        <div style={{ minWidth: 0 }}>
                          <div className="bico-truncate" style={{ fontWeight: 550 }}>
                            {failure.fileName}
                          </div>
                          <Text type="secondary" style={{ overflowWrap: 'anywhere' }}>
                            {failure.message}
                          </Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </>
              )
            }
          ]}
        />
      )}
    </Modal>
  )
}
