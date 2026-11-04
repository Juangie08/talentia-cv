/**
 * Limitador de peticiones en memoria compartido por las rutas de IA.
 * Suficiente para un despliegue de una sola instancia; para múltiples
 * instancias reemplazar por Redis (ver DEPLOY.md).
 */

interface RateRecord {
  count: number;
  resetTime: number;
}

const buckets = new Map<string, RateRecord>();

/**
 * Devuelve true si la petición está permitida y suma al contador.
 * @param key identificador (normalmente la IP)
 * @param limit máximo de peticiones por ventana
 * @param windowMs tamaño de la ventana en milisegundos
 */
export function checkRateLimit(key: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = buckets.get(key);

  if (!record || now > record.resetTime) {
    buckets.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

/** Extrae la IP del cliente desde los headers de Vercel/Next. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/** Limpia buckets vencidos para no acumular memoria en procesos largos. */
export function pruneRateLimit(): void {
  const now = Date.now();
  Array.from(buckets.entries()).forEach(([key, record]) => {
    if (now > record.resetTime) buckets.delete(key);
  });
}
