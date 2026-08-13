/**
 * The theme registry.
 *
 * A theme is a complete palette, not an accent swap. Every surface, border and
 * text colour is stated, because deriving a light theme by inverting a dark one
 * produces washed out greys and borders that disappear. The accent stays
 * separately adjustable on top of whichever theme is active.
 */

export type ThemeBase = 'dark' | 'light'

export interface ThemePalette {
  /** The window background, behind every panel. */
  canvas: string
  /** Panels, cards and the sidebar. */
  surface: string
  /** Rows, headers and anything sitting one step above a panel. */
  surfaceRaised: string
  /** Modals, dropdowns and popovers. */
  surfaceOverlay: string
  border: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  warning: string
  danger: string
  /** Badge colour for work that ran on a graphics adapter. */
  gpu: string
  /** Badge colour for work that ran on the processor. */
  cpu: string
}

export interface ThemeDefinition {
  id: string
  /** Shown in the picker. Translated at the point of use, not here. */
  name: string
  description: string
  base: ThemeBase
  /** Suggested accent, applied when the user has not chosen their own. */
  accent: string
  palette: ThemePalette
}

/**
 * `system` is deliberately not in this list. It is a preference that resolves to
 * one of these at runtime, not a palette of its own.
 */
export const THEMES: ThemeDefinition[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep navy with a cool cast. The default.',
    base: 'dark',
    accent: '#4c8dff',
    palette: {
      canvas: '#0b0e14',
      surface: '#121821',
      surfaceRaised: '#19212c',
      surfaceOverlay: '#1f2835',
      border: '#252f3d',
      textPrimary: '#e8edf5',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      success: '#3ddc97',
      warning: '#ffb454',
      danger: '#ff6b6b',
      gpu: '#a78bfa',
      cpu: '#38bdf8'
    }
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Neutral grey with no colour cast, for judging colour work.',
    base: 'dark',
    accent: '#7c8bff',
    palette: {
      canvas: '#0f0f11',
      surface: '#17171a',
      surfaceRaised: '#1e1e22',
      surfaceOverlay: '#26262b',
      border: '#2f2f35',
      textPrimary: '#ececee',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
      success: '#4ade80',
      warning: '#fbbf24',
      danger: '#f87171',
      gpu: '#c084fc',
      cpu: '#60a5fa'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    description: 'Muted arctic blues, easy on the eyes over long sessions.',
    base: 'dark',
    accent: '#88c0d0',
    palette: {
      canvas: '#2e3440',
      surface: '#343c4b',
      surfaceRaised: '#3b4252',
      surfaceOverlay: '#434c5e',
      border: '#4c566a',
      textPrimary: '#eceff4',
      textSecondary: '#d8dee9',
      textMuted: '#9aa5b8',
      success: '#a3be8c',
      warning: '#ebcb8b',
      danger: '#bf616a',
      gpu: '#b48ead',
      cpu: '#81a1c1'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    description: 'High saturation violet, strong contrast against the surfaces.',
    base: 'dark',
    accent: '#bd93f9',
    palette: {
      canvas: '#1e1f29',
      surface: '#282a36',
      surfaceRaised: '#313442',
      surfaceOverlay: '#3a3d4d',
      border: '#44475a',
      textPrimary: '#f8f8f2',
      textSecondary: '#c8cad4',
      textMuted: '#8b8fa3',
      success: '#50fa7b',
      warning: '#f1fa8c',
      danger: '#ff5555',
      gpu: '#ff79c6',
      cpu: '#8be9fd'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Warm dark green, lower blue light than the navy themes.',
    base: 'dark',
    accent: '#6ee7a8',
    palette: {
      canvas: '#0c1310',
      surface: '#131c18',
      surfaceRaised: '#1a2620',
      surfaceOverlay: '#213029',
      border: '#2a3a32',
      textPrimary: '#e6efe9',
      textSecondary: '#9db3a7',
      textMuted: '#6d8479',
      success: '#6ee7a8',
      warning: '#e8c468',
      danger: '#f0796b',
      gpu: '#b193f5',
      cpu: '#5cc9d6'
    }
  },
  {
    id: 'daylight',
    name: 'Daylight',
    description: 'Clean white with cool greys. The default light theme.',
    base: 'light',
    accent: '#2563eb',
    palette: {
      canvas: '#f4f6fa',
      surface: '#ffffff',
      surfaceRaised: '#f8fafc',
      surfaceOverlay: '#ffffff',
      border: '#dfe4ec',
      textPrimary: '#111827',
      textSecondary: '#4b5563',
      textMuted: '#6b7280',
      success: '#0f9d63',
      warning: '#b45309',
      danger: '#dc2626',
      gpu: '#7c3aed',
      cpu: '#0284c7'
    }
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Warm off white, closer to print stock than to a screen.',
    base: 'light',
    accent: '#b45309',
    palette: {
      canvas: '#f5f1e8',
      surface: '#fdfbf6',
      surfaceRaised: '#f8f4ea',
      surfaceOverlay: '#fffdf8',
      border: '#e3dccb',
      textPrimary: '#292420',
      textSecondary: '#5c5348',
      textMuted: '#857a6c',
      success: '#3f7d4f',
      warning: '#a06712',
      danger: '#b8443c',
      gpu: '#7c5bb5',
      cpu: '#2b6f9e'
    }
  },
  {
    id: 'contrast',
    name: 'High Contrast',
    description: 'Maximum separation between text and background, for accessibility.',
    base: 'dark',
    accent: '#ffd400',
    palette: {
      canvas: '#000000',
      surface: '#0a0a0a',
      surfaceRaised: '#141414',
      surfaceOverlay: '#1c1c1c',
      border: '#5a5a5a',
      textPrimary: '#ffffff',
      textSecondary: '#e0e0e0',
      textMuted: '#b0b0b0',
      success: '#00e676',
      warning: '#ffd400',
      danger: '#ff5252',
      gpu: '#e879f9',
      cpu: '#40c4ff'
    }
  }
]

export const DEFAULT_THEME_ID = 'midnight'

export function findTheme(id: string): ThemeDefinition {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]!
}

/** Themes are offered grouped, because a light option in a dark list reads as a mistake. */
export function themesByBase(base: ThemeBase): ThemeDefinition[] {
  return THEMES.filter((theme) => theme.base === base)
}
