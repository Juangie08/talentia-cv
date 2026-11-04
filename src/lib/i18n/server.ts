import type { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, negotiateLocale, type Locale } from './config';

/**
 * Idioma de la petición en el servidor (rutas de API).
 *
 * Se lee la cookie que ya escribe `src/middleware.ts`; si no existe (primera
 * visita, peticiones directas), se negocia con `Accept-Language`. Así el
 * asistente responde en el idioma de la interfaz sin que el cliente tenga que
 * enviarlo en cada llamada.
 */
export function getRequestLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  return negotiateLocale(request.headers.get('accept-language')) || DEFAULT_LOCALE;
}
