import { NextRequest, NextResponse } from 'next/server';
import { aiError, aiNotConfigured } from '@/lib/aiErrors';
import { askAIJSON, readTextFromImages, isAIConfigured, AIError } from '@/lib/aiServer';
import { normalizeCVData, describeExtracted } from '@/lib/cvNormalize';
import { checkRateLimit, getClientIp, pruneRateLimit } from '@/lib/rateLimit';
import { isCrossSiteRequest } from '@/lib/requestGuard';
import { consumeAiQuota, withUsageHeaders } from '@/lib/aiQuota';
import { getRequestLocale } from '@/lib/i18n/server';
import { buildExtractPrompt } from '@/lib/prompts';

const MAX_TEXT_CHARS = 12_000;
const MAX_IMAGES = 6;
const MAX_IMAGE_DATAURL_CHARS = 6_000_000; // ~4.5 MB de bytes por imagen
const RATE_LIMIT = 8; // peticiones por minuto por IP

// Las respuestas de IA pueden tardar: se amplía el límite de la función
// serverless (60s es el máximo del plan Hobby de Vercel).
export const maxDuration = 60;

/**
 * POST /api/ai/extract
 * Recibe uno de:
 *  - { text }          → texto crudo de una hoja de vida (o narración libre del usuario)
 *  - { images: [...] } → data URLs de páginas escaneadas / fotos del CV
 * y devuelve datos estructurados (CVData parcial) usando el asistente de IA:
 * las imágenes primero se transcriben con el modelo multimodal.
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

  // Cuota diaria en créditos (protege la IA compartida; el respaldo regex
  // sigue disponible para el usuario aunque se agote).
  const quota = await consumeAiQuota(request, 'extract');
  if (!quota.ok) return quota.response!;

  if (!isAIConfigured()) {
    return NextResponse.json(
      { error: aiNotConfigured(getRequestLocale(request), 'extract') },
      { status: 503 },
    );
  }

  let text = '';
  let images: string[] = [];
  try {
    const body = await request.json();
    if (typeof body?.text === 'string') {
      text = body.text;
    }
    if (Array.isArray(body?.images)) {
      images = body.images
        .filter((img: unknown): img is string => typeof img === 'string' && img.startsWith('data:image/'))
        .slice(0, MAX_IMAGES);
      if (images.some((img: string) => img.length > MAX_IMAGE_DATAURL_CHARS)) {
        return NextResponse.json({ error: aiError(getRequestLocale(request), 'imageTooLarge') }, { status: 413 });
      }
    }
  } catch {
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'badBody') }, { status: 400 });
  }

  const trimmed = text.trim();
  if (!trimmed && images.length === 0) {
    return NextResponse.json(
      { error: aiError(getRequestLocale(request), 'emptyInput') },
      { status: 422 },
    );
  }

  try {
    let sourceText = trimmed;

    // Imágenes (PDF escaneado o foto): transcribir con el modelo multimodal.
    if (images.length > 0) {
      const transcribed = await readTextFromImages(images, locale);
      sourceText = `${transcribed}\n${trimmed}`.trim();
    }

    if (sourceText.trim().length < 40) {
      return NextResponse.json(
        { error: aiError(getRequestLocale(request), 'unreadable') },
        { status: 422 },
      );
    }

    const prompt = buildExtractPrompt(sourceText.slice(0, MAX_TEXT_CHARS), locale);
    const raw = await askAIJSON<unknown>(prompt, { temperature: 0.2, maxTokens: 2500 });
    const data = normalizeCVData(raw);
    const found = describeExtracted(data);
    if (found.length === 0) {
      return NextResponse.json(
        { error: aiError(getRequestLocale(request), 'noData') },
        { status: 422 },
      );
    }
    return withUsageHeaders(NextResponse.json({ data, found }), quota.remaining);
  } catch (error) {
    if (error instanceof AIError) {
      const status = error.code === 'timeout' ? 504 : 502;
      return NextResponse.json({ error: aiError(getRequestLocale(request), 'extractFailed') }, { status });
    }
    console.error('Error en /api/ai/extract:', error);
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'generic') }, { status: 500 });
  }
}

