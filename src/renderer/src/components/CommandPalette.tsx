import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Input, Modal, Typography } from 'antd'
import {
  AppstoreOutlined,
  BgColorsOutlined,
  FileAddOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  StarOutlined
} from '@ant-design/icons'
import {
  cancelConversion,
  clearQueue,
  openExternal,
  pickAndAddFiles,
  pickAndAddFolder,
  pickOutputFolder,
  pickZipPath,
  removeSelected,
  startConversion,
  togglePause
} from '../actions'
import { savePrefs } from '../store/bridge'
import { useAppStore } from '../store/useAppStore'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useT } from '../i18n'
import type { TranslationKey } from '../i18n'
import { Glyph } from './Glyph'
import type { GlyphTone } from './Glyph'
import type { InputRef } from 'antd'

const { Text } = Typography

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

type SectionId = 'files' | 'conversion' | 'panels' | 'appearance' | 'presets' | 'help'

interface SectionMeta {
  labelKey: TranslationKey
  icon: React.JSX.Element
  tone: GlyphTone
}

/**
 * One glyph and one tone per section.
 *
 * The list is long enough that reading every row is slower than recognising a
 * colour, which is the whole reason the rows carry an icon at all.
 */
const SECTIONS: Record<SectionId, SectionMeta> = {
  files: { labelKey: 'palette.section.files', icon: <FileAddOutlined />, tone: 'accent' },
  conversion: {
    labelKey: 'palette.section.conversion',
    icon: <PlayCircleOutlined />,
    tone: 'green'
  },
  panels: { labelKey: 'palette.section.panels', icon: <AppstoreOutlined />, tone: 'violet' },
  appearance: {
    labelKey: 'palette.section.appearance',
    icon: <BgColorsOutlined />,
    tone: 'pink'
  },
  presets: { labelKey: 'palette.section.presets', icon: <StarOutlined />, tone: 'amber' },
  help: { labelKey: 'palette.section.help', icon: <QuestionCircleOutlined />, tone: 'cyan' }
}

interface Command {
  id: string
  name: string
  section: SectionId
  sectionLabel: string
  /** Extra words the search should match, beyond the visible name. */
  keywords: string
  shortcut: string
  run: () => void
}

/** What a command is before the dictionary and the store are applied to it. */
interface CommandSpec {
  id: string
  nameKey: TranslationKey
  keywordsKey: TranslationKey
  section: SectionId
  shortcut: string
  run: () => void
}

const REPO_URL = 'https://github.com/shehari007/BICO-bulk-image-converter-optimizer-tool'

/** Menu accelerators are written with the platform modifier, so labels match. */
const ACCEL = navigator.userAgent.includes('Mac') ? 'Cmd' : 'Ctrl'

const ROW_HEIGHT = 40

/** Case insensitive subsequence test, so `bwb` still finds `Balanced Web`. */
function isSubsequence(query: string, haystack: string): boolean {
  let cursor = 0
  for (const character of haystack) {
    if (character === query[cursor]) cursor += 1
    if (cursor === query.length) return true
  }
  return cursor === query.length
}

/**
 * Lower is better, negative means no match.
 *
 * A prefix hit on the visible name always wins, because typing the first few
 * letters of a command you already know should never be outranked by a keyword
 * buried in something else.
 */
function score(query: string, command: Command): number {
  if (!query) return 0

  const name = command.name.toLowerCase()
  const haystack = `${name} ${command.keywords} ${command.sectionLabel.toLowerCase()}`
  const at = name.indexOf(query)

  if (at === 0) return 0
  if (at > 0) return 1
  if (haystack.includes(query)) return 2
  return isSubsequence(query, haystack) ? 3 : -1
}

/**
 * Every action in the app, reachable from one search field.
 *
 * The entries call into the actions module and the store rather than
 * reimplementing anything, so a command and the toolbar button beside it can
 * never drift apart.
 */
export function CommandPalette(props: CommandPaletteProps): React.JSX.Element {
  const { open, onClose } = props

  const { width } = useBreakpoint()
  const t = useT()
  const presets = useAppStore((state) => state.presets)
  const applyPreset = useAppStore((state) => state.applyPreset)
  const setPanel = useAppStore((state) => state.setPanel)

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<InputRef | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const commands = useMemo<Command[]>(() => {
    const panel =
      (id: 'about' | 'diagnostics' | 'history' | 'presets' | 'preview' | 'watch') => (): void =>
        setPanel(id)

    const specs: CommandSpec[] = [
      {
        id: 'add-files',
        nameKey: 'palette.command.addFiles',
        keywordsKey: 'palette.command.addFiles.keywords',
        section: 'files',
        shortcut: `${ACCEL} O`,
        run: () => void pickAndAddFiles()
      },
      {
        id: 'add-folder',
        nameKey: 'palette.command.addFolder',
        keywordsKey: 'palette.command.addFolder.keywords',
        section: 'files',
        shortcut: `${ACCEL} Shift O`,
        run: () => void pickAndAddFolder()
      },
      {
        id: 'output-folder',
        nameKey: 'palette.command.outputFolder',
        keywordsKey: 'palette.command.outputFolder.keywords',
        section: 'files',
        shortcut: `${ACCEL} D`,
        run: () => void pickOutputFolder()
      },
      {
        id: 'output-zip',
        nameKey: 'palette.command.outputZip',
        keywordsKey: 'palette.command.outputZip.keywords',
        section: 'files',
        shortcut: '',
        run: () => void pickZipPath()
      },
      {
        id: 'remove-selected',
        nameKey: 'palette.command.removeSelected',
        keywordsKey: 'palette.command.removeSelected.keywords',
        section: 'files',
        shortcut: 'Delete',
        run: removeSelected
      },
      {
        id: 'clear-queue',
        nameKey: 'palette.command.clearQueue',
        keywordsKey: 'palette.command.clearQueue.keywords',
        section: 'files',
        shortcut: `${ACCEL} Backspace`,
        run: clearQueue
      },
      {
        id: 'start',
        nameKey: 'palette.command.start',
        keywordsKey: 'palette.command.start.keywords',
        section: 'conversion',
        shortcut: `${ACCEL} Enter`,
        run: () => void startConversion()
      },
      {
        id: 'pause',
        nameKey: 'palette.command.pause',
        keywordsKey: 'palette.command.pause.keywords',
        section: 'conversion',
        shortcut: `${ACCEL} P`,
        run: () => void togglePause()
      },
      {
        id: 'cancel',
        nameKey: 'palette.command.cancel',
        keywordsKey: 'palette.command.cancel.keywords',
        section: 'conversion',
        shortcut: 'Esc',
        run: () => void cancelConversion()
      },
      {
        id: 'panel-preview',
        nameKey: 'palette.command.panelPreview',
        keywordsKey: 'palette.command.panelPreview.keywords',
        section: 'panels',
        shortcut: `${ACCEL} L`,
        run: panel('preview')
      },
      {
        id: 'panel-presets',
        nameKey: 'palette.command.panelPresets',
        keywordsKey: 'palette.command.panelPresets.keywords',
        section: 'panels',
        shortcut: `${ACCEL} Shift P`,
        run: panel('presets')
      },
      {
        id: 'panel-watch',
        nameKey: 'palette.command.panelWatch',
        keywordsKey: 'palette.command.panelWatch.keywords',
        section: 'panels',
        shortcut: '',
        run: panel('watch')
      },
      {
        id: 'panel-history',
        nameKey: 'palette.command.panelHistory',
        keywordsKey: 'palette.command.panelHistory.keywords',
        section: 'panels',
        shortcut: '',
        run: panel('history')
      },
      {
        id: 'panel-diagnostics',
        nameKey: 'palette.command.panelDiagnostics',
        keywordsKey: 'palette.command.panelDiagnostics.keywords',
        section: 'panels',
        shortcut: '',
        run: panel('diagnostics')
      },
      {
        id: 'panel-about',
        nameKey: 'palette.command.panelAbout',
        keywordsKey: 'palette.command.panelAbout.keywords',
        section: 'panels',
        shortcut: '',
        run: panel('about')
      },
      {
        id: 'theme-dark',
        nameKey: 'palette.command.themeDark',
        keywordsKey: 'palette.command.themeDark.keywords',
        section: 'appearance',
        shortcut: '',
        run: () => savePrefs({ theme: 'dark' })
      },
      {
        id: 'theme-light',
        nameKey: 'palette.command.themeLight',
        keywordsKey: 'palette.command.themeLight.keywords',
        section: 'appearance',
        shortcut: '',
        run: () => savePrefs({ theme: 'light' })
      },
      {
        id: 'theme-system',
        nameKey: 'palette.command.themeSystem',
        keywordsKey: 'palette.command.themeSystem.keywords',
        section: 'appearance',
        shortcut: '',
        run: () => savePrefs({ theme: 'system' })
      },
      {
        id: 'view-table',
        nameKey: 'palette.command.viewTable',
        keywordsKey: 'palette.command.viewTable.keywords',
        section: 'appearance',
        shortcut: '',
        run: () => savePrefs({ queueView: 'table' })
      },
      {
        id: 'view-grid',
        nameKey: 'palette.command.viewGrid',
        keywordsKey: 'palette.command.viewGrid.keywords',
        section: 'appearance',
        shortcut: '',
        run: () => savePrefs({ queueView: 'grid' })
      },
      {
        id: 'toggle-sidebar',
        nameKey: 'palette.command.toggleSidebar',
        keywordsKey: 'palette.command.toggleSidebar.keywords',
        section: 'appearance',
        shortcut: `${ACCEL} B`,
        run: () => {
          const store = useAppStore.getState()
          store.setSidebarOpen(!store.sidebarOpen)
        }
      },
      {
        id: 'help-docs',
        nameKey: 'palette.command.help',
        keywordsKey: 'palette.command.help.keywords',
        section: 'help',
        shortcut: '',
        run: () => void openExternal(REPO_URL)
      }
    ]

    const base = specs.map<Command>((spec) => ({
      id: spec.id,
      name: t(spec.nameKey),
      section: spec.section,
      sectionLabel: t(SECTIONS[spec.section].labelKey),
      keywords: t(spec.keywordsKey).toLowerCase(),
      shortcut: spec.shortcut,
      run: spec.run
    }))

    const presetCommands = presets.map<Command>((preset) => ({
      id: `preset-${preset.id}`,
      name: t('palette.command.applyPreset', { name: preset.name }),
      section: 'presets',
      sectionLabel: t(SECTIONS.presets.labelKey),
      keywords: `${preset.name.toLowerCase()} ${preset.description.toLowerCase()}`,
      shortcut: '',
      run: () => applyPreset(preset)
    }))

    return [...base, ...presetCommands]
  }, [applyPreset, presets, setPanel, t])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return commands
      .map((command) => ({ command, rank: score(needle, command) }))
      .filter((entry) => entry.rank >= 0)
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => entry.command)
  }, [commands, query])

  // Typing narrows the list under the cursor, so the highlight is clamped here
  // rather than corrected afterwards, which would render one frame out of range.
  const last = Math.max(0, results.length - 1)
  const activeIndex = Math.min(active, last)
  const activeCommand = results[activeIndex] ?? null

  useEffect(() => {
    const row = listRef.current?.children[activeIndex]
    row?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const runAt = useCallback(
    (index: number): void => {
      const command = results[index]
      if (!command) return
      // Close first so a command that opens a dialog or another panel is not
      // fighting this modal for focus.
      onClose()
      command.run()
    },
    [onClose, results]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      switch (event.key) {
        case 'ArrowDown':
          setActive(activeIndex >= last ? 0 : activeIndex + 1)
          break
        case 'ArrowUp':
          setActive(activeIndex <= 0 ? last : activeIndex - 1)
          break
        case 'Home':
          setActive(0)
          break
        case 'End':
          setActive(last)
          break
        case 'Enter':
          runAt(activeIndex)
          break
        case 'Escape':
          onClose()
          break
        default:
          return
      }

      event.preventDefault()
    },
    [activeIndex, last, onClose, runAt]
  )

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      closable={false}
      destroyOnHidden
      width={Math.min(640, Math.max(300, width - 48))}
      style={{ top: 72 }}
      styles={{ body: { padding: 0 } }}
      afterOpenChange={(isOpen) => {
        // Resetting on the way out rather than on the way in means the next
        // opening is already clean, with no stale query visible for a frame.
        if (isOpen) inputRef.current?.focus()
        else {
          setQuery('')
          setActive(0)
        }
      }}
    >
      <div
        style={{
          paddingBlock: 6,
          paddingInline: 12,
          borderBottom: '1px solid var(--bico-border)'
        }}
      >
        <Input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={handleKeyDown}
          variant="borderless"
          size="large"
          prefix={<Glyph bare icon={<SearchOutlined />} tone="accent" size="md" />}
          placeholder={t('palette.search.placeholder')}
          aria-label={t('palette.search.aria')}
          aria-activedescendant={activeCommand ? `bico-command-${activeCommand.id}` : undefined}
          role="combobox"
          aria-expanded
          aria-controls="bico-command-list"
        />
      </div>

      <div
        id="bico-command-list"
        ref={listRef}
        role="listbox"
        aria-label={t('palette.list.aria')}
        className="bico-scroll-y"
        style={{ maxHeight: 'min(52vh, 420px)', padding: 6 }}
      >
        {results.map((command, index) => {
          const isActive = index === active
          const meta = SECTIONS[command.section]
          return (
            <div
              key={command.id}
              id={`bico-command-${command.id}`}
              role="option"
              aria-selected={isActive}
              onMouseEnter={() => setActive(index)}
              onClick={() => runAt(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minHeight: ROW_HEIGHT,
                paddingInline: 10,
                borderRadius: 8,
                cursor: 'pointer',
                background: isActive ? 'var(--bico-surface-overlay)' : undefined
              }}
            >
              <Glyph bare icon={meta.icon} tone={meta.tone} size="md" />

              <span className="bico-truncate" style={{ flex: '1 1 auto' }}>
                {command.name}
              </span>

              <span
                style={{
                  flex: '0 0 auto',
                  fontSize: 11,
                  color: 'var(--bico-text-muted)'
                }}
              >
                {command.sectionLabel}
              </span>

              {command.shortcut && (
                <kbd
                  className="bico-mono"
                  dir="ltr"
                  style={{
                    flex: '0 0 auto',
                    fontSize: 11,
                    paddingBlock: 2,
                    paddingInline: 7,
                    borderRadius: 6,
                    border: '1px solid var(--bico-border)',
                    color: 'var(--bico-text-secondary)'
                  }}
                >
                  {command.shortcut}
                </kbd>
              )}
            </div>
          )
        })}

        {results.length === 0 && (
          <div
            style={{
              display: 'grid',
              justifyItems: 'center',
              gap: 8,
              paddingBlock: 18,
              paddingInline: 12,
              textAlign: 'center'
            }}
          >
            <Glyph icon={<SearchOutlined />} tone="slate" size="lg" />
            <Text type="secondary">{t('palette.empty')}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {t('palette.empty.hint')}
            </Text>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          paddingBlock: 8,
          paddingInline: 12,
          borderTop: '1px solid var(--bico-border)',
          fontSize: 11,
          color: 'var(--bico-text-muted)'
        }}
      >
        <span>{t('palette.hint.move')}</span>
        <span>{t('palette.hint.run')}</span>
        <span>{t('palette.hint.close')}</span>
      </div>
    </Modal>
  )
}
