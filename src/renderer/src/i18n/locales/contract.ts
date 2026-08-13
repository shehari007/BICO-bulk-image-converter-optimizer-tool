import type { en } from './en'

/** Every key English defines, which every other language has to supply. */
export type TranslationKey = keyof typeof en

/** A complete translation. Partial coverage is a compile error by design. */
export type TranslatedDictionary = Record<TranslationKey, string>
