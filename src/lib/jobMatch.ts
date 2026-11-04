/**
 * Motor de coincidencia CV ⇄ oferta ("Modo vacante").
 *
 * Replica lo que hacen los grandes del sector, pero de forma determinista:
 *  - Puntaje ponderado con la jerarquía publicada por Jobscan: habilidades
 *    duras > título del cargo > educación > habilidades blandas > resto.
 *  - Cada palabra clave se clasifica por evidencia (Teal): aparece dentro de
 *    un logro con fechas (evidencia real), solo en la lista de habilidades
 *    (declaración) o no aparece (hueco).
 *  - Detecta requisitos vs. deseables leyendo el propio anuncio.
 *  - Avisa de sobre-optimización por encima del rango recomendado (75–90).
 *
 * No llama a ninguna IA: es instantáneo, funciona sin clave y se puede probar
 * en CI. La IA solo entra después, para reescribir con este diagnóstico.
 */

import type { CVData } from './types';
import { analyzeJobMatch, extractKeywords, keywordInCV, normalize } from './cv-quality';

export type KeywordStatus = 'evidence' | 'listed' | 'missing';
export type KeywordCategory = 'hard' | 'soft' | 'other';
export type MatchBand = 'low' | 'partial' | 'good' | 'ideal' | 'over';

export interface JobKeyword {
  term: string;
  /** Frecuencia en el anuncio. */
  count: number;
  /** Aparece en una frase de requisito (no solo en "deseable"). */
  required: boolean;
  category: KeywordCategory;
  status: KeywordStatus;
  /** Otra forma con la que ya está en el CV (sigla o sinónimo). */
  alias?: string;
}

export interface MatchCategory {
  key: 'hard' | 'title' | 'education' | 'soft' | 'other';
  labelEs: string;
  labelEn: string;
  /** Peso sobre el total (los pesos suman 100). */
  weight: number;
  /** Cobertura de esta categoría, 0–100. */
  score: number;
  detailEs: string;
  detailEn: string;
}

export interface JobAnalysis {
  score: number;
  band: MatchBand;
  categories: MatchCategory[];
  keywords: JobKeyword[];
  evidence: string[];
  listed: string[];
  missing: string[];
  /** Huecos que el anuncio marca como requisito. */
  criticalGaps: string[];
  titleTarget: string;
  titleMatch: 'exact' | 'close' | 'different';
  yearsRequired: number | null;
  candidateYears: number;
  seniority: 'junior' | 'mid' | 'senior' | 'lead';
  educationRequired: boolean;
  educationOk: boolean;
  /** Consejos de formato en español (la UI elige según el idioma activo). */
  atsTipsEs: string[];
  atsTipsEn: string[];
  overOptimized: boolean;
  /** Resumen de una línea, ya redactado, para pintar junto al puntaje. */
  summaryEs: string;
  summaryEn: string;
}

const SOFT_SKILLS = [
  'liderazgo', 'leadership', 'comunicacion', 'communication', 'trabajo en equipo', 'teamwork',
  'team player', 'adaptabilidad', 'adaptability', 'resolucion de problemas', 'problem solving',
  'pensamiento critico', 'critical thinking', 'gestion del tiempo', 'time management',
  'creatividad', 'creativity', 'empatia', 'empathy', 'negociacion', 'negotiation',
  'orientacion al cliente', 'customer oriented', 'customer service', 'proactividad', 'proactive',
  'autonomia', 'autonomy', 'organizacion', 'organizational', 'atencion al detalle', 'attention to detail',
  'colaboracion', 'collaboration', 'mentoria', 'mentoring', 'ownership', 'stakeholder',
  'stakeholders', 'comunicacion asertiva', 'escucha activa', 'active listening', 'tolerancia a la presion',
];

const HARD_SKILLS = [
  'sql', 'python', 'java', 'javascript', 'typescript', 'react', 'angular', 'vue', 'node', 'nodejs',
  'php', 'laravel', 'django', 'flask', 'spring', 'c#', '.net', 'go', 'golang', 'rust', 'ruby', 'rails',
  'kotlin', 'swift', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'aws', 'azure', 'gcp', 'docker',
  'kubernetes', 'terraform', 'jenkins', 'git', 'github', 'gitlab', 'ci', 'cd', 'linux', 'bash',
  'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'oracle', 'sqlserver', 'bigquery', 'snowflake',
  'excel', 'power bi', 'powerbi', 'tableau', 'looker', 'qlik', 'sap', 'salesforce', 'hubspot', 'odoo',
  'jira', 'confluence', 'figma', 'photoshop', 'illustrator', 'canva', 'seo', 'sem', 'google analytics',
  'meta ads', 'shopify', 'woocommerce', 'scrum', 'kanban', 'agile', 'pmbok', 'lean', 'six sigma',
  'etl', 'elt', 'airflow', 'dbt', 'spark', 'hadoop', 'kafka', 'pandas', 'numpy', 'tensorflow', 'pytorch',
  'scikit', 'machine learning', 'deep learning', 'nlp', 'estadistica', 'statistics', 'econometria',
  'contabilidad', 'accounting', 'finanzas', 'finance', 'presupuesto', 'budget', 'auditoria', 'audit',
  'nomina', 'payroll', 'reclutamiento', 'recruiting', 'logistica', 'logistics', 'inventario', 'inventory',
  'compras', 'procurement', 'ventas', 'sales', 'crm', 'marketing digital', 'digital marketing',
  'redaccion', 'copywriting', 'diseno grafico', 'graphic design', 'photoshop', 'autocad', 'solidworks',
  'atencion al cliente', 'customer support', 'call center', 'telemercadeo', 'facturacion', 'billing',
  'iso 9001', 'iso 14001', 'iso 45001', 'sgsst', 'primera infancia', 'pedagogia', 'docencia',
];

const SOFT_SET = new Set(SOFT_SKILLS.map((s) => normalize(s)));
const HARD_SET = new Set(HARD_SKILLS.map((s) => normalize(s)));

const REQUIRED_MARKERS = /(requisito|requerid|indispensable|obligatori|must have|required|minimum|mínimo|excluyente|es necesario|necesitas)/i;
const NICE_MARKERS = /(deseable|preferible|valorable|plus|nice to have|preferred|a plus|sería un plus|no excluyente)/i;
const EDUCATION_MARKERS = /(ingenier|licenciad|profesional en|tecnolog|técnic[oa] en|bachiller|universitari|bachelor|degree|master|maestr|phd|doctorado|título)/i;

const MONTHS: Record<string, number> = {
  ene: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, aug: 8, sep: 9, oct: 10, nov: 11, dic: 12, dec: 12,
};

/** Punto temporal (año*12+mes) de una fecha de texto del CV. */
function datePoint(value?: string): number | null {
  if (!value?.trim()) return null;
  const text = normalize(value);
  const year = text.match(/\b(19|20)\d{2}\b/);
  if (!year) return null;
  const monthName = text.match(/\b(ene|jan|feb|mar|abr|apr|may|jun|jul|ago|aug|sep|oct|nov|dic|dec)[a-z]*\b/);
  const month = monthName ? MONTHS[monthName[1]] ?? 1 : 6;
  return parseInt(year[0], 10) * 12 + month;
}

/** Años de experiencia estimados desde la experiencia registrada. */
export function candidateExperienceYears(cv: CVData): number {
  const points = cv.experience
    .map((exp) => datePoint(exp.startDate))
    .filter((point): point is number => point !== null);
  if (points.length === 0) return 0;
  const earliest = Math.min(...points);
  const now = new Date();
  const current = now.getFullYear() * 12 + (now.getMonth() + 1);
  return Math.max(0, Math.round(((current - earliest) / 12) * 10) / 10);
}

/** Años pedidos por el anuncio ("3+ años", "5 years"). */
function requiredYears(offerNormalized: string): number | null {
  const matches = Array.from(offerNormalized.matchAll(/(\d{1,2})\s*(?:\+|mas de|más de|over|plus)?\s*(?:anos|años|years?)/g));
  const values = matches
    .map((match) => parseInt(match[1], 10))
    .filter((value) => value > 0 && value <= 30);
  return values.length > 0 ? Math.max(...values) : null;
}

/**
 * Recorta una frase hasta el cargo: corta en preposiciones y puntuación, así
 * "Buscamos analista de datos con 3 años" queda en "Analista de datos".
 */
function cleanTitle(raw: string): string {
  const cut = raw.split(/\s+(?:con|with|para|for|que|y|and)\b|[.,;:()\n\t]/i)[0].trim();
  const title = cut.split(/\s+/).slice(0, 8).join(' ').replace(/^[-–\s]+|[-–\s]+$/g, '');
  if (!title) return '';
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/** Cargo objetivo: lo que diga el anuncio o, si no, el que el usuario declaró. */
export function extractTargetTitle(offerText: string, fallback = ''): string {
  const labeled = offerText.match(/(?:cargo|puesto|vacante|position|job title|role)\s*[:\-–]\s*([^\n.]{3,70})/i);
  if (labeled) {
    const fromLabel = cleanTitle(labeled[1]);
    if (fromLabel) return fromLabel;
  }

  const lines = offerText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const hireLine = lines.find((line) => /(buscamos|estamos buscando|se busca|we are looking for|hiring|requerimos)/i.test(line));
  if (hireLine) {
    // El grupo opcional del artículo exige límite de palabra: sin él, "Buscamos
    // analista" perdía la "a" inicial de "analista".
    const rest = hireLine.replace(
      /^.*?(buscamos|estamos buscando|se busca|we are looking for|hiring|requerimos)\b(?:\s+(?:a|an|un|una)\b)?\s*/i,
      '',
    );
    const fromHire = cleanTitle(rest);
    if (fromHire) return fromHire;
  }

  const firstLine = lines[0];
  if (firstLine) {
    const fromFirst = cleanTitle(firstLine);
    if (fromFirst) return fromFirst;
  }

  return fallback;
}

function categoryOf(term: string): KeywordCategory {
  const normalized = normalize(term);
  if (SOFT_SET.has(normalized)) return 'soft';
  if (HARD_SET.has(normalized)) return 'hard';
  // Siglas, versiones y palabras con dígitos casi siempre son herramientas.
  if (/\d/.test(normalized) || /^[a-z]{2,5}$/.test(normalized)) return 'hard';
  return 'other';
}

/** Frasgos del anuncio que expresan requisitos (para marcar lo indispensable). */
function requiredContext(offerNormalized: string): string {
  return offerNormalized
    .split(/(?<=[.!?;])\s+|\n+/)
    .filter((sentence) => REQUIRED_MARKERS.test(sentence) || !NICE_MARKERS.test(sentence))
    .join(' ');
}

function titleOverlap(candidate: string, target: string): { ratio: number; match: 'exact' | 'close' | 'different' } {
  const clean = (value: string) =>
    normalize(value)
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2);

  const a = clean(candidate);
  const b = clean(target);
  if (a.length === 0 || b.length === 0) return { ratio: 0, match: 'different' };

  const shared = b.filter((token) => a.includes(token)).length;
  const ratio = shared / b.length;
  const exact = normalize(candidate).trim() === normalize(target).trim();
  return { ratio, match: exact ? 'exact' : ratio >= 0.5 ? 'close' : 'different' };
}

function seniorityFrom(years: number, offerNormalized: string): 'junior' | 'mid' | 'senior' | 'lead' {
  if (/\b(lead|head of|director|gerente general|vp|chief|cto|ceo)\b/.test(offerNormalized)) return 'lead';
  if (/\b(senior|sr\.?|experto|especialista senior)\b/.test(offerNormalized) || years >= 7) return 'senior';
  if (/\b(junior|jr\.?|trainee|practicante|aprendiz|entry level|sin experiencia)\b/.test(offerNormalized) || years < 2) return 'junior';
  return 'mid';
}

function bandFor(score: number): MatchBand {
  if (score >= 95) return 'over';
  if (score >= 80) return 'ideal';
  if (score >= 60) return 'good';
  if (score >= 35) return 'partial';
  return 'low';
}

function round(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

/**
 * Analiza una oferta contra el CV y devuelve el diagnóstico completo.
 */
export function analyzeVacancy(cv: CVData, offerText: string): JobAnalysis {
  const offerNormalized = normalize(offerText);
  const base = analyzeJobMatch(cv, offerText);
  const keywordsRaw = extractKeywords(offerText, 40);
  const requiredText = requiredContext(offerNormalized);

  const evidenceText = normalize(
    [cv.summary, ...cv.experience.flatMap((exp) => [exp.position, ...exp.achievements])].filter(Boolean).join(' '),
  );
  const listedText = normalize([cv.personalInfo.title, ...cv.skills].filter(Boolean).join(' '));

  const keywords: JobKeyword[] = keywordsRaw.map(({ word, count }) => {
    const term = word;
    let status: KeywordStatus = 'missing';
    let alias: string | undefined;

    if (keywordInCV(evidenceText, term)) {
      status = 'evidence';
    } else if (keywordInCV(listedText, term)) {
      status = 'listed';
    } else {
      // Busca con qué alias del CV ya existe, para mostrarlo en la interfaz.
      const singular = term.endsWith('s') && term.length > 4 ? term.slice(0, -1) : term;
      if (singular !== term && (evidenceText.includes(singular) || listedText.includes(singular))) {
        alias = singular;
        status = evidenceText.includes(singular) ? 'evidence' : 'listed';
      }
    }

    return {
      term,
      count,
      required: requiredText.includes(term),
      category: categoryOf(term),
      status,
      alias,
    };
  });

  const coverage = (category: KeywordCategory): { score: number; total: number; hit: number } => {
    const items = keywords.filter((keyword) => keyword.category === category);
    if (items.length === 0) return { score: 0, total: 0, hit: 0 };
    let total = 0;
    let hit = 0;
    for (const item of items) {
      total += item.count;
      if (item.status === 'evidence') hit += item.count;
      else if (item.status === 'listed') hit += item.count * 0.7;
    }
    return { score: round((hit / total) * 100), total: items.length, hit: items.filter((i) => i.status !== 'missing').length };
  };

  // ---- Título del cargo ----
  const titleTarget = extractTargetTitle(offerText, cv.target?.role || cv.personalInfo.title || '');
  const candidateTitle = cv.personalInfo.title || cv.experience[0]?.position || '';
  const title = titleOverlap(candidateTitle, titleTarget);

  // ---- Educación ----
  const educationRequired = EDUCATION_MARKERS.test(offerNormalized);
  const educationOk = !educationRequired || cv.education.length > 0;

  // ---- Experiencia ----
  const years = candidateExperienceYears(cv);
  const required = requiredYears(offerNormalized);

  const hard = coverage('hard');
  const soft = coverage('soft');
  const other = coverage('other');
  const evidenceRatio = keywords.length > 0
    ? keywords.filter((keyword) => keyword.status === 'evidence').length / keywords.length
    : 0;

  const categories: MatchCategory[] = [
    {
      key: 'hard',
      labelEs: 'Habilidades duras',
      labelEn: 'Hard skills',
      weight: 40,
      score: hard.total > 0 ? hard.score : base.score,
      detailEs: `${hard.hit} de ${hard.total} herramientas y competencias técnicas del anuncio`,
      detailEn: `${hard.hit} of ${hard.total} tools and technical skills from the post`,
    },
    {
      key: 'title',
      labelEs: 'Título del cargo',
      labelEn: 'Job title',
      weight: 20,
      score: round(title.ratio * 100),
      detailEs: titleTarget
        ? `El anuncio busca «${titleTarget}» y tu CV dice «${candidateTitle || 'sin título'}»`
        : 'No detectamos un cargo explícito en el anuncio',
      detailEn: titleTarget
        ? `The post asks for “${titleTarget}” and your resume says “${candidateTitle || 'no title'}”`
        : 'No explicit job title found in the post',
    },
    {
      key: 'education',
      labelEs: 'Formación',
      labelEn: 'Education',
      weight: 10,
      score: educationRequired ? (educationOk ? 100 : 0) : 100,
      detailEs: educationRequired
        ? (educationOk ? 'Cumples el nivel de formación que pide el anuncio' : 'El anuncio pide formación y tu CV no la registra')
        : 'El anuncio no exige formación específica',
      detailEn: educationRequired
        ? (educationOk ? 'You meet the education level the post asks for' : 'The post asks for education and your resume has none')
        : 'The post does not require a specific degree',
    },
    {
      key: 'soft',
      labelEs: 'Habilidades blandas',
      labelEn: 'Soft skills',
      weight: 15,
      score: soft.total > 0 ? soft.score : 70,
      detailEs: soft.total > 0
        ? `${soft.hit} de ${soft.total} competencias blandas con evidencia en tu experiencia`
        : 'El anuncio no nombra competencias blandas concretas',
      detailEn: soft.total > 0
        ? `${soft.hit} of ${soft.total} soft skills backed by evidence in your experience`
        : 'The post names no specific soft skills',
    },
    {
      key: 'other',
      labelEs: 'Otras palabras clave',
      labelEn: 'Other keywords',
      weight: 15,
      score: other.total > 0 ? other.score : 80,
      detailEs: `${other.hit} de ${other.total} palabras clave del sector`,
      detailEn: `${other.hit} of ${other.total} industry keywords`,
    },
  ];

  const weighted = categories.reduce((sum, category) => sum + (category.score * category.weight) / 100, 0);
  // La evidencia dentro de la experiencia pesa: es lo que realmente leen los ATS.
  const score = round(weighted * 0.95 + evidenceRatio * 100 * 0.05);

  const evidence = keywords.filter((keyword) => keyword.status === 'evidence').map((keyword) => keyword.term);
  const listed = keywords.filter((keyword) => keyword.status === 'listed').map((keyword) => keyword.term);
  const missing = keywords.filter((keyword) => keyword.status === 'missing').map((keyword) => keyword.term);
  const criticalGaps = keywords
    .filter((keyword) => keyword.status === 'missing' && keyword.required)
    .sort((a, b) => b.count - a.count)
    .map((keyword) => keyword.term)
    .slice(0, 8);

  // ---- Consejos de formato y contenido (en los dos idiomas) ----
  const atsTipsEs: string[] = [];
  const atsTipsEn: string[] = [];
  const addTip = (es: string, en: string) => {
    atsTipsEs.push(es);
    atsTipsEn.push(en);
  };
  if (!cv.personalInfo.email?.trim() || !cv.personalInfo.phone?.trim()) {
    addTip(
      'Email y teléfono en el cuerpo: muchos ATS ignoran el encabezado y el pie de página.',
      'Email and phone in the main body: many ATS ignore headers and footers.',
    );
  }
  if (title.match === 'different' && titleTarget) {
    addTip(
      `Usa el título exacto del anuncio (${titleTarget}) en tu titular y en tu cargo más reciente.`,
      `Use the post's exact title (${titleTarget}) in your headline and most recent role.`,
    );
  }
  const recentAchievements = cv.experience[0]?.achievements || [];
  if (recentAchievements.length > 0 && !recentAchievements.some((achievement) => /\d/.test(achievement))) {
    addTip(
      'Añade al menos un resultado medible a tu cargo más reciente (%, tiempo, dinero, volumen).',
      'Add at least one measurable result to your most recent role (%, time, money, volume).',
    );
  }
  if (cv.experience.some((exp) => exp.achievements.some((achievement) => achievement.length > 240))) {
    addTip(
      'Mantén cada logro por debajo de ~200 caracteres para que se lea en una sola línea.',
      'Keep each bullet under ~200 characters so a recruiter can scan it in one line.',
    );
  }
  if (cv.skills.length < 4) {
    addTip(
      'Lista de 4 a 10 habilidades clave en una sección propia: es el bloque más limpio para cualquier parser.',
      'List 4–10 core skills in a dedicated section: it is the cleanest block for any parser.',
    );
  }
  if (missing.length > 12) {
    addTip(
      'No pegues todas las palabras clave: elige las 5–8 que de verdad puedas defender y demuéstralas con resultados.',
      'Do not paste every keyword: pick the 5–8 that are true for you and prove them with results.',
    );
  }

  const overOptimized = score >= 95 || keywords.some((keyword) => keyword.status !== 'missing' && keyword.count >= 4 && keyword.required);

  const summaryEs =
    score >= 80
      ? 'Alineación alta: tu CV habla el idioma de esta oferta.'
      : score >= 60
        ? 'Alineación buena: suben el puntaje las palabras clave que ya puedas demostrar.'
        : score >= 35
          ? 'Alineación parcial: faltan herramientas o el título no coincide con el del anuncio.'
          : 'Alineación baja: el anuncio pide un perfil que tu CV aún no muestra.';

  const summaryEn =
    score >= 80
      ? 'Strong alignment: your resume speaks the language of this post.'
      : score >= 60
        ? 'Good alignment: the keywords you can honestly back will lift the score.'
        : score >= 35
          ? 'Partial alignment: tools are missing or the title does not match the post.'
          : 'Low alignment: the post asks for a profile your resume does not show yet.';

  return {
    score,
    band: bandFor(score),
    categories,
    keywords,
    evidence,
    listed,
    missing,
    criticalGaps,
    titleTarget,
    titleMatch: title.match,
    yearsRequired: required,
    candidateYears: years,
    seniority: seniorityFrom(required ?? years, offerNormalized),
    educationRequired,
    educationOk,
    atsTipsEs: atsTipsEs.slice(0, 5),
    atsTipsEn: atsTipsEn.slice(0, 5),
    overOptimized,
    summaryEs,
    summaryEn,
  };
}

/**
 * Lo que se envía a la IA: solo el diagnóstico accionable, para que el prompt
 * sea corto y el modelo no tenga que adivinar qué falta.
 */
export function diagnosisForAI(analysis: JobAnalysis) {
  return {
    score: analysis.score,
    titleTarget: analysis.titleTarget,
    seniority: analysis.seniority,
    yearsRequired: analysis.yearsRequired,
    candidateYears: analysis.candidateYears,
    evidence: analysis.evidence.slice(0, 15),
    listed: analysis.listed.slice(0, 15),
    criticalGaps: analysis.criticalGaps,
    missing: analysis.missing.slice(0, 15),
    atsTips: analysis.atsTipsEn,
  };
}
