import { useCallback, useMemo } from 'react'
import { App as AntApp, Button, Dropdown, Progress, Tag, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import {
  AppstoreOutlined,
  BarChartOutlined,
  DesktopOutlined,
  DownOutlined,
  EyeOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  StopOutlined,
  SunOutlined
} from '@ant-design/icons'
import { FORMATS } from '@shared/formats'
import { clamp } from '@shared/utils'
import type { ThemeMode } from '@shared/types'
import {
  cancelConversion,
  pickAndAddFiles,
  pickAndAddFolder,
  startConversion,
  togglePause
} from '../actions'
import { savePrefs } from '../store/bridge'
import { useAppStore } from '../store/useAppStore'
import type { PanelId } from '../store/useAppStore'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useLocale, useT } from '../i18n'
import type { TranslationKey } from '../i18n'
import { Glyph } from './Glyph'
import type { GlyphTone } from './Glyph'
// Vite fingerprints and copies this, so the packaged renderer ships the real
// mark rather than a stand in icon that looks like every other Ant glyph.
import logoUrl from '../../../../resources/icon.png'

interface PanelAction {
  id: Exclude<PanelId, null>
  labelKey: TranslationKey
  icon: React.JSX.Element
  tone: GlyphTone
}

/**
 * The two secondary surfaces that earn a permanent button.
 *
 * Everything else moved behind the settings menu. A row of seven unlabelled
 * icons is not a navigation bar, it is a puzzle: nothing says what any of them
 * does until you hover, and they compete with the actions that matter. These
 * two stay because they answer questions people ask constantly, namely what
 * will this look like and how much have I saved.
 */
const QUICK_ACTIONS: PanelAction[] = [
  { id: 'preview', labelKey: 'toolbar.panel.preview', icon: <EyeOutlined />, tone: 'cyan' },
  { id: 'stats', labelKey: 'toolbar.panel.stats', icon: <BarChartOutlined />, tone: 'green' }
]

/** Everything reachable from the settings menu, in the order it is shown. */
const MENU_ACTIONS: PanelAction[] = [
  { id: 'presets', labelKey: 'toolbar.panel.presets', icon: <AppstoreOutlined />, tone: 'violet' },
  { id: 'watch', labelKey: 'toolbar.panel.watch', icon: <FolderOpenOutlined />, tone: 'teal' },
  { id: 'history', labelKey: 'toolbar.panel.history', icon: <HistoryOutlined />, tone: 'orange' },
  {
    id: 'diagnostics',
    labelKey: 'toolbar.panel.preferences',
    icon: <SettingOutlined />,
    tone: 'accent'
  },
  { id: 'about', labelKey: 'toolbar.panel.about', icon: <InfoCircleOutlined />, tone: 'slate' }
]

const THEME_CYCLE: ThemeMode[] = ['dark', 'light', 'system']

const THEME_META: Record<
  ThemeMode,
  { labelKey: TranslationKey; icon: React.JSX.Element; tone: GlyphTone }
> = {
  dark: { labelKey: 'toolbar.theme.dark', icon: <MoonOutlined />, tone: 'violet' },
  light: { labelKey: 'toolbar.theme.light', icon: <SunOutlined />, tone: 'amber' },
  system: { labelKey: 'toolbar.theme.system', icon: <DesktopOutlined />, tone: 'slate' }
}

const BAR_STYLE: React.CSSProperties = {
  position: 'relative',
  flex: '0 0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 58,
  paddingInline: 10,
  // A single flat fill made the bar disappear into the queue below it. The wash
  // is a tint of the live accent, so it follows the theme rather than pinning
  // one colour into the chrome.
  background:
    'linear-gradient(180deg, color-mix(in srgb, var(--bico-accent) 7%, var(--bico-surface)) 0%, var(--bico-surface) 100%)',
  borderBottom: '1px solid var(--bico-border)'
}

const GROUP_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0
}

/** A hairline between the brand and the actions, so the two groups read apart. */
const SEPARATOR_STYLE: React.CSSProperties = {
  flex: '0 0 auto',
  width: 1,
  height: 26,
  marginInline: 6,
  background: 'var(--bico-border)'
}

/** Icon size for the primary buttons, which sit on a filled or danger surface. */
const SOLID_ICON: React.CSSProperties = { fontSize: 18 }

/**
 * The command surface for the whole window.
 *
 * Everything here routes through the actions module rather than talking to the
 * bridge directly, so the menu bar, the command palette and this bar can never
 * drift apart on what an intent actually does.
 */
export function Toolbar(): React.JSX.Element {
  const { isCompact, isTiny } = useBreakpoint()
  const { modal } = AntApp.useApp()
  const t = useT()
  const { direction, n } = useLocale()

  const sidebarOpen = useAppStore((state) => state.sidebarOpen)
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen)
  const setPanel = useAppStore((state) => state.setPanel)
  const version = useAppStore((state) => state.system?.app.version ?? '')
  const theme = useAppStore((state) => state.prefs.theme)
  const confirmBeforeRun = useAppStore((state) => state.prefs.confirmBeforeRun)
  const queueCount = useAppStore((state) => state.items.length)
  const format = useAppStore((state) => state.settings.format)
  const runState = useAppStore((state) => state.progress?.state ?? 'idle')
  const percent = useAppStore((state) => state.progress?.percent ?? 0)

  const running = runState === 'running' || runState === 'paused' || runState === 'finishing'
  const paused = runState === 'paused'
  const themeMeta = THEME_META[theme]
  const themeLabel = t(themeMeta.labelKey)
  const sidebarLabel = t(sidebarOpen ? 'toolbar.sidebar.hide' : 'toolbar.sidebar.show')

  const cycleTheme = useCallback(() => {
    const index = THEME_CYCLE.indexOf(theme)
    const next = THEME_CYCLE[(index + 1) % THEME_CYCLE.length] ?? 'dark'
    savePrefs({ theme: next })
  }, [theme])

  /**
   * The confirmation exists because a run writes files. Once the user has
   * turned the preference off the intent fires straight through, which is why
   * both paths call the same action rather than duplicating the validation.
   */
  const requestStart = useCallback(() => {
    if (!confirmBeforeRun || queueCount === 0) {
      void startConversion()
      return
    }

    const single = queueCount === 1
    const content =
      format === 'original'
        ? t(single ? 'toolbar.confirm.oneOriginal' : 'toolbar.confirm.manyOriginal', {
            count: n(queueCount)
          })
        : t(single ? 'toolbar.confirm.one' : 'toolbar.confirm.many', {
            count: n(queueCount),
            format: FORMATS[format].label
          })

    modal.confirm({
      title: t('toolbar.confirm.title'),
      content,
      icon: <Glyph icon={<PlayCircleOutlined />} tone="green" size="md" />,
      okText: t('toolbar.confirm.ok'),
      cancelText: t('toolbar.confirm.cancel'),
      onOk: () => startConversion()
    })
  }, [confirmBeforeRun, format, modal, n, queueCount, t])

  /**
   * The settings menu.
   *
   * On a narrow window the two quick actions fold in here as well, so the bar
   * never has to drop a target it simply cannot show.
   */
  const menuItems = useMemo<MenuProps['items']>(() => {
    const quick = isTiny
      ? [
          ...QUICK_ACTIONS.map((action) => ({
            key: action.id,
            label: t(action.labelKey),
            icon: <Glyph bare icon={action.icon} tone={action.tone} size="sm" />
          })),
          { type: 'divider' as const }
        ]
      : []

    return [
      ...quick,
      ...MENU_ACTIONS.map((action) => ({
        key: action.id,
        label: t(action.labelKey),
        icon: <Glyph bare icon={action.icon} tone={action.tone} size="sm" />
      })),
      { type: 'divider' as const },
      {
        key: 'theme',
        label: t('toolbar.theme.cycle', { theme: themeLabel }),
        icon: <Glyph bare icon={themeMeta.icon} tone={themeMeta.tone} size="sm" />
      }
    ]
  }, [isTiny, t, themeLabel, themeMeta])

  const onMenuClick: NonNullable<MenuProps['onClick']> = ({ key }) => {
    if (key === 'theme') {
      cycleTheme()
      return
    }
    const action = [...QUICK_ACTIONS, ...MENU_ACTIONS].find((candidate) => candidate.id === key)
    if (action) setPanel(action.id)
  }

  return (
    <header style={BAR_STYLE}>
      <div style={GROUP_STYLE}>
        <Tooltip title={sidebarLabel}>
          <Button
            type="text"
            aria-label={sidebarLabel}
            icon={
              <Glyph
                bare
                icon={sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                tone="slate"
                size="md"
              />
            }
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
        </Tooltip>

        <img
          src={logoUrl}
          alt={t('toolbar.logoAlt')}
          width={26}
          height={26}
          style={{
            width: 26,
            height: 26,
            flex: '0 0 auto',
            borderRadius: 8,
            display: 'block',
            marginInlineStart: 2
          }}
        />

        {!isTiny && (
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.14em' }}>
            {t('app.name')}
          </span>
        )}

        {!isCompact && version && (
          <Tag variant="filled" style={{ marginInlineEnd: 0 }}>
            {t('toolbar.version', { version })}
          </Tag>
        )}
      </div>

      <span style={SEPARATOR_STYLE} aria-hidden="true" />

      {/*
        The three primary actions sit at the start of the bar rather than
        floating in the middle. Centring them put the most important controls in
        the least predictable place: their position shifted with the width of
        whatever happened to be beside them, and there is no convention anywhere
        that puts a toolbar's main verbs in the centre.
      */}
      <nav style={{ ...GROUP_STYLE, gap: 8 }} aria-label={t('toolbar.actions.aria')}>
        <Button
          size="large"
          icon={<FileAddOutlined style={SOLID_ICON} />}
          aria-label={t('toolbar.addImages')}
          title={t('toolbar.addImages.tooltip')}
          onClick={() => void pickAndAddFiles()}
        >
          {isCompact ? null : t('toolbar.addImages')}
        </Button>

        <Button
          size="large"
          icon={<FolderAddOutlined style={SOLID_ICON} />}
          aria-label={t('toolbar.addFolder')}
          title={t('toolbar.addFolder.tooltip')}
          onClick={() => void pickAndAddFolder()}
        >
          {isCompact ? null : t('toolbar.addFolder')}
        </Button>

        {running ? (
          <>
            <Button
              size="large"
              icon={
                paused ? (
                  <PlayCircleOutlined style={SOLID_ICON} />
                ) : (
                  <PauseCircleOutlined style={SOLID_ICON} />
                )
              }
              aria-label={t(paused ? 'toolbar.resume' : 'toolbar.pause')}
              title={t(paused ? 'toolbar.resume.tooltip' : 'toolbar.pause.tooltip')}
              disabled={runState === 'finishing'}
              onClick={() => void togglePause()}
            >
              {isTiny ? null : t(paused ? 'toolbar.resume' : 'toolbar.pause')}
            </Button>

            <Button
              size="large"
              danger
              icon={<StopOutlined style={SOLID_ICON} />}
              aria-label={t('toolbar.cancel')}
              title={t('toolbar.cancel.tooltip')}
              onClick={() => void cancelConversion()}
            >
              {isTiny ? null : t('toolbar.cancel')}
            </Button>
          </>
        ) : (
          <Button
            size="large"
            type="primary"
            icon={<PlayCircleOutlined style={SOLID_ICON} />}
            aria-label={t('toolbar.start')}
            title={t('toolbar.start.tooltip')}
            onClick={requestStart}
          >
            {isTiny ? null : t('toolbar.start')}
          </Button>
        )}
      </nav>

      {/* Pushes the secondary group to the far end without centring anything. */}
      <span style={{ flex: '1 1 auto', minWidth: 8 }} />

      <div style={GROUP_STYLE}>
        {!isTiny &&
          QUICK_ACTIONS.map((action) => {
            const label = t(action.labelKey)
            return (
              <Tooltip key={action.id} title={label}>
                <Button
                  size="large"
                  type="text"
                  aria-label={label}
                  icon={<Glyph bare icon={action.icon} tone={action.tone} size="md" />}
                  onClick={() => setPanel(action.id)}
                >
                  {isCompact ? null : label}
                </Button>
              </Tooltip>
            )
          })}

        <Dropdown
          trigger={['click']}
          // The menu hangs off the end of the bar, and which physical corner
          // that is depends on the reading direction.
          placement={direction === 'rtl' ? 'bottomLeft' : 'bottomRight'}
          menu={{ items: menuItems, onClick: onMenuClick }}
        >
          <Button
            size="large"
            aria-label={t('toolbar.settings')}
            title={t('toolbar.settings.tooltip')}
            icon={<SettingOutlined style={SOLID_ICON} />}
          >
            {isCompact ? null : t('toolbar.settings')}
            {isCompact ? null : <DownOutlined style={{ fontSize: 11, opacity: 0.7 }} />}
          </Button>
        </Dropdown>
      </div>

      {running && (
        <div
          style={{ position: 'absolute', insetInline: 0, insetBlockEnd: 0, lineHeight: 0 }}
          role="progressbar"
          aria-label={t('toolbar.progress.aria', { percent: n(Math.round(percent)) })}
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <Progress
            percent={clamp(percent, 0, 100)}
            showInfo={false}
            size={{ height: 3 }}
            strokeLinecap="butt"
            railColor="transparent"
            status={paused ? 'normal' : 'active'}
          />
        </div>
      )}
    </header>
  )
}
