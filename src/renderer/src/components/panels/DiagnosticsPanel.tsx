import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  App as AntApp,
  Button,
  Collapse,
  Drawer,
  Empty,
  Progress,
  Segmented,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  theme,
  type TableColumnsType
} from 'antd'
import {
  BellOutlined,
  CloudDownloadOutlined,
  CopyOutlined,
  DesktopOutlined,
  ExportOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  PictureOutlined,
  ProfileOutlined,
  ReloadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  TranslationOutlined
} from '@ant-design/icons'
import type {
  ChromiumGpuReport,
  GpuAdapterInfo,
  GpuStatus,
  LogLevel,
  LogRecord,
  QueueView,
  SystemInfo,
  UpdateInfo,
  UpdateState
} from '@shared/types'
import { LANGUAGES, languageMeta, type LanguageCode } from '@shared/i18n/types'
import { recentLogs, savePrefs, subscribeLogs } from '../../store/bridge'
import { useAppStore } from '../../store/useAppStore'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useLocale, useT, type TranslationKey } from '../../i18n'
import { Glyph, type GlyphTone } from '../Glyph'
import { ThemesSection } from './ThemesSection'

const { Paragraph, Text } = Typography

interface DiagnosticsPanelProps {
  open: boolean
  onClose: () => void
}

interface KvRow {
  label: string
  value: React.ReactNode
}

type LogFilter = 'all' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: 'default',
  info: 'blue',
  warn: 'orange',
  error: 'red'
}

const LEVEL_LABEL: Record<LogLevel, TranslationKey> = {
  debug: 'diagnostics.log.level.debug',
  info: 'diagnostics.log.level.info',
  warn: 'diagnostics.log.level.warn',
  error: 'diagnostics.log.level.error'
}

const ADAPTER_KIND_KEY: Record<GpuAdapterInfo['kind'], TranslationKey> = {
  discrete: 'diagnostics.graphics.kind.discrete',
  integrated: 'diagnostics.graphics.kind.integrated',
  cpu: 'diagnostics.graphics.kind.cpu',
  unknown: 'diagnostics.graphics.kind.unknown'
}

/** English only, because this one feeds the pasted bug report rather than the UI. */
const ADAPTER_KIND_ENGLISH: Record<GpuAdapterInfo['kind'], string> = {
  discrete: 'Discrete',
  integrated: 'Integrated',
  cpu: 'Software',
  unknown: 'Unreported'
}

const UPDATE_MESSAGE_KEY: Record<UpdateState, TranslationKey> = {
  idle: 'diagnostics.updates.state.idle',
  checking: 'diagnostics.updates.state.checking',
  available: 'diagnostics.updates.state.available',
  'not-available': 'diagnostics.updates.state.notAvailable',
  downloading: 'diagnostics.updates.state.downloading',
  downloaded: 'diagnostics.updates.state.downloaded',
  error: 'diagnostics.updates.state.error'
}

const IDLE_UPDATE: UpdateInfo = {
  state: 'idle',
  version: '',
  releaseNotes: '',
  percent: 0,
  error: '',
  manualDownload: false,
  releaseUrl: ''
}

function openPath(target: string): void {
  if (target) void window.bico.system.openPath(target)
}

/** Local wall clock, seconds resolution, which is all a tail needs. */
function logTime(ms: number): string {
  return new Date(ms).toTimeString().slice(0, 8)
}

function yesNo(value: boolean): string {
  return value ? 'yes' : 'no'
}

function kvSection(title: string, rows: KvRow[]): React.JSX.Element {
  return (
    <div style={{ marginBlockEnd: 20 }}>
      <div className="bico-section-title">{title}</div>
      <dl className="bico-kv">
        {rows.map((row) => (
          <Fragment key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  )
}

function settingRow(label: string, hint: string, control: React.ReactNode): React.JSX.Element {
  return (
    <div
      key={label}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        paddingBlock: 8
      }}
    >
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div>{label}</div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {hint}
        </Text>
      </div>
      <div style={{ flex: '0 0 auto' }}>{control}</div>
    </div>
  )
}

function sectionHeading(
  icon: React.ReactNode,
  tone: GlyphTone,
  title: string,
  spaced = true
): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBlockStart: spaced ? 18 : 0,
        marginBlockEnd: 4
      }}
    >
      <Glyph icon={icon} tone={tone} size="sm" />
      <div style={{ fontWeight: 600 }}>{title}</div>
    </div>
  )
}

/** A tab label, with its glyph carrying the tone that names the tab. */
function tabLabel(icon: React.ReactNode, tone: GlyphTone, text: string): React.JSX.Element {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Glyph icon={icon} tone={tone} size="sm" bare />
      {text}
    </span>
  )
}

/** A path row that opens the folder rather than only showing where it is. */
function pathButton(target: string, title: string): React.JSX.Element {
  return (
    <Button
      type="link"
      size="small"
      title={title}
      style={{ padding: 0, height: 'auto', textAlign: 'start' }}
      onClick={() => openPath(target)}
    >
      {/* A path can open on a separator, which is neutral, so it is isolated
          rather than reordered by an Arabic paragraph. */}
      <bdi dir="ltr">{target}</bdi>
    </Button>
  )
}

/**
 * Serialises everything the panel knows as markdown.
 *
 * Deliberately not translated. The report exists to be pasted into an issue for
 * a maintainer to read, and an Arabic or Turkish copy of it would arrive
 * unreadable at the one place it is meant to be useful. Only the language the
 * user is running in is recorded, as a fact about the session.
 */
function buildReport(
  system: SystemInfo,
  gpu: GpuStatus | null,
  chromium: ChromiumGpuReport | null,
  language: LanguageCode
): string {
  const lines: string[] = []

  lines.push('# BICO diagnostics report', '')

  lines.push('## App')
  lines.push(`- Name: ${system.app.name}`)
  lines.push(`- Version: ${system.app.version}`)
  lines.push(`- Packaged build: ${yesNo(system.app.packaged)}`)
  lines.push(`- Build date: ${system.app.buildDate}`)
  lines.push(`- System locale: ${system.app.locale}`)
  lines.push(`- Interface language: ${languageMeta(language).englishName}`)
  lines.push('')

  lines.push('## Runtime')
  lines.push(`- Electron: ${system.runtime.electron}`)
  lines.push(`- Chromium: ${system.runtime.chrome}`)
  lines.push(`- Node: ${system.runtime.node}`)
  lines.push(`- V8: ${system.runtime.v8}`)
  lines.push(`- Native module ABI: ${system.runtime.abi}`)
  lines.push('')

  lines.push('## Operating system')
  lines.push(`- Platform: ${system.os.platform}`)
  lines.push(`- Architecture: ${system.os.arch}`)
  lines.push(`- Release: ${system.os.release}`)
  lines.push(`- Version: ${system.os.version}`)
  lines.push(`- Processor: ${system.os.cpuModel} (${system.os.cpuCores} logical cores)`)
  lines.push(`- Memory: ${system.os.totalMemoryMb} MB total, ${system.os.freeMemoryMb} MB free`)
  lines.push('')

  lines.push('## Imaging')
  lines.push(`- sharp: ${system.imaging.sharp}`)
  lines.push(`- libvips: ${system.imaging.libvips}`)
  lines.push(`- SIMD: ${yesNo(system.imaging.simd)}`)
  lines.push(`- libvips threads: ${system.imaging.concurrency}`)
  for (const [id, support] of Object.entries(system.imaging.formats)) {
    lines.push(`- Codec ${id}: read ${yesNo(support.input)}, write ${yesNo(support.output)}`)
  }
  lines.push('')

  lines.push('## Graphics')
  if (gpu) {
    lines.push(`- WebGPU adapters resolved: ${yesNo(gpu.supported)}`)
    lines.push(`- GPU lanes enabled: ${yesNo(gpu.enabled)}`)
    if (gpu.reason) lines.push(`- Reason given: ${gpu.reason}`)
    lines.push(`- Images completed on GPU: ${gpu.processed}`)
    lines.push(`- Images that fell back to CPU: ${gpu.fallbacks}`)
    gpu.adapters.forEach((adapter, index) => {
      lines.push(
        `- Adapter ${index + 1}: ${adapter.vendor} ${adapter.device} (${ADAPTER_KIND_ENGLISH[adapter.kind]}), architecture ${adapter.architecture || 'unreported'}, max texture ${adapter.maxTextureDimension}, max buffer ${adapter.maxBufferSizeMb} MB`
      )
    })
  } else {
    lines.push('- WebGPU status was not published by the renderer.')
  }
  if (chromium) {
    lines.push(`- Chromium vendor: ${chromium.vendor}`)
    lines.push(`- Chromium device: ${chromium.device}`)
    lines.push(`- Chromium driver: ${chromium.driver}`)
    for (const [feature, status] of Object.entries(chromium.featureStatus)) {
      lines.push(`- Feature ${feature}: ${status}`)
    }
  }
  lines.push('')

  lines.push('## Paths')
  lines.push(`- User data: ${system.paths.userData}`)
  lines.push(`- Logs: ${system.paths.logs}`)
  lines.push(`- Temporary files: ${system.paths.temp}`)
  lines.push(`- Presets: ${system.paths.presets}`)
  lines.push('')

  return lines.join('\n')
}

/**
 * The panel a bug report is written from.
 *
 * Everything here is read only apart from the preferences tab, and every value
 * is either a live store slice or a fresh call made when the drawer opens, so
 * nothing is ever reported from a stale snapshot taken at startup.
 */
export function DiagnosticsPanel(props: DiagnosticsPanelProps): React.JSX.Element {
  const { open, onClose } = props
  const { message } = AntApp.useApp()
  const { token } = theme.useToken()
  const { width, height } = useBreakpoint()
  const t = useT()
  const { direction } = useLocale()

  // Ant's tab body does not stretch on its own, and the log tail needs a real
  // height to scroll inside, so the panels are sized against the window instead
  // of chasing percentages through the component's internals.
  const contentHeight = Math.max(240, height - 210)

  const system = useAppStore((state) => state.system)
  const gpu = useAppStore((state) => state.gpu)

  const language = useAppStore((state) => state.prefs.language)
  const compactUi = useAppStore((state) => state.prefs.compactUi)
  const queueView = useAppStore((state) => state.prefs.queueView)
  const confirmBeforeRun = useAppStore((state) => state.prefs.confirmBeforeRun)
  const notifyOnComplete = useAppStore((state) => state.prefs.notifyOnComplete)
  const minimiseToTray = useAppStore((state) => state.prefs.minimiseToTray)
  const openOutputWhenDone = useAppStore((state) => state.prefs.openOutputWhenDone)
  const taskbarProgress = useAppStore((state) => state.prefs.taskbarProgress)
  const autoCheckUpdates = useAppStore((state) => state.prefs.autoCheckUpdates)

  const [chromium, setChromium] = useState<ChromiumGpuReport | null>(null)
  const [records, setRecords] = useState<readonly LogRecord[]>([])
  const [filter, setFilter] = useState<LogFilter>('all')
  const [update, setUpdate] = useState<UpdateInfo>(IDLE_UPDATE)
  const [checking, setChecking] = useState(false)

  const logScroll = useRef<HTMLDivElement | null>(null)
  // Auto scroll is a courtesy, not a rule: the moment the user scrolls back to
  // read something, new lines must stop yanking the view away from them.
  const stickToBottom = useRef(true)

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    void window.bico.system
      .gpuReport()
      .then((report) => {
        if (!cancelled) setChromium(report)
      })
      .catch(() => undefined)

    stickToBottom.current = true

    const disposeLogs = subscribeLogs((next) => setRecords(next.slice()))
    const disposeUpdates = window.bico.on.updateState((info) => setUpdate(info))

    // The ring buffer keeps filling while the drawer is closed, so the tail has
    // to be seeded on open. Deferring it by a microtask keeps the effect body
    // free of a synchronous state write and lets the drawer paint first.
    queueMicrotask(() => {
      if (!cancelled) setRecords(recentLogs().slice())
    })

    return () => {
      cancelled = true
      disposeLogs()
      disposeUpdates()
    }
  }, [open])

  const filtered = useMemo(() => {
    if (filter === 'all') return records
    const floor = LEVEL_RANK[filter]
    return records.filter((record) => LEVEL_RANK[record.level] >= floor)
  }, [records, filter])

  useEffect(() => {
    const element = logScroll.current
    if (!element || !stickToBottom.current) return
    element.scrollTop = element.scrollHeight
  }, [filtered])

  const handleLogScroll = useCallback(() => {
    const element = logScroll.current
    if (!element) return
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight
    stickToBottom.current = distance < 24
  }, [])

  const handleCopyReport = useCallback(() => {
    if (!system) return
    void window.bico.system
      .copyText(buildReport(system, gpu, chromium, language))
      .then(() => message.success(t('diagnostics.env.copied')))
      .catch(() => message.error(t('diagnostics.env.copyFailed')))
  }, [system, gpu, chromium, language, message, t])

  const handleCheckUpdates = useCallback(() => {
    setChecking(true)
    void window.bico.updates
      .check()
      .then((info) => setUpdate(info))
      .catch(() =>
        setUpdate({
          ...IDLE_UPDATE,
          state: 'error',
          error: t('diagnostics.updates.unreachable')
        })
      )
      .finally(() => setChecking(false))
  }, [t])

  const adapterColumns: TableColumnsType<GpuAdapterInfo> = [
    {
      title: t('diagnostics.graphics.column.adapter'),
      dataIndex: 'device',
      render: (_value, adapter) => (
        <div style={{ minWidth: 0 }}>
          <div className="bico-truncate">{adapter.device || adapter.description || adapter.id}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {adapter.vendor || t('diagnostics.graphics.vendorUnknown')}
          </Text>
        </div>
      )
    },
    {
      title: t('diagnostics.graphics.column.type'),
      dataIndex: 'kind',
      width: 130,
      render: (_value, adapter) => (
        <Space size={4} wrap>
          <Tag style={{ marginInlineEnd: 0 }}>{t(ADAPTER_KIND_KEY[adapter.kind])}</Tag>
          {adapter.isFallbackAdapter ? (
            <Tag color="orange" style={{ marginInlineEnd: 0 }}>
              {t('diagnostics.graphics.fallbackAdapter')}
            </Tag>
          ) : null}
        </Space>
      )
    },
    {
      title: t('diagnostics.graphics.column.limits'),
      dataIndex: 'maxBufferSizeMb',
      width: 150,
      render: (_value, adapter) => (
        <Text type="secondary" className="bico-mono" style={{ fontSize: 12 }}>
          {t('diagnostics.graphics.limitsValue', {
            pixels: adapter.maxTextureDimension,
            megabytes: adapter.maxBufferSizeMb
          })}
        </Text>
      )
    },
    {
      title: t('diagnostics.graphics.column.lane'),
      dataIndex: 'active',
      width: 100,
      render: (_value, adapter) => (
        <Tag color={adapter.active ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>
          {adapter.active
            ? t('diagnostics.graphics.laneWorking')
            : t('diagnostics.graphics.laneIdle')}
        </Tag>
      )
    }
  ]

  const environmentTab = system ? (
    <div className="bico-scroll-y" style={{ maxHeight: contentHeight, paddingInlineEnd: 4 }}>
      <Button
        type="primary"
        icon={<CopyOutlined />}
        onClick={handleCopyReport}
        style={{ marginBlockEnd: 16 }}
        block
      >
        {t('diagnostics.env.copy')}
      </Button>

      {kvSection(t('diagnostics.env.app'), [
        { label: t('diagnostics.env.app.name'), value: system.app.name },
        { label: t('diagnostics.env.app.version'), value: system.app.version },
        { label: t('diagnostics.env.app.buildDate'), value: system.app.buildDate },
        {
          label: t('diagnostics.env.app.packaged'),
          value: system.app.packaged
            ? t('diagnostics.env.app.packagedYes')
            : t('diagnostics.env.app.packagedNo')
        },
        { label: t('diagnostics.env.app.locale'), value: system.app.locale }
      ])}

      {kvSection(t('diagnostics.env.runtime'), [
        { label: t('diagnostics.env.runtime.electron'), value: system.runtime.electron },
        { label: t('diagnostics.env.runtime.chromium'), value: system.runtime.chrome },
        { label: t('diagnostics.env.runtime.node'), value: system.runtime.node },
        { label: t('diagnostics.env.runtime.v8'), value: system.runtime.v8 },
        { label: t('diagnostics.env.runtime.abi'), value: system.runtime.abi }
      ])}

      {kvSection(t('diagnostics.env.os'), [
        { label: t('diagnostics.env.os.platform'), value: system.os.platform },
        { label: t('diagnostics.env.os.arch'), value: system.os.arch },
        { label: t('diagnostics.env.os.release'), value: system.os.release },
        { label: t('diagnostics.env.os.version'), value: system.os.version },
        { label: t('diagnostics.env.os.processor'), value: system.os.cpuModel },
        { label: t('diagnostics.env.os.cores'), value: String(system.os.cpuCores) },
        {
          label: t('diagnostics.env.os.memory'),
          value: t('diagnostics.env.os.memoryValue', {
            total: system.os.totalMemoryMb,
            free: system.os.freeMemoryMb
          })
        }
      ])}

      {kvSection(t('diagnostics.env.imaging'), [
        { label: t('diagnostics.env.imaging.sharp'), value: system.imaging.sharp },
        { label: t('diagnostics.env.imaging.libvips'), value: system.imaging.libvips },
        {
          label: t('diagnostics.env.imaging.simd'),
          value: system.imaging.simd
            ? t('diagnostics.env.imaging.simdOn')
            : t('diagnostics.env.imaging.simdOff')
        },
        { label: t('diagnostics.env.imaging.threads'), value: String(system.imaging.concurrency) },
        {
          label: t('diagnostics.env.imaging.codecs'),
          value: (
            <>
              <Space size={[4, 4]} wrap>
                {Object.entries(system.imaging.formats).map(([id, support]) => (
                  <Tag
                    key={id}
                    color={support.output ? 'success' : support.input ? 'default' : 'warning'}
                    style={{ marginInlineEnd: 0 }}
                  >
                    {id}
                  </Tag>
                ))}
              </Space>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {t('diagnostics.env.imaging.codecsHint')}
                </Text>
              </div>
            </>
          )
        }
      ])}

      {kvSection(t('diagnostics.env.paths'), [
        {
          label: t('diagnostics.env.paths.userData'),
          value: pathButton(system.paths.userData, t('diagnostics.env.paths.open'))
        },
        {
          label: t('diagnostics.env.paths.logs'),
          value: pathButton(system.paths.logs, t('diagnostics.env.paths.open'))
        },
        {
          label: t('diagnostics.env.paths.temp'),
          value: pathButton(system.paths.temp, t('diagnostics.env.paths.open'))
        },
        {
          label: t('diagnostics.env.paths.presets'),
          value: pathButton(system.paths.presets, t('diagnostics.env.paths.open'))
        }
      ])}
    </div>
  ) : (
    <Empty description={t('diagnostics.env.empty')} />
  )

  const graphicsTab = (
    <div className="bico-scroll-y" style={{ maxHeight: contentHeight, paddingInlineEnd: 4 }}>
      <Paragraph type="secondary" style={{ fontSize: 12 }}>
        {t('diagnostics.graphics.intro')}
      </Paragraph>

      {sectionHeading(<ThunderboltOutlined />, 'amber', t('diagnostics.graphics.adapters'), false)}

      {gpu && gpu.adapters.length > 0 ? (
        <Table<GpuAdapterInfo>
          columns={adapterColumns}
          dataSource={gpu.adapters}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ x: 520 }}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={gpu?.reason || t('diagnostics.graphics.noAdapters')}
        />
      )}

      {gpu ? (
        <div style={{ marginBlockStart: 12 }}>
          <Space size={[6, 6]} wrap>
            <Tag color={gpu.supported ? 'green' : 'default'}>
              {gpu.supported
                ? t('diagnostics.graphics.webgpuOn')
                : t('diagnostics.graphics.webgpuOff')}
            </Tag>
            <Tag color={gpu.enabled ? 'green' : 'orange'}>
              {gpu.enabled ? t('diagnostics.graphics.lanesOn') : t('diagnostics.graphics.lanesOff')}
            </Tag>
            <Tag color="purple">
              {gpu.processed === 1
                ? t('diagnostics.graphics.processedOne')
                : t('diagnostics.graphics.processedMany', { count: gpu.processed })}
            </Tag>
            <Tag color={gpu.fallbacks > 0 ? 'orange' : 'default'}>
              {gpu.fallbacks === 1
                ? t('diagnostics.graphics.fellBackOne')
                : t('diagnostics.graphics.fellBackMany', { count: gpu.fallbacks })}
            </Tag>
          </Space>
        </div>
      ) : null}

      {sectionHeading(<DesktopOutlined />, 'cyan', t('diagnostics.graphics.chromium'))}

      {chromium ? (
        <>
          <dl className="bico-kv" style={{ marginBlockEnd: 12 }}>
            <dt>{t('diagnostics.graphics.chromium.vendor')}</dt>
            <dd>{chromium.vendor || t('diagnostics.graphics.chromium.notReported')}</dd>
            <dt>{t('diagnostics.graphics.chromium.device')}</dt>
            <dd>{chromium.device || t('diagnostics.graphics.chromium.notReported')}</dd>
            <dt>{t('diagnostics.graphics.chromium.driver')}</dt>
            <dd>{chromium.driver || t('diagnostics.graphics.chromium.notReported')}</dd>
            <dt>{t('diagnostics.graphics.chromium.description')}</dt>
            <dd>{chromium.deviceString || t('diagnostics.graphics.chromium.notReported')}</dd>
          </dl>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(chromium.featureStatus).map(([feature, status]) => (
              <div
                key={feature}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'space-between',
                  fontSize: 12
                }}
              >
                <Text style={{ minWidth: 0 }}>{feature}</Text>
                <Text
                  type={
                    status.includes('disabled') || status.includes('unavailable')
                      ? 'warning'
                      : 'success'
                  }
                  className="bico-mono"
                >
                  {status}
                </Text>
              </div>
            ))}
          </div>

          <Collapse
            ghost
            size="small"
            style={{ marginBlockStart: 12 }}
            items={[
              {
                key: 'raw',
                label: t('diagnostics.graphics.chromium.raw'),
                children: (
                  <pre
                    className="bico-mono bico-selectable"
                    style={{
                      margin: 0,
                      padding: 10,
                      maxHeight: 260,
                      overflow: 'auto',
                      fontSize: 11,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      background: token.colorFillQuaternary,
                      borderRadius: token.borderRadius
                    }}
                  >
                    {chromium.raw}
                  </pre>
                )
              }
            ]}
          />
        </>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('diagnostics.graphics.chromium.pending')}
        />
      )}
    </div>
  )

  const logTab = (
    <div style={{ height: contentHeight, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBlockEnd: 8
        }}
      >
        <Segmented<LogFilter>
          size="small"
          value={filter}
          onChange={setFilter}
          options={[
            { label: t('diagnostics.log.filter.all'), value: 'all' },
            { label: t('diagnostics.log.filter.info'), value: 'info' },
            { label: t('diagnostics.log.filter.warn'), value: 'warn' },
            { label: t('diagnostics.log.filter.error'), value: 'error' }
          ]}
        />
        <Button
          size="small"
          icon={<FolderOpenOutlined />}
          disabled={!system}
          onClick={() => {
            if (system) openPath(system.paths.logs)
          }}
        >
          {t('diagnostics.log.openFile')}
        </Button>
      </div>

      <div
        ref={logScroll}
        onScroll={handleLogScroll}
        className="bico-scroll-y bico-selectable"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadius,
          padding: 8
        }}
      >
        {filtered.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('diagnostics.log.empty')} />
        ) : (
          filtered.map((record, index) => (
            <div
              key={`${record.time}-${index}`}
              className="bico-mono"
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'baseline',
                fontSize: 11,
                lineHeight: 1.7,
                overflowWrap: 'anywhere'
              }}
            >
              <span style={{ color: token.colorTextTertiary, flex: '0 0 auto' }}>
                {logTime(record.time)}
              </span>
              <Tag
                color={LEVEL_COLOR[record.level]}
                style={{ marginInlineEnd: 0, flex: '0 0 auto', fontSize: 10, lineHeight: '16px' }}
              >
                {t(LEVEL_LABEL[record.level])}
              </Tag>
              <span style={{ color: token.colorTextTertiary, flex: '0 0 auto' }}>
                {record.scope}
              </span>
              <span style={{ minWidth: 0 }}>{record.message}</span>
            </div>
          ))
        )}
      </div>

      <Text type="secondary" style={{ fontSize: 11, marginBlockStart: 6 }}>
        {t('diagnostics.log.follow')}
      </Text>
    </div>
  )

  const preferencesTab = (
    <div className="bico-scroll-y" style={{ maxHeight: contentHeight, paddingInlineEnd: 4 }}>
      <ThemesSection />

      {sectionHeading(<TranslationOutlined />, 'teal', t('appearance.language.title'))}

      {settingRow(
        t('appearance.language.select'),
        t('appearance.language.hint'),
        <Select<LanguageCode>
          size="small"
          value={language}
          style={{ minWidth: 150 }}
          onChange={(value) => savePrefs({ language: value })}
          options={LANGUAGES.map((entry) => ({ label: entry.nativeName, value: entry.code }))}
        />
      )}

      <Text type="secondary" style={{ fontSize: 11 }}>
        {t('appearance.language.rtl')}
      </Text>

      {sectionHeading(<PictureOutlined />, 'orange', t('diagnostics.prefs.interface'))}

      {settingRow(
        t('diagnostics.prefs.compact'),
        t('diagnostics.prefs.compactHint'),
        <Switch checked={compactUi} onChange={(checked) => savePrefs({ compactUi: checked })} />
      )}

      {settingRow(
        t('diagnostics.prefs.queueView'),
        t('diagnostics.prefs.queueViewHint'),
        <Segmented<QueueView>
          size="small"
          value={queueView}
          onChange={(value) => savePrefs({ queueView: value })}
          options={[
            { label: t('diagnostics.prefs.queueView.table'), value: 'table' },
            { label: t('diagnostics.prefs.queueView.grid'), value: 'grid' }
          ]}
        />
      )}

      {sectionHeading(<BellOutlined />, 'rose', t('diagnostics.prefs.behaviour'))}

      {settingRow(
        t('diagnostics.prefs.confirm'),
        t('diagnostics.prefs.confirmHint'),
        <Switch
          checked={confirmBeforeRun}
          onChange={(checked) => savePrefs({ confirmBeforeRun: checked })}
        />
      )}

      {settingRow(
        t('diagnostics.prefs.notify'),
        t('diagnostics.prefs.notifyHint'),
        <Switch
          checked={notifyOnComplete}
          onChange={(checked) => savePrefs({ notifyOnComplete: checked })}
        />
      )}

      {settingRow(
        t('diagnostics.prefs.openOutput'),
        t('diagnostics.prefs.openOutputHint'),
        <Switch
          checked={openOutputWhenDone}
          onChange={(checked) => savePrefs({ openOutputWhenDone: checked })}
        />
      )}

      {settingRow(
        t('diagnostics.prefs.taskbar'),
        t('diagnostics.prefs.taskbarHint'),
        <Switch
          checked={taskbarProgress}
          onChange={(checked) => savePrefs({ taskbarProgress: checked })}
        />
      )}

      {settingRow(
        t('diagnostics.prefs.tray'),
        t('diagnostics.prefs.trayHint'),
        <Switch
          checked={minimiseToTray}
          onChange={(checked) => savePrefs({ minimiseToTray: checked })}
        />
      )}

      {sectionHeading(<CloudDownloadOutlined />, 'green', t('diagnostics.updates.title'))}

      {settingRow(
        t('diagnostics.updates.auto'),
        t('diagnostics.updates.autoHint'),
        <Switch
          checked={autoCheckUpdates}
          onChange={(checked) => savePrefs({ autoCheckUpdates: checked })}
        />
      )}

      <div style={{ paddingBlockStart: 4 }}>
        <Space size={8} wrap style={{ marginBlockEnd: 8 }}>
          <Button
            icon={<ReloadOutlined />}
            loading={checking || update.state === 'checking'}
            onClick={handleCheckUpdates}
          >
            {t('diagnostics.updates.check')}
          </Button>
          {update.state === 'available' && !update.manualDownload ? (
            <Button type="primary" onClick={() => void window.bico.updates.download()}>
              {t('diagnostics.updates.download', { version: update.version })}
            </Button>
          ) : null}
          {update.state === 'available' && update.manualDownload ? (
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={() => void window.bico.system.openExternal(update.releaseUrl)}
            >
              {t('diagnostics.updates.openPage', { version: update.version })}
            </Button>
          ) : null}
          {update.state === 'downloaded' ? (
            <Button type="primary" onClick={() => void window.bico.updates.install()}>
              {t('diagnostics.updates.install')}
            </Button>
          ) : null}
        </Space>

        <div>
          <Text type={update.state === 'error' ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
            {update.state === 'error' && update.error
              ? update.error
              : update.state === 'available' && update.manualDownload
                ? t('diagnostics.updates.manualHint', { version: update.version })
                : t(UPDATE_MESSAGE_KEY[update.state])}
          </Text>
        </div>

        {update.state === 'downloading' ? (
          <Progress
            percent={Math.round(update.percent)}
            size="small"
            style={{ marginBlockStart: 6 }}
          />
        ) : null}

        {update.releaseNotes ? (
          <Alert
            type="info"
            style={{ marginBlockStart: 10 }}
            title={t('diagnostics.updates.notes', { version: update.version })}
            description={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {update.releaseNotes}
              </Text>
            }
          />
        ) : null}
      </div>
    </div>
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      // The panel belongs on the inline end of the window, which is the left
      // edge once the interface is flipped for a right to left language.
      placement={direction === 'rtl' ? 'left' : 'right'}
      title={t('diagnostics.title')}
      size={Math.min(640, Math.max(320, width - 48))}
      styles={{ body: { paddingTop: 12 } }}
    >
      {open ? (
        <Tabs
          defaultActiveKey="environment"
          items={[
            {
              key: 'environment',
              label: tabLabel(<ProfileOutlined />, 'cyan', t('diagnostics.tab.environment')),
              children: environmentTab
            },
            {
              key: 'graphics',
              label: tabLabel(<ThunderboltOutlined />, 'amber', t('diagnostics.tab.graphics')),
              children: graphicsTab
            },
            {
              key: 'log',
              label: tabLabel(<FileTextOutlined />, 'green', t('diagnostics.tab.log')),
              children: logTab
            },
            {
              key: 'preferences',
              label: tabLabel(<SettingOutlined />, 'violet', t('diagnostics.tab.preferences')),
              children: preferencesTab
            }
          ]}
        />
      ) : null}
    </Drawer>
  )
}
