import { theme, type ThemeConfig } from 'antd'
import { DEFAULT_THEME_ID, findTheme, type ThemeBase, type ThemePalette } from '@shared/themes'
import type { ThemeMode } from '@shared/types'
import { interactionShades, readableOn } from './colour'

export type { ThemeBase, ThemePalette }
export { perceptualContrast, readableOn, relativeLuminance } from './colour'

/**
 * Resolves the `system` setting against the operating system preference.
 *
 * Only ever called with a real preference, never with a theme id: the light or
 * dark decision and the palette choice are two separate settings, so that
 * picking Nord does not silently disable following the system.
 */
export function resolveBase(mode: ThemeMode, systemBase: ThemeBase): ThemeBase {
  return mode === 'system' ? systemBase : mode
}

/**
 * Chooses which palette to apply.
 *
 * A theme carries its own base, so selecting Daylight while the mode says dark
 * would fight itself. The mode wins, and the chosen theme is used only when its
 * base agrees, falling back to the first theme that matches otherwise. That
 * keeps "follow the system" working with any theme selected.
 */
export function resolvePalette(
  themeId: string,
  base: ThemeBase
): { palette: ThemePalette; suggestedAccent: string; id: string } {
  const chosen = findTheme(themeId)
  if (chosen.base === base) {
    return { palette: chosen.palette, suggestedAccent: chosen.accent, id: chosen.id }
  }

  const fallback = findTheme(base === 'dark' ? DEFAULT_THEME_ID : 'daylight')
  return { palette: fallback.palette, suggestedAccent: fallback.accent, id: fallback.id }
}

/**
 * The colours Ant Design will actually paint, which are not the ones handed to it.
 *
 * The dark algorithm regenerates the seed against a dark background instead of
 * using it as given: the default blue accent goes in as #4c8dff and comes out
 * as #447bdc, and Dracula's lavender goes in at #bd93f9 and is painted #a480d7.
 * The light algorithm passes both through untouched.
 *
 * Judging a foreground from the seed therefore judged a colour that never
 * reaches the screen. It read Nord and Dracula as light enough for black text,
 * while the buttons were painted several steps darker, which measured 52 and 45
 * on a scale where 60 is the floor for text this size.
 */
export function paintedColours(base: ThemeBase, accent: string, danger: string): [string, string] {
  const derived = theme.getDesignToken({
    algorithm: base === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: { colorPrimary: accent, colorError: danger }
  })

  return [String(derived.colorPrimary), String(derived.colorError)]
}

/**
 * Builds the Ant Design theme.
 *
 * Component overrides are kept to the places where the default is genuinely
 * wrong for this app. Everything else is driven by the seed tokens, so changing
 * the palette or the accent recolours the whole interface without touching a
 * stylesheet.
 */
export function buildTheme(
  palette: ThemePalette,
  base: ThemeBase,
  accent: string,
  compact: boolean
): ThemeConfig {
  const isDark = base === 'dark'

  const [paintedAccent, paintedDanger] = paintedColours(base, accent, palette.danger)

  const onAccent = readableOn(paintedAccent)
  const accentShades = interactionShades(paintedAccent, onAccent)

  const onDanger = readableOn(paintedDanger)
  const dangerShades = interactionShades(paintedDanger, onDanger)

  const algorithms = [isDark ? theme.darkAlgorithm : theme.defaultAlgorithm]
  if (compact) algorithms.push(theme.compactAlgorithm)

  return {
    algorithm: algorithms,
    token: {
      colorPrimary: accent,
      colorInfo: accent,
      colorSuccess: palette.success,
      colorWarning: palette.warning,
      colorError: palette.danger,
      colorBgBase: palette.canvas,
      colorBgContainer: palette.surface,
      colorBgElevated: palette.surfaceOverlay,
      colorBgLayout: palette.canvas,
      colorBorder: palette.border,
      colorBorderSecondary: palette.border,
      colorText: palette.textPrimary,
      colorTextSecondary: palette.textSecondary,
      colorTextTertiary: palette.textMuted,
      borderRadius: 10,
      borderRadiusLG: 14,
      borderRadiusSM: 8,
      wireframe: false,
      fontSize: compact ? 13 : 14,
      // Both read the custom properties declared in styles/fonts.css, so the
      // Ant components and the hand written surfaces cannot drift onto
      // different faces.
      fontFamily: 'var(--bico-font-sans)',
      fontFamilyCode: 'var(--bico-font-mono)'
    },
    components: {
      Layout: {
        headerBg: palette.surface,
        bodyBg: palette.canvas,
        siderBg: palette.surface,
        footerBg: palette.surface,
        headerHeight: 60,
        headerPadding: '0 16px'
      },
      Card: { colorBgContainer: palette.surface, headerBg: 'transparent' },
      Table: {
        headerBg: palette.surfaceRaised,
        headerSplitColor: 'transparent',
        rowHoverBg: palette.surfaceRaised,
        borderColor: palette.border,
        cellPaddingBlock: compact ? 8 : 12,
        cellPaddingInline: 12
      },
      Collapse: {
        headerBg: 'transparent',
        contentBg: 'transparent',
        headerPadding: '12px 12px',
        contentPadding: '4px 12px 14px'
      },
      // The solid buttons and the selected segment are the Ant surfaces that
      // paint text straight onto a theme colour, so each takes the derived
      // foreground rather than assuming the colour underneath is dark enough
      // for white.
      //
      // The hover and pressed shades are overridden inside the Button scope
      // only. The global colorPrimaryHover also colours the text and border of
      // an outlined button on hover, where it is read against the page rather
      // than sat behind it, and the two want opposite adjustments.
      Button: {
        primaryColor: onAccent,
        colorPrimaryHover: accentShades.hover,
        colorPrimaryActive: accentShades.active,
        dangerColor: onDanger,
        colorErrorHover: dangerShades.hover,
        colorErrorActive: dangerShades.active
      },
      // Painted rather than seed, so the one selected segment in the interface
      // is the same colour as the button beside it and the foreground chosen
      // for that colour is the right one for this surface too.
      Segmented: { itemSelectedBg: paintedAccent, itemSelectedColor: onAccent },
      Slider: {
        railBg: isDark ? palette.surfaceOverlay : palette.border,
        railHoverBg: palette.border
      },
      Tooltip: {
        colorBgSpotlight: palette.surfaceOverlay,
        colorTextLightSolid: palette.textPrimary
      },
      Modal: { contentBg: palette.surface, headerBg: palette.surface },
      Drawer: { colorBgElevated: palette.surface },
      Progress: { defaultColor: paintedAccent },
      Statistic: { contentFontSize: compact ? 20 : 26 }
    }
  }
}

type ToneName = 'violet' | 'green' | 'amber' | 'rose' | 'cyan' | 'teal' | 'orange' | 'pink'

/**
 * The icon tone ramps.
 *
 * One set of hues cannot serve both bases. The bright ramp measured only 1.40
 * to 2.72 to 1 against the light surfaces, and the toolbar renders its panel
 * buttons as icon only text buttons, so on Daylight and Paper that row was close
 * to invisible. The light ramp holds each hue within a few degrees and darkens
 * it until it clears 3 to 1 everywhere.
 *
 * Both ramps are checked against the worst case, which is not the bare surface
 * but the sixteen percent tinted tile the Glyph draws behind the icon, since
 * that tint is the tone itself and therefore reduces its own contrast. Measured
 * across all 24 dark surfaces and all 8 light ones in the registry, the floors
 * are 3.03 to 1 tiled on dark, at violet on the Nord overlay, and 3.58 to 1
 * tiled on light, at amber on the Paper canvas. Violet, rose and pink were
 * lightened from their original values specifically to clear that floor: Nord
 * and Dracula have unusually light overlay surfaces for dark themes, which is
 * where the original ramp fell to 2.60 to 1.
 *
 * Publishing them as custom properties rather than fixing them in the component
 * means they repaint with the theme like every other colour.
 */
const TONE_RAMP: Record<ThemeBase, Record<ToneName, string>> = {
  dark: {
    violet: '#b69ffb',
    green: '#3ddc97',
    amber: '#ffc453',
    rose: '#ff8695',
    cyan: '#4fd1e8',
    teal: '#2dd4bf',
    orange: '#ff9f57',
    pink: '#f687c1'
  },
  light: {
    violet: '#6d28d9',
    green: '#067a4e',
    amber: '#a16207',
    rose: '#b91c30',
    cyan: '#0e7490',
    teal: '#0f766e',
    orange: '#c2410c',
    pink: '#b21e6a'
  }
}

/**
 * Publishes the palette as CSS custom properties.
 *
 * A handful of surfaces are hand written CSS rather than Ant components, and
 * this keeps them in step with the token theme instead of hard coding colours
 * in two places that then drift apart.
 */
export function applyCssVariables(
  palette: ThemePalette,
  base: ThemeBase,
  accent: string,
  direction: 'ltr' | 'rtl'
): void {
  const root = document.documentElement

  root.dataset.theme = base
  root.dir = direction

  // The same colour the Ant components are painted with, rather than the seed,
  // so a hand written surface sitting next to a button is the same blue as the
  // button and not the slightly brighter one the picker was set to.
  const [paintedAccent, paintedDanger] = paintedColours(base, accent, palette.danger)

  const entries: [string, string][] = [
    ['--bico-canvas', palette.canvas],
    ['--bico-surface', palette.surface],
    ['--bico-surface-raised', palette.surfaceRaised],
    ['--bico-surface-overlay', palette.surfaceOverlay],
    ['--bico-border', palette.border],
    ['--bico-text', palette.textPrimary],
    ['--bico-text-secondary', palette.textSecondary],
    ['--bico-text-muted', palette.textMuted],
    ['--bico-accent', paintedAccent],
    ['--bico-on-accent', readableOn(paintedAccent)],
    ['--bico-success', palette.success],
    ['--bico-warning', palette.warning],
    ['--bico-danger', paintedDanger],
    ['--bico-gpu', palette.gpu],
    ['--bico-cpu', palette.cpu]
  ]

  for (const [tone, colour] of Object.entries(TONE_RAMP[base])) {
    entries.push([`--bico-tone-${tone}`, colour])
  }

  for (const [name, value] of entries) root.style.setProperty(name, value)
}
