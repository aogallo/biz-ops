import type en from './locales/en.json'

export type Locale = 'en' | 'es'
export type TranslationKey = keyof typeof en
export type Translations = Record<TranslationKey, string>
