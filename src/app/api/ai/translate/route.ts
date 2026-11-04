import { NextRequest, NextResponse } from 'next/server';
import { aiError, aiNotConfigured } from '@/lib/aiErrors';
import { askAIJSON, isAIConfigured, AIError } from '@/lib/aiServer';
import { checkRateLimit, getClientIp, pruneRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/requestGuard';
import { consumeAiQuota, withUsageHeaders } from '@/lib/aiQuota';
import { getRequestLocale } from '@/lib/i18n/server';
import { buildTranslatePrompt } from '@/lib/prompts';

// Las respuestas de IA pueden tardar: se amplía el límite de la función
// serverless (60s es el máximo del plan Hobby de Vercel).
export const maxDuration = 60;
import { cvSourceText, findUnsupportedClaims } from '@/lib/aiVerification';
import { isMockMode, mockTranslation } from '@/lib/aiMock';
import { CVData } from '@/lib/types';

const RATE_LIMIT = 6;

interface TranslateResult {
  summary?: string;
  skills?: string[];
  experience?: Array<{ id?: string; position?: string; achievements?: string[] }>;
  education?: Array<{ id?: string; degree?: string; field?: string }>;
}

/**
 * POST /api/ai/translate
 * Traduce el contenido de la hoja de vida al otro idioma del producto
 * (español ⇄ inglés) sin tocar el diseño ni los datos duros: cifras, fechas,
 * empresas e instituciones se conservan tal cual.
 *
 * body: { cv: CVData, target: 'es' | 'en' }
 */
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

  // Traducir cuesta lo mismo que adaptar: reescribe todo el contenido.
  const quota = await consumeAiQuota(request, 'adapt');
  if (!quota.ok) return quota.response!;

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: aiNotConfigured(getRequestLocale(request), 'translate') },
      { status: 503 },
    );
  }

  let cv: CVData | undefined;
  let target: 'es' | 'en' | undefined;
  try {
    const body = await request.json();
    cv = body?.cv as CVData;
    target = body?.target === 'es' || body?.target === 'en' ? body.target : undefined;
  } catch {
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'badBody') }, { status: 400 });
  }

  if (!cv || !cv.personalInfo || !target) {
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'translateMissing') }, { status: 422 });
  }

  const locale = getRequestLocale(request);
  const prompt = buildTranslatePrompt(cv, target);

  try {
    const raw = isMockMode()
      ? mockTranslation(cv, target)
      : await askAIJSON<TranslateResult>(prompt, { temperature: 0.2, maxTokens: 2500 });

    const result = sanitizeTranslation(raw, cv);
    if (!result.summary && result.experience.length === 0 && result.education.length === 0) {
      return NextResponse.json(
        { error: aiError(getRequestLocale(request), 'translateEmpty') },
        { status: 422 },
      );
    }

    return withUsageHeaders(
      NextResponse.json({ result, target, warnings: reviewTranslation(cv, result, locale) }),
      quota.remaining,
    );
  } catch (error) {
    if (error instanceof AIError) {
      const status = error.code === 'timeout' ? 504 : 502;
      return NextResponse.json({ error: aiError(getRequestLocale(request), 'translateFailed') }, { status });
    }
    console.error('Error en /api/ai/translate:', error);
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'generic') }, { status: 500 });
  }
}

/** Descarta entradas con ids inventados y normaliza tipos y longitudes. */
function sanitizeTranslation(raw: TranslateResult, cv: CVData): {
  summary: string;
  skills: string[];
  experience: Array<{ id: string; position: string; achievements: string[] }>;
  education: Array<{ id: string; degree: string; field: string }>;
} {
  const validExpIds = new Set(cv.experience.map((exp) => exp.id));
  const validEduIds = new Set(cv.education.map((edu) => edu.id));

  const experience = Array.isArray(raw.experience)
    ? raw.experience
        .filter((item) => item && typeof item.id === 'string' && validExpIds.has(item.id))
        .map((item) => ({
          id: item.id as string,
          position: typeof item.position === 'string' ? item.position.trim().slice(0, 120) : '',
          achievements: Array.isArray(item.achievements)
            ? item.achievements
                .filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
                .map((a) => a.trim().slice(0, 400))
                .slice(0, 10)
            : [],
        }))
    : [];

  const education = Array.isArray(raw.education)
    ? raw.education
        .filter((item) => item && typeof item.id === 'string' && validEduIds.has(item.id))
        .map((item) => ({
          id: item.id as string,
          degree: typeof item.degree === 'string' ? item.degree.trim().slice(0, 120) : '',
          field: typeof item.field === 'string' ? item.field.trim().slice(0, 120) : '',
        }))
    : [];

  return {
    summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 1200) : '',
    skills: Array.isArray(raw.skills)
      ? raw.skills
          .filter((skill): skill is string => typeof skill === 'string' && skill.trim().length > 0)
          .map((skill) => skill.trim().slice(0, 60))
          .slice(0, 20)
      : [],
    experience,
    education,
  };
}

/** Una traducción no debería introducir cifras nuevas: se avisa si lo hace. */
function reviewTranslation(
  cv: CVData,
  result: ReturnType<typeof sanitizeTranslation>,
  locale: 'es' | 'en',
): string[] {
  const generated = [
    result.summary,
    ...result.experience.flatMap((exp) => [exp.position, ...exp.achievements]),
    ...result.education.flatMap((edu) => [edu.degree, edu.field]),
  ].join(' \n ');

  return findUnsupportedClaims(cvSourceText(cv), generated)
    .slice(0, 5)
    .map((claim) =>
      locale === 'es'
        ? `La traducción introdujo la cifra «${claim.claim}», que no está en tu hoja de vida. Corrígela antes de exportar.`
        : `The translation introduced the figure “${claim.claim}”, which is not in your resume. Fix it before exporting.`,
    );
}
