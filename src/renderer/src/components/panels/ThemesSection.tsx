import { useSyncExternalStore } from 'react'
import { Button, ColorPicker, Segmented, Tooltip, Typography } from 'antd'
import { BgColorsOutlined, CheckOutlined, SkinOutlined, UndoOutlined } from '@ant-design/icons'
import { THEMES, type ThemeBase, type ThemeDefinition } from '@shared/themes'
import type { ThemeMode } from '@shared/types'
import { Glyph } from '../Glyph'
import { useT, type TranslationKey, type Translate } from '../../i18n'
import { resolveBase, resolvePalette } from '../../theme/tokens'
import { savePrefs } from '../../store/bridge'
import { useAppStore } from '../../store/useAppStore'

const { Text } = Typography

const LIGHT_QUERY = '(prefers-color-scheme: light)'

/**
 * The operating system colour preference.
 *
 * Read the same way the app shell reads it, because this section has to know
 * which base is actually in force before it can say which palette is on screen.
 * Mirroring the query into state through an effect would answer wrongly on the
 * first paint, which is exactly when the selected card is being drawn.
 */
function subscribeToScheme(onChange: () => void): () => void {
  const query = window.matchMedia(LIGHT_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function readScheme(): ThemeBase {
  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark'
}

/**
 * Translation keys for the registry entries.
 *
 * The registry keeps its English names so the main process and the diagnostics
 * report can use them without pulling the renderer dictionary in. The picker is
 * the one place a translated name is wanted, so the mapping lives here.
 */
const THEME_TEXT: Record<string, { name: TranslationKey; description: TranslationKey }> = {
  midnight: {
    name: 'appearance.theme.midnight.name',
    description: 'appearance.theme.midnight.description'
  },
  graphite: {
    name: 'appearance.theme.graphite.name',
    description: 'appearance.theme.graphite.description'
  },
  nord: { name: 'appearance.theme.nord.name', description: 'appearance.theme.nord.description' },
  dracula: {
    name: 'appearance.theme.dracula.name',
    description: 'appearance.theme.dracula.description'
  },
  forest: {
    name: 'appearance.theme.forest.name',
    description: 'appearance.theme.forest.description'
  },
  daylight: {
    name: 'appearance.theme.daylight.name',
    description: 'appearance.theme.daylight.description'
  },
  paper: { name: 'appearance.theme.paper.name', description: 'appearance.theme.paper.description' },
  contrast: {
    name: 'appearance.theme.contrast.name',
    description: 'appearance.theme.contrast.description'
  }
}

/** Falls back to the registry's own English name for a theme added after this map. */
function themeName(definition: ThemeDefinition, t: Translate): string {
  const text = THEME_TEXT[definition.id]
  return text ? t(text.name) : definition.name
}

function themeDescription(definition: ThemeDefinition, t: Translate): string {
  const text = THEME_TEXT[definition.id]
  return text ? t(text.description) : definition.description
}

/**
 * A miniature of the app drawn in one theme's palette.
 *
 * Colour dots would tell the user which hues a theme contains but not what it
 * feels like to work in. Laying the real surfaces out in the real arrangement,
 * canvas behind a sidebar and a content panel, answers the only question that
 * matters: is text readable on that background and does the accent stand out.
 * Flex direction is the writing direction, so the miniature mirrors under right
 * to left exactly as the app it depicts does.
 */
function ThemePreview(props: { definition: ThemeDefinition }): React.JSX.Element {
  const { palette, accent } = props.definition

  const bar = (width: string, colour: string, height = 4): React.JSX.Element => (
    <div style={{ width, height, borderRadius: 999, background: colour }} />
  )

  return (
    <div
      aria-hidden
      style={{
        display: 'flex',
        gap: 5,
        height: 78,
        padding: 6,
        borderRadius: 9,
        background: palette.canvas,
        border: `1px solid ${palette.border}`
      }}
    >
      <div
        style={{
          flex: '0 0 27%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          padding: 5,
          borderRadius: 6,
          background: palette.surface,
          border: `1px solid ${palette.border}`
        }}
      >
        {bar('80%', palette.textSecondary)}
        {bar('60%', palette.border)}
        {bar('70%', palette.border)}
        {bar('50%', palette.border)}
      </div>

      <div
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: 6,
          borderRadius: 6,
          background: palette.surface,
          border: `1px solid ${palette.border}`
        }}
      >
        {bar('62%', palette.textPrimary, 6)}
        {bar('88%', palette.textSecondary)}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: 4,
            borderRadius: 5,
            background: palette.surfaceRaised
          }}
        >
          <div style={{ width: 26, height: 9, borderRadius: 999, background: accent }} />
          <div style={{ width: 9, height: 9, borderRadius: 999, background: palette.gpu }} />
          <div style={{ width: 9, height: 9, borderRadius: 999, background: palette.cpu }} />
          <div style={{ flex: '1 1 auto' }} />
          <div style={{ width: 9, height: 9, borderRadius: 999, background: palette.success }} />
        </div>
      </div>
    </div>
  )
}

interface ThemeCardProps {
  definition: ThemeDefinition
  selected: boolean
  onSelect: (definition: ThemeDefinition) => void
}

function ThemeCard(props: ThemeCardProps): React.JSX.Element {
  const { definition, selected, onSelect } = props
  const t = useT()
  const name = themeName(definition, t)

  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-label={t('appearance.themes.choose', { name })}
      tabIndex={0}
      onClick={() => onSelect(definition)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(definition)
        }
      }}
      style={{
        position: 'relative',
        minWidth: 0,
        cursor: 'pointer',
        padding: 8,
        borderRadius: 12,
        background: 'var(--bico-surface-raised)',
        border: `1px solid ${selected ? 'var(--bico-accent)' : 'var(--bico-border)'}`,
        boxShadow: selected ? '0 0 0 1px var(--bico-accent)' : undefined,
        transition: 'border-color 140ms ease'
      }}
    >
      <ThemePreview definition={definition} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBlockStart: 8,
          minWidth: 0
        }}
      >
        <span className="bico-truncate" style={{ fontWeight: 600, fontSize: 13 }}>
          {name}
        </span>
        {selected ? (
          <span
            style={{
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--bico-accent)'
            }}
          >
            <CheckOutlined />
            {t('appearance.themes.inUse')}
          </span>
        ) : null}
      </div>

      <div
        style={{
          fontSize: 11,
          lineHeight: 1.45,
          color: 'var(--bico-text-muted)',
          marginBlockStart: 2
        }}
      >
        {themeDescription(definition, t)}
      </div>
    </div>
  )
}

function GroupHeading(props: { label: string }): React.JSX.Element {
  return (
    <div className="bico-section-title" style={{ marginBlockStart: 14 }}>
      {props.label}
    </div>
  )
}

/**
 * Theme picker for the preferences tab.
 *
 * Two preferences are edited here and they are easy to confuse, so they are
 * presented in the order they apply: first whether the app is light or dark,
 * then which palette fills that choice. Picking a palette from the group that
 * does not match the current base also moves the base, because otherwise the
 * click would resolve back to a fallback palette and appear to do nothing.
 */
export function ThemesSection(): React.JSX.Element {
  const t = useT()

  const mode = useAppStore((state) => state.prefs.theme)
  const themeId = useAppStore((state) => state.prefs.themeId)
  const accent = useAppStore((state) => state.prefs.accent)

  const systemBase = useSyncExternalStore(subscribeToScheme, readScheme)
  const base = resolveBase(mode, systemBase)
  const applied = resolvePalette(themeId, base)
  const appliedTheme = THEMES.find((definition) => definition.id === applied.id)

  const dark = THEMES.filter((definition) => definition.base === 'dark')
  const light = THEMES.filter((definition) => definition.base === 'light')

  const handleSelect = (definition: ThemeDefinition): void => {
    // A dark palette cannot be shown while the base is light, so choosing one
    // has to carry the base with it. Leaving the mode alone when the bases
    // already agree is what keeps "follow the system" switched on.
    const alignsBase = definition.base !== base
    savePrefs(
      alignsBase ? { themeId: definition.id, theme: definition.base } : { themeId: definition.id }
    )
  }

  const suggested = applied.suggestedAccent
  const accentIsSuggested = accent.toLowerCase() === suggested.toLowerCase()

  return (
    <section style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBlockEnd: 6 }}>
        <Glyph icon={<SkinOutlined />} tone="violet" size="md" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{t('appearance.section.title')}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('appearance.section.hint')}
          </Text>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          paddingBlock: 10
        }}
      >
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div>{t('appearance.mode.label')}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('appearance.mode.hint')}
          </Text>
        </div>
        <Segmented<ThemeMode>
          size="small"
          value={mode}
          onChange={(value) => savePrefs({ theme: value })}
          options={[
            { label: t('appearance.mode.light'), value: 'light' },
            { label: t('appearance.mode.dark'), value: 'dark' },
            { label: t('appearance.mode.system'), value: 'system' }
          ]}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          paddingBlockEnd: 10
        }}
      >
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div>{t('appearance.accent.label')}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('appearance.accent.hint')}
          </Text>
        </div>
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ColorPicker
            value={accent}
            disabledAlpha
            onChangeComplete={(colour) => savePrefs({ accent: colour.toHexString() })}
          />
          <Tooltip
            title={t('appearance.accent.resetHint', {
              name: appliedTheme ? themeName(appliedTheme, t) : applied.id
            })}
          >
            <Button
              size="small"
              icon={<UndoOutlined />}
              disabled={accentIsSuggested}
              onClick={() => savePrefs({ accent: suggested })}
            >
              {t('appearance.accent.reset')}
            </Button>
          </Tooltip>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBlockStart: 4 }}>
        <Glyph icon={<BgColorsOutlined />} tone="cyan" size="sm" />
        <div style={{ fontWeight: 600 }}>{t('appearance.themes.title')}</div>
      </div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBlockStart: 4 }}>
        {t('appearance.themes.hint')}
      </Text>

      <div role="radiogroup" aria-label={t('appearance.themes.title')}>
        <GroupHeading label={t('appearance.themes.group.dark')} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
            gap: 10
          }}
        >
          {dark.map((definition) => (
            <ThemeCard
              key={definition.id}
              definition={definition}
              selected={definition.id === applied.id}
              onSelect={handleSelect}
            />
          ))}
        </div>

        <GroupHeading label={t('appearance.themes.group.light')} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
            gap: 10
          }}
        >
          {light.map((definition) => (
            <ThemeCard
              key={definition.id}
              definition={definition}
              selected={definition.id === applied.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBlockStart: 8 }}>
        {t('appearance.themes.previewNote')}
      </Text>
    </section>
  )
}
