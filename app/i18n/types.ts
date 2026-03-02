import type en from './locales/en/index'

export type Locale = 'en' | 'es'
export type TranslationKey = keyof typeof en
export type Translations = Record<TranslationKey, string>
