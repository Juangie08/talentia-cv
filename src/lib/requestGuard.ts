/**
 * Defensa básica contra el uso de las rutas de IA desde otros sitios.
 *
 * Una ruta de IA abierta puede ser consumida por cualquier página de terceros
 * que conozca la URL pública. Aquí se rechazan las peticiones cuyo `Origin`
 * no coincide con el sitio que sirve la petición.
 *
 * Las peticiones sin `Origin` (curl, llamadas servidor-a-servidor) se dejan
 * pasar a propósito: los límites por IP y la cuota diaria siguen aplicando.
 */
export function isCrossSiteRequest(request: Request, opts: { allowWithoutOrigin?: boolean } = {}): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return opts.allowWithoutOrigin ? false : false;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return true;
  }

  // Detrás de un proxy (Netlify, Vercel, Nginx) el Host interno puede no ser
  // el público, así que se acepta cualquiera de las dos cabeceras.
  const candidates = [request.headers.get('host'), request.headers.get('x-forwarded-host')]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.split(',')[0].trim());

  if (candidates.length === 0) return false;
  return !candidates.includes(originHost);
}
