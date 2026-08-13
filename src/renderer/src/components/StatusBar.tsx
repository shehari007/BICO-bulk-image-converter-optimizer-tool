import { useMemo } from 'react'
import { Tooltip } from 'antd'
import {
  ClusterOutlined,
  DeploymentUnitOutlined,
  FileZipOutlined,
  FolderOpenOutlined,
  PictureOutlined,
  RocketOutlined,
  SwapOutlined,
  SyncOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { useAppStore } from '../store/useAppStore'
import { useLocale, useT } from '../i18n'
import { Glyph } from './Glyph'

/** What the acceleration indicator at the start of the bar is reporting. */
interface AccelerationState {
  colour: string
  icon: React.JSX.Element
  label: string
  detail: string
}

const CLICKABLE: React.CSSProperties = {
  cursor: 'pointer',
  minWidth: 0
}

/**
 * The always visible summary of where output goes and what is doing the work.
 *
 * Everything here is read only. The two clickable items are shortcuts to a
 * place that can actually change something, which keeps a 34 pixel tall strip
 * from turning into a second control surface.
 */
export function StatusBar(): React.JSX.Element {
  const t = useT()
  const { n } = useLocale()

  const gpu = useAppStore((state) => state.gpu)
  const concurrency = useAppStore((state) => state.system?.imaging.concurrency ?? 0)
  const progress = useAppStore((state) => state.progress)
  const target = useAppStore((state) => state.settings.output.target)
  const folder = useAppStore((state) => state.settings.output.folder)
  const zipPath = useAppStore((state) => state.settings.output.zipPath)
  const setPanel = useAppStore((state) => state.setPanel)

  const acceleration = useMemo<AccelerationState>(() => {
    if (!gpu) {
      return {
        colour: 'var(--bico-text-muted)',
        icon: <SyncOutlined spin />,
        label: t('statusbar.gpu.probing'),
        detail: t('statusbar.gpu.probingDetail')
      }
    }

    if (!gpu.supported) {
      return {
        colour: 'var(--bico-text-muted)',
        icon: <ThunderboltOutlined />,
        label: t('statusbar.gpu.unavailable', {
          reason: gpu.reason || t('statusbar.gpu.unavailableReason')
        }),
        detail: t('statusbar.gpu.unavailableDetail')
      }
    }

    if (!gpu.enabled) {
      return {
        colour: 'var(--bico-warning)',
        icon: <ThunderboltOutlined />,
        label: t('statusbar.gpu.idle', { reason: gpu.reason || t('statusbar.gpu.idleReason') }),
        detail: t('statusbar.gpu.idleDetail')
      }
    }

    const adapter = gpu.adapters.find((candidate) => candidate.active) ?? gpu.adapters[0]
    const generic = t('statusbar.gpu.genericAdapter')
    const name = adapter ? adapter.device || adapter.description || generic : generic

    return {
      colour: 'var(--bico-gpu)',
      icon: <RocketOutlined />,
      label: t('statusbar.gpu.active', { device: name }),
      detail: t('statusbar.gpu.activeDetail', {
        processed: n(gpu.processed),
        fallbacks: n(gpu.fallbacks)
      })
    }
  }, [gpu, n, t])

  const running =
    progress !== null &&
    (progress.state === 'running' || progress.state === 'paused' || progress.state === 'finishing')

  const outputPath = target === 'zip' ? zipPath : target === 'folder' ? folder : ''
  const outputLabel = t(target === 'zip' ? 'statusbar.output.archive' : 'statusbar.output.folder')

  const reveal = (): void => {
    if (outputPath) void window.bico.system.revealPath(outputPath)
  }

  return (
    <footer className="bico-statusbar">
      <Tooltip title={`${acceleration.detail} ${t('statusbar.gpu.openDiagnostics')}`}>
        <span
          role="button"
          tabIndex={0}
          className="bico-statusbar-item"
          style={{ ...CLICKABLE, flexShrink: 1 }}
          onClick={() => setPanel('diagnostics')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              setPanel('diagnostics')
            }
          }}
        >
          <Glyph
            bare
            icon={acceleration.icon}
            size="sm"
            // The tone set cannot express "the GPU colour of the active theme",
            // and this indicator has to match the GPU tags in the queue.
            style={{ color: acceleration.colour }}
          />
          <span className="bico-truncate">{acceleration.label}</span>
        </span>
      </Tooltip>

      {concurrency > 0 && (
        <Tooltip title={t('statusbar.workers.detail')}>
          <span className="bico-statusbar-item">
            <Glyph bare icon={<ClusterOutlined />} size="sm" style={{ color: 'var(--bico-cpu)' }} />
            {concurrency === 1
              ? t('statusbar.workers.one')
              : t('statusbar.workers.many', { count: n(concurrency) })}
          </span>
        </Tooltip>
      )}

      {progress !== null && progress.activeDevices.length > 0 && (
        <Tooltip title={t('statusbar.working.detail')}>
          <span className="bico-statusbar-item" style={{ flexShrink: 1 }}>
            <Glyph bare icon={<DeploymentUnitOutlined />} tone="violet" size="sm" />
            <span className="bico-truncate">
              {t('statusbar.working', { devices: progress.activeDevices.join(', ') })}
            </span>
          </span>
        </Tooltip>
      )}

      <span className="bico-statusbar-spacer" />

      {target === 'in-place' ? (
        <Tooltip title={t('statusbar.output.inPlaceDetail')}>
          <span className="bico-statusbar-item">
            <Glyph bare icon={<SwapOutlined />} tone="orange" size="sm" />
            {t('statusbar.output.inPlace')}
          </span>
        </Tooltip>
      ) : outputPath ? (
        <Tooltip title={t('statusbar.output.revealHint', { path: outputPath })}>
          <span
            role="button"
            tabIndex={0}
            className="bico-statusbar-item"
            style={{ ...CLICKABLE, flexShrink: 1 }}
            onClick={reveal}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                reveal()
              }
            }}
          >
            <Glyph
              bare
              icon={target === 'zip' ? <FileZipOutlined /> : <FolderOpenOutlined />}
              tone={target === 'zip' ? 'amber' : 'green'}
              size="sm"
            />
            <span style={{ flex: '0 0 auto' }}>
              {t('statusbar.output.label', { label: outputLabel })}
            </span>
            {/* A filesystem path is Latin text with its own separators, so it is
                isolated rather than reordered by an Arabic paragraph around it. */}
            <span className="bico-truncate bico-mono" dir="ltr">
              {outputPath}
            </span>
          </span>
        </Tooltip>
      ) : (
        <Tooltip title={t('statusbar.output.noneDetail')}>
          <span className="bico-statusbar-item">
            <Glyph
              bare
              icon={target === 'zip' ? <FileZipOutlined /> : <FolderOpenOutlined />}
              tone="slate"
              size="sm"
            />
            {t(target === 'zip' ? 'statusbar.output.noArchive' : 'statusbar.output.noFolder')}
          </span>
        </Tooltip>
      )}

      {running && (
        <>
          <Tooltip title={t('statusbar.rate.throughputDetail')}>
            <span className="bico-statusbar-item bico-mono">
              <Glyph bare icon={<ThunderboltOutlined />} tone="amber" size="sm" />
              {t('statusbar.rate.throughput', {
                rate: n(progress.throughputMbps, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1
                })
              })}
            </span>
          </Tooltip>

          <Tooltip title={t('statusbar.rate.imagesDetail')}>
            <span className="bico-statusbar-item bico-mono">
              <Glyph bare icon={<PictureOutlined />} tone="pink" size="sm" />
              {t('statusbar.rate.images', {
                rate: n(progress.imagesPerSecond, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1
                })
              })}
            </span>
          </Tooltip>
        </>
      )}
    </footer>
  )
}
