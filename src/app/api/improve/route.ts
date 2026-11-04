import { NextRequest, NextResponse } from 'next/server';
import { askAIJSON, isAIConfigured } from '@/lib/aiServer';
import { buildImprovePrompt } from '@/lib/prompts';

// Las respuestas de IA pueden tardar: se amplía el límite de la función
// serverless (60s es el máximo del plan Hobby de Vercel).
export const maxDuration = 60;
import { reviewImprovement } from '@/lib/aiVerification';
import { getRequestLocale } from '@/lib/i18n/server';
import { checkRateLimit, getClientIp, pruneRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/requestGuard';
import { consumeAiQuota, withUsageHeaders } from '@/lib/aiQuota';

const RATE_LIMIT = 10;

interface ExperienceInput {
  id: string;
  position: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  achievements: string[];
}

/**
 * POST /api/improve
 * Mejora perfil y logros del CV con IA. Si la IA no está
 * disponible o la cuota diaria se agotó, aplica una mejora básica con reglas
 * (ai=false) en vez de bloquear al usuario.
 */
export async function POST(request: NextRequest) {
  if (isCrossSiteRequest(request)) {
    return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
  }

  pruneRateLimit();
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, RATE_LIMIT)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.' },
      { status: 429 },
    );
  }

  // Cuota diaria de IA. Si se agotó, no bloqueamos: devolvemos la mejora
  // local con reglas (no consume la key compartida), marcando ai=false.
  const quota = await consumeAiQuota(request, 'improve');

  try {
    const body = await request.json();
    const summary: string = typeof body?.summary === 'string' ? body.summary : '';
    const experience: ExperienceInput[] = Array.isArray(body?.experience) ? body.experience : [];

    if (quota.ok && isAIConfigured()) {
      try {
        const prompt = buildImprovePrompt(summary, experience, getRequestLocale(request));
        const raw = await askAIJSON<{ summary?: string; achievements?: string[][] }>(prompt, { temperature: 0.5, maxTokens: 2200 });
        const parsed = parseAIResponse(raw, experience);
        if (parsed.summary || parsed.experience) {
          // Avisos de cifras inventadas: se muestran, no se aplican solas.
          const warnings = reviewImprovement(
            [summary, ...experience.flatMap((exp) => exp.achievements)].join(' '),
            parsed,
            getRequestLocale(request),
          );
          return withUsageHeaders(NextResponse.json({ ...parsed, ai: true, warnings }), quota.remaining);
        }
      } catch (error) {
        console.error('Error con la IA en /api/improve:', error);
        // cae al fallback
      }
    }

    const improved = improveWithoutAI(summary, experience);
    return NextResponse.json({ ...improved, ai: false, usage: quota.usage || null });
  } catch (error) {
    console.error('Error en /api/improve:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}

function parseAIResponse(
  parsed: { summary?: string; achievements?: string[][] },
  experience: ExperienceInput[],
): { summary?: string; experience?: ExperienceInput[] } {
  const result: { summary?: string; experience?: ExperienceInput[] } = {};

  if (typeof parsed.summary === 'string' && parsed.summary.trim()) {
    result.summary = parsed.summary.trim().slice(0, 1200);
  }

  if (Array.isArray(parsed.achievements)) {
    result.experience = experience.map((exp, i) => {
      const rewritten = parsed.achievements?.[i];
      return {
        ...exp,
        achievements: Array.isArray(rewritten)
          ? rewritten.filter((a): a is string => typeof a === 'string' && a.trim().length > 0).map((a) => a.trim().slice(0, 400))
          : exp.achievements,
      };
    });
  }

  return result;
}

/** Mejora básica sin IA: agrega verbos de acción y frases profesionales */
function improveWithoutAI(
  summary: string,
  experience: ExperienceInput[],
): { summary?: string; experience?: ExperienceInput[] } {
  const result: { summary?: string; experience?: ExperienceInput[] } = {};

  if (summary) {
    result.summary = summary
      .replace(/soy un/gi, 'Profesional')
      .replace(/tengo experiencia/gi, 'Cuento con amplia experiencia')
      .replace(/trabajo en/gi, 'Me especializo en')
      .replace(/me gusta/gi, 'Me apasiona')
      .replace(/hago/gi, 'Desarrollo')
      .replace(/bueno en/gi, 'Competente en');
  }

  if (experience.length > 0) {
    const actionVerbs = [
      'Lideré', 'Implementé', 'Desarrollé', 'Optimicé', 'Gestioné',
      'Coordiné', 'Diseñé', 'Logré', 'Contribuí a', 'Impulsé',
    ];

    result.experience = experience.map((exp) => ({
      ...exp,
      achievements: exp.achievements.map((ach, i) => {
        const verb = actionVerbs[i % actionVerbs.length];
        if (/^(Lideré|Implementé|Desarrollé|Optimicé|Gestioné|Coordiné|Diseñé|Logré|Contribuí|Impulsé)/i.test(ach)) {
          return ach;
        }
        return `${verb} ${ach.charAt(0).toLowerCase() + ach.slice(1)}`;
      }),
    }));
  }

  return result;
}
