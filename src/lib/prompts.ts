import type { Locale } from './i18n/config';

/**
 * Prompts del asistente de IA, en un solo sitio y en los dos idiomas del producto.
 *
 * Antes vivían dentro de cada ruta y estaban escritos solo en español, así que
 * un usuario con la interfaz en inglés recibía respuestas en español. Aquí cada
 * función recibe el locale de la petición y escribe las reglas en ese idioma:
 * el modelo responde en el idioma en que se le pide.
 *
 * Al editar un prompt, edita también su contrato JSON final: las rutas lo
 * parsean tal cual.
 */

export interface SuggestContext {
  role?: string;
  company?: string;
  currentText?: string;
  yearsHint?: string;
  skills?: string[];
  achievements?: string[];
}

export type SuggestField = 'summary' | 'achievement' | 'title';

export interface ImproveExperience {
  position: string;
  company: string;
  achievements: string[];
}

/** Rebanada del CV que necesita el prompt de adaptación. */
export interface AdaptContext {
  summary?: string;
  skills: string[];
  experience: Array<{ id: string; position: string; company: string; achievements: string[] }>;
}

function skillsList(skills: string[] | undefined, max = 12): string {
  return Array.isArray(skills)
    ? skills.filter((s) => typeof s === 'string').slice(0, max).join(', ')
    : '';
}

function achievementsList(achievements: string[] | undefined, max = 6): string {
  return Array.isArray(achievements)
    ? achievements.filter((a) => typeof a === 'string' && a.trim()).slice(0, max).join(' | ')
    : '';
}

function languageRule(locale: Locale): string {
  return locale === 'es'
    ? 'Escribe TODA la respuesta en español neutro.'
    : 'Write the ENTIRE answer in natural English.';
}

export function buildSuggestPrompt(field: SuggestField, data: SuggestContext, locale: Locale): string {
  const skills = skillsList(data.skills);
  const achievements = achievementsList(data.achievements);
  const current = (data.currentText || '').toString().slice(0, 400);
  const yearsHint = (data.yearsHint || '').toString().slice(0, 40).trim();

  if (field === 'title') {
    if (locale === 'es') {
      return `Eres experto en hojas de vida para el mercado laboral colombiano. Sugiere 3 variantes de TÍTULO PROFESIONAL (el texto corto que va bajo el nombre).
${current ? `Título actual: "${current}". Puedes mejorarlo.` : ''}
${skills ? `Habilidades clave: ${skills}.` : ''}

Reglas: máximo 60 caracteres, concreto, dice QUÉ hace y su nivel/especialidad. No inventes cargos que no se deduzcan de la información. Sin comillas. ${languageRule(locale)}

Devuelve SOLO este JSON, sin markdown:
{"variants":["título 1","título 2","título 3"]}`;
    }
    return `You are an expert resume writer for the international job market. Suggest 3 variants of a PROFESSIONAL HEADLINE (the short line under the name).
${current ? `Current headline: "${current}". You may improve it.` : ''}
${skills ? `Key skills: ${skills}.` : ''}

Rules: 60 characters max, specific, states WHAT they do and at which level/specialty. Do not invent roles that cannot be inferred from the data. No quotation marks. ${languageRule(locale)}

Return ONLY this JSON, no markdown:
{"variants":["headline 1","headline 2","headline 3"]}`;
  }

  if (field === 'achievement') {
    if (locale === 'es') {
      return `Eres experto en hojas de vida con logros medibles. Para el cargo "${data.role}" en la empresa "${data.company}"${yearsHint ? ` (${yearsHint})` : ''}, sugiere 3 LOGROS/RESPONSABILIDADES que una persona en ese cargo típicamente habría tenido.
${achievements ? `Otros logros reales de esta persona (para mantener coherencia, NO los repitas): ${achievements}` : ''}
${current ? `Borrador actual del usuario: "${current}". Mejóralo manteniendo su intención.` : ''}

Reglas estrictas:
- Una línea por logro, empezando con verbo de acción en primera persona (Lideré, Aumenté, Implementé...).
- Incluye SIEMPRE un resultado medible plausible (%, cifra, tiempo) redactado de forma que el usuario lo pueda ajustar a su realidad.
- Máximo 200 caracteres cada uno.
- NO inventes tecnologías ni responsabilidades ajenas al cargo indicado.
- ${languageRule(locale)}

Devuelve SOLO este JSON, sin markdown:
{"variants":["logro 1","logro 2","logro 3"]}`;
    }
    return `You are an expert in resumes with measurable achievements. For the role "${data.role}" at "${data.company}"${yearsHint ? ` (${yearsHint})` : ''}, suggest 3 ACHIEVEMENTS/RESPONSIBILITIES someone in that role would typically have had.
${achievements ? `Other real achievements of this person (keep coherence, do NOT repeat them): ${achievements}` : ''}
${current ? `User's current draft: "${current}". Improve it while keeping their intent.` : ''}

Strict rules:
- One line per achievement, starting with an action verb in the past tense (Led, Increased, Implemented...).
- ALWAYS include a plausible measurable result (%, number, time) worded so the user can adjust it to their reality.
- 200 characters max each.
- Do NOT invent technologies or responsibilities unrelated to the role.
- ${languageRule(locale)}

Return ONLY this JSON, no markdown:
{"variants":["achievement 1","achievement 2","achievement 3"]}`;
  }

  if (locale === 'es') {
    return `Eres experto en hojas de vida para el mercado laboral colombiano. Redacta 3 variantes de PERFIL PROFESIONAL (el resumen de 3 a 5 líneas que va al inicio).
${data.role ? `Cargo actual: ${data.role}.` : ''}${yearsHint ? ` Experiencia: ${yearsHint}.` : ''}
${skills ? `Habilidades: ${skills}.` : ''}
${achievements ? `Logros reales que puedes mencionar brevemente: ${achievements}` : ''}
${current ? `Perfil actual del usuario: "${current}". Puedes mejorar respetando los datos reales.` : ''}

Reglas:
- 30 a 60 palabras, en primera persona implícita (sin "yo").
- Estructura: quién es + años de experiencia + especialidad + valor que aporta.
- Usa 1 o 2 de las habilidades listadas. NO inventes experiencia, empresas ni cifras específicas que no estén en los datos.
- ${languageRule(locale)}

Devuelve SOLO este JSON, sin markdown:
{"variants":["perfil 1","perfil 2","perfil 3"]}`;
  }

  return `You are an expert resume writer. Write 3 variants of a PROFESSIONAL SUMMARY (the 3 to 5 line paragraph at the top).
${data.role ? `Current role: ${data.role}.` : ''}${yearsHint ? ` Experience: ${yearsHint}.` : ''}
${skills ? `Skills: ${skills}.` : ''}
${achievements ? `Real achievements you may briefly mention: ${achievements}` : ''}
${current ? `User's current summary: "${current}". You may improve it while respecting the real data.` : ''}

Rules:
- 30 to 60 words, implied first person (no "I").
- Structure: who they are + years of experience + specialty + value they bring.
- Use 1 or 2 of the listed skills. Do NOT invent experience, companies or specific numbers that are not in the data.
- ${languageRule(locale)}

Return ONLY this JSON, no markdown:
{"variants":["summary 1","summary 2","summary 3"]}`;
}

export function buildImprovePrompt(summary: string, experience: ImproveExperience[], locale: Locale): string {
  const expText = experience
    .map((e) => `${e.position} @ ${e.company}\n- ${e.achievements.join('\n- ')}`)
    .join('\n\n');

  if (locale === 'es') {
    return `Eres un experto en redacción de hojas de vida profesionales. Mejora el contenido de abajo. Usa verbos de acción, cuantifica logros cuando sea posible y hazlo destacar, pero SIN inventar experiencia ni métricas que no estén en el texto original.

RESUMEN ACTUAL:
${summary || '(vacío)'}

EXPERIENCIA ACTUAL:
${expText || '(vacía)'}

Responde SOLO en JSON, sin markdown:
{
  "summary": "resumen mejorado",
  "achievements": [
    ["logro mejorado 1 del trabajo 1", "logro mejorado 2 del trabajo 1"],
    ["logro mejorado 1 del trabajo 2"]
  ]
}
El array "achievements" tiene un sub-array por cada experiencia, en el mismo orden. ${languageRule(locale)}`;
  }

  return `You are an expert resume writer. Improve the content below. Use action verbs, quantify achievements when possible and make it stand out, but WITHOUT inventing experience or metrics that are not in the original text.

CURRENT SUMMARY:
${summary || '(empty)'}

CURRENT EXPERIENCE:
${expText || '(empty)'}

Respond ONLY in JSON, no markdown:
{
  "summary": "improved summary",
  "achievements": [
    ["improved achievement 1 of job 1", "improved achievement 2 of job 1"],
    ["improved achievement 1 of job 2"]
  ]
}
The "achievements" array has one sub-array per experience, in the same order. ${languageRule(locale)}`;
}

export function buildAdaptPrompt(cv: AdaptContext, offer: string, locale: Locale): string {
  const expText = cv.experience
    .map((exp) => `id=${exp.id} | ${exp.position} @ ${exp.company}\n- ${exp.achievements.join('\n- ')}`)
    .join('\n\n');

  if (locale === 'es') {
    return `Eres un experto en hojas de vida y filtros ATS. Vas a adaptar una hoja de vida a una oferta concreta.

Reglas estrictas:
- NO inventes experiencia, empresas, fechas ni logros que no estén en el CV. Solo reformula y reordena lo existente usando las palabras clave de la oferta.
- El perfil (summary) debe tener 3 a 5 líneas, en primera persona implícita, con verbos de acción y las palabras clave más importantes de la oferta.
- skillsAdd: SOLO habilidades coexistentes con la experiencia REAL del CV y que aparezcan en la oferta. Máximo 6.
- experienceRewrites: reescribe los logros de cada experiencia (mismo id) para que resalten lo que la oferta pide, conservando los hechos y métricas reales.
- ${languageRule(locale)}

Devuelve SOLO este JSON, sin markdown:
{
  "summary": "perfil adaptado",
  "skillsAdd": ["habilidad1", "habilidad2"],
  "experienceRewrites": [{ "id": "id-exacto", "achievements": ["logro reescrito 1", "logro reescrito 2"] }]
}

OFERTA LABORAL:
"""
${offer}
"""

HOJA DE VIDA ACTUAL:
Perfil: ${cv.summary || '(vacío)'}
Habilidades: ${cv.skills.join(', ') || '(ninguna)'}
Experiencia:
${expText || '(sin experiencia registrada)'}`;
  }

  return `You are an expert resume writer and ATS specialist. You will tailor a resume to one specific job post.

Strict rules:
- Do NOT invent experience, companies, dates or achievements that are not in the resume. Only rephrase and reorder what exists, using the job post keywords.
- The summary must be 3 to 5 lines, implied first person, with action verbs and the most important keywords from the post.
- skillsAdd: ONLY skills consistent with the REAL experience in the resume and present in the post. 6 max.
- experienceRewrites: rewrite the achievements of each experience (same id) to highlight what the post asks for, keeping real facts and metrics.
- ${languageRule(locale)}

Return ONLY this JSON, no markdown:
{
  "summary": "tailored summary",
  "skillsAdd": ["skill1", "skill2"],
  "experienceRewrites": [{ "id": "exact-id", "achievements": ["rewritten achievement 1", "rewritten achievement 2"] }]
}

JOB POST:
"""
${offer}
"""

CURRENT RESUME:
Summary: ${cv.summary || '(empty)'}
Skills: ${cv.skills.join(', ') || '(none)'}
Experience:
${expText || '(no experience recorded)'}`;
}

export function buildExtractPrompt(text: string, locale: Locale): string {
  if (locale === 'es') {
    return `Eres un extractor de datos de hojas de vida. A continuación puede venir: el texto de una hoja de vida, una narración libre donde una persona cuenta quién es y su experiencia, o una mezcla. Extrae la información en JSON estricto.

Reglas:
- Si un dato no aparece, usa cadena vacía (o array vacío). NO inventes información.
- Captura TODAS las experiencias y formaciones, no solo la primera.
- Si el texto es una narración ("trabajé en X...", "busco oportunidades de..."), interpreta cada mención como experiencia, formación, habilidad o lo que corresponda.
- Si el texto menciona lo que la persona busca u objetivos, intégralo al final del campo "summary".
- Fechas en formato "Mes AAAA" o "AAAA" (ej: "Mar 2019", "2021"). Si solo se menciona duración ("2 años"), deja las fechas vacías.
- "current": true si el trabajo es actual o termina en "Presente"/"Actualidad"/"actualmente".
- achievements: lista de logros/responsabilidades de cada experiencia, como frases cortas.
- level de idiomas: exactamente uno de "Básico", "Intermedio", "Avanzado", "Nativo".
- Conserva el texto original en el idioma en que esté escrito; no traduzcas.

Devuelve SOLO este JSON, sin markdown ni explicaciones:
{
  "personalInfo": { "fullName": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "" },
  "summary": "",
  "skills": ["", ""],
  "experience": [{ "position": "", "company": "", "startDate": "", "endDate": "", "current": false, "achievements": [""] }],
  "education": [{ "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "current": false }],
  "languages": [{ "name": "", "level": "" }],
  "references": [{ "name": "", "position": "", "company": "", "phone": "", "email": "" }]
}

TEXTO DE LA HOJA DE VIDA:
"""
${text}
"""`;
  }

  return `You are a resume data extractor. The input may be: the text of a resume, a free-form story where someone describes who they are and their experience, or a mix of both. Extract the information into strict JSON.

Rules:
- If a value is missing, use an empty string (or empty array). Do NOT invent information.
- Capture ALL experiences and education entries, not only the first one.
- If the text is a story ("I worked at X...", "I am looking for..."), interpret each mention as experience, education, skill or whatever fits.
- If the text mentions what the person is looking for or their goals, append it at the end of the "summary" field.
- Dates in "Mon YYYY" or "YYYY" format (e.g. "Mar 2019", "2021"). If only a duration is mentioned ("2 years"), leave dates empty.
- "current": true if the job is current or ends with "Present"/"Currently".
- achievements: list of achievements/responsibilities per experience, as short sentences.
- Language "level": exactly one of "Basic", "Intermediate", "Advanced", "Native".
- Keep the original wording and language of the input; do not translate.

Return ONLY this JSON, no markdown or explanations:
{
  "personalInfo": { "fullName": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "" },
  "summary": "",
  "skills": ["", ""],
  "experience": [{ "position": "", "company": "", "startDate": "", "endDate": "", "current": false, "achievements": [""] }],
  "education": [{ "institution": "", "degree": "", "field": "", "startDate": "", "endDate": "", "current": false }],
  "languages": [{ "name": "", "level": "" }],
  "references": [{ "name": "", "position": "", "company": "", "phone": "", "email": "" }]
}

RESUME TEXT:
"""
${text}
"""`;
}

/** Instrucción para transcribir páginas escaneadas o fotos del CV. */
export function buildVisionPrompt(locale: Locale): string {
  return locale === 'es'
    ? 'Estas imágenes son páginas de una hoja de vida (CV). Transcribe TODO el texto que veas, ' +
        'en el orden original, incluyendo nombre, contacto, perfil, experiencia, educación, ' +
        'habilidades, idiomas y fechas. No resumas, no corrijas, no agregues nada: solo ' +
        'transcribe fielmente y en el idioma original. Responde únicamente con el texto transcrito.'
    : 'These images are pages of a resume (CV). Transcribe ALL the text you see, in the original ' +
        'order, including name, contact details, profile, experience, education, skills, languages ' +
        'and dates. Do not summarize, do not correct, do not add anything: just transcribe ' +
        'faithfully and in the original language. Reply only with the transcribed text.';
}

/** Rebanada del CV que necesita el prompt de traducción. */
export interface TranslateContext {
  summary?: string;
  skills: string[];
  experience: Array<{ id: string; position: string; company: string; achievements: string[] }>;
  education: Array<{ id: string; institution: string; degree: string; field: string }>;
}

/**
 * Traduce el contenido de la hoja de vida al otro idioma del producto sin
 * tocar el diseño: conserva ids, cifras, fechas, empresas e instituciones.
 */
export function buildTranslatePrompt(cv: TranslateContext, target: Locale): string {
  const expText = cv.experience
    .map((exp) => `id=${exp.id} | ${exp.position} @ ${exp.company}\n- ${exp.achievements.join('\n- ')}`)
    .join('\n\n');
  const eduText = cv.education
    .map((edu) => `id=${edu.id} | ${edu.degree} | ${edu.field} | ${edu.institution}`)
    .join('\n');

  if (target === 'en') {
    return `You translate resumes into professional English for the international job market.

Strict rules:
- Translate ONLY the wording. Keep every number, percentage, date, company, institution and person name exactly as it is.
- Keep the same ids in the output, one entry per input entry, same order.
- Do not add or remove achievements. Do not invent data.
- Use standard job titles in English (e.g. "Analista de datos" → "Data Analyst").

Return ONLY this JSON, no markdown:
{
  "summary": "translated summary",
  "skills": ["translated skill"],
  "experience": [{ "id": "exact-id", "position": "translated title", "achievements": ["translated achievement"] }],
  "education": [{ "id": "exact-id", "degree": "translated degree", "field": "translated field" }]
}

SUMMARY:
${cv.summary || '(empty)'}

SKILLS: ${cv.skills.join(', ') || '(none)'}

EXPERIENCE:
${expText || '(none)'}

EDUCATION:
${eduText || '(none)'}`;
  }

  return `Traduces hojas de vida a español profesional para el mercado latinoamericano.

Reglas estrictas:
- Traduce SOLO la redacción. Conserva exactamente cifras, porcentajes, fechas, empresas, instituciones y nombres de personas.
- Mantén los mismos ids en la salida, una entrada por cada entrada de la entrada, en el mismo orden.
- No agregues ni quites logros. No inventes datos.
- Usa cargos estándar en español (ej. "Data Analyst" → "Analista de datos").

Devuelve SOLO este JSON, sin markdown:
{
  "summary": "perfil traducido",
  "skills": ["habilidad traducida"],
  "experience": [{ "id": "id-exacto", "position": "cargo traducido", "achievements": ["logro traducido"] }],
  "education": [{ "id": "id-exacto", "degree": "título traducido", "field": "campo traducido" }]
}

PERFIL:
${cv.summary || '(vacío)'}

HABILIDADES: ${cv.skills.join(', ') || '(ninguna)'}

EXPERIENCIA:
${expText || '(ninguna)'}

FORMACIÓN:
${eduText || '(ninguna)'}`;
}

// ============================================================
// Modo vacante: personalización profunda, carta y entrevista
// ============================================================

export type TailorTone = 'conservador' | 'equilibrado' | 'agresivo';

export interface VacancyDiagnosis {
  score: number;
  titleTarget: string;
  seniority: string;
  yearsRequired: number | null;
  candidateYears: number;
  evidence: string[];
  listed: string[];
  criticalGaps: string[];
  missing: string[];
}

/** Todo lo que necesitan los tres prompts de vacante. */
export interface VacancyBrief {
  cv: TranslateContext & { title?: string; languages?: string[] };
  offer: string;
  company: string;
  role: string;
  tone: TailorTone;
  diagnosis: VacancyDiagnosis;
}

const TONE_RULE_ES: Record<TailorTone, string> = {
  conservador:
    'TONO CONSERVADOR: reformula sin exagerar. Frases sobrias, sin superlativos, misma longitud y mismo registro que el CV original. Solo cambia palabras por las de la oferta cuando encajen con naturalidad.',
  equilibrado:
    'TONO EQUILIBRADO: verbos de acción, orientado a resultados y con las palabras clave de la oferta donde encajen de forma natural. Profesional y directo.',
  agresivo:
    'TONO AGRESIVO: máximo impacto. El logro más fuerte va primero, el título y las tres primeras palabras de cada línea llevan el peso de la oferta. Sigue siendo honesto: nunca exageres ni inventes.',
};

/**
 * Cierre obligatorio de los prompts que esperan JSON.
 *
 * Sin esto, algunos modelos enrutados se ponen a razonar en voz alta, gastan
 * todos los tokens pensando y nunca emiten el objeto: la ruta recibía texto
 * plano y devolvía 502. Con la orden explícita (y el modo JSON del proveedor)
 * la respuesta empieza directamente por la llave de apertura.
 */
const ANSWER_NOW = {
  es: '\n\nCÓMO RESPONDER: empieza tu respuesta con { y termina con }. No razones en voz alta, no expliques, no escribas texto antes ni después del objeto. Sé breve: el perfil no pasa de 55 palabras, companyAngle de 45, cada "why" de 14, cada "advice" de 22 y cada riesgo de 16.',
  en: '\n\nHOW TO ANSWER: start your reply with { and end with }. Do not think out loud, do not explain, do not write anything before or after the object. Keep it short: summary under 55 words, companyAngle under 45, each "why" under 14, each "advice" under 22, each risk under 16.',
};

const TONE_RULE_EN: Record<TailorTone, string> = {
  conservador:
    'CONSERVATIVE TONE: rephrase without exaggerating. Sober sentences, no superlatives, same length and register as the original resume. Only swap wording for the post vocabulary where it fits naturally.',
  equilibrado:
    'BALANCED TONE: action verbs, results-oriented, with the post keywords landing naturally. Professional and direct.',
  agresivo:
    'AGGRESSIVE TONE: maximum impact. Strongest achievement first, title and the first three words of each line carry the weight of the post. Still honest: never exaggerate or invent.',
};

function diagnosisBlock(brief: VacancyBrief): string {
  const d = brief.diagnosis;
  return JSON.stringify(
    {
      match: d.score,
      targetTitle: d.titleTarget,
      seniority: d.seniority,
      yearsRequired: d.yearsRequired,
      candidateYears: d.candidateYears,
      alreadyInExperience: d.evidence,
      onlyInSkillsList: d.listed,
      importantGaps: d.criticalGaps,
      otherMissing: d.missing,
    },
    null,
    0,
  );
}

function cvBlock(cv: VacancyBrief['cv']): string {
  const exp = cv.experience
    .map((item) => `id=${item.id} | ${item.position} @ ${item.company}\n- ${item.achievements.join('\n- ')}`)
    .join('\n\n');
  const edu = cv.education.map((item) => `${item.degree} ${item.field} — ${item.institution}`).join('; ');
  return `Perfil: ${cv.summary || '(vacío)'}
Título actual: ${cv.title || '(sin título)'}
Habilidades: ${cv.skills.join(', ') || '(ninguna)'}
Idiomas: ${(cv.languages || []).join(', ') || '(sin registrar)'}
Formación: ${edu || '(sin registrar)'}
Experiencia:
${exp || '(sin experiencia registrada)'}`;
}

/**
 * Personalización profunda: título, perfil, habilidades priorizadas, reescritura
 * de logros con marcadores cuando falta una cifra y consejo por hueco.
 */
export function buildTailorPrompt(brief: VacancyBrief, locale: Locale): string {
  const d = brief.diagnosis;
  const target = brief.role || d.titleTarget;
  const company = brief.company || '(no indicada)';

  if (locale === 'es') {
    return `Eres un consultor senior de empleabilidad que personaliza hojas de vida para una vacante concreta.

VACANTE
Cargo: ${target}
Empresa: ${company}
${TONE_RULE_ES[brief.tone]}

DIAGNÓSTICO AUTOMÁTICO (ya calculado, no lo repitas ni lo contradigas)
${diagnosisBlock(brief)}

REGLAS INQUEBRANTABLES
- NUNCA inventes experiencia, empresas, fechas, títulos, herramientas ni cifras. Si un logro necesita un número que no está en el CV, escribe el marcador [X] (o [X]% si es un porcentaje) para que la persona lo complete. Jamás pongas un número inventado.
- Usa el título EXACTO del cargo del anuncio en "headline" si es coherente con la experiencia real.
- Los logros reescritos conservan el mismo id y el mismo hecho de fondo: cambias el enfoque hacia lo que pide la oferta, no el contenido.
- "skillsAdd": solo habilidades que la persona YA demuestra en su experiencia o en su lista, y que además aparecen en la oferta. Marca priority "must" si el anuncio la exige y "nice" si es deseable. Si no hay ninguna legítima, devuelve [].
- "gapAdvice": para cada hueco importante, una frase accionable y honesta (cómo cubrirlo o cómo compensarlo). Nunca sugieras mentir.
- "companyAngle": 2 o 3 frases sobre cómo posicionarse para ESTA empresa usando SOLO lo que revela el anuncio (sector, producto, valores, retos). No afirmes hechos sobre la empresa que no estén en el texto.
- "risks": lo que un reclutador podría objetar (años, formación, hueco, cambio de sector). Máximo 4.
- ${locale === 'es' ? 'Escribe TODA la respuesta en español neutro.' : ''}

Devuelve SOLO este JSON, sin markdown:
{
  "headlines": ["título 1", "título 2"],
  "headline": "el mejor título",
  "summary": "el mejor perfil",
  "skillsAdd": [{ "name": "habilidad", "priority": "must", "why": "por qué es legítima para esta persona" }],
  "achievementRewrites": [{ "id": "id-exacto", "achievements": ["logro reescrito 1", "logro reescrito 2"] }],
  "gapAdvice": [{ "term": "palabra clave", "advice": "qué hacer con este hueco" }],
  "companyAngle": "cómo posicionarse para esta empresa",
  "risks": ["objeción probable"]
}

HOJA DE VIDA ACTUAL
${cvBlock(brief.cv)}OFERTA
"""
${brief.offer}
"""${ANSWER_NOW.es}
`;
  }

  return `You are a senior career consultant tailoring a resume to one specific job.

VACANCY
Role: ${target}
Company: ${company}
${TONE_RULE_EN[brief.tone]}

AUTOMATIC DIAGNOSIS (already computed, do not repeat or contradict it)
${diagnosisBlock(brief)}

NON-NEGOTIABLE RULES
- NEVER invent experience, companies, dates, degrees, tools or numbers. If an achievement needs a number that is not in the resume, write the placeholder [X] (or [X]% for a percentage) so the person fills it in. Never output a made-up number.
- Use the post's EXACT role title in "headline" when it is coherent with the real experience.
- Rewritten achievements keep the same id and the same underlying fact: you shift the emphasis toward what the post asks for, not the content.
- "skillsAdd": only skills the person ALREADY proves in their experience or skills list and that also appear in the post. Mark priority "must" when the post requires it and "nice" when it is desirable. If there are none legitimate, return [].
- "gapAdvice": for each important gap, one honest, actionable sentence (how to cover or offset it). Never suggest lying.
- "companyAngle": 2 or 3 sentences on how to position for THIS company using ONLY what the post reveals (industry, product, values, challenges). Do not assert facts about the company that are not in the text.
- "risks": what a recruiter could object to (years, education, employment gap, career switch). 4 max.
- Write the ENTIRE answer in natural English.

Return ONLY this JSON, no markdown:
{
  "headlines": ["headline 1", "headline 2"],
  "headline": "best headline",
  "summary": "best summary",
  "skillsAdd": [{ "name": "skill", "priority": "must", "why": "why it is legitimate for this person" }],
  "achievementRewrites": [{ "id": "exact-id", "achievements": ["rewritten achievement 1", "rewritten achievement 2"] }],
  "gapAdvice": [{ "term": "keyword", "advice": "what to do about this gap" }],
  "companyAngle": "how to position for this company",
  "risks": ["likely objection"]
}

CURRENT RESUME
${cvBlock(brief.cv)}JOB POST
"""
${brief.offer}
"""${ANSWER_NOW.en}
`;
}

/** Carta de presentación + textos de LinkedIn, con el mismo cuidado anti-invención. */
export function buildCoverLetterPrompt(brief: VacancyBrief, locale: Locale): string {
  const target = brief.role || brief.diagnosis.titleTarget;
  const company = brief.company || '';

  if (locale === 'es') {
    return `Eres un redactor de cartas de presentación para procesos de selección reales.

Cargo: ${target}
Empresa: ${company || '(no indicada; usa "el equipo de selección")'}
${TONE_RULE_ES[brief.tone]}

REGLAS
- 180 a 240 palabras en el cuerpo. Cuatro párrafos: gancho con el logro más relevante, por qué esta empresa/rol, qué aportarías en los primeros 90 días, cierre con llamada a la acción.
- Usa SOLO hechos del CV. Si falta una cifra, escribe el marcador [X]; nunca inventes números, nombres ni datos de la empresa.
- Menciona el cargo exacto del anuncio y al menos tres palabras clave de la oferta que la persona pueda demostrar.
- Sin clichés ("soy una persona proactiva y responsable"), sin repetir el CV línea por línea, sin adulación vacía.
- Formato texto plano apto para ATS: sin tablas, sin viñetas, sin negritas.
- "linkedinHeadline": máximo 120 caracteres, con el cargo objetivo y la especialidad.
- "linkedinSummary": 3 o 4 frases en primera persona para la sección "Acerca de".
- "followUp": una nota breve de seguimiento para enviar 5 días después.
- Escribe TODA la respuesta en español neutro.

Devuelve SOLO este JSON, sin markdown:
{
  "subject": "asunto del correo",
  "body": "carta completa con saludo y despedida",
  "linkedinHeadline": "titular de LinkedIn",
  "linkedinSummary": "resumen de LinkedIn",
  "followUp": "nota de seguimiento"
}

HOJA DE VIDA
${cvBlock(brief.cv)}OFERTA
"""
${brief.offer}
"""${ANSWER_NOW.es}
`;
  }

  return `You write cover letters for real hiring processes.

Role: ${target}
Company: ${company || '(not provided; use "the hiring team")'}
${TONE_RULE_EN[brief.tone]}

RULES
- 180 to 240 words in the body. Four paragraphs: hook with the most relevant achievement, why this company/role, what you would deliver in the first 90 days, close with a call to action.
- Use ONLY facts from the resume. If a number is missing, write the placeholder [X]; never invent numbers, names or facts about the company.
- Name the exact role from the post and at least three post keywords the person can honestly back.
- No clichés ("I am a proactive and responsible person"), no line-by-line resume repetition, no empty flattery.
- Plain text, ATS safe: no tables, no bullets, no bold.
- "linkedinHeadline": 120 characters max, with the target role and specialty.
- "linkedinSummary": 3 or 4 first-person sentences for the "About" section.
- "followUp": a short follow-up note to send 5 days later.
- Write the ENTIRE answer in natural English.

Return ONLY this JSON, no markdown:
{
  "subject": "email subject",
  "body": "full letter with greeting and sign-off",
  "linkedinHeadline": "LinkedIn headline",
  "linkedinSummary": "LinkedIn summary",
  "followUp": "follow-up note"
}

RESUME
${cvBlock(brief.cv)}JOB POST
"""
${brief.offer}
"""${ANSWER_NOW.en}
`;
}

/** Preguntas probables de entrevista, con pista STAR basada en hechos del CV. */
export function buildInterviewPrompt(brief: VacancyBrief, locale: Locale): string {
  const target = brief.role || brief.diagnosis.titleTarget;
  const company = brief.company || '';
  const gaps = brief.diagnosis.criticalGaps.join(', ') || '(ninguno)';

  if (locale === 'es') {
    return `Eres un entrevistador técnico con 15 años contratando para el cargo de "${target}"${company ? ` en ${company}` : ''}.

Prepara la entrevista que esta persona probablemente tendrá.

REGLAS
- 8 preguntas: 3 específicas del cargo (herramientas y retos del anuncio), 2 de comportamiento, 2 sobre motivación y encaje con la empresa, 1 de expectativa salarial o disponibilidad.
- "why": por qué la preguntan (qué evalúa el entrevistador), en una frase.
- "starHint": cómo responderla usando SOLO hechos del CV: situación → acción → resultado. Si falta una cifra, escribe [X]. No inventes experiencias.
- "keywords": 2 o 3 palabras del anuncio que conviene decir en la respuesta.
- "questionsToAsk": 4 preguntas inteligentes que la persona puede hacer al final (sobre el rol, el equipo, el éxito a 6 meses y el proceso). Nada de salario en esta lista.
- "closingTip": una frase de cierre que deje una impresión concreta.
- Huecos detectados a preparar: ${gaps}.
- Escribe TODA la respuesta en español neutro.

Devuelve SOLO este JSON, sin markdown:
{
  "questions": [{ "question": "pregunta", "why": "qué evalúa", "starHint": "cómo responderla", "keywords": ["palabra"] }],
  "questionsToAsk": ["pregunta para el entrevistador"],
  "closingTip": "frase de cierre"
}

HOJA DE VIDA
${cvBlock(brief.cv)}OFERTA
"""
${brief.offer}
"""${ANSWER_NOW.es}
`;
  }

  return `You are a technical interviewer with 15 years hiring for "${target}"${company ? ` at ${company}` : ''}.

Prepare the interview this person is likely to face.

RULES
- 8 questions: 3 role-specific (tools and challenges from the post), 2 behavioral, 2 on motivation and company fit, 1 on salary expectations or availability.
- "why": why they ask it (what the interviewer evaluates), one sentence.
- "starHint": how to answer using ONLY resume facts: situation → action → result. If a number is missing, write [X]. Do not invent experiences.
- "keywords": 2 or 3 words from the post worth saying in the answer.
- "questionsToAsk": 4 smart questions the person can ask at the end (about the role, the team, what success looks like in 6 months, the process). No salary here.
- "closingTip": one closing sentence that leaves a concrete impression.
- Gaps to prepare for: ${gaps}.
- Write the ENTIRE answer in natural English.

Return ONLY this JSON, no markdown:
{
  "questions": [{ "question": "question", "why": "what it evaluates", "starHint": "how to answer", "keywords": ["word"] }],
  "questionsToAsk": ["question for the interviewer"],
  "closingTip": "closing sentence"
}

RESUME
${cvBlock(brief.cv)}JOB POST
"""
${brief.offer}
"""${ANSWER_NOW.en}
`;
}
