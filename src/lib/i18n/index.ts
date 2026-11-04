import { en } from './en';
import { es, type Dictionary, type TranslationKey } from './es';
import { DEFAULT_LOCALE, type Locale } from './config';

export * from './config';
export type { TranslationKey } from './es';

export const DICTIONARIES: Record<Locale, Dictionary> = { en, es };

export type TranslationVars = Record<string, string | number>;

/**
 * Traduce una clave con interpolación de variables `{name}`.
 * Si la clave no existiera en el idioma pedido, cae al inglés y luego al
 * español para no mostrar nunca una clave cruda en pantalla.
 */
export function translate(locale: Locale, key: TranslationKey, vars?: TranslationVars): string {
  const value = DICTIONARIES[locale]?.[key] ?? DICTIONARIES[DEFAULT_LOCALE]?.[key] ?? es[key] ?? key;
  if (!vars) return value;

  return Object.entries(vars).reduce(
    (acc, [name, replacement]) => acc.split(`{${name}}`).join(String(replacement)),
    value,
  );
}
