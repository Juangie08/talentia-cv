/**
 * Utilidades del lado cliente para los errores de cuota diaria de IA.
 * El servidor responde 429 con { error, usage: { limit, used, remaining, resetAt, model } };
 * aquí lo convertimos en mensajes amables (sin exponer nada interno) en el
 * idioma activo de la interfaz.
 */

import type { Locale } from './i18n/config';

/** Prefijo histórico del mensaje en español; se mantiene por compatibilidad. */
export const QUOTA_ERROR_PREFIX = 'Alcanzaste tu cuota diaria';

interface QuotaUsage {
  limit?: number;
  used?: number;
  resetAt?: string;
  model?: string;
}

/**
 * Detecta si un error (o cuerpo de respuesta) es un bloqueo por cuota.
 *
 * No depende del texto: el mensaje del servidor cambia de idioma, así que la
 * señal fiable es el objeto `usage` que acompaña al 429.
 */
export function isQuotaError(error: unknown): boolean {
  const body = (error as { body?: { usage?: unknown } } | null)?.body;
  if (body && typeof body === 'object' && body.usage) return true;
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.startsWith(QUOTA_ERROR_PREFIX);
}

/** Convierte el resetAt (UTC) a la hora local del idioma activo. */
function resetLabel(resetAt: string | undefined, locale: Locale): string {
  const fallback = locale === 'es' ? 'medianoche' : 'midnight';
  if (!resetAt) return fallback;
  try {
    return new Date(resetAt).toLocaleTimeString(locale === 'es' ? 'es-CO' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fallback;
  }
}

/**
 * Mensaje amable para mostrar en la UI cuando la cuota diaria se agotó.
 */
export function quotaMessageFromResponse(body: unknown, locale: Locale = 'es'): string {
  const usage = (body as { usage?: QuotaUsage } | null)?.usage;
  const model = usage?.model || (locale === 'es' ? 'la IA' : 'AI');
  const limit = usage?.limit;
  const used = usage?.used;
  const hasCredits = typeof used === 'number' && typeof limit === 'number';
  const reset = resetLabel(usage?.resetAt, locale);

  if (locale === 'en') {
    const creditsPart = hasCredits ? ` (${used}/${limit} credits)` : '';
    return `You used up today's free ${model} credits${creditsPart}. They reset today at ${reset}; in the meantime you can keep editing your resume by hand and export it with no problem.`;
  }

  const creditsPart = hasCredits ? ` (${used}/${limit} créditos)` : '';
  return `Se agotaron tus créditos gratis de hoy de ${model}${creditsPart}. Tus créditos se renuevan hoy a las ${reset}; mientras tanto puedes editar tu hoja de vida a mano y exportarla sin problema.`;
}

/**
 * Envuelve un fetch y lanza un Error marcado con el prefijo de cuota,
 * adjuntando el cuerpo JSON en `err.body` para recuperar `usage`.
 */
export async function fetchWithQuotaHandling(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 429) {
    const body = await response.clone().json().catch(() => null);
    const message = (body as { error?: string } | null)?.error || '';
    const hasUsage = Boolean((body as { usage?: unknown } | null)?.usage);
    if (hasUsage || message.startsWith(QUOTA_ERROR_PREFIX)) {
      const error = new Error(message) as Error & { body?: unknown };
      error.body = body;
      throw error;
    }
  }
  return response;
}
