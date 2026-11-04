/**
 * Cliente de IA del servidor.
 *
 * La aplicación habla con cualquier endpoint compatible con la API de chat de
 * OpenAI (`POST {AI_BASE_URL}/chat/completions`).
 *
 * Seguridad: la clave y la URL del servicio viven SOLO en el entorno del
 * servidor (`AI_API_KEY`, `AI_BASE_URL`). Nunca se envían al navegador, nunca
 * se registran en el cliente y nunca se escriben en el repositorio. Sin
 * `AI_API_KEY` la app sigue funcionando con sus respaldos locales.
 */

import { buildVisionPrompt } from './prompts';
import { isMockMode, mockChatText, mockVisionTranscript } from './aiMock';
import type { Locale } from './i18n/config';

const BASE_URL = (process.env.AI_BASE_URL || '').trim().replace(/\/+$/, '');
const API_KEY = (process.env.AI_API_KEY || '').trim();
const MODEL = (process.env.AI_MODEL || 'auto').trim();
const VISION_MODEL = (process.env.AI_VISION_MODEL || MODEL).trim();
const REQUEST_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 90_000);

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: 'no-key' | 'timeout' | 'http' | 'empty' | 'parse',
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export function isAIConfigured(): boolean {
  // En modo de prueba (AI_MOCK=1) el producto funciona sin proveedor ni clave.
  return isMockMode() || Boolean(API_KEY && BASE_URL);
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

export type ChatPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  /** Parts multimodales (texto + imágenes); reemplaza al prompt simple. */
  parts?: ChatPart[];
  /** Fuerza un modelo distinto al principal (p. ej. el multimodal). */
  model?: string;
  /**
   * Reintentos ante fallos transitorios del proveedor (corte de red, 5xx,
   * respuesta vacía). 0 = sin reintentos. Nunca reintenta un JSON inválido.
   */
  retries?: number;
  /**
   * Pide al proveedor el modo JSON (`response_format`). Si el endpoint no lo
   * soporta, se reintenta sin él: algunos modelos razonan en voz alta y nunca
   * llegan a emitir el objeto, y esto es lo que evita el 502.
   */
  jsonMode?: boolean;
}

/**
 * Envía un prompt (o un mensaje multimodal) al modelo y devuelve el texto de la respuesta.
 */
export async function askAI(prompt: string, options: ChatOptions = {}): Promise<string> {
  if (!API_KEY || !BASE_URL) {
    if (isMockMode()) return mockChatText(prompt);
    throw new AIError('El asistente de IA no está configurado en el servidor', 'no-key');
  }

  if (isMockMode()) return mockChatText(prompt);

  const model = options.model || MODEL;
  const content = options.parts?.length ? options.parts : prompt;

  const send = (jsonMode: boolean) =>
    fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2000,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

  let response: Response;
  try {
    response = await send(Boolean(options.jsonMode));
    // Endpoint sin soporte de response_format: se repite la llamada sin él.
    if (!response.ok && options.jsonMode && [400, 404, 422, 501].includes(response.status)) {
      console.warn(`[ai] response_format no soportado (${response.status}); se reintenta sin modo JSON`);
      response = await send(false);
    }
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new AIError('La IA tardó demasiado en responder', 'timeout');
    }
    throw new AIError('No se pudo conectar con la IA', 'http');
  }

  if (!response.ok) {
    // El detalle queda solo en el log del servidor; al usuario nunca se le
    // muestran datos del proveedor ni de la infraestructura.
    const detail = await response.text().catch(() => '');
    // El detalle queda solo en el log del servidor: sirve para diagnosticar
    // (límite de tokens, corte del proveedor) sin mostrarlo al usuario.
    console.error(`[ai] upstream ${response.status}: ${detail.slice(0, 300)}`);
    throw new AIError(`La IA respondió con error ${response.status}: ${detail.slice(0, 200)}`, 'http');
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AIError('La IA devolvió una respuesta vacía', 'empty');
  }
  return text;
}

/**
 * Lee imágenes (hojas de vida escaneadas o en foto) con el modelo multimodal
 * y devuelve el texto completo que contienen.
 */
export async function readTextFromImages(images: string[], locale: Locale = 'es'): Promise<string> {
  if (images.length === 0) return '';
  if (isMockMode()) return mockVisionTranscript();

  const parts: ChatPart[] = [
    { type: 'text', text: buildVisionPrompt(locale) },
    ...images.map((url): ChatPart => ({ type: 'image_url', image_url: { url } })),
  ];

  const text = await askAI('', {
    parts,
    model: VISION_MODEL,
    temperature: 0.1,
    maxTokens: 3000,
  });
  return text;
}

/**
 * Extrae el primer objeto JSON de un texto que puede venir con markdown
 * (```json ... ```) o con explicaciones alrededor.
 */
export function extractJsonObject(text: string): unknown {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new AIError('La IA no devolvió un JSON válido', 'parse');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Pide al modelo una respuesta JSON y la parsea de forma tolerante.
 */
export async function askAIJSON<T>(prompt: string, options: ChatOptions = {}): Promise<T> {
  const attempts = Math.max(1, Math.min(3, (options.retries ?? 0) + 1));
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const text = await askAI(prompt, options);
      return extractJsonObject(text) as T;
    } catch (error) {
      lastError = error;
      // Solo se reintenta lo transitorio: un JSON malformado no mejora solo.
      // Un JSON truncado por el proveedor suele ser azar del enrutado, así que
      // también se reintenta una vez.
      const transient =
        error instanceof AIError &&
        (error.code === 'http' || error.code === 'timeout' || error.code === 'empty' || error.code === 'parse');
      if (!transient || attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
    }
  }

  if (lastError instanceof AIError) throw lastError;
  throw new AIError('La IA devolvió un JSON que no se pudo leer', 'parse');
}
