import { NextRequest, NextResponse } from 'next/server';
import { aiError, aiNotConfigured } from '@/lib/aiErrors';
import { askAIJSON, isAIConfigured, AIError } from '@/lib/aiServer';
import { checkRateLimit, getClientIp, pruneRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/requestGuard';
import { consumeAiQuota, withUsageHeaders } from '@/lib/aiQuota';
import { getRequestLocale } from '@/lib/i18n/server';
import { buildSuggestPrompt } from '@/lib/prompts';

// Las respuestas de IA pueden tardar: se amplía el límite de la función
// serverless (60s es el máximo del plan Hobby de Vercel).
export const maxDuration = 60;

/**
 * POST /api/ai/suggest
 * Sugiere contenido corto para un campo del CV (perfil, logro, título).
 * Devuelve SIEMPRE 3 variantes para que el usuario elija: la IA nunca
 * escribe directamente en su hoja de vida.
 *
 * body: { field: 'summary' | 'achievement' | 'title', context: {...} }
 */

const RATE_LIMIT = 10;

type SuggestField = 'summary' | 'achievement' | 'title';

interface SuggestBody {
  field?: SuggestField;
  role?: string;
  company?: string;
  currentText?: string;
  yearsHint?: string;
  skills?: string[];
  achievements?: string[];
}

function sanitizeVariant(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  if (isCrossSiteRequest(request)) {
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'origin') }, { status: 403 });
  }

  pruneRateLimit();
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, RATE_LIMIT)) {
    return NextResponse.json(
      { error: aiError(getRequestLocale(request), 'rateLimit') },
      { status: 429 },
    );
  }

  const quota = await consumeAiQuota(request, 'suggest');
  if (!quota.ok) return quota.response!;

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: aiNotConfigured(getRequestLocale(request), 'suggest') },
      { status: 503 },
    );
  }

  let body: SuggestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'badBody') }, { status: 400 });
  }

  const field = body.field;
  if (field !== 'summary' && field !== 'achievement' && field !== 'title') {
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'unsupportedField') }, { status: 422 });
  }

  const role = (body.role || '').toString().slice(0, 120).trim();
  const company = (body.company || '').toString().slice(0, 120).trim();
  const yearsHint = (body.yearsHint || '').toString().slice(0, 40).trim();

  if (field === 'achievement' && (!role || !company)) {
    return NextResponse.json(
      { error: aiError(getRequestLocale(request), 'missingRole') },
      { status: 422 },
    );
  }

  const prompt = buildSuggestPrompt(field, { ...body, role, company, yearsHint }, getRequestLocale(request));

  try {
    const raw = await askAIJSON<{ variants?: unknown[] }>(prompt, { temperature: 0.7, maxTokens: 900 });
    const maxLen = field === 'summary' ? 480 : field === 'achievement' ? 220 : 70;
    const variants = Array.isArray(raw?.variants)
      ? raw.variants.map((v) => sanitizeVariant(v, maxLen)).filter(Boolean).slice(0, 3)
      : [];

    if (variants.length === 0) {
      return NextResponse.json(
        { error: aiError(getRequestLocale(request), 'suggestEmpty') },
        { status: 422 },
      );
    }

    return withUsageHeaders(NextResponse.json({ variants }), quota.remaining);
  } catch (error) {
    if (error instanceof AIError) {
      const status = error.code === 'timeout' ? 504 : 502;
      return NextResponse.json({ error: aiError(getRequestLocale(request), 'suggestTimeout') }, { status });
    }
    console.error('Error en /api/ai/suggest:', error);
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'generic') }, { status: 500 });
  }
}

