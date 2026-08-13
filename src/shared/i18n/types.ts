/**
 * Language support.
 *
 * The dictionary is a flat map of dotted keys to strings rather than a nested
 * object, because a flat map is trivially diffable: a translator can see exactly
 * which keys a release added, and a missing key is one line in a review rather
 * than a hole somewhere inside a tree.
 */

export type LanguageCode = 'en' | 'tr' | 'ar'

export type TextDirection = 'ltr' | 'rtl'

export interface LanguageMeta {
  code: LanguageCode
  /** The language in its own script, which is what a language picker should show. */
  nativeName: string
  /** The language in English, for the diagnostics report. */
  englishName: string
  direction: TextDirection
  /** BCP 47 tag used for number and date formatting. */
  locale: string
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', direction: 'ltr', locale: 'en-GB' },
  { code: 'tr', nativeName: 'Turkce', englishName: 'Turkish', direction: 'ltr', locale: 'tr-TR' },
  { code: 'ar', nativeName: 'Arabic', englishName: 'Arabic', direction: 'rtl', locale: 'ar' }
]

export const DEFAULT_LANGUAGE: LanguageCode = 'en'

export function languageMeta(code: string): LanguageMeta {
  return LANGUAGES.find((entry) => entry.code === code) ?? LANGUAGES[0]!
}

export function isRightToLeft(code: string): boolean {
  return languageMeta(code).direction === 'rtl'
}

/**
 * Every translatable string in the app, keyed.
 *
 * `Dictionary` is derived from the English file, so adding a key there makes
 * every other language fail to compile until it is translated. That is the
 * point: a silently missing translation is worse than a build error.
 */
export type Dictionary = Record<string, string>

/**
 * Substitutes `{name}` placeholders.
 *
 * Kept deliberately simple. Full ICU message formatting would bring plural and
 * gender rules, which matter for Arabic, but it also brings a parser and a
 * runtime. Where a plural is genuinely needed the dictionary carries separate
 * keys and the caller picks, which keeps the translator in control.
 */
export function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (match, token: string) => {
    const value = values[token]
    return value === undefined ? match : String(value)
  })
}
