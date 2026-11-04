import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, isLocale, negotiateLocale } from '@/lib/i18n/config';

/**
 * Detecta el idioma del visitante la primera vez que entra.
 *
 * Si ya eligió un idioma (cookie), lo respetamos. Si no, negociamos con la
 * cabecera `Accept-Language` del navegador y guardamos el resultado en la
 * cookie para que el servidor pueda renderizar `<html lang>` y la metadata
 * con el idioma correcto desde el primer byte.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;

  if (isLocale(cookieLocale)) return response;

  const locale = negotiateLocale(request.headers.get('accept-language'));
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  return response;
}

export const config = {
  // Todo excepto assets estáticos, imágenes optimizadas y rutas de API.
  matcher: ['/((?!api|_next/static|_next/image|img|landing|uploads|favicon.ico).*)'],
};
