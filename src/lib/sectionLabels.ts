import type { Locale } from './i18n/config';

/**
 * Etiquetas de las secciones de la hoja de vida (las que van impresas en el
 * documento, no en la interfaz del editor).
 *
 * Viven aquí —y no en los diccionarios de la UI— porque las consumen las 36
 * plantillas y los exportadores a PDF/Word: un currículum en inglés debe salir
 * con «Experience», no con «Experiencia», sin importar el idioma del editor.
 *
 * Varias plantillas usan títulos propios de su especialidad («Competencias
 * Jurídicas», «Experiencia Clínica»); están todos aquí para que la traducción
 * sea una sola tabla revisable y no 72 cadenas sueltas por el código.
 */
export type SectionKey =
  | 'summary'
  | 'summaryShort'
  | 'profile'
  | 'profileProfessional'
  | 'experience'
  | 'experienceProfessional'
  | 'experienceJobs'
  | 'experienceProjects'
  | 'experienceCreative'
  | 'experienceTeaching'
  | 'experienceClinical'
  | 'education'
  | 'educationPlain'
  | 'educationShort'
  | 'educationAndTraining'
  | 'educationMedical'
  | 'skills'
  | 'competencies'
  | 'skillsKey'
  | 'skillsPedagogical'
  | 'skillsLegal'
  | 'languages'
  | 'references'
  | 'referencesProfessional'
  | 'contact';

export const SECTION_LABELS: Record<Locale, Record<SectionKey, string>> = {
  es: {
    summary: 'Resumen profesional',
    summaryShort: 'Resumen',
    profile: 'Perfil',
    profileProfessional: 'Perfil Profesional',
    experience: 'Experiencia',
    experienceProfessional: 'Experiencia Profesional',
    experienceJobs: 'Experiencia Laboral',
    experienceProjects: 'Experiencia y Proyectos',
    experienceCreative: 'Experiencia creativa',
    experienceTeaching: 'Experiencia Docente',
    experienceClinical: 'Experiencia Clínica',
    education: 'Formación Académica',
    educationPlain: 'Formación',
    educationShort: 'Educación',
    educationAndTraining: 'Educación y Formación',
    educationMedical: 'Formación Médica',
    skills: 'Habilidades',
    competencies: 'Competencias',
    skillsKey: 'Competencias Clave',
    skillsPedagogical: 'Competencias Pedagógicas',
    skillsLegal: 'Competencias Jurídicas',
    languages: 'Idiomas',
    references: 'Referencias',
    referencesProfessional: 'Referencias Profesionales',
    contact: 'Contacto',
  },
  en: {
    summary: 'Professional Summary',
    summaryShort: 'Summary',
    profile: 'Profile',
    profileProfessional: 'Professional Profile',
    experience: 'Experience',
    experienceProfessional: 'Professional Experience',
    experienceJobs: 'Work Experience',
    experienceProjects: 'Experience & Projects',
    experienceCreative: 'Creative Experience',
    experienceTeaching: 'Teaching Experience',
    experienceClinical: 'Clinical Experience',
    education: 'Education',
    educationPlain: 'Education',
    educationShort: 'Education',
    educationAndTraining: 'Education & Training',
    educationMedical: 'Medical Training',
    skills: 'Skills',
    competencies: 'Competencies',
    skillsKey: 'Key Skills',
    skillsPedagogical: 'Teaching Skills',
    skillsLegal: 'Legal Skills',
    languages: 'Languages',
    references: 'References',
    referencesProfessional: 'Professional References',
    contact: 'Contact',
  },
};

/** Devuelve el juego de etiquetas del idioma pedido (español si falta). */
export function sectionLabels(locale: Locale | undefined | null): Record<SectionKey, string> {
  return (locale && SECTION_LABELS[locale]) || SECTION_LABELS.es;
}
