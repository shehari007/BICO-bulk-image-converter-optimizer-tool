import { useEffect, useMemo, useState, version as reactVersion } from 'react'
import {
  Alert,
  Button,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  theme,
  version as antdVersion,
  type TableColumnsType
} from 'antd'
import {
  ApiOutlined,
  BugOutlined,
  CheckCircleOutlined,
  CoffeeOutlined,
  FileImageOutlined,
  GithubOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  RocketOutlined,
  UserOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { FORMATS, OUTPUT_FORMAT_IDS } from '@shared/formats'
import type { FormatCapabilities, OutputFormat, SystemInfo } from '@shared/types'
import { Glyph, type GlyphTone } from '../Glyph'
import { useAppStore } from '../../store/useAppStore'
import { formatCopyKey, useLocale, useT, type Translate, type TranslationKey } from '../../i18n'
// The real product mark rather than a stand in icon, resolved by the bundler
// from the shared resources folder the installer also ships.
import logoUrl from '../../../../../resources/icon.png'

const { Paragraph, Text, Title } = Typography

const REPOSITORY_URL = 'https://github.com/shehari007/BICO-bulk-image-converter-optimizer-tool'
const ISSUES_URL = `${REPOSITORY_URL}/issues`
const AUTHOR_URL = 'https://github.com/shehari007'
const SPONSOR_URL = 'https://www.buymeacoffee.com/shehari007'

const LOGO_SIZE = 64

/** Matches the icon size Ant Design gives an alert that carries a description. */
const ALERT_ICON_SIZE = 24

/** What this release does that the previous one could not. */
const HIGHLIGHT_KEYS = [
  'about.highlight.pipeline',
  'about.highlight.gpu',
  'about.highlight.formats',
  'about.highlight.preview',
  'about.highlight.sizeTarget',
  'about.highlight.variants',
  'about.highlight.watch'
] as const satisfies readonly TranslationKey[]

interface AboutPanelProps {
  open: boolean
  onClose: () => void
}

interface FormatRow {
  key: OutputFormat
  caps: FormatCapabilities
  /** Null when the running build did not report on this codec at all. */
  read: boolean | null
  write: boolean | null
}

interface CreditEntry {
  name: string
  roleKey: TranslationKey
  version: string
  url: string
  tone: GlyphTone
  /** Used where a project has no version number to quote, such as WebGPU. */
  note: string
}

function openLink(url: string): void {
  // The renderer has no browser of its own, every outbound link goes to the
  // shell through the preload bridge.
  void window.bico.system.openExternal(url)
}

/** Platform names as people actually say them, matching the window title. */
function platformName(platform: string, t: Translate): string {
  switch (platform) {
    case 'win32':
      return t('about.platform.windows')
    case 'darwin':
      return t('about.platform.macos')
    case 'linux':
      return t('about.platform.linux')
    default:
      return platform
  }
}

/** Architecture names people recognise from a download page. */
function archName(arch: string): string {
  return arch === 'ia32' ? 'x86' : arch
}

function capabilityTags(
  caps: FormatCapabilities,
  t: Translate,
  n: (value: number) => string
): string[] {
  const tags: string[] = []
  if (caps.quality) tags.push(t('about.capability.quality'))
  if (caps.lossless) tags.push(t('about.capability.lossless'))
  if (caps.alpha) tags.push(t('about.capability.alpha'))
  if (caps.animation) tags.push(t('about.capability.animation'))
  if (caps.progressive) tags.push(t('about.capability.progressive'))
  if (caps.chroma) tags.push(t('about.capability.chroma'))
  if (caps.hdr) tags.push(t('about.capability.hdr'))
  if (caps.metadata) tags.push(t('about.capability.metadata'))
  if (caps.effort) {
    tags.push(t('about.capability.effort', { min: n(caps.effort.min), max: n(caps.effort.max) }))
  }
  if (caps.browserEncodable) tags.push(t('about.capability.gpuEncode'))
  return tags
}

function creditList(system: SystemInfo | null, gpuSummary: string): CreditEntry[] {
  return [
    {
      name: 'libvips',
      roleKey: 'about.credits.libvips',
      version: system?.imaging.libvips ?? '',
      url: 'https://www.libvips.org',
      tone: 'green',
      note: ''
    },
    {
      name: 'sharp',
      roleKey: 'about.credits.sharp',
      version: system?.imaging.sharp ?? '',
      url: 'https://sharp.pixelplumbing.com',
      tone: 'cyan',
      note: ''
    },
    {
      name: 'Electron',
      roleKey: 'about.credits.electron',
      version: system?.runtime.electron ?? '',
      url: 'https://www.electronjs.org',
      tone: 'violet',
      note: ''
    },
    {
      name: 'Chromium',
      roleKey: 'about.credits.chromium',
      version: system?.runtime.chrome ?? '',
      url: 'https://www.chromium.org',
      tone: 'amber',
      note: ''
    },
    {
      name: 'React',
      roleKey: 'about.credits.react',
      version: reactVersion,
      url: 'https://react.dev',
      tone: 'teal',
      note: ''
    },
    {
      name: 'Ant Design',
      roleKey: 'about.credits.antd',
      version: antdVersion,
      url: 'https://ant.design',
      tone: 'pink',
      note: ''
    },
    {
      name: 'WebGPU',
      roleKey: 'about.credits.webgpu',
      version: '',
      url: 'https://www.w3.org/TR/webgpu/',
      tone: 'orange',
      note: gpuSummary
    },
    {
      name: 'IBM Plex',
      roleKey: 'about.credits.plex',
      version: '',
      url: 'https://www.ibm.com/plex/',
      tone: 'rose',
      note: 'SIL Open Font License 1.1'
    }
  ]
}

/**
 * The product screen.
 *
 * System information is refreshed every time the modal opens rather than being
 * read once at startup, because the imaging section reports which codecs the
 * bundled libvips actually resolved and that is the answer people come here for.
 */
export function AboutPanel(props: AboutPanelProps): React.JSX.Element {
  const { open, onClose } = props
  const { token } = theme.useToken()
  const t = useT()
  const { n, d } = useLocale()

  const storedSystem = useAppStore((state) => state.system)
  const gpu = useAppStore((state) => state.gpu)
  const [fetched, setFetched] = useState<SystemInfo | null>(null)

  // The store copy is loaded at startup and is almost always present, so it
  // stands in until the fresh read resolves and the panel never shows a spinner.
  const system = fetched ?? storedSystem

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    void window.bico.system
      .info()
      .then((info) => {
        if (!cancelled) setFetched(info)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [open])

  const rows = useMemo<FormatRow[]>(() => {
    const reported = system?.imaging.formats
    return OUTPUT_FORMAT_IDS.map((id) => {
      const support = reported ? reported[id] : undefined
      return {
        key: id,
        caps: FORMATS[id],
        read: support ? support.input : null,
        write: support ? support.output : null
      }
    })
  }, [system])

  // Build dates arrive as an ISO string, but never trust one enough to crash on.
  const buildDate = useMemo(() => {
    const raw = system?.app.buildDate ?? ''
    if (!raw) return ''
    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? raw : d(parsed.getTime(), { dateStyle: 'long' })
  }, [system, d])

  const missingWrite = rows.filter((row) => row.write === false).length

  const columns: TableColumnsType<FormatRow> = [
    {
      title: t('about.formats.column.format'),
      dataIndex: 'key',
      width: 132,
      render: (_value, row) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{row.caps.label}</div>
          <Text type="secondary" className="bico-mono" style={{ fontSize: 12 }}>
            {/* The leading dot is a neutral character with nothing strong before
                it, so an Arabic paragraph would render this as jpg followed by a
                dot unless the whole extension is isolated as one Latin run. */}
            <bdi dir="ltr">.{row.caps.extension}</bdi>
          </Text>
        </div>
      )
    },
    {
      title: t('about.formats.column.bestFor'),
      dataIndex: 'tagline',
      width: 190,
      render: (_value, row) => (
        <Text type="secondary">{t(formatCopyKey(row.caps.id, 'tagline'))}</Text>
      )
    },
    {
      title: t('about.formats.column.capabilities'),
      dataIndex: 'caps',
      width: 260,
      render: (_value, row) => (
        <Space size={[4, 4]} wrap>
          {capabilityTags(row.caps, t, n).map((tag) => (
            <Tag key={tag} style={{ marginInlineEnd: 0 }}>
              {tag}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: t('about.formats.column.availability'),
      dataIndex: 'write',
      width: 160,
      render: (_value, row) => {
        if (row.read === null || row.write === null) {
          return <Tag>{t('about.availability.notReported')}</Tag>
        }
        return (
          <Space size={[4, 4]} wrap>
            <Tag color={row.read ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
              {row.read ? t('about.availability.reads') : t('about.availability.noDecoder')}
            </Tag>
            <Tag
              color={row.write ? 'success' : 'warning'}
              icon={row.write ? undefined : <WarningOutlined />}
              style={{ marginInlineEnd: 0 }}
            >
              {row.write ? t('about.availability.writes') : t('about.availability.noEncoder')}
            </Tag>
          </Space>
        )
      }
    }
  ]

  const adapterCount = gpu?.supported ? gpu.adapters.length : 0
  const gpuSummary =
    adapterCount === 0
      ? t('about.credits.gpuNone')
      : adapterCount === 1
        ? t('about.credits.gpuOne')
        : t('about.credits.gpuMany', { count: n(adapterCount) })

  const credits = creditList(system, gpuSummary)

  const aboutTab = (
    <div className="bico-scroll-y" style={{ maxHeight: '58vh', paddingInlineEnd: 4 }}>
      <div className="bico-about-hero" style={{ flexWrap: 'wrap' }}>
        <div className="bico-about-mark">
          <img
            src={logoUrl}
            alt={t('about.hero.logoAlt')}
            width={LOGO_SIZE}
            height={LOGO_SIZE}
            style={{ display: 'block', width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 14 }}
          />
        </div>
        <div style={{ minWidth: 0, flex: '1 1 220px' }}>
          <Title level={2} style={{ margin: 0, letterSpacing: '0.06em' }}>
            {t('app.name')}
          </Title>
          <Text style={{ fontSize: 15 }}>{t('app.tagline')}</Text>
          <Space size={[6, 6]} wrap style={{ marginTop: 8 }}>
            {system ? (
              <>
                <Tag className="bico-mono" style={{ marginInlineEnd: 0 }}>
                  {t('about.build.version', { version: system.app.version })}
                </Tag>
                <Tag className="bico-mono" style={{ marginInlineEnd: 0 }}>
                  {t('about.build.platform', {
                    platform: platformName(system.os.platform, t),
                    arch: archName(system.os.arch)
                  })}
                </Tag>
                {buildDate ? (
                  <Tag style={{ marginInlineEnd: 0 }}>
                    {t('about.build.built', { date: buildDate })}
                  </Tag>
                ) : null}
              </>
            ) : (
              <Tag style={{ marginInlineEnd: 0 }}>{t('about.build.reading')}</Tag>
            )}
          </Space>
        </div>
      </div>

      <Paragraph style={{ marginTop: 16 }}>{t('about.intro')}</Paragraph>

      <div className="bico-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Glyph bare size="sm" tone="amber" icon={<RocketOutlined />} />
        {t('about.section.highlights')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {HIGHLIGHT_KEYS.map((key) => (
          <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Glyph
              bare
              size="sm"
              tone="green"
              icon={<CheckCircleOutlined />}
              style={{ marginBlockStart: 3 }}
            />
            <Text style={{ minWidth: 0 }}>{t(key)}</Text>
          </div>
        ))}
      </div>

      <div
        className="bico-section-title"
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBlockStart: 20 }}
      >
        <Glyph bare size="sm" tone="cyan" icon={<LinkOutlined />} />
        {t('about.section.links')}
      </div>
      <Space size={8} wrap>
        <Button
          icon={<Glyph bare size="sm" tone="violet" icon={<GithubOutlined />} />}
          onClick={() => openLink(REPOSITORY_URL)}
        >
          {t('about.link.repository')}
        </Button>
        <Button
          icon={<Glyph bare size="sm" tone="rose" icon={<BugOutlined />} />}
          onClick={() => openLink(ISSUES_URL)}
        >
          {t('about.link.issues')}
        </Button>
        <Button
          icon={<Glyph bare size="sm" tone="teal" icon={<UserOutlined />} />}
          onClick={() => openLink(AUTHOR_URL)}
        >
          {t('about.link.author')}
        </Button>
        <Button
          icon={<Glyph bare size="sm" tone="orange" icon={<CoffeeOutlined />} />}
          onClick={() => openLink(SPONSOR_URL)}
        >
          {t('about.link.sponsor')}
        </Button>
      </Space>

      <Paragraph type="secondary" style={{ marginTop: 20, marginBottom: 0, fontSize: 12 }}>
        {t('about.licence')}
      </Paragraph>
    </div>
  )

  const formatsTab = (
    <div className="bico-scroll-y" style={{ maxHeight: '58vh', paddingInlineEnd: 4 }}>
      <Alert
        type={missingWrite > 0 ? 'warning' : 'info'}
        showIcon
        icon={
          <Glyph
            bare
            tone={missingWrite > 0 ? 'amber' : 'cyan'}
            icon={missingWrite > 0 ? <WarningOutlined /> : <InfoCircleOutlined />}
            style={{ fontSize: ALERT_ICON_SIZE }}
          />
        }
        style={{ marginBottom: 12 }}
        title={
          missingWrite === 0
            ? t('about.formats.allAvailable')
            : missingWrite === 1
              ? t('about.formats.missingOne')
              : t('about.formats.missingMany', { count: n(missingWrite) })
        }
        description={t('about.formats.note')}
      />
      <Table<FormatRow>
        columns={columns}
        dataSource={rows}
        rowKey="key"
        size="small"
        pagination={false}
        scroll={{ x: 700 }}
      />
    </div>
  )

  const creditsTab = (
    <div className="bico-scroll-y" style={{ maxHeight: '58vh', paddingInlineEnd: 4 }}>
      <Paragraph type="secondary" style={{ marginTop: 0 }}>
        {t('about.credits.intro')}
      </Paragraph>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {credits.map((credit) => (
          <div
            key={credit.name}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'baseline',
              gap: 8,
              paddingBottom: 12,
              borderBottom: `1px solid ${token.colorBorderSecondary}`
            }}
          >
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <Space size={8} wrap style={{ marginBottom: 2 }}>
                <Glyph size="sm" tone={credit.tone} icon={<ApiOutlined />} />
                <Text strong>{credit.name}</Text>
                {credit.version ? (
                  <Tag className="bico-mono" style={{ marginInlineEnd: 0 }}>
                    {credit.version}
                  </Tag>
                ) : (
                  <Tag style={{ marginInlineEnd: 0 }}>
                    {credit.note || t('about.credits.versionUnknown')}
                  </Tag>
                )}
              </Space>
              <div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {t(credit.roleKey)}
                </Text>
              </div>
            </div>
            <Button size="small" type="link" onClick={() => openLink(credit.url)}>
              {t('about.credits.visit')}
            </Button>
          </div>
        ))}
      </div>
      <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
        {t('about.credits.footer')}
      </Paragraph>
    </div>
  )

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Glyph size="sm" tone="accent" icon={<InfoCircleOutlined />} />
          <span className="bico-truncate">{t('about.title')}</span>
        </span>
      }
      width={760}
      centered
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      footer={
        <Button type="primary" onClick={onClose}>
          {t('action.close')}
        </Button>
      }
    >
      {open ? (
        <Tabs
          defaultActiveKey="about"
          items={[
            {
              key: 'about',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Glyph bare size="sm" tone="accent" icon={<InfoCircleOutlined />} />
                  {t('about.tab.about')}
                </span>
              ),
              children: aboutTab
            },
            {
              key: 'formats',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Glyph bare size="sm" tone="cyan" icon={<FileImageOutlined />} />
                  {t('about.tab.formats')}
                </span>
              ),
              children: formatsTab
            },
            {
              key: 'credits',
              label: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Glyph bare size="sm" tone="pink" icon={<HeartOutlined />} />
                  {t('about.tab.credits')}
                </span>
              ),
              children: creditsTab
            }
          ]}
        />
      ) : null}
    </Modal>
  )
}
