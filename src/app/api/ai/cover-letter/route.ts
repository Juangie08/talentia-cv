import { NextRequest, NextResponse } from 'next/server';
import { aiError, aiNotConfigured } from '@/lib/aiErrors';
import { askAIJSON, isAIConfigured, AIError } from '@/lib/aiServer';
import { checkRateLimit, getClientIp, pruneRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/requestGuard';
import { consumeAiQuota, withUsageHeaders } from '@/lib/aiQuota';
import { getRequestLocale } from '@/lib/i18n/server';
import { buildCoverLetterPrompt, TailorTone, VacancyBrief } from '@/lib/prompts';

// Las respuestas de IA pueden tardar: se amplía el límite de la función
// serverless (60s es el máximo del plan Hobby de Vercel).
export const maxDuration = 60;
import { analyzeVacancy, diagnosisForAI } from '@/lib/jobMatch';
import { cvSourceText, reviewText } from '@/lib/aiVerification';
import { isMockMode, mockCoverLetter } from '@/lib/aiMock';
import { CVData } from '@/lib/types';

const MAX_OFFER_CHARS = 6_000;
const RATE_LIMIT = 4;
const TONES: TailorTone[] = ['conservador', 'equilibrado', 'agresivo'];

interface LetterRaw {
  subject?: unknown;
  body?: unknown;
  linkedinHeadline?: unknown;
  linkedinSummary?: unknown;
  followUp?: unknown;
}

export interface CoverLetterResult {
  subject: string;
  body: string;
  linkedinHeadline: string;
  linkedinSummary: string;
  followUp: string;
}

/**
 * POST /api/ai/cover-letter
 * Carta de presentación para la vacante + titular y resumen de LinkedIn.
 * Sin datos inventados: si falta una cifra, el modelo deja un marcador [X].
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

  const quota = await consumeAiQuota(request, 'letter');
  if (!quota.ok) return quota.response!;

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: aiNotConfigured(getRequestLocale(request), 'letter') },
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
      ? (mockCoverLetter(locale) as unknown as LetterRaw)
      : await askAIJSON<LetterRaw>(buildCoverLetterPrompt(brief, locale), {
          temperature: 0.6,
          maxTokens: 3000,
          retries: 1,
          jsonMode: true,
        });

    const result = sanitize(raw);
    if (!result.body) {
      return NextResponse.json({ error: aiError(getRequestLocale(request), 'letterEmpty') }, { status: 422 });
    }

    const warnings = reviewText(cvSourceText(cv, offerText), result.body, locale);
    return withUsageHeaders(NextResponse.json({ result, analysis, warnings }), quota.remaining);
  } catch (error) {
    if (error instanceof AIError) {
      const status = error.code === 'timeout' ? 504 : 502;
      return NextResponse.json({ error: aiError(getRequestLocale(request), 'letterFailed') }, { status });
    }
    console.error('Error en /api/ai/cover-letter:', error);
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'generic') }, { status: 500 });
  }
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function sanitize(raw: LetterRaw): CoverLetterResult {
  return {
    subject: text(raw.subject, 140),
    body: text(raw.body, 4000),
    linkedinHeadline: text(raw.linkedinHeadline, 160),
    linkedinSummary: text(raw.linkedinSummary, 1800),
    followUp: text(raw.followUp, 700),
  };
}
