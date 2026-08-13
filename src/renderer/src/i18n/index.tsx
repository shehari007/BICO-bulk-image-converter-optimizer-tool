// The hooks live beside the provider they read from, which is the whole point
// of the module. Fast refresh only cares about files that are components.
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { en } from './locales/en'
import { tr } from './locales/tr'
import { ar } from './locales/ar'
import {
  DEFAULT_LANGUAGE,
  interpolate,
  languageMeta,
  type Dictionary,
  type LanguageCode
} from '@shared/i18n/types'

export type { TranslationKey } from './locales/contract'
import type { TranslationKey } from './locales/contract'
import type { OutputFormat } from '@shared/types'

const DICTIONARIES: Record<LanguageCode, Dictionary> = { en, tr, ar }

export type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string

function lookup(
  language: LanguageCode,
  key: TranslationKey,
  values?: Record<string, string | number>
): string {
  const dictionary = DICTIONARIES[language] ?? DICTIONARIES[DEFAULT_LANGUAGE]
  const fallback = DICTIONARIES[DEFAULT_LANGUAGE]
  // Falling through to English rather than showing the raw key means a
  // missed translation degrades to a readable sentence instead of debris
  // like "settings.output.collision.rename" in the middle of a panel.
  const template = dictionary[key] ?? fallback[key] ?? String(key)
  return interpolate(template, values)
}

/**
 * The language the provider last committed.
 *
 * Written on commit rather than during render, so a render React throws away
 * cannot leave behind a language the interface never showed.
 */
let activeLanguage: LanguageCode = DEFAULT_LANGUAGE

interface I18nValue {
  language: LanguageCode
  locale: string
  direction: 'ltr' | 'rtl'
  t: Translate
  /** Formats a number in the active locale, including its digit system. */
  n: (value: number, options?: Intl.NumberFormatOptions) => string
  /** Formats a timestamp in the active locale. */
  d: (value: number, options?: Intl.DateTimeFormatOptions) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider(props: {
  language: LanguageCode
  children: React.ReactNode
}): React.JSX.Element {
  const { language, children } = props

  const value = useMemo<I18nValue>(() => {
    const meta = languageMeta(language)

    return {
      language,
      locale: meta.locale,
      direction: meta.direction,
      t: (key, values) => lookup(language, key, values),
      n: (num, options) => new Intl.NumberFormat(meta.locale, options).format(num),
      d: (at, options) =>
        new Intl.DateTimeFormat(
          meta.locale,
          options ?? { dateStyle: 'medium', timeStyle: 'short' }
        ).format(new Date(at))
    }
  }, [language])

  useEffect(() => {
    activeLanguage = language
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/**
 * Translation for the modules that are not components.
 *
 * `actions.ts` and `useLivePreview.ts` build sentences the user reads, but they
 * run inside event handlers and promise callbacks where no hook can be called.
 * Both are only ever reached after the provider has committed, so the mirrored
 * language is the one on screen.
 */
export const translate: Translate = (key, values) => lookup(activeLanguage, key, values)

/** Number formatting for those same modules, so counts keep the locale's digits. */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(languageMeta(activeLanguage).locale, options).format(value)
}

function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n was called outside the I18nProvider')
  return value
}

/** The common case: just the translate function. */
export function useT(): Translate {
  return useI18n().t
}

/** Locale aware number and date formatting, plus the active direction. */
export function useLocale(): Omit<I18nValue, 't'> {
  const { t: _t, ...rest } = useI18n()
  return rest
}

/**
 * Byte counts in the active locale.
 *
 * Kept here rather than in shared/utils because the unit suffix is a translated
 * string and the digits themselves change script in Arabic.
 */
export function useFormatBytes(): (bytes: number, decimals?: number) => string {
  const { n } = useI18n()
  const t = useT()

  return useCallback(
    (bytes: number, decimals = 2) => {
      if (!Number.isFinite(bytes) || bytes <= 0) return `0 ${t('unit.byte')}`
      const units: TranslationKey[] = ['unit.byte', 'unit.kb', 'unit.mb', 'unit.gb', 'unit.tb']
      const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
      const value = bytes / Math.pow(1024, exponent)
      const key = units[exponent] ?? 'unit.byte'
      return `${n(value, {
        minimumFractionDigits: exponent === 0 ? 0 : decimals,
        maximumFractionDigits: exponent === 0 ? 0 : decimals
      })} ${t(key)}`
    },
    [n, t]
  )
}

/**
 * The dictionary key holding a format's own words.
 *
 * These used to be read straight off the capability table in shared code, which
 * meant they stayed English in every language and sat outside the translation
 * contract entirely. Building the key here keeps the words in the dictionaries,
 * where a missing one is a compile error like any other.
 */
export function formatCopyKey(id: OutputFormat, part: 'tagline' | 'description'): TranslationKey {
  return `settings.format.${id}.${part}` as TranslationKey
}
