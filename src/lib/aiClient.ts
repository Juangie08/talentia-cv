import { Experience } from './types';

export type Provider = 'gemini' | 'openai' | 'zai' | 'local';

export interface AIConfig {
  provider: Provider;
  geminiApiKey?: string;
  openaiApiKey?: string;
  zaiApiKey?: string;
  model?: string;
}

export interface ImprovePayload {
  summary: string;
  experience: Experience[];
}

export interface ImproveResult {
  summary: string;
  experience: Experience[];
}

export const AI_CONFIG_KEY = 'hdv.apiConfig';

const DEFAULT_PROVIDER: Provider = 'local';
const DEFAULT_MODELS: Record<Exclude<Provider, 'local'>, string> = {
  gemini: 'gemini-pro',
  openai: 'gpt-3.5-turbo',
  zai: 'flash',
};

function parseJSONSafe<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isProvider(value: unknown): value is Provider {
  return value === 'gemini' || value === 'openai' || value === 'zai' || value === 'local';
}

function sanitizeConfig(raw: Partial<AIConfig> | null): AIConfig {
  if (!raw || !isProvider(raw.provider)) {
    return { provider: DEFAULT_PROVIDER };
  }

  return {
    provider: raw.provider,
    geminiApiKey: raw.geminiApiKey?.trim() || undefined,
    openaiApiKey: raw.openaiApiKey?.trim() || undefined,
    zaiApiKey: raw.zaiApiKey?.trim() || undefined,
    model: raw.model?.trim() || undefined,
  };
}

export function getAIConfig(): AIConfig {
  if (typeof window === 'undefined') return { provider: DEFAULT_PROVIDER };

  const stored = parseJSONSafe<Partial<AIConfig>>(localStorage.getItem(AI_CONFIG_KEY));
  return sanitizeConfig(stored);
}

export function saveAIConfig(config: AIConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(sanitizeConfig(config)));
}

/**
 * Mejora texto con proveedor local o proveedor externo configurado.
 */
export async function improveTextWithAI(
  config: AIConfig,
  payload: ImprovePayload
): Promise<ImproveResult> {
  const sanitizedConfig = sanitizeConfig(config);

  if (sanitizedConfig.provider === 'local') {
    return improveWithoutAI(payload.summary, payload.experience);
  }

  const prompt = buildImprovementPrompt(payload.summary, payload.experience);

  try {
    if (sanitizedConfig.provider === 'gemini' && sanitizedConfig.geminiApiKey) {
      return await callGemini(sanitizedConfig.geminiApiKey, prompt, payload.experience);
    }

    if (sanitizedConfig.provider === 'openai' && sanitizedConfig.openaiApiKey) {
      return await callOpenAI(
        sanitizedConfig.openaiApiKey,
        prompt,
        payload.experience,
        sanitizedConfig.model || DEFAULT_MODELS.openai
      );
    }

    if (sanitizedConfig.provider === 'zai' && sanitizedConfig.zaiApiKey) {
      return await callZai(
        sanitizedConfig.zaiApiKey,
        prompt,
        payload.experience,
        sanitizedConfig.model || DEFAULT_MODELS.zai
      );
    }
  } catch (error) {
    console.error('Error al mejorar con IA:', error);
  }

  return improveWithoutAI(payload.summary, payload.experience);
}

async function callGemini(apiKey: string, prompt: string, experience: Experience[]): Promise<ImproveResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error en Gemini API');
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseAIResponse(text, experience);
}

async function callOpenAI(
  apiKey: string,
  prompt: string,
  experience: Experience[],
  model: string
): Promise<ImproveResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error en OpenAI API');
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content || '';
  return parseAIResponse(text, experience);
}

async function callZai(
  apiKey: string,
  prompt: string,
  experience: Experience[],
  model: string
): Promise<ImproveResult> {
  const response = await fetch('https://api.z.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('Error en Z.ai API. Revisa endpoint y API key.');
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content || '';
  return parseAIResponse(text, experience);
}

function buildImprovementPrompt(summary: string, experience: Experience[]): string {
  const expText = experience
    .map((item) => `Cargo: ${item.position} en ${item.company}\nLogros:\n${item.achievements.map((a) => `- ${a}`).join('\n')}`)
    .join('\n\n');

  return `Eres un experto en redaccion de hojas de vida profesionales en espanol.
Mejora el siguiente contenido del CV con tono profesional, verbos de accion y enfoque en resultados.

RESUMEN ACTUAL:
${summary || '(vacio)'}

EXPERIENCIA ACTUAL:
${expText || '(vacia)'}

Responde SOLO en JSON con este formato:
{
  "summary": "resumen mejorado aqui",
  "achievements": [
    ["logro mejorado 1 del trabajo 1", "logro mejorado 2 del trabajo 1"],
    ["logro mejorado 1 del trabajo 2"]
  ]
}`;
}

function parseAIResponse(text: string, experience: Experience[]): ImproveResult {
  try {
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || cleaned) as {
      summary?: unknown;
      achievements?: unknown;
    };

    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      experience: experience.map((item, index) => {
        const parsedAchievements = Array.isArray((parsed.achievements as unknown[] | undefined)?.[index])
          ? ((parsed.achievements as string[][])[index] || [])
          : item.achievements;

        return {
          ...item,
          achievements: parsedAchievements,
        };
      }),
    };
  } catch {
    return { summary: text.trim().slice(0, 500), experience };
  }
}

function improveWithoutAI(summary: string, experience: Experience[]): ImproveResult {
  const professionalVerbs = [
    'Lidere',
    'Implemente',
    'Desarrolle',
    'Optimice',
    'Gestione',
    'Coordine',
    'Disene',
    'Logre',
    'Impulse',
    'Asesore',
    'Asegure',
    'Contribui a',
    'Supervise',
    'Colabore en',
  ];

  const polishSentence = (sentence: string, index: number): string => {
    let normalized = sentence.trim();
    if (!normalized) return normalized;

    normalized = normalized.replace(
      /^(me encargue de|era responsable de|hice|hacia|yo|estaba en el area de)\s+/i,
      ''
    );

    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);

    const startsWithAction = professionalVerbs.some((verb) => normalized.startsWith(verb));
    if (!startsWithAction && normalized.length > 5) {
      const verb = professionalVerbs[index % professionalVerbs.length];
      normalized = `${verb} ${normalized.charAt(0).toLowerCase() + normalized.slice(1)}`;
    }

    if (!normalized.endsWith('.')) normalized += '.';

    return normalized;
  };

  return {
    summary: summary
      ? summary.length < 50
        ? `Profesional proactivo con capacidad de adaptacion. ${summary}.`
        : summary
      : '',
    experience: experience.map((item) => ({
      ...item,
      achievements: item.achievements.map((achievement, index) => polishSentence(achievement, index)),
    })),
  };
}
