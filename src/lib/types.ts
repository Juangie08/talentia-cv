// ============================================
// Tipos principales del generador de hojas de vida
// ============================================

export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  photoUrl: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  achievements: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface Language {
  id: string;
  name: string;
  level: "Básico" | "Intermedio" | "Avanzado" | "Nativo";
}

export interface Reference {
  id: string;
  name: string;
  position: string;
  company: string;
  phone: string;
  email: string;
}

/** Objetivo de la hoja de vida: la empresa/cargo al que se postula. */
export interface CVTarget {
  company?: string;
  role?: string;
  offerText?: string;
  /** Tono con el que la IA reescribe el contenido. */
  tone?: 'conservador' | 'equilibrado' | 'agresivo';
  /** Seniority detectado o elegido por la persona. */
  seniority?: 'junior' | 'mid' | 'senior' | 'lead';
  /** Último puntaje de coincidencia calculado (para mostrarlo al volver). */
  matchScore?: number;
}

export interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  languages: Language[];
  references: Reference[];
  /** Opcional: contexto de la oferta para adaptar la HDV. */
  target?: CVTarget;
}

/**
 * Los BaseTemplateId corresponden a los componentes predefinidos.
 * Los usuarios pueden crear UserTemplateConfig que "sobrescriben" visualmente 
 * uno de estos layouts base.
 */
export type BaseTemplateId =
  | 'moderno'
  | 'minimalista'
  | 'creativo'
  | 'customer-service'
  | 'student'
  | 'developer'
  | 'creative-pro'
  | 'ejecutivo'
  | 'medico'
  | 'legal'
  | 'finance'
  | 'marketing'
  | 'educacion'
  | 'pink'
  | 'designer'
  | 'tech'
  | 'corporate'
  | 'senior'
  | 'psychologist'
  | 'software-engineer'
  | 'visual-designer'
  | 'customer-care'
  | 'chat-specialist'
  | 'marketing-strategist'
  | 'sakura-bloom'
  | 'cherry-ribbon'
  | 'candy-editorial'
  | 'peach-magazine'
  | 'bubble-minimal'
  | 'editorial-bold'
  | 'pastel-pro'
  | 'mono-statement'
  | 'neon-modern'
  | 'ink-elegant'
  | 'green-fresh';

export type PaperSize = 'letter' | 'legal' | 'a4' | 'continuous';
export type TemplateWeight = 'ligera' | 'regular' | 'pesada';

// Mantenemos TemplateName por compatibilidad si es necesario, 
// pero usaremos BaseTemplateId para la lógica nueva.
export type TemplateName = BaseTemplateId | string;

export interface UserTemplateConfig {
  id: string; // uuid
  name: string;
  description?: string;
  baseTemplate: BaseTemplateId;
  accentColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  density: 'compact' | 'normal' | 'spacious';
  showPhoto: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateRating {
  templateId: string; // name del base template o ID del user template
  totalScore: number;
  votes: number;
}

export interface TemplateWithRating {
  templateId: string;
  name: string;
  isUserTemplate: boolean;
  averageScore: number;
  votes: number;
  config?: UserTemplateConfig; // si es personalizada
}

/** Estado por defecto para un CV vacío */
export const defaultCVData: CVData = {
  personalInfo: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    photoUrl: "",
  },
  summary: "",
  skills: [],
  experience: [],
  education: [],
  languages: [],
  references: [],
};

export interface CVCustomizationSectionsVisible {
  photo: boolean;
  summary: boolean;
  skills: boolean;
  experience: boolean;
  education: boolean;
  languages: boolean;
  references: boolean;
}

export interface CVCustomization {
  fontBody: string;
  fontSizeBase: number;
  fontSizeHeading: number;
  fontSizeName: number;
  fontWeightBody: 'normal' | 'bold';
  fontStyleBody: 'normal' | 'italic';
  decorationHeading: 'none' | 'underline';
  transformHeading: 'none' | 'uppercase';
  colorAccent: string;
  colorHeaderBg: string;
  colorHeaderText: string;
  colorBodyText: string;
  spacing: 'compact' | 'normal' | 'spacious';
  pagePadding: number;
  sectionsVisible: CVCustomizationSectionsVisible;
  sectionsOrder: string[];
  showWatermark: boolean;
}

export const defaultCustomization: CVCustomization = {
  fontBody: 'Inter',
  fontSizeBase: 10,
  fontSizeHeading: 12,
  fontSizeName: 26,
  fontWeightBody: 'normal',
  fontStyleBody: 'normal',
  decorationHeading: 'none',
  transformHeading: 'uppercase',
  colorAccent: '#0033A0',
  colorHeaderBg: '#0033A0',
  colorHeaderText: '#FFFFFF',
  colorBodyText: '#1A1A1A',
  spacing: 'normal',
  pagePadding: 32,
  sectionsVisible: {
    photo: true,
    summary: true,
    skills: true,
    experience: true,
    education: true,
    languages: true,
    references: true,
  },
  sectionsOrder: ['photo', 'summary', 'experience', 'education', 'skills', 'languages', 'references'],
  showWatermark: false,
};

/** Genera un ID único para elementos de arrays */
export function generateId(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}
