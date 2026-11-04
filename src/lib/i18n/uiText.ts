'use client';

import { useCallback } from 'react';
import { useI18n } from './LocaleProvider';
import type { Locale } from './config';
import { UI_EN } from './ui-en';

/**
 * Traducción de textos de interfaz.
 *
 * La clave es el propio texto en español: así el código sigue siendo legible
 * (se ve la frase final, no una clave opaca) y cualquier frase que todavía no
 * tenga traducción se muestra en español en lugar de romperse o dejar un
 * hueco vacío.
 */
export type UiVars = Record<string, string | number>;

export function uiText(locale: Locale, es: string, vars?: UiVars): string {
  const template = locale === 'en' ? UI_EN[es] ?? es : es;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/** Hook: devuelve un traductor atado al idioma activo de la interfaz. */
export function useUiText() {
  const { locale } = useI18n();
  return useCallback((es: string, vars?: UiVars) => uiText(locale, es, vars), [locale]);
}
