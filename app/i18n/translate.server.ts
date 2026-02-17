import type { Locale, TranslationKey, Translations } from './types'
import en from './locales/en.json'
import es from './locales/es.json'

const translations: Record<Locale, Translations> = {
  en: en as Translations,
  es: es as Translations,
}

const DEFAULT_LOCALE: Locale = 'es'

export function getLocaleFromRequest(request: Request): Locale {
  const cookieHeader = request.headers.get('Cookie') || ''
  const localeMatch = cookieHeader.match(/locale=(en|es)/)
  return (localeMatch?.[1] as Locale) || DEFAULT_LOCALE
}

export function translateServer(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string>
): string {
  let text = translations[locale]?.[key] ?? translations.en[key] ?? key

  if (params) {
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(`{{${param}}}`, value)
    }
  }

  return text
}
