import { createContext, useContext, useCallback } from 'react'
import type { Locale, TranslationKey, Translations } from './types'
import en from './locales/en/index'
import es from './locales/es/index'

const translations: Record<Locale, Translations> = {
  en: en as Translations,
  es: es as Translations,
}

interface I18nContextValue {
  locale: Locale
  t: (key: TranslationKey, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  t: (key) => key,
})

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string>) => {
      let text = translations[locale]?.[key] ?? translations.en[key] ?? key

      if (params) {
        for (const [param, value] of Object.entries(params)) {
          text = text.replace(`{{${param}}}`, value)
        }
      }

      return text
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  return useContext(I18nContext)
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale
}
