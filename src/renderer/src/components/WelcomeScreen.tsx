import { useMemo, useState } from 'react'
import { Button, Checkbox, Modal, Tag, Typography } from 'antd'
import {
  ArrowRightOutlined,
  BgColorsOutlined,
  CheckCircleFilled,
  DatabaseOutlined,
  EyeOutlined,
  GlobalOutlined,
  PictureOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { RELEASE_HIGHLIGHTS, RELEASE_VERSION } from '@shared/highlights'
import { savePrefs } from '../store/bridge'
import { useAppStore } from '../store/useAppStore'
import { useLocale, useT } from '../i18n'
import type { TranslationKey } from '../i18n'
import { Glyph, type GlyphTone } from './Glyph'
import logoUrl from '../../../../resources/icon.png'

const { Paragraph, Text, Title } = Typography

/** One icon per highlight, keyed by the id in the shared list. */
const HIGHLIGHT_ICONS: Record<string, React.JSX.Element> = {
  threads: <ThunderboltOutlined />,
  gpu: <DatabaseOutlined />,
  formats: <PictureOutlined />,
  preview: <EyeOutlined />,
  languages: <GlobalOutlined />,
  themes: <BgColorsOutlined />
}

interface WelcomeScreenProps {
  open: boolean
  onClose: () => void
}

/**
 * First run and post upgrade welcome.
 *
 * It exists to answer three questions in the first ten seconds: what is this,
 * what changed, and did it find my hardware. The last one matters more than it
 * sounds. A user who never opens the diagnostics panel has no way of knowing the
 * GPU lane is doing anything, and a converter that silently ignores a discrete
 * card looks identical to one that never had support at all.
 */
export function WelcomeScreen(props: WelcomeScreenProps): React.JSX.Element {
  const { open, onClose } = props
  const t = useT()
  const { n } = useLocale()

  const system = useAppStore((state) => state.system)
  const gpu = useAppStore((state) => state.gpu)

  const [dontShow, setDontShow] = useState(true)
  const activeAdapter = useMemo(
    () => gpu?.adapters.find((adapter) => adapter.active) ?? gpu?.adapters[0] ?? null,
    [gpu]
  )

  const dismiss = (): void => {
    // Recording the version rather than a flag means an upgrade shows this once
    // more, which is the only moment it has anything new to say.
    savePrefs({ welcomeSeenVersion: dontShow ? RELEASE_VERSION : '' })
    onClose()
  }

  const facts: { key: TranslationKey; value: string; tone: GlyphTone; icon: React.JSX.Element }[] =
    []

  if (system) {
    facts.push({
      key: 'welcome.fact.processor',
      value: t('welcome.fact.processorValue', {
        cpu: system.os.cpuModel,
        threads: n(system.os.cpuCores)
      }),
      tone: 'cyan',
      icon: <ThunderboltOutlined />
    })
    facts.push({
      key: 'welcome.fact.workers',
      value: t('welcome.fact.workersValue', { count: n(system.imaging.concurrency) }),
      tone: 'teal',
      icon: <DatabaseOutlined />
    })
  }

  facts.push(
    activeAdapter
      ? {
          key: 'welcome.fact.graphics',
          value: activeAdapter.description,
          tone: 'violet',
          icon: <PictureOutlined />
        }
      : {
          key: 'welcome.fact.graphics',
          value: t('welcome.fact.graphicsNone'),
          tone: 'slate',
          icon: <PictureOutlined />
        }
  )

  return (
    <Modal
      open={open}
      onCancel={dismiss}
      footer={null}
      width={720}
      centered
      destroyOnHidden
      closable={false}
      classNames={{ body: 'bico-welcome' }}
    >
      <div className="bico-welcome-in">
        <header className="bico-welcome-hero" style={{ ['--i' as string]: 0 }}>
          <img src={logoUrl} alt="" width={72} height={72} className="bico-welcome-mark" />
          <div style={{ minWidth: 0 }}>
            <Title level={2} style={{ margin: 0, letterSpacing: '0.04em' }}>
              {t('app.name')}
            </Title>
            <Text type="secondary">{t('app.tagline')}</Text>
            <div style={{ marginTop: 6 }}>
              <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                {t('welcome.version', { version: system?.app.version ?? RELEASE_VERSION })}
              </Tag>
            </div>
          </div>
        </header>

        <Paragraph type="secondary" className="bico-welcome-row" style={{ ['--i' as string]: 1 }}>
          {t('welcome.intro')}
        </Paragraph>

        <section
          className="bico-welcome-row bico-welcome-facts"
          style={{ ['--i' as string]: 2 }}
          aria-label={t('welcome.facts.aria')}
        >
          {facts.map((fact) => (
            <div key={fact.key} className="bico-welcome-fact">
              <Glyph icon={fact.icon} tone={fact.tone} size="md" />
              <div style={{ minWidth: 0 }}>
                <div className="bico-welcome-fact-label">{t(fact.key)}</div>
                <div className="bico-welcome-fact-value bico-truncate" title={fact.value}>
                  {fact.value}
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="bico-section-title bico-welcome-row" style={{ ['--i' as string]: 3 }}>
          {t('welcome.whatsNew', { version: RELEASE_VERSION })}
        </div>

        <ul className="bico-welcome-list">
          {RELEASE_HIGHLIGHTS.map((highlight, index) => (
            <li
              key={highlight.id}
              className="bico-welcome-row bico-welcome-item"
              style={{ ['--i' as string]: 4 + index }}
            >
              <Glyph
                icon={HIGHLIGHT_ICONS[highlight.id] ?? <CheckCircleFilled />}
                tone={highlight.tone}
                size="md"
              />
              <div style={{ minWidth: 0 }}>
                <div className="bico-welcome-item-title">
                  {t(highlight.titleKey as TranslationKey)}
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {t(highlight.bodyKey as TranslationKey)}
                </Text>
              </div>
            </li>
          ))}
        </ul>

        <footer
          className="bico-welcome-row bico-welcome-footer"
          style={{ ['--i' as string]: 4 + RELEASE_HIGHLIGHTS.length }}
        >
          <Checkbox checked={dontShow} onChange={(event) => setDontShow(event.target.checked)}>
            {t('welcome.dontShowAgain')}
          </Checkbox>

          <Button type="primary" size="large" onClick={dismiss} icon={<ArrowRightOutlined />}>
            {t('welcome.start')}
          </Button>
        </footer>
      </div>
    </Modal>
  )
}
