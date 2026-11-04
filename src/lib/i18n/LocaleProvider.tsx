'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { translate, type TranslationKey, type TranslationVars } from './index';
import {
  DEFAULT_LOCALE,
  INTL_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  isLocale,
  type Locale,
} from './config';

interface LocaleContextValue {
  locale: Locale;
  intlLocale: string;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Una cookie por un año; el middleware la reutiliza en el servidor. */
function persistLocale(locale: Locale) {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
  } catch {
    // document.cookie puede fallar en contextos restringidos: seguimos en memoria.
  }
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    isLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE,
  );

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    if (typeof document !== 'undefined') {
      // Reflejamos el cambio en el documento para que el idioma, el título de
      // la pestaña y la meta descripción coincidan sin recargar la página.
      document.documentElement.lang = next;
      document.title = translate(next, 'meta.title');
      const description = document.querySelector('meta[name="description"]');
      if (description) description.setAttribute('content', translate(next, 'meta.description'));
    }
    setLocaleState(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'es' ? 'en' : 'es');
  }, [locale, setLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      intlLocale: INTL_LOCALE[locale],
      t: (key, vars) => translate(locale, key, vars),
      setLocale,
      toggleLocale,
    }),
    [locale, setLocale, toggleLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Devuelve el idioma activo y el traductor. Si se usa fuera del provider
 * (por ejemplo en un test aislado) cae al idioma por defecto en vez de romper.
 */
export function useI18n(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (context) return context;

  return {
    locale: DEFAULT_LOCALE,
    intlLocale: INTL_LOCALE[DEFAULT_LOCALE],
    t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
    setLocale: persistLocale,
    toggleLocale: () => undefined,
  };
}

export { LOCALES };
