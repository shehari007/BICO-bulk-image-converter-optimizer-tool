/**
 * What the welcome screen shows as new in this release.
 *
 * Kept here rather than parsed out of CHANGELOG.md because the welcome screen is
 * translated and the changelog is not. Each entry is a pair of translation keys,
 * so the list itself is structure and the words live in the dictionaries.
 *
 * The `version` field is what decides whether the screen returns after an
 * upgrade, so it must be bumped whenever this list changes.
 */
export interface ReleaseHighlight {
  id: string
  /** Key for the short heading. */
  titleKey: string
  /** Key for the one sentence explanation. */
  bodyKey: string
  /** Icon tone, matching the Glyph tones in the renderer. */
  tone: 'accent' | 'violet' | 'green' | 'amber' | 'rose' | 'cyan' | 'teal' | 'orange' | 'pink'
}

export const RELEASE_VERSION = '3.0.0'

export const RELEASE_HIGHLIGHTS: ReleaseHighlight[] = [
  {
    id: 'threads',
    titleKey: 'welcome.highlight.threads.title',
    bodyKey: 'welcome.highlight.threads.body',
    tone: 'accent'
  },
  {
    id: 'gpu',
    titleKey: 'welcome.highlight.gpu.title',
    bodyKey: 'welcome.highlight.gpu.body',
    tone: 'violet'
  },
  {
    id: 'formats',
    titleKey: 'welcome.highlight.formats.title',
    bodyKey: 'welcome.highlight.formats.body',
    tone: 'green'
  },
  {
    id: 'preview',
    titleKey: 'welcome.highlight.preview.title',
    bodyKey: 'welcome.highlight.preview.body',
    tone: 'cyan'
  },
  {
    id: 'languages',
    titleKey: 'welcome.highlight.languages.title',
    bodyKey: 'welcome.highlight.languages.body',
    tone: 'amber'
  },
  {
    id: 'themes',
    titleKey: 'welcome.highlight.themes.title',
    bodyKey: 'welcome.highlight.themes.body',
    tone: 'pink'
  }
]
