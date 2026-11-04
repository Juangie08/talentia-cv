import { NextRequest, NextResponse } from 'next/server';
import type { Locale } from './i18n/config';

/**
 * Uso de la IA sin cuentas ni base de datos.
 *
 * - No hay cuota diaria: cada persona usa el asistente las veces que necesite.
 * - El antiabuso es por IP y por minuto, con el limitador en memoria de
 *   `lib/rateLimit` (cada ruta de IA lo aplica antes de llamar al modelo).
 * - Este módulo conserva la API que ya usan las rutas y la interfaz, pero sin
 *   Prisma ni sesiones: así el despliegue no necesita base de datos.
 */

export type AiAction =
  | 'extract'
  | 'improve'
  | 'adapt'
  | 'suggest'
  | 'translate'
  | 'tailor'
  | 'letter'
  | 'interview';

/** Coste informativo de cada función (solo se usa para explicarlo en la UI). */
export const AI_ACTION_COSTS: Record<AiAction, number> = {
  extract: 1,
  improve: 2,
  adapt: 2,
  suggest: 1,
  translate: 2,
  tailor: 3,
  letter: 2,
  interview: 2,
};

/** Nombre público del asistente; nunca se menciona el proveedor ni el modelo. */
export const PUBLIC_MODEL_NAME = 'Talentia IA';

/** Peticiones por minuto y por IP, suficientes para uso normal y contra abusos. */
export function aiRequestsPerMinute(): number {
  const parsed = Number(process.env.AI_REQUESTS_PER_MINUTE || 15);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
}

export interface AiUsageInfo {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
  model: string;
}

export interface AiUsageSummary extends AiUsageInfo {
  registered: boolean;
  unlimited: boolean;
  perMinuteLimit: number;
}

function nextResetIso(): string {
  return new Date(Date.now() + 60_000).toISOString();
}

/**
 * Verifica la cuota de una acción de IA. Sin cuota diaria, siempre permite la
 * petición: el límite real es el antiabuso por minuto de cada ruta.
 */
export async function consumeAiQuota(
  request: NextRequest,
  action: AiAction,
): Promise<{ ok: boolean; response?: NextResponse; remaining?: number; usage?: AiUsageInfo }> {
  // Sin cuota diaria: el freno real es el límite por minuto de cada ruta.
  void request;
  void action;
  return { ok: true };
}

/** Respuesta 429 estándar (la usa el limitador por minuto de las rutas). */
export function quotaExceededResponse(usage: AiUsageInfo, locale: Locale = 'es'): NextResponse {
  const error =
    locale === 'es'
      ? `Vas muy rápido: espera un momento antes de volver a usar ${usage.model}.`
      : `You are going too fast: wait a moment before using ${usage.model} again.`;
  return NextResponse.json({ error, usage }, { status: 429 });
}

/** Adjunta el estado de uso a cualquier respuesta de IA (opcional y tolerante). */
export function withUsageHeaders(response: NextResponse, remaining?: number): NextResponse {
  if (typeof remaining === 'number' && Number.isFinite(remaining)) {
    response.headers.set('X-AI-Remaining', String(remaining));
  }
  return response;
}

/** Resumen de uso para la UI (usado por GET /api/ai/usage). */
export async function getAiUsageSummary(request: NextRequest): Promise<AiUsageSummary> {
  void request;
  const perMinuteLimit = aiRequestsPerMinute();
  return {
    limit: perMinuteLimit,
    used: 0,
    remaining: perMinuteLimit,
    resetAt: nextResetIso(),
    model: PUBLIC_MODEL_NAME,
    registered: false,
    unlimited: true,
    perMinuteLimit,
  };
}
