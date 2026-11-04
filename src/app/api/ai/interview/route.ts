import { NextRequest, NextResponse } from 'next/server';
import { aiError, aiNotConfigured } from '@/lib/aiErrors';
import { askAIJSON, isAIConfigured, AIError } from '@/lib/aiServer';
import { checkRateLimit, getClientIp, pruneRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/requestGuard';
import { consumeAiQuota, withUsageHeaders } from '@/lib/aiQuota';
import { getRequestLocale } from '@/lib/i18n/server';
import { buildInterviewPrompt, VacancyBrief } from '@/lib/prompts';

// Las respuestas de IA pueden tardar: se amplía el límite de la función
// serverless (60s es el máximo del plan Hobby de Vercel).
export const maxDuration = 60;
import { analyzeVacancy, diagnosisForAI } from '@/lib/jobMatch';
import { isMockMode, mockInterview } from '@/lib/aiMock';
import { CVData } from '@/lib/types';

const MAX_OFFER_CHARS = 6_000;
const RATE_LIMIT = 4;

export interface InterviewQuestion {
  question: string;
  why: string;
  starHint: string;
  keywords: string[];
}

export interface InterviewResult {
  questions: InterviewQuestion[];
  questionsToAsk: string[];
  closingTip: string;
}

/**
 * POST /api/ai/interview
 * Prepara la entrevista probable para una vacante: preguntas, por qué las hacen
 * y cómo responderlas con hechos reales del CV (sin inventar experiencia).
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

  const quota = await consumeAiQuota(request, 'interview');
  if (!quota.ok) return quota.response!;

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: aiNotConfigured(getRequestLocale(request), 'interview') },
      { status: 503 },
    );
  }

  let cv: CVData | undefined;
  let offer = '';
  let company = '';
  let role = '';
  try {
    const body = await request.json();
    cv = body?.cv as CVData;
    offer = typeof body?.offer === 'string' ? body.offer : '';
    company = typeof body?.company === 'string' ? body.company.slice(0, 120) : '';
    role = typeof body?.role === 'string' ? body.role.slice(0, 120) : '';
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
    tone: 'equilibrado',
    diagnosis: diagnosisForAI(analysis),
  };

  try {
    const raw = isMockMode()
      ? (mockInterview(locale) as unknown as Record<string, unknown>)
      : await askAIJSON<Record<string, unknown>>(buildInterviewPrompt(brief, locale), {
          temperature: 0.5,
          maxTokens: 3500,
          retries: 1,
          jsonMode: true,
        });

    const result = sanitize(raw);
    if (result.questions.length === 0) {
      return NextResponse.json({ error: aiError(getRequestLocale(request), 'interviewEmpty') }, { status: 422 });
    }

    return withUsageHeaders(NextResponse.json({ result, analysis }), quota.remaining);
  } catch (error) {
    if (error instanceof AIError) {
      const status = error.code === 'timeout' ? 504 : 502;
      return NextResponse.json({ error: aiError(getRequestLocale(request), 'interviewFailed') }, { status });
    }
    console.error('Error en /api/ai/interview:', error);
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'generic') }, { status: 500 });
  }
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function stringList(value: unknown, max: number, maxLength: number): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim().slice(0, maxLength))
        .slice(0, max)
    : [];
}

function sanitize(raw: Record<string, unknown>): InterviewResult {
  const questions = Array.isArray(raw.questions)
    ? raw.questions
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
        .map((item) => ({
          question: text(item.question, 300),
          why: text(item.why, 300),
          starHint: text(item.starHint, 600),
          keywords: stringList(item.keywords, 3, 40),
        }))
        .filter((item) => item.question.length > 0)
        .slice(0, 10)
    : [];

  return {
    questions,
    questionsToAsk: stringList(raw.questionsToAsk, 6, 260),
    closingTip: text(raw.closingTip, 400),
  };
}
