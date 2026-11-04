import { CVData } from '@/lib/types';

export type EditorSectionKey =
  | 'personal'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'languages'
  | 'references';

export interface CompletionSectionState {
  key: EditorSectionKey;
  label: string;
  required: boolean;
  completed: boolean;
  status: 'complete' | 'incomplete' | 'optional';
  weight: number;
  qualityScore: number;
  qualityLabel: 'vacio' | 'basico' | 'fuerte' | 'muy-fuerte';
}

export interface CompletionSummary {
  percent: number;
  missing: string[];
  states: CompletionSectionState[];
  isReadyToExport: boolean;
  hasAnyProgress: boolean;
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function hasCompleteExperience(data: CVData): boolean {
  return data.experience.some((item) => hasText(item.company) && hasText(item.position) && (hasText(item.startDate) || hasText(item.endDate) || item.current));
}

function hasCompleteEducation(data: CVData): boolean {
  return data.education.some((item) => hasText(item.institution) && hasText(item.degree));
}

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function hasMetric(value: string): boolean {
  return /\d|%|\$|kpi|ventas|clientes|usuarios|tiempo|procesos|ahorro|crec/i.test(value);
}

function hasActionVerb(value: string): boolean {
  return /lider|aument|redu|optimi|crea|implemen|gestion|coordi|diseñ|desarroll|ejecut|mejor/i.test(value);
}

function toQualityLabel(score: number): CompletionSectionState['qualityLabel'] {
  if (score <= 0) return 'vacio';
  if (score < 60) return 'basico';
  if (score < 85) return 'fuerte';
  return 'muy-fuerte';
}

function getPersonalQuality(data: CVData): number {
  let score = 0;
  if (hasText(data.personalInfo.fullName)) score += 25;
  if (hasText(data.personalInfo.title)) score += 20;
  if (hasText(data.personalInfo.email)) score += 15;
  if (hasText(data.personalInfo.phone)) score += 15;
  if (hasText(data.personalInfo.location)) score += 10;
  if (hasText(data.personalInfo.linkedin) || hasText(data.personalInfo.website)) score += 10;
  if (hasText(data.personalInfo.photoUrl)) score += 5;
  return Math.min(score, 100);
}

function getSummaryQuality(data: CVData): number {
  if (!hasText(data.summary)) return 0;
  let score = 30;
  const words = countWords(data.summary);
  if (words >= 18) score += 20;
  if (words >= 30) score += 10;
  if (hasActionVerb(data.summary)) score += 20;
  if (hasMetric(data.summary)) score += 20;
  return Math.min(score, 100);
}

function getExperienceQuality(data: CVData): number {
  if (data.experience.length === 0) return 0;
  const completeEntries = data.experience.filter((item) => hasText(item.company) && hasText(item.position));
  if (completeEntries.length === 0) return 15;
  let score = Math.min(40, completeEntries.length * 15);
  const achievementsCount = completeEntries.reduce((sum, item) => sum + item.achievements.length, 0);
  score += Math.min(20, achievementsCount * 4);
  if (completeEntries.some((item) => item.achievements.some(hasActionVerb))) score += 20;
  if (completeEntries.some((item) => item.achievements.some(hasMetric))) score += 20;
  return Math.min(score, 100);
}

function getEducationQuality(data: CVData): number {
  if (data.education.length === 0) return 0;
  const completeEntries = data.education.filter((item) => hasText(item.institution) && hasText(item.degree));
  if (completeEntries.length === 0) return 20;
  let score = Math.min(55, completeEntries.length * 25);
  if (completeEntries.some((item) => hasText(item.startDate) || hasText(item.endDate) || item.current)) score += 20;
  if (completeEntries.some((item) => hasText(item.field))) score += 25;
  return Math.min(score, 100);
}

function getSkillsQuality(data: CVData): number {
  const count = data.skills.filter((skill) => hasText(skill)).length;
  if (count === 0) return 0;
  if (count < 3) return 35;
  if (count <= 6) return 85;
  if (count <= 10) return 100;
  return 70;
}

function getLanguagesQuality(data: CVData): number {
  if (data.languages.length === 0) return 0;
  const named = data.languages.filter((language) => hasText(language.name)).length;
  if (named === 0) return 20;
  if (named === 1) return 70;
  return 90;
}

function getReferencesQuality(data: CVData): number {
  if (data.references.length === 0) return 0;
  const complete = data.references.filter((reference) => hasText(reference.name) && hasText(reference.position) && (hasText(reference.phone) || hasText(reference.email)));
  if (complete.length === 0) return 25;
  if (complete.length === 1) return 75;
  return 90;
}

export function isEditorEmpty(data: CVData): boolean {
  return !hasText(data.personalInfo.fullName) &&
    !hasText(data.personalInfo.email) &&
    !hasText(data.personalInfo.title) &&
    !hasText(data.summary) &&
    data.experience.length === 0 &&
    data.education.length === 0 &&
    data.skills.length === 0 &&
    data.languages.length === 0 &&
    data.references.length === 0 &&
    !hasText(data.personalInfo.photoUrl);
}

export function getCompletionSummary(data: CVData): CompletionSummary {
  const baseStates: CompletionSectionState[] = [
    {
      key: 'personal',
      label: 'Datos',
      required: true,
      completed: [data.personalInfo.fullName, data.personalInfo.title, data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].every(hasText),
      status: 'incomplete',
      weight: 25,
      qualityScore: getPersonalQuality(data),
      qualityLabel: 'vacio',
    },
    {
      key: 'summary',
      label: 'Perfil',
      required: true,
      completed: hasText(data.summary),
      status: 'incomplete',
      weight: 15,
      qualityScore: getSummaryQuality(data),
      qualityLabel: 'vacio',
    },
    {
      key: 'experience',
      label: 'Experiencia',
      required: true,
      completed: hasCompleteExperience(data),
      status: 'incomplete',
      weight: 20,
      qualityScore: getExperienceQuality(data),
      qualityLabel: 'vacio',
    },
    {
      key: 'education',
      label: 'Educación',
      required: true,
      completed: hasCompleteEducation(data),
      status: 'incomplete',
      weight: 15,
      qualityScore: getEducationQuality(data),
      qualityLabel: 'vacio',
    },
    {
      key: 'skills',
      label: 'Habilidades',
      required: true,
      completed: data.skills.filter((skill) => hasText(skill)).length >= 3,
      status: 'incomplete',
      weight: 10,
      qualityScore: getSkillsQuality(data),
      qualityLabel: 'vacio',
    },
    {
      key: 'languages',
      label: 'Idiomas',
      required: true,
      completed: data.languages.some((language) => hasText(language.name)),
      status: 'incomplete',
      weight: 5,
      qualityScore: getLanguagesQuality(data),
      qualityLabel: 'vacio',
    },
    {
      key: 'references',
      label: 'Referencias',
      required: false,
      completed: data.references.some((reference) => hasText(reference.name)),
      status: 'optional',
      weight: 5,
      qualityScore: getReferencesQuality(data),
      qualityLabel: 'vacio',
    },
  ];

  const photoCompleted = hasText(data.personalInfo.photoUrl);
  const photoWeight = 5;
  const percent = Math.min(
    100,
    baseStates.reduce((sum, state) => sum + (state.completed ? state.weight : 0), 0) + (photoCompleted ? photoWeight : 0),
  );

  const states: CompletionSectionState[] = baseStates.map((state) => ({
    ...state,
    status: state.completed ? 'complete' : state.required ? 'incomplete' : 'optional',
    qualityLabel: toQualityLabel(state.qualityScore),
  }));

  const missing: string[] = [];

  if (!states.find((item) => item.key === 'personal')?.completed) missing.push('datos básicos');
  if (!states.find((item) => item.key === 'summary')?.completed) missing.push('resumen profesional');
  if (!states.find((item) => item.key === 'experience')?.completed) missing.push('1 experiencia completa');
  if (!states.find((item) => item.key === 'education')?.completed) missing.push('1 formación');
  if (!states.find((item) => item.key === 'skills')?.completed) missing.push('3 habilidades');
  if (!states.find((item) => item.key === 'languages')?.completed) missing.push('1 idioma');
  if (!photoCompleted) missing.push('foto');

  return {
    percent,
    missing,
    states,
    isReadyToExport: percent === 100,
    hasAnyProgress: percent > 0,
  };
}

export function getSectionAdvice(section: EditorSectionKey, data: CVData): string {
  switch (section) {
    case 'personal':
      if (!hasText(data.personalInfo.fullName)) return 'Usa tu nombre completo como aparece en documentos y evita apodos.';
      if (!hasText(data.personalInfo.title)) return 'El título debe decir qué haces hoy, no solo tu profesión. Ejemplo: Diseñadora UX Senior.';
      if (hasText(data.personalInfo.email) && !/@/.test(data.personalInfo.email)) return 'Revisa el correo: debe verse profesional y tener formato válido para evitar perder contactos.';
      if (hasText(data.personalInfo.linkedin) && !/linkedin/i.test(data.personalInfo.linkedin)) return 'Si vas a poner LinkedIn, usa la URL o nombre real del perfil para que sea fácil de abrir.';
      if (!hasText(data.personalInfo.location)) return 'Agregar ciudad y país ayuda a reclutadores a filtrar vacantes y modalidad.';
      return 'Incluye un correo profesional y un teléfono con indicativo para que te contacten sin fricción.';
    case 'summary':
      if (!hasText(data.summary)) return 'Resume en 3 o 4 líneas tu experiencia, especialidad y el tipo de valor que aportas.';
      if (countWords(data.summary) < 18) return 'Tu perfil aún es corto. Añade años de experiencia, sector y 1 o 2 logros concretos.';
      if (!hasMetric(data.summary) && !hasActionVerb(data.summary)) return 'Tu resumen suena genérico. Agrega impacto real: resultados, mejoras o responsabilidades de mayor nivel.';
      return 'Evita frases genéricas como “responsable” o “proactivo”; cambia eso por impacto y resultados medibles.';
    case 'experience':
      if (data.experience.length === 0) return 'Empieza por tu experiencia más reciente. Añade cargo, empresa y fechas antes de describir logros.';
      if (!hasCompleteExperience(data)) return 'Cada experiencia debe tener empresa, cargo y fechas para verse profesional y completa.';
      if (data.experience.some((item) => item.achievements.length === 0)) return 'Hay experiencias sin logros. Añade 2 o 3 bullets por cargo explicando qué hiciste y qué mejoraste.';
      if (data.experience.some((item) => item.achievements.some((achievement) => !hasMetric(achievement) && !hasActionVerb(achievement)))) {
        return 'Conviene fortalecer algunos logros. Usa verbos de acción y, si puedes, una métrica: %, tiempo, dinero, clientes o volumen.';
      }
      return 'Describe logros con verbos de acción y resultado. Ejemplo: “Aumenté ventas 18%” o “Reducí tiempos 30%”.';
    case 'education':
      if (data.education.length === 0) return 'Incluye al menos tu formación más relevante o más reciente, aunque todavía esté en curso.';
      if (!hasCompleteEducation(data)) return 'Completa institución y título para que esta sección cuente como formación válida.';
      if (data.education.some((item) => hasText(item.degree) && !hasText(item.startDate) && !hasText(item.endDate) && !item.current)) return 'Si puedes, agrega fechas de estudio. No siempre son obligatorias, pero ayudan a dar contexto y orden.';
      return 'Si tu experiencia laboral es fuerte, mantén educación breve; si eres junior, añade énfasis en cursos o enfoque.';
    case 'skills':
      if (data.skills.length === 0) return 'Combina habilidades técnicas y blandas, pero prioriza las que sí puedes defender en entrevista.';
      if (data.skills.length < 3) return 'Añade al menos 3 habilidades clave alineadas con el cargo al que vas a postularte.';
      if (data.skills.length > 10) return 'Tienes muchas habilidades. Deja primero las más relevantes para el cargo y elimina ruido o duplicados.';
      return 'Ordena primero las habilidades más relevantes para el puesto. Menos ruido y más enfoque.';
    case 'languages':
      if (data.languages.length === 0) return 'Agrega idiomas solo si puedes indicar nivel real. Eso mejora credibilidad y filtrado ATS.';
      if (data.languages.some((language) => !hasText(language.name))) return 'Hay idiomas incompletos. Escribe el nombre del idioma para que la sección sí aporte valor.';
      return 'Usa niveles claros como Básico, Intermedio, Avanzado o Nativo para que el reclutador entienda tu dominio rápido.';
    case 'references':
      if (data.references.length === 0) return 'Las referencias son opcionales. Si las agregas, usa personas que realmente puedan hablar de tu trabajo.';
      if (data.references.some((reference) => !hasText(reference.name) || !hasText(reference.position))) return 'Hay referencias incompletas. Completa nombre y cargo para que se vean creíbles y útiles.';
      if (data.references.some((reference) => !hasText(reference.phone) && !hasText(reference.email))) return 'Cada referencia debería tener al menos un medio de contacto: teléfono o correo.';
      return 'Incluye referencias solo si están actualizadas y autorizadas. Si no, es mejor omitirlas.';
    default:
      return '';
  }
}
