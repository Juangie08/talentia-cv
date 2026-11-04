import { CVData, Experience, Education, Language, Reference, defaultCVData } from './types';

/**
 * Normaliza un objeto desconocido (p. ej. la salida de un LLM) a un
 * Partial<CVData> seguro, validando campo a campo y descartando basura.
 * Nunca lanza: devuelve lo que pudo interpretar.
 */

function str(value: unknown, max = 600): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function strArray(value: unknown, maxItems = 12, maxLen = 400): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => str(item, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function idFor(index: number): string {
  return `imported-${Date.now()}-${index}`;
}

const LANGUAGE_LEVELS: Language['level'][] = ['Básico', 'Intermedio', 'Avanzado', 'Nativo'];

function normalizeLanguageLevel(value: unknown): Language['level'] {
  const raw = str(value).toLowerCase();
  const match = LANGUAGE_LEVELS.find((level) => level.toLowerCase() === raw);
  if (match) return match;
  if (/nativ|matern|madre/.test(raw)) return 'Nativo';
  if (/avanzad|fluent|proficien|c1|c2/.test(raw)) return 'Avanzado';
  if (/intermedi|medio|b1|b2/.test(raw)) return 'Intermedio';
  return 'Básico';
}

export function normalizeCVData(input: unknown): Partial<CVData> {
  if (!input || typeof input !== 'object') return {};
  const data = input as Record<string, unknown>;
  const result: Partial<CVData> = {};

  const personal = (data.personalInfo || data.personal || {}) as Record<string, unknown>;
  const personalInfo = {
    fullName: str(personal.fullName || personal.name, 120),
    title: str(personal.title || personal.profession, 120),
    email: str(personal.email, 160),
    phone: str(personal.phone || personal.telephone, 40),
    location: str(personal.location || personal.city, 120),
    linkedin: str(personal.linkedin, 200),
    website: str(personal.website || personal.portfolio, 200),
    photoUrl: '',
  };
  if (Object.values(personalInfo).some(Boolean)) {
    result.personalInfo = personalInfo;
  }

  const summary = str(data.summary || data.perfil || data.resumen, 1200);
  if (summary) result.summary = summary;

  const skills = strArray(data.skills || data.habilidades || data.competencias, 25, 60);
  if (skills.length > 0) result.skills = skills;

  if (Array.isArray(data.experience)) {
    result.experience = data.experience
      .map((raw, index): Experience | null => {
        const exp = (raw || {}) as Record<string, unknown>;
        const position = str(exp.position || exp.cargo || exp.role, 120);
        const company = str(exp.company || exp.empresa || exp.employer, 120);
        if (!position && !company) return null;
        return {
          id: idFor(index),
          company,
          position,
          startDate: str(exp.startDate || exp.desde || exp.start, 40),
          endDate: str(exp.endDate || exp.hasta || exp.end, 40),
          current: exp.current === true || /actual|presente|actualidad/i.test(str(exp.endDate, 40)),
          achievements: strArray(exp.achievements || exp.logros || exp.responsibilities, 10),
        };
      })
      .filter((item): item is Experience => item !== null)
      .slice(0, 12);
  }

  if (Array.isArray(data.education)) {
    result.education = data.education
      .map((raw, index): Education | null => {
        const edu = (raw || {}) as Record<string, unknown>;
        const degree = str(edu.degree || edu.titulo || edu.title, 120);
        const institution = str(edu.institution || edu.institucion || edu.school || edu.university, 120);
        if (!degree && !institution) return null;
        return {
          id: idFor(100 + index),
          institution,
          degree,
          field: str(edu.field || edu.area || edu.enfasis, 120),
          startDate: str(edu.startDate || edu.desde || edu.start, 40),
          endDate: str(edu.endDate || edu.hasta || edu.end || edu.graduation, 40),
          current: edu.current === true,
        };
      })
      .filter((item): item is Education => item !== null)
      .slice(0, 10);
  }

  if (Array.isArray(data.languages)) {
    result.languages = data.languages
      .map((raw, index): Language | null => {
        const lang = (raw || {}) as Record<string, unknown>;
        const name = str(lang.name || lang.idioma, 60);
        if (!name) return null;
        return { id: idFor(200 + index), name, level: normalizeLanguageLevel(lang.level || lang.nivel) };
      })
      .filter((item): item is Language => item !== null)
      .slice(0, 8);
  }

  if (Array.isArray(data.references)) {
    result.references = data.references
      .map((raw, index): Reference | null => {
        const ref = (raw || {}) as Record<string, unknown>;
        const name = str(ref.name || ref.nombre, 120);
        if (!name) return null;
        return {
          id: idFor(300 + index),
          name,
          position: str(ref.position || ref.cargo, 120),
          company: str(ref.company || ref.empresa, 120),
          phone: str(ref.phone || ref.telefono, 40),
          email: str(ref.email, 160),
        };
      })
      .filter((item): item is Reference => item !== null)
      .slice(0, 6);
  }

  return result;
}

/** Combina un Partial<CVData> con los valores por defecto (mismo contrato que hooks.ts). */
export function mergeWithDefaultCVData(input: Partial<CVData> | null | undefined): CVData {
  if (!input) return defaultCVData;
  return {
    ...defaultCVData,
    ...input,
    personalInfo: {
      ...defaultCVData.personalInfo,
      ...(input.personalInfo || {}),
    },
    skills: Array.isArray(input.skills) ? input.skills : defaultCVData.skills,
    experience: Array.isArray(input.experience) ? input.experience : defaultCVData.experience,
    education: Array.isArray(input.education) ? input.education : defaultCVData.education,
    languages: Array.isArray(input.languages) ? input.languages : defaultCVData.languages,
    references: Array.isArray(input.references) ? input.references : defaultCVData.references,
  };
}

/** Resumen de qué secciones quedaron llenas tras una extracción (para avisos al usuario). */
export function describeExtracted(data: Partial<CVData>): string[] {
  const found: string[] = [];
  if (data.personalInfo?.fullName) found.push('nombre');
  if (data.summary) found.push('perfil');
  if ((data.experience?.length || 0) > 0) found.push(`${data.experience!.length} experiencia(s)`);
  if ((data.education?.length || 0) > 0) found.push(`${data.education!.length} formación(es)`);
  if ((data.skills?.length || 0) > 0) found.push(`${data.skills!.length} habilidades`);
  if ((data.languages?.length || 0) > 0) found.push('idiomas');
  return found;
}
