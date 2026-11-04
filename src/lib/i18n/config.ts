/**
 * Configuración de idiomas de Talentia.
 *
 * El idioma se guarda en una cookie para poder resolverlo también en el
 * servidor (metadata y atributo `lang`); si no hay cookie, el middleware lo
 * negocia con la cabecera `Accept-Language` del navegador.
 */

export const LOCALES = ['en', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

/** Idioma por defecto para visitantes de cualquier otro país. */
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_COOKIE = 'talentia-locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

/** Locale BCP-47 para Intl (fechas y números). */
export const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-CO',
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

type LanguagePreference = { locale: Locale; quality: number };

/**
 * Negocia el idioma a partir de la cabecera `Accept-Language`
 * (p. ej. `es-CO,es;q=0.9,en;q=0.8`). Devuelve el idioma soportado con mayor
 * prioridad para el visitante y, si no hay coincidencias, el de defecto.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferences: LanguagePreference[] = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qualityParam = params.find((param) => param.trim().startsWith('q='));
      const quality = qualityParam ? Number.parseFloat(qualityParam.split('=')[1]) : 1;
      const primary = tag.trim().toLowerCase().split('-')[0];
      return { primary, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((entry) => entry.primary.length > 0)
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => ({ locale: entry.primary as Locale, quality: entry.quality }));

  const match = preferences.find((entry) => isLocale(entry.locale));
  return match ? match.locale : DEFAULT_LOCALE;
}
