import { NextRequest, NextResponse } from 'next/server';
import { aiError, aiNotConfigured } from '@/lib/aiErrors';
import { askAIJSON, isAIConfigured, AIError } from '@/lib/aiServer';
import { checkRateLimit, getClientIp, pruneRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/requestGuard';
import { consumeAiQuota, withUsageHeaders } from '@/lib/aiQuota';
import { getRequestLocale } from '@/lib/i18n/server';
import { buildAdaptPrompt } from '@/lib/prompts';
import { cvSourceText, reviewAdaptation } from '@/lib/aiVerification';
import { isMockMode, mockAdaptation } from '@/lib/aiMock';
import { CVData } from '@/lib/types';

const MAX_OFFER_CHARS = 6_000;
const RATE_LIMIT = 6;

// Las respuestas de IA pueden tardar: se amplía el límite de la función
// serverless (60s es el máximo del plan Hobby de Vercel).
export const maxDuration = 60;

interface AdaptResult {
  summary?: string;
  skillsAdd?: string[];
  experienceRewrites?: Array<{ id: string; achievements: string[] }>;
}

/**
 * POST /api/ai/adapt
 * Recibe la hoja de vida y el texto de una oferta laboral, y sugiere cómo
 * reescribir perfil, habilidades y logros para alinearlos con la oferta.
 * Regla clave: NO inventa experiencia; solo reformula lo existente.
 */
export async function POST(request: NextRequest) {
  if (isCrossSiteRequest(request)) {
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'origin') }, { status: 403 });
  }

  const locale = getRequestLocale(request);

  pruneRateLimit();
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, RATE_LIMIT)) {
    return NextResponse.json(
      { error: aiError(getRequestLocale(request), 'rateLimit') },
      { status: 429 },
    );
  }

  // Cuota diaria en créditos (protege la IA compartida).
  const quota = await consumeAiQuota(request, 'adapt');
  if (!quota.ok) return quota.response!;

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: aiNotConfigured(getRequestLocale(request), 'adapt') },
      { status: 503 },
    );
  }

  let cv: CVData | undefined;
  let offer = '';
  try {
    const body = await request.json();
    cv = body?.cv as CVData;
    offer = typeof body?.offer === 'string' ? body.offer : '';
  } catch {
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'badBody') }, { status: 400 });
  }

  if (!cv || !cv.personalInfo || offer.trim().length < 30) {
    return NextResponse.json(
      { error: aiError(getRequestLocale(request), 'offerShort') },
      { status: 422 },
    );
  }

  const prompt = buildAdaptPrompt(cv, offer.slice(0, MAX_OFFER_CHARS), locale);

  try {
    // En modo de prueba (AI_MOCK=1) la adaptación se arma con los datos reales
    // del CV, así los ids siempre coinciden.
    const raw = isMockMode()
      ? mockAdaptation(cv)
      : await askAIJSON<AdaptResult>(prompt, { temperature: 0.4, maxTokens: 2200 });
    const result = sanitizeAdaptResult(raw, cv);
    if (!result.summary && result.skillsAdd.length === 0 && result.experienceRewrites.length === 0) {
      return NextResponse.json(
        { error: aiError(getRequestLocale(request), 'adaptEmpty') },
        { status: 422 },
      );
    }
    // Avisos de cifras que la IA inventó (no están ni en el CV ni en la oferta).
    const warnings = reviewAdaptation(cvSourceText(cv, offer), result, locale);
    return withUsageHeaders(NextResponse.json({ result, warnings }), quota.remaining);
  } catch (error) {
    if (error instanceof AIError) {
      const status = error.code === 'timeout' ? 504 : 502;
      return NextResponse.json({ error: aiError(getRequestLocale(request), 'adaptFailed') }, { status });
    }
    console.error('Error en /api/ai/adapt:', error);
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'generic') }, { status: 500 });
  }
}

interface SanitizedAdapt {
  summary: string;
  skillsAdd: string[];
  experienceRewrites: Array<{ id: string; achievements: string[] }>;
}

/** Descarta reescrituras de experiencias inexistentes y normaliza tipos. */
function sanitizeAdaptResult(raw: AdaptResult, cv: CVData): SanitizedAdapt {
  const validIds = new Set(cv.experience.map((exp) => exp.id));
  return {
    summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 1200) : '',
    skillsAdd: Array.isArray(raw.skillsAdd)
      ? raw.skillsAdd
          .filter((skill): skill is string => typeof skill === 'string' && skill.trim().length > 0)
          .map((skill) => skill.trim().slice(0, 60))
          .slice(0, 12)
      : [],
    experienceRewrites: Array.isArray(raw.experienceRewrites)
      ? raw.experienceRewrites
          .filter((rewrite) => rewrite && typeof rewrite.id === 'string' && validIds.has(rewrite.id))
          .map((rewrite) => ({
            id: rewrite.id,
            achievements: Array.isArray(rewrite.achievements)
              ? rewrite.achievements
                  .filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
                  .map((a) => a.trim().slice(0, 400))
                  .slice(0, 10)
              : [],
          }))
          .filter((rewrite) => rewrite.achievements.length > 0)
      : [],
  };
}

