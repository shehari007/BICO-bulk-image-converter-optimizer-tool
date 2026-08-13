// This is the entry module, so it deliberately mixes a component with the
// bootstrap side effects that mount it. Fast refresh does not apply here.
/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, useMemo, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntApp, ConfigProvider } from 'antd'
import enGB from 'antd/locale/en_GB'
import trTR from 'antd/locale/tr_TR'
import arEG from 'antd/locale/ar_EG'
import type { Locale } from 'antd/es/locale'
import { App } from './App'
import { I18nProvider } from './i18n'
import { applyCssVariables, buildTheme, resolveBase, resolvePalette } from './theme/tokens'
import { useAppStore } from './store/useAppStore'
import { languageMeta, type LanguageCode } from '@shared/i18n/types'
import type { ThemeBase } from '@shared/themes'
import './styles/fonts.css'
import './styles/global.css'

const LIGHT_QUERY = '(prefers-color-scheme: light)'

/**
 * The operating system colour preference, read as an external store.
 *
 * Mirroring a media query into component state through an effect means the very
 * first paint uses the wrong value and then corrects itself, which shows up as a
 * flash. Subscribing directly gives the right answer on the first render.
 */
function subscribeToScheme(onChange: () => void): () => void {
  const query = window.matchMedia(LIGHT_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function readScheme(): ThemeBase {
  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark'
}

/** Ant Design ships its own locale bundles for dates, pagination and empty states. */
const ANTD_LOCALES: Record<LanguageCode, Locale> = {
  en: enGB,
  tr: trTR,
  ar: arEG
}

/** Owns the theme and the language so a preference change repaints everything at once. */
function Shell(): React.JSX.Element {
  const mode = useAppStore((state) => state.prefs.theme)
  const themeId = useAppStore((state) => state.prefs.themeId)
  const accent = useAppStore((state) => state.prefs.accent)
  const compact = useAppStore((state) => state.prefs.compactUi)
  const language = useAppStore((state) => state.prefs.language)

  const systemBase = useSyncExternalStore(subscribeToScheme, readScheme)
  const base = resolveBase(mode, systemBase)
  const { palette } = resolvePalette(themeId, base)
  const direction = languageMeta(language).direction

  useEffect(() => {
    applyCssVariables(palette, base, accent, direction)
  }, [palette, base, accent, direction])

  const antdTheme = useMemo(
    () => buildTheme(palette, base, accent, compact),
    [palette, base, accent, compact]
  )

  return (
    <ConfigProvider
      theme={antdTheme}
      locale={ANTD_LOCALES[language] ?? enGB}
      direction={direction}
      componentSize={compact ? 'small' : 'middle'}
      warning={{ strict: false }}
    >
      <I18nProvider language={language}>
        <AntApp
          notification={{
            placement: direction === 'rtl' ? 'bottomLeft' : 'bottomRight',
            duration: 4
          }}
          message={{ duration: 2.5, maxCount: 3 }}
        >
          <App />
        </AntApp>
      </I18nProvider>
    </ConfigProvider>
  )
}

/**
 * Automation handle.
 *
 * The end to end tests attach over the DevTools protocol and drive the real
 * bridge rather than a mock, which means they need to read the current settings
 * out of the store. This grants nothing the renderer does not already have,
 * since the store lives in this context either way.
 */
;(window as unknown as { __BICO_STORE__: typeof useAppStore }).__BICO_STORE__ = useAppStore

const container = document.getElementById('root')
if (!container) throw new Error('the root element is missing from index.html')

createRoot(container).render(
  <StrictMode>
    <Shell />
  </StrictMode>
)
