import { useCallback, useRef, useState } from 'react'
import { Button, Typography } from 'antd'
import {
  BranchesOutlined,
  FileAddOutlined,
  FileImageOutlined,
  FolderAddOutlined,
  InboxOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import { READABLE_EXTENSIONS } from '@shared/formats'
import { pickAndAddFiles, pickAndAddFolder } from '../actions'
import { useLocale, useT } from '../i18n'
import type { TranslationKey } from '../i18n'
import { Glyph } from './Glyph'
import type { GlyphTone } from './Glyph'

const { Text, Title } = Typography

/** Built from the reader list so the copy can never claim an unsupported input. */
const SUPPORTED_INPUTS = READABLE_EXTENSIONS.map((extension) => extension.toUpperCase()).join(', ')

interface Feature {
  key: TranslationKey
  icon: React.JSX.Element
  tone: GlyphTone
}

/** Three promises about what importing actually does, one glyph each. */
const FEATURES: Feature[] = [
  { key: 'dropzone.feature.recursive', icon: <BranchesOutlined />, tone: 'cyan' },
  { key: 'dropzone.feature.nondestructive', icon: <SafetyCertificateOutlined />, tone: 'green' },
  { key: 'dropzone.feature.formats', icon: <FileImageOutlined />, tone: 'violet' }
]

const FEATURE_ROW: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 10,
  marginBlockStart: 4
}

const FEATURE_CHIP: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  paddingBlock: 6,
  paddingInline: 12,
  borderRadius: 999,
  border: '1px solid var(--bico-border)',
  background: 'var(--bico-surface-raised)',
  fontSize: 12,
  color: 'var(--bico-text-secondary)'
}

/**
 * The empty state.
 *
 * Importing is deliberately not handled here. The whole window is a drop target
 * and the shell owns that handler, including the counter that dismisses the
 * full screen overlay. Claiming the event here as well would import twice, and
 * stopping it from bubbling would leave the overlay stuck on screen because the
 * shell never sees the drop that would clear it. All this component does is
 * highlight itself while a drag is over it.
 */
export function DropZone(): React.JSX.Element {
  const t = useT()
  const { n } = useLocale()

  const [over, setOver] = useState(false)
  // Drag events fire for every descendant, so only a counter can tell a real
  // exit from a move between the icon and the buttons.
  const depth = useRef(0)

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes('Files')) return
    depth.current += 1
    setOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    depth.current = Math.max(0, depth.current - 1)
    if (depth.current === 0) setOver(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    // The shell handler does the work. Only the hover styling is reset here, and
    // the event is left to bubble.
    depth.current = 0
    setOver(false)
    void event
  }, [])

  return (
    <div
      className={over ? 'bico-dropzone is-over' : 'bico-dropzone'}
      onClick={() => void pickAndAddFiles()}
      onDragEnter={handleDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Glyph icon={<InboxOutlined />} tone="accent" size="xl" style={{ marginBlockEnd: 4 }} />

      <Title level={4} style={{ margin: 0 }}>
        {t('dropzone.title')}
      </Title>

      <Text type="secondary" style={{ maxWidth: '52ch' }}>
        {t('dropzone.body')}
      </Text>

      <div style={FEATURE_ROW}>
        {FEATURES.map((feature) => (
          <span key={feature.key} style={FEATURE_CHIP}>
            <Glyph bare icon={feature.icon} tone={feature.tone} size="sm" />
            {t(feature.key, { count: n(READABLE_EXTENSIONS.length) })}
          </span>
        ))}
      </div>

      <Text type="secondary" style={{ maxWidth: '52ch', fontSize: 11 }}>
        {t('dropzone.formats', { list: SUPPORTED_INPUTS })}
      </Text>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        <Button
          type="primary"
          icon={<FileAddOutlined style={{ fontSize: 17 }} />}
          onClick={(event) => {
            event.stopPropagation()
            void pickAndAddFiles()
          }}
        >
          {t('toolbar.addImages')}
        </Button>

        <Button
          icon={<Glyph bare icon={<FolderAddOutlined />} tone="amber" size="md" />}
          onClick={(event) => {
            event.stopPropagation()
            void pickAndAddFolder()
          }}
        >
          {t('toolbar.addFolder')}
        </Button>
      </div>
    </div>
  )
}
