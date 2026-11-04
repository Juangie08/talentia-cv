import { NextRequest, NextResponse } from 'next/server';
import { aiError, aiNotConfigured } from '@/lib/aiErrors';
import { askAIJSON, isAIConfigured, AIError } from '@/lib/aiServer';
import { checkRateLimit, getClientIp, pruneRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/requestGuard';
import { consumeAiQuota, withUsageHeaders } from '@/lib/aiQuota';
import { getRequestLocale } from '@/lib/i18n/server';
import { buildTailorPrompt, TailorTone, VacancyBrief } from '@/lib/prompts';

// Las respuestas de IA pueden tardar: se amplía el límite de la función
// serverless (60s es el máximo del plan Hobby de Vercel).
export const maxDuration = 60;
import { analyzeVacancy, diagnosisForAI } from '@/lib/jobMatch';
import { cvSourceText, findUnsupportedClaims } from '@/lib/aiVerification';
import { isMockMode, mockTailoring } from '@/lib/aiMock';
import { CVData } from '@/lib/types';

const MAX_OFFER_CHARS = 6_000;
const RATE_LIMIT = 4;
const TONES: TailorTone[] = ['conservador', 'equilibrado', 'agresivo'];

interface TailorRaw {
  headlines?: unknown;
  headline?: unknown;
  summaries?: unknown;
  summary?: unknown;
  skillsAdd?: unknown;
  achievementRewrites?: unknown;
  gapAdvice?: unknown;
  companyAngle?: unknown;
  risks?: unknown;
}

interface SkillSuggestion {
  name: string;
  priority: 'must' | 'nice';
  why: string;
}

export interface TailorResult {
  headlines: string[];
  headline: string;
  summaries: string[];
  summary: string;
  skillsAdd: SkillSuggestion[];
  achievementRewrites: Array<{ id: string; achievements: string[] }>;
  gapAdvice: Array<{ term: string; advice: string }>;
  companyAngle: string;
  risks: string[];
}

/**
 * POST /api/ai/tailor
 * Personalización profunda para una vacante concreta: título, perfil, habilidades
 * priorizadas, logros reescritos y lectura estratégica de la oferta.
 *
 * Recibe además el diagnóstico determinista (calculado en el cliente) para que
 * el modelo sepa exactamente qué falta y no tenga que adivinarlo.
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

  const quota = await consumeAiQuota(request, 'tailor');
  if (!quota.ok) return quota.response!;

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: aiNotConfigured(getRequestLocale(request), 'tailor') },
      { status: 503 },
    );
  }

  let cv: CVData | undefined;
  let offer = '';
  let company = '';
  let role = '';
  let tone: TailorTone = 'equilibrado';
  try {
    const body = await request.json();
    cv = body?.cv as CVData;
    offer = typeof body?.offer === 'string' ? body.offer : '';
    company = typeof body?.company === 'string' ? body.company.slice(0, 120) : '';
    role = typeof body?.role === 'string' ? body.role.slice(0, 120) : '';
    if (TONES.includes(body?.tone)) tone = body.tone as TailorTone;
  } catch {
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'badBody') }, { status: 400 });
  }

  if (!cv || !cv.personalInfo || offer.trim().length < 30) {
    return NextResponse.json(
      { error: aiError(getRequestLocale(request), 'offerShort') },
      { status: 422 },
    );
  }

  const offerText = offer.slice(0, MAX_OFFER_CHARS);
  const analysis = analyzeVacancy(cv, offerText);
  const brief: VacancyBrief = {
    cv: {
      summary: cv.summary,
      title: cv.personalInfo.title,
      skills: cv.skills,
      languages: cv.languages.map((language) => language.name),
      experience: cv.experience.map((exp) => ({
        id: exp.id,
        position: exp.position,
        company: exp.company,
        achievements: exp.achievements,
      })),
      education: cv.education.map((edu) => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
      })),
    },
    offer: offerText,
    company,
    role: role || analysis.titleTarget,
    tone,
    diagnosis: diagnosisForAI(analysis),
  };

  try {
    const raw = isMockMode()
      ? (mockTailoring(cv, locale) as unknown as TailorRaw)
      : await askAIJSON<TailorRaw>(buildTailorPrompt(brief, locale), {
          temperature: 0.35,
          // El contrato es amplio: se pide concisión y se deja margen, con un
          // reintento si el proveedor corta la generación.
          maxTokens: 6000,
          retries: 1,
          jsonMode: true,
        });

    const result = sanitize(raw, cv);
    if (!result.summary && result.achievementRewrites.length === 0 && result.skillsAdd.length === 0) {
      return NextResponse.json(
        { error: aiError(getRequestLocale(request), 'tailorEmpty') },
        { status: 422 },
      );
    }

    // Cifras que no existen ni en el CV ni en la oferta (los marcadores [X] no cuentan).
    const source = cvSourceText(cv, offerText);
    const warnings = Array.from(
      new Set([
        ...findUnsupportedClaims(source, result.summary).map((claim) => claim.claim),
        ...result.achievementRewrites.flatMap((rewrite) =>
          findUnsupportedClaims(source, rewrite.achievements.join(' ')).map((claim) => claim.claim),
        ),
      ]),
    )
      .slice(0, 5)
      .map((claim) =>
        locale === 'es'
          ? `La cifra «${claim}» no aparece en tu hoja de vida ni en la oferta. Reemplázala por tu dato real.`
          : `The figure “${claim}” does not appear in your resume or in the job post. Replace it with your real data.`,
      );

    return withUsageHeaders(NextResponse.json({ result, analysis, warnings }), quota.remaining);
  } catch (error) {
    if (error instanceof AIError) {
      const status = error.code === 'timeout' ? 504 : 502;
      return NextResponse.json({ error: aiError(getRequestLocale(request), 'tailorFailed') }, { status });
    }
    console.error('Error en /api/ai/tailor:', error);
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'generic') }, { status: 500 });
  }
}

function stringList(value: unknown, max: number, maxLength: number): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim().slice(0, maxLength))
        .slice(0, max)
    : [];
}

/** Normaliza tipos, descarta ids inexistentes y limita longitudes. */
function sanitize(raw: TailorRaw, cv: CVData): TailorResult {
  const validIds = new Set(cv.experience.map((exp) => exp.id));

  const skillsAdd: SkillSuggestion[] = Array.isArray(raw.skillsAdd)
    ? raw.skillsAdd
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          name: typeof item.name === 'string' ? item.name.trim().slice(0, 60) : '',
          priority: item.priority === 'must' ? ('must' as const) : ('nice' as const),
          why: typeof item.why === 'string' ? item.why.trim().slice(0, 200) : '',
        }))
        .filter((item) => item.name.length > 0)
        .slice(0, 8)
    : [];

  const achievementRewrites = Array.isArray(raw.achievementRewrites)
    ? raw.achievementRewrites
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .filter((item) => typeof item.id === 'string' && validIds.has(item.id))
        .map((item) => ({
          id: item.id as string,
          achievements: stringList(item.achievements, 8, 400),
        }))
        .filter((item) => item.achievements.length > 0)
    : [];

  const gapAdvice = Array.isArray(raw.gapAdvice)
    ? raw.gapAdvice
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          term: typeof item.term === 'string' ? item.term.trim().slice(0, 60) : '',
          advice: typeof item.advice === 'string' ? item.advice.trim().slice(0, 300) : '',
        }))
        .filter((item) => item.term.length > 0 && item.advice.length > 0)
        .slice(0, 6)
    : [];

  const headlines = stringList(raw.headlines, 3, 90);
  const summaries = stringList(raw.summaries, 3, 900);
  const headline = typeof raw.headline === 'string' && raw.headline.trim() ? raw.headline.trim().slice(0, 90) : headlines[0] || '';
  const summary = typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary.trim().slice(0, 900) : summaries[0] || '';

  return {
    headlines,
    headline,
    summaries,
    summary,
    skillsAdd,
    achievementRewrites,
    gapAdvice,
    companyAngle: typeof raw.companyAngle === 'string' ? raw.companyAngle.trim().slice(0, 700) : '',
    risks: stringList(raw.risks, 4, 240),
  };
}
