import { CVData } from './types';

// ============================================================
// Validador de calidad de hojas de vida
// Basado en recomendaciones de empleabilidad Colombia
// (MinTrabajo, Computrabajo, Konrad Lorenz, ManpowerGroup):
//  - Contacto completo y sin datos que generen sesgos
//  - Perfil de 3 a 5 líneas con experiencia y valor
//  - Experiencia en orden cronológico inverso con logros medibles
//  - Formación con título, institución y fechas
//  - Habilidades técnicas + blandas equilibradas
//  - Extensión de 1 a 2 páginas máximo
// ============================================================

export type CheckStatus = 'ok' | 'warn' | 'fail';

export interface QualityCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  tip?: string;
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

const ACTION_VERBS = /lider|aument|redu|optimi|crea|implemen|gestion|coordi|diseñ|desarroll|ejecut|mejor|automati|negoci|capacit|formul|dirigi|supervis|migr|lanch|lanza/i;

const SOFT_SKILLS = [
  'liderazgo', 'comunicacion', 'comunicación', 'trabajo en equipo', 'adaptabilidad',
  'resolucion de problemas', 'resolución de problemas', 'pensamiento critico', 'pensamiento crítico',
  'gestion del tiempo', 'gestión del tiempo', 'creatividad', 'empatia', 'empatía',
  'negociacion', 'negociación', 'orientacion al cliente', 'orientación al cliente',
  'proactividad', 'autonomia', 'autonomía', 'tolerancia a la presion', 'organizacion', 'organización',
];

/** Detecta datos que generan sesgos o que no deben ir en una hoja de vida moderna. */
const BIAS_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(c[eé]dula|documento de identidad|cc[:\s]*\d|\b1\s*[0-9]{7,}\b)/i, label: 'número de documento' },
  { pattern: /\b(tengo|edad[:\s]|años de edad)\s*\d{2}\b/i, label: 'edad' },
  { pattern: /\b(soltero|casado|casada|uni[oó]n libre|divorciado|divorciada|estado civil)\b/i, label: 'estado civil' },
  { pattern: /\b(calle|carrera|cll|cra|kra|avenida|transversal|diag|diagonal|barrio)\b[^,\n]*\d{2,}/i, label: 'dirección exacta' },
];

const MONTHS: Record<string, number> = {
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
  jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
};

/** Convierte una fecha de texto ("Ene 2022", "2020-2021") a un índice de mes. */
function parseDatePoint(value?: string): number | null {
  if (!value) return null;
  const v = normalize(value);
  const yearMatch = v.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return null;
  const year = parseInt(yearMatch[0], 10);
  const monthMatch = v.match(/\b(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\b/);
  const month = monthMatch ? MONTHS[monthMatch[1]] ?? 1 : 12;
  return year * 12 + month;
}

/**
 * Estima el número de páginas del PDF moderno (dos columnas) para el CV.
 * Heurística basada en caracteres por línea y alturas de bloque reales.
 */
export function estimatePages(data: CVData): number {
  const charsPerLine = 68; // columna principal ~338pt con Helvetica 9.5pt
  const pageCapacity = 680; // puntos útiles por página
  let total = 64; // encabezado (nombre + cargo + barra)

  if (data.summary) total += 32 + Math.ceil(data.summary.length / charsPerLine) * 13.5;

  for (const exp of data.experience) {
    total += 32; // título de sección (aprox, 1 por grupo)
    const head = (exp.position || '') + (exp.company ? ` — ${exp.company}` : '');
    total += Math.max(1, Math.ceil(head.length / 60)) * 14;
    total += 12;
    for (const achievement of exp.achievements) {
      total += Math.max(1, Math.ceil((achievement || '').length / charsPerLine)) * 13;
    }
    total += 18;
  }

  for (const edu of data.education) {
    const degree = (edu.degree || '') + (edu.field ? ` en ${edu.field}` : '');
    total += Math.max(1, Math.ceil(degree.length / 60)) * 14 + (edu.institution ? 12 : 0) + 12;
  }
  if (data.education.length) total += 32;
  if (data.references.length) total += 32 + data.references.length * 23;

  const firstPage = Math.max(0, 680 - total);
  if (total <= 680) return 1;
  return 1 + Math.ceil((total - 680 + firstPage) / pageCapacity);
}

function getChecks(data: CVData): QualityCheck[] {
  const checks: QualityCheck[] = [];
  const { personalInfo, summary, skills, experience, education, languages } = data;

  // ---- Contacto ----
  const missingContact: string[] = [];
  if (!hasText(personalInfo.fullName)) missingContact.push('nombre completo');
  if (!hasText(personalInfo.email)) missingContact.push('correo');
  if (!hasText(personalInfo.phone)) missingContact.push('teléfono');
  checks.push({
    id: 'contact-basic',
    label: 'Datos de contacto esenciales',
    status: missingContact.length === 0 ? 'ok' : missingContact.length >= 2 ? 'fail' : 'warn',
    detail: missingContact.length === 0
      ? 'Nombre, correo y teléfono completos: un reclutador puede ubicarte sin fricción.'
      : `Faltan: ${missingContact.join(', ')}.`,
    tip: missingContact.length > 0 ? 'Incluye nombre completo, teléfono con indicativo y correo profesional.' : undefined,
  });

  const locationParts = (personalInfo.location || '').split(',').map((part) => part.trim()).filter(Boolean);
  checks.push({
    id: 'contact-location',
    label: 'Ciudad y país de residencia',
    status: locationParts.length >= 2 ? 'ok' : hasText(personalInfo.location) ? 'warn' : 'fail',
    detail: locationParts.length >= 2
      ? `Ubicación clara: ${personalInfo.location}.`
      : hasText(personalInfo.location)
        ? `"${personalInfo.location}" no muestra ciudad y país juntas.`
        : 'Sin ubicación.',
    tip: 'Usa el formato "Ciudad, País" (ej. Bogotá, Colombia). Evita la dirección exacta.',
  });

  checks.push({
    id: 'contact-online',
    label: 'LinkedIn o portafolio',
    status: hasText(personalInfo.linkedin) || hasText(personalInfo.website) ? 'ok' : 'warn',
    detail: hasText(personalInfo.linkedin) || hasText(personalInfo.website)
      ? 'Enlace profesional incluido.'
      : 'Sin LinkedIn ni portafolio.',
    tip: 'Un enlace a LinkedIn o portafolio multiplica la credibilidad y es clave para ATS.',
  });

  const email = (personalInfo.email || '').trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const firstName = normalize(personalInfo.fullName).split(/\s+/)[0] || '';
  const emailMatchesName = firstName.length >= 3 && normalize(email).includes(firstName.slice(0, 3));
  checks.push({
    id: 'contact-email-quality',
    label: 'Correo con apariencia profesional',
    status: !hasText(email) ? 'fail' : !emailValid ? 'warn' : emailMatchesName ? 'ok' : 'warn',
    detail: !hasText(email)
      ? 'Sin correo electrónico.'
      : !emailValid
        ? 'El correo no tiene formato válido.'
        : emailMatchesName
          ? `${email} se ve profesional.`
          : `${email} es válido, pero no se relaciona con tu nombre.`,
    tip: 'Lo ideal es nombre.apellido@... Evita correos con apodos o apariencia informal.',
  });

  // ---- Datos que generan sesgos ----
  const biasHits: string[] = [];
  const freeText = [summary, personalInfo.location, personalInfo.title, personalInfo.fullName].filter(hasText).join(' ');
  for (const { pattern, label } of BIAS_PATTERNS) {
    if (pattern.test(freeText)) biasHits.push(label);
  }
  checks.push({
    id: 'bias-free',
    label: 'Sin datos que generen sesgos',
    status: biasHits.length === 0 ? 'ok' : 'warn',
    detail: biasHits.length === 0
      ? 'No detectamos documento, edad, estado civil ni dirección exacta. Perfecto para evitar sesgos.'
      : `Detectamos posibles datos sensibles: ${biasHits.join(', ')}.`,
    tip: biasHits.length > 0
      ? 'Las buenas prácticas actuales recomiendan evitar edad, estado civil, documento y dirección exacta: el reclutador te contactará por los canales de contacto.'
      : undefined,
  });

  // ---- Perfil profesional ----
  if (!hasText(summary)) {
    checks.push({
      id: 'summary',
      label: 'Perfil profesional (3 a 5 líneas)',
      status: 'fail',
      detail: 'Aún no escribes tu perfil profesional.',
      tip: 'Un párrafo de 3 a 5 líneas: quién eres, años de experiencia, especialidad y el valor que aportas.',
    });
  } else {
    const words = countWords(summary);
    const mentionsYears = /\d+\s*años/i.test(summary);
    const hasImpact = ACTION_VERBS.test(summary) || /\d+\s*%|\d+\s*(personas|clientes|usuarios|proyectos|equipos)/i.test(summary);
    const lengthOk = words >= 25 && words <= 110;
    const status: CheckStatus = lengthOk && mentionsYears ? 'ok' : lengthOk || mentionsYears ? 'warn' : 'warn';
    checks.push({
      id: 'summary',
      label: 'Perfil profesional (3 a 5 líneas)',
      status,
      detail: `${words} palabras. ${mentionsYears ? 'Menciona años de experiencia.' : 'No menciona años de experiencia.'} ${hasImpact ? 'Incluye impacto concreto.' : 'Falta un logro o valor concreto.'}`,
      tip: lengthOk && mentionsYears && hasImpact
        ? undefined
        : 'Fórmula: "Profesional de X con N años de experiencia en Y. Especialista en Z; logré [resultado medible]".',
    });
  }

  // ---- Experiencia: orden cronológico inverso ----
  if (experience.length >= 2) {
    let ordered = true;
    for (let i = 0; i < experience.length - 1; i += 1) {
      const current = parseDatePoint(experience[i].startDate);
      const next = parseDatePoint(experience[i + 1].startDate);
      if (current !== null && next !== null && current < next) {
        ordered = false;
        break;
      }
    }
    checks.push({
      id: 'exp-order',
      label: 'Orden cronológico inverso',
      status: ordered ? 'ok' : 'fail',
      detail: ordered
        ? 'La experiencia va de la más reciente a la más antigua.'
        : 'Hay experiencias con fechas fuera de orden.',
      tip: ordered ? undefined : 'Ordena los cargos de lo más reciente a lo más antiguo: es el estándar que esperan reclutadores y ATS.',
    });
  }

  // ---- Experiencia: logros cuantificables ----
  if (experience.length > 0) {
    const withoutAchievements = experience.filter((exp) => exp.achievements.filter((a) => hasText(a)).length === 0);
    const allAchievements = experience.flatMap((exp) => exp.achievements).filter(hasText);
    const strong = allAchievements.filter((a) => ACTION_VERBS.test(a) && /\d/i.test(a)).length;
    const ratio = allAchievements.length > 0 ? strong / allAchievements.length : 0;
    const status: CheckStatus = withoutAchievements.length > 0 || ratio < 0.5 ? 'warn' : 'ok';
    checks.push({
      id: 'exp-achievements',
      label: 'Logros con verbos de acción y métricas',
      status,
      detail: withoutAchievements.length > 0
        ? `${withoutAchievements.length} cargo(s) sin logros descritos.`
        : `${strong} de ${allAchievements.length} logros combinan verbo de acción + resultado medible.`,
      tip: 'Enfócate en logros, no tareas: "Aumenté las ventas en un 20%", "Reduje el tiempo de entrega en 3 días".',
    });
  }

  // ---- Formación ----
  if (education.length === 0) {
    checks.push({
      id: 'education',
      label: 'Formación académica',
      status: 'fail',
      detail: 'Sin formación registrada.',
      tip: 'Incluye título, institución y fechas. Si ya tienes educación superior, no necesitas primaria ni bachillerato.',
    });
  } else {
    const complete = education.filter((edu) => hasText(edu.degree) && hasText(edu.institution) && (hasText(edu.startDate) || hasText(edu.endDate) || edu.current));
    const partial = education.filter((edu) => hasText(edu.degree) && hasText(edu.institution) && !complete.includes(edu));
    checks.push({
      id: 'education',
      label: 'Formación académica',
      status: complete.length === education.length ? 'ok' : partial.length > 0 || complete.length > 0 ? 'warn' : 'fail',
      detail: complete.length === education.length
        ? 'Título, institución y fechas completos.'
        : `${education.length - complete.length} formación(es) sin título, institución o fechas.`,
      tip: complete.length === education.length ? undefined : 'Completa título obtenido, institución y periodo o fecha de graduación.',
    });
  }

  // ---- Habilidades ----
  const validSkills = skills.filter((skill) => hasText(skill));
  const softCount = validSkills.filter((skill) => SOFT_SKILLS.some((soft) => normalize(skill).includes(normalize(soft)) || normalize(soft).includes(normalize(skill)))).length;
  const hardCount = validSkills.length - softCount;
  const balanced = softCount > 0 && hardCount > 0;
  const countOk = validSkills.length >= 4 && validSkills.length <= 10;
  checks.push({
    id: 'skills',
    label: 'Habilidades técnicas y blandas',
    status: validSkills.length === 0 ? 'fail' : balanced && countOk ? 'ok' : 'warn',
    detail: validSkills.length === 0
      ? 'Sin habilidades registradas.'
      : `${hardCount} técnicas y ${softCount} blandas (${validSkills.length} en total).`,
    tip: balanced && countOk
      ? undefined
      : 'Mezcla herramientas/técnicas con competencias blandas (liderazgo, comunicación) y prioriza las relevantes al empleo: entre 4 y 10.',
  });

  // ---- Idiomas ----
  checks.push({
    id: 'languages',
    label: 'Idiomas con nivel',
    status: languages.length === 0 ? 'warn' : languages.every((lang) => hasText(lang.name) && hasText(lang.level)) ? 'ok' : 'warn',
    detail: languages.length === 0
      ? 'Sin idiomas registrados.'
      : languages.every((lang) => hasText(lang.name) && hasText(lang.level))
        ? `${languages.length} idioma(s) con nivel declarado.`
        : 'Hay idiomas sin nivel definido.',
    tip: languages.length === 0 ? 'Si hablas inglés u otro idioma, agrégalo con nivel honesto (Básico/Nativo...): los ATS filtran por esto.' : undefined,
  });

  // ---- Extensión ----
  const pages = estimatePages(data);
  checks.push({
    id: 'length',
    label: 'Extensión (1 a 2 páginas)',
    status: pages <= 2 ? 'ok' : 'fail',
    detail: pages <= 1 ? 'Cabe en 1 página: ideal.' : pages === 2 ? 'Cerca de 2 páginas: aceptable para trayectorias amplias.' : `Se estima en ${pages} páginas.`,
    tip: pages > 2 ? 'Recorta: prioriza los últimos 10-15 años y los logros más relevantes para el cargo.' : undefined,
  });

  // ---- Foto (opcional) ----
  checks.push({
    id: 'photo',
    label: 'Fotografía (opcional)',
    status: 'ok',
    detail: hasText(personalInfo.photoUrl)
      ? 'Foto incluida. Verifica que sea reciente, tipo estudio y con fondo neutro.'
      : 'Sin foto: hoy es opcional y en muchas empresas se prefiere sin ella.',
    tip: hasText(personalInfo.photoUrl)
      ? 'La foto debe ser de tipo documento/estudio con fondo neutro y buena iluminación; evita recortes de eventos sociales.'
      : undefined,
  });

  return checks;
}

export function getQualityReport(data: CVData): { checks: QualityCheck[]; score: number; ready: boolean } {
  const checks = getChecks(data);
  const weight: Record<CheckStatus, number> = { ok: 100, warn: 55, fail: 0 };
  const score = Math.round(checks.reduce((sum, check) => sum + weight[check.status], 0) / checks.length);
  return { checks, score, ready: checks.every((check) => check.status !== 'fail') };
}

// ============================================================
// Analizador de oferta laboral (palabras clave ATS)
// ============================================================

export interface JobMatchResult {
  score: number;
  matched: string[];
  missing: string[];
}

const STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'u', 'que', 'en', 'a', 'por', 'con', 'para',
  'como', 'del', 'al', 'lo', 'su', 'sus', 'se', 'es', 'son', 'ser', 'soy', 'esta', 'este', 'estos', 'estas', 'mas',
  'más', 'pero', 'si', 'no', 'ni', 'ya', 'sobre', 'entre', 'desde', 'hasta', 'durante', 'según', 'sin', 'tras', 'ante',
  'bajo', 'contra', 'nos', 'les', 'nosotros', 'usted', 'ustedes', 'tú', 'tu', 'tus', 'te', 'mi', 'mis', 'me',
  'experiencia', 'laboral', 'laborales', 'perfil', 'empresa', 'empresas', 'trabajo', 'trabajos', 'empleado', 'empleada',
  'postular', 'postulación', 'vacante', 'vacantes', 'convocatoria', 'requisito', 'requisitos', 'función', 'funciones',
  'responsabilidad', 'responsabilidades', 'actividad', 'actividades', 'conocimiento', 'conocimientos', 'capacidad',
  'capacidades', 'nivel', 'alto', 'medio', 'básico', 'avanzado', 'preferible', 'deseable', 'indispensable', 'necesario',
  'opcional', 'ofrece', 'ofrecemos', 'contrato', 'jornada', 'salario', 'beneficios', 'prestaciones', 'remoto',
  'presencial', 'híbrido', 'persona', 'personas', 'candidato', 'candidatos', 'candidata', 'candidatas', 'aspirante',
  'aspirantes', 'hoja', 'vida', 'curriculum', 'currículum', 'vitae', 'documento', 'documentos', 'certificado',
  'certificados', 'estudios', 'años', 'año', 'mes', 'meses', 'debe', 'deberá', 'deberas', 'podrás', 'esperar',
  'buscamos', 'busca', 'requiere', 'requerimos', 'esperamos', 'valoramos', 'realizar', 'realizará', 'manera', 'además',
  'así', 'también', 'todo', 'todos', 'toda', 'todas', 'cada', 'otro', 'otros', 'otra', 'otras', 'entre', 'sido',
  'https', 'http', 'www', 'com', 'co', 'net', 'org', 'correo', 'email', 'aplicar', 'aplica', 'postulate', 'postúlate',
  'importante', 'importan', 'deseable', 'excelente', 'excelentes', 'buena', 'buenas', 'buen', 'buensimo', 'gran',
  'jornada', 'tiempo', 'completo', 'parcial', 'dic', 'html', 'php',
]);

// Ofertas en inglés: sin esto, "the", "with" o "experience" entrarían como
// palabras clave y bajarían el puntaje de coincidencia de todo el mundo.
const EN_STOPWORDS = [
  'the', 'and', 'for', 'with', 'you', 'your', 'our', 'are', 'will', 'have', 'has', 'that', 'this',
  'from', 'they', 'their', 'who', 'all', 'any', 'can', 'not', 'but', 'out', 'job', 'role', 'team',
  'teams', 'work', 'working', 'experience', 'years', 'year', 'requirements', 'responsibilities',
  'skills', 'ability', 'strong', 'good', 'plus', 'must', 'should', 'would', 'about', 'into', 'more',
  'also', 'other', 'using', 'use', 'used', 'new', 'within', 'across', 'including', 'include',
  'includes', 'well', 'very', 'able', 'knowledge', 'understanding', 'position', 'company',
  'candidate', 'candidates', 'apply', 'applications', 'benefits', 'salary', 'remote', 'hybrid',
  'onsite', 'full', 'part', 'time', 'level', 'senior', 'junior', 'mid', 'required', 'preferred',
  'desirable', 'excellent', 'great', 'least', 'etc', 'looking', 'join', 'offer', 'offers', 'offer',
  'what', 'when', 'where', 'which', 'while', 'your', 'them', 'these', 'those', 'than', 'then',
];
for (const word of EN_STOPWORDS) STOPWORDS.add(word);

/**
 * Equivalencias que un ATS real sí cruza (inglés/español y siglas técnicas).
 * Sin esto, "JavaScript" en la oferta no coincide con "JS" en el CV y la
 * persona ve una palabra clave faltante que en realidad ya tiene.
 */
const SYNONYMS: Record<string, string[]> = {
  javascript: ['js'], js: ['javascript'],
  typescript: ['ts'], ts: ['typescript'],
  react: ['reactjs', 'react.js'], reactjs: ['react'],
  node: ['nodejs', 'node.js'], nodejs: ['node'],
  postgresql: ['postgres', 'psql'], postgres: ['postgresql'],
  kubernetes: ['k8s'], k8s: ['kubernetes'],
  python: ['pandas', 'numpy'],
  ventas: ['sales'], sales: ['ventas'],
  contabilidad: ['accounting'], accounting: ['contabilidad'],
  liderazgo: ['leadership'], leadership: ['liderazgo'],
  negociacion: ['negotiation'], negotiation: ['negociacion'],
  soporte: ['support'], support: ['soporte'],
  gestion: ['management'], management: ['gestion'],
  analisis: ['analysis'], analysis: ['analisis'],
  diseno: ['design'], design: ['diseno'],
  desarrollo: ['development'], development: ['desarrollo'],
  programacion: ['programming'], programming: ['programacion'],
  seguridad: ['security'], security: ['seguridad'],
  calidad: ['quality'], quality: ['calidad'],
  logistica: ['logistics'], logistics: ['logistica'],
  atencion: ['customer'], customer: ['atencion'],
  capacitacion: ['training'], training: ['capacitacion'],
  presupuesto: ['budget'], budget: ['presupuesto'],
  reportes: ['reporting', 'reports'], reporting: ['reportes'],
  automatizacion: ['automation'], automation: ['automatizacion'],
};

function normalizeToken(value: string): string {
  return normalize(value).trim();
}

/** Extrae las palabras clave más relevantes de una oferta laboral. */
export function extractKeywords(offerText: string, limit = 25): Array<{ word: string; count: number }> {
  const cleaned = normalizeToken(offerText);
  const tokens = cleaned.match(/\b[a-z][a-z0-9+#.]{2,}\b/g) || [];
  const freq = new Map<string, number>();
  for (const raw of tokens) {
    const token = raw.replace(/[.]+$/, '');
    if (token.length < 3 || STOPWORDS.has(token) || /^\d+$/.test(token)) continue;
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

/**
 * ¿La palabra clave de la oferta aparece en el CV, en singular o por sinónimo?
 */
export function keywordInCV(cvText: string, word: string): boolean {
  if (cvText.includes(word)) return true;
  const singular = word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word;
  if (singular !== word && cvText.includes(singular)) return true;
  return (SYNONYMS[word] || []).some((synonym) => cvText.includes(synonym));
}

/**
 * Compara el CV contra una oferta laboral: score de coincidencia y las
 * palabras clave que faltan (para destacar en filtros ATS).
 */
export function analyzeJobMatch(data: CVData, offerText: string): JobMatchResult {
  const cvText = normalizeToken([
    data.personalInfo.fullName,
    data.personalInfo.title,
    data.summary,
    data.personalInfo.location,
    ...data.skills,
    ...data.experience.flatMap((exp) => [exp.position, exp.company, ...exp.achievements]),
    ...data.education.map((edu) => `${edu.degree} ${edu.field} ${edu.institution}`),
    ...data.languages.map((lang) => `${lang.name} ${lang.level}`),
  ].filter(hasText).join(' '));

  const keywords = extractKeywords(offerText);
  if (keywords.length === 0) return { score: 0, matched: [], missing: [] };

  const matched: string[] = [];
  const missing: string[] = [];
  let weightMatched = 0;
  let weightTotal = 0;

  for (const { word, count } of keywords) {
    weightTotal += count;
    if (keywordInCV(cvText, word)) {
      matched.push(word);
      weightMatched += count;
    } else {
      missing.push(word);
    }
  }

  return {
    score: Math.round((weightMatched / weightTotal) * 100),
    matched,
    missing,
  };
}
