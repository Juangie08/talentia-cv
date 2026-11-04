import {
  BaseTemplateId,
  UserTemplateConfig,
  TemplateRating,
  TemplateWithRating,
  generateId,
} from './types';

const USER_TEMPLATES_KEY = 'hdv.userTemplates.';
const RATINGS_KEY = 'hdv.templateRatings.';

export type TemplateCategory = 'corporativo' | 'moderno' | 'creativo' | 'sencillo';

export type RoleKey =
  | 'desarrollo'
  | 'diseno'
  | 'marketing'
  | 'ventas'
  | 'atencion-cliente'
  | 'administrativo'
  | 'finanzas'
  | 'legal'
  | 'salud'
  | 'docencia'
  | 'ingenieria'
  | 'primera-experiencia'
  | 'general';

export interface BaseTemplateMeta {
  id: BaseTemplateId;
  name: string;
  description: string;
  /** Nombre y descripción en inglés (opcional; se usa en la landing EN). */
  nameEn?: string;
  descriptionEn?: string;
  colors: string[];
  weight: 'ligera' | 'regular' | 'pesada';
  badges?: string[];
  useCase?: string;
  tone?: 'ats' | 'light' | 'creative' | 'balanced';
  category?: TemplateCategory;
  roles?: RoleKey[];
  defaults?: {
    colorAccent: string;
    colorHeaderBg: string;
    colorHeaderText: string;
    colorBodyText: string;
  };
}

/** Etiquetas amigables para el selector guiado por cargo. */
export const ROLE_OPTIONS: Array<{ key: RoleKey; label: string; emoji: string }> = [
  { key: 'desarrollo', label: 'Desarrollo / Software', emoji: '💻' },
  { key: 'diseno', label: 'Diseño / Creativo', emoji: '🎨' },
  { key: 'marketing', label: 'Marketing', emoji: '📣' },
  { key: 'ventas', label: 'Ventas', emoji: '📈' },
  { key: 'atencion-cliente', label: 'Atención al cliente', emoji: '🎧' },
  { key: 'administrativo', label: 'Administrativo', emoji: '🗂️' },
  { key: 'finanzas', label: 'Finanzas / Contaduría', emoji: '🧮' },
  { key: 'legal', label: 'Legal / Abogacía', emoji: '⚖️' },
  { key: 'salud', label: 'Salud', emoji: '🩺' },
  { key: 'docencia', label: 'Docencia / Educación', emoji: '📚' },
  { key: 'ingenieria', label: 'Ingeniería', emoji: '⚙️' },
  { key: 'primera-experiencia', label: 'Primera experiencia', emoji: '🌱' },
  { key: 'general', label: 'Otro / General', emoji: '✨' },
];

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  corporativo: 'Corporativo',
  moderno: 'Moderno',
  creativo: 'Creativo',
  sencillo: 'Sencillo',
};

function readStorageJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorageJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`No se pudo guardar ${key} en localStorage:`, error);
  }
}

/**
 * Devuelve los textos de la plantilla en el idioma pedido. Si la versión en
 * inglés no está definida todavía, se conserva la original.
 */
export function localizeTemplateMeta(meta: BaseTemplateMeta, locale: string): BaseTemplateMeta {
  if (locale !== 'en') return meta;
  return {
    ...meta,
    name: meta.nameEn || meta.name,
    description: meta.descriptionEn || meta.description,
  };
}

export const BASE_TEMPLATES: BaseTemplateMeta[] = [
  {
    id: 'editorial-bold',
    name: 'Editorial Bold',
    nameEn: 'Editorial Bold',
    description: 'Titular gigante estilo revista con barra lateral de color',
    descriptionEn: 'Magazine-style giant headline with a color sidebar',
    colors: ['#F97316', '#7C2D12', '#FFF7ED'],
    weight: 'pesada',
    badges: ['Editorial', 'Nueva'],
    defaults: {
      colorAccent: '#F97316',
      colorHeaderBg: '#7C2D12',
      colorHeaderText: '#FFFFFF',
      colorBodyText: '#292524',
    },
  },
  {
    id: 'pastel-pro',
    name: 'Pastel Pro',
    nameEn: 'Pastel Pro',
    description: 'Moderno y suave en tonos pastel, apto para filtros ATS',
    descriptionEn: 'Modern and soft pastel tones, ATS friendly',
    colors: ['#8B5CF6', '#F5F3FF', '#2E1065'],
    weight: 'ligera',
    badges: ['ATS', 'Ligera', 'Nueva'],
    defaults: {
      colorAccent: '#8B5CF6',
      colorHeaderBg: '#F5F3FF',
      colorHeaderText: '#2E1065',
      colorBodyText: '#1F2937',
    },
  },
  {
    id: 'mono-statement',
    name: 'Mono Statement',
    nameEn: 'Mono Statement',
    description: 'Tipografía geométrica en escala de grises con acento vivo',
    descriptionEn: 'Geometric typography in grayscale with a vivid accent',
    colors: ['#22D3EE', '#0F172A', '#F8FAFC'],
    weight: 'regular',
    badges: ['Nueva'],
    defaults: {
      colorAccent: '#22D3EE',
      colorHeaderBg: '#0F172A',
      colorHeaderText: '#FFFFFF',
      colorBodyText: '#1F2937',
    },
  },
  {
    id: 'neon-modern',
    name: 'Neón Moderno',
    nameEn: 'Modern Neon',
    description: 'Fondo oscuro de alto impacto para perfiles tech y creativos',
    descriptionEn: 'High-impact dark background for tech and creative profiles',
    colors: ['#A3E635', '#18181B', '#FAFAFA'],
    weight: 'pesada',
    badges: ['Editorial', 'Nueva'],
    defaults: {
      colorAccent: '#A3E635',
      colorHeaderBg: '#18181B',
      colorHeaderText: '#FFFFFF',
      colorBodyText: '#27272A',
    },
  },
  {
    id: 'ink-elegant',
    name: 'Ink Elegant',
    nameEn: 'Ink Elegant',
    description: 'Elegancia en blanco y negro con serif editorial',
    descriptionEn: 'Black and white elegance with editorial serif',
    colors: ['#111827', '#F5F5F4', '#1C1917'],
    weight: 'ligera',
    badges: ['ATS', 'Nueva'],
    defaults: {
      colorAccent: '#111827',
      colorHeaderBg: '#F5F5F4',
      colorHeaderText: '#1C1917',
      colorBodyText: '#292524',
    },
  },
  {
    id: 'green-fresh',
    name: 'Green Fresh',
    nameEn: 'Green Fresh',
    description: 'Fresco y natural con acentos jade y mint',
    descriptionEn: 'Fresh and natural with jade and mint accents',
    colors: ['#10B981', '#D1FAE5', '#064E3B'],
    weight: 'ligera',
    badges: ['ATS', 'Ligera', 'Nueva'],
    defaults: {
      colorAccent: '#10B981',
      colorHeaderBg: '#D1FAE5',
      colorHeaderText: '#064E3B',
      colorBodyText: '#1F2937',
    },
  },
  {
    id: 'moderno',
    name: 'Moderno Pro',
    nameEn: 'Modern Pro',
    description: 'Corporativo con barra lateral sólida',
    descriptionEn: 'Corporate layout with a solid sidebar',
    colors: ['#2563EB', '#1E40AF', '#EFF6FF'],
    weight: 'regular',
    badges: ['Clásica'],
    defaults: {
      colorAccent: '#2563EB',
      colorHeaderBg: '#1E293B',
      colorHeaderText: '#FFFFFF',
      colorBodyText: '#1F2937',
    },
  },
  {
    id: 'minimalista',
    name: 'Minimalista Flat',
    nameEn: 'Flat Minimalist',
    description: 'Limpio y centrado, estilo académico',
    descriptionEn: 'Clean and centered, academic style',
    colors: ['#1F2937', '#6B7280', '#F9FAFB'],
    weight: 'ligera',
    badges: ['ATS', 'Ligera'],
    defaults: {
      colorAccent: '#6B7280',
      colorHeaderBg: '#FFFFFF',
      colorHeaderText: '#111827',
      colorBodyText: '#1F2937',
    },
  },
  {
    id: 'creativo',
    name: 'Creativo Dark',
    description: 'Encabezado oscuro y estilo tech',
    colors: ['#7C3AED', '#EC4899', '#FDF4FF'],
    weight: 'pesada',
  },
  {
    id: 'customer-service',
    name: 'Servicio al Cliente',
    description: 'ATS-Friendly, enfocado en habilidades',
    colors: ['#3B82F6', '#2563EB', '#DBEAFE'],
    weight: 'ligera',
    badges: ['ATS', 'Ligera'],
    defaults: {
      colorAccent: '#2563EB',
      colorHeaderBg: '#FFFFFF',
      colorHeaderText: '#1F2937',
      colorBodyText: '#1F2937',
    },
  },
  {
    id: 'student',
    name: 'Estudiante / Pasante',
    description: 'Prioriza educación y proyectos',
    colors: ['#10B981', '#059669', '#ECFDF5'],
    weight: 'ligera',
    badges: ['ATS', 'Ligera'],
    defaults: {
      colorAccent: '#10B981',
      colorHeaderBg: '#F8FAFC',
      colorHeaderText: '#0F172A',
      colorBodyText: '#1F2937',
    },
  },
  {
    id: 'developer',
    name: 'Developer IT',
    description: 'Categorización de stack técnico',
    colors: ['#3B82F6', '#1D4ED8', '#EFF6FF'],
    weight: 'regular',
  },
  {
    id: 'creative-pro',
    name: 'Creative Portfolio',
    description: 'Diseño audaz con sidebar de color',
    descriptionEn: 'Bold design with a colorful sidebar',
    colors: ['#7C3AED', '#6D28D9', '#F5F3FF'],
    weight: 'pesada',
    badges: ['Editorial'],
  },
  {
    id: 'ejecutivo',
    name: 'Ejecutivo Clásico',
    nameEn: 'Classic Executive',
    description: 'Estilo ejecutivo tradicional con ribete dorado',
    descriptionEn: 'Traditional executive style with a golden trim',
    colors: ['#B8860B', '#DAA520', '#FFF8DC'],
    weight: 'ligera',
  },
  {
    id: 'medico',
    name: 'Médico Sanitario',
    description: 'Diseño limpio para profesionales de la salud',
    colors: ['#0EA5E9', '#0284C7', '#F0F9FF'],
    weight: 'ligera',
  },
  {
    id: 'legal',
    name: 'Abogado Legal',
    description: 'Profesional y formal para el ámbito jurídico',
    colors: ['#374151', '#1F2937', '#F3F4F6'],
    weight: 'ligera',
    badges: ['ATS'],
  },
  {
    id: 'finance',
    name: 'Finance Analyst',
    description: 'Enfocado en números y experiencia financiera',
    colors: ['#059669', '#047857', '#ECFDF5'],
    weight: 'regular',
  },
  {
    id: 'marketing',
    name: 'Marketing Digital',
    description: 'Creativo y moderno para profesionales de marketing',
    colors: ['#F59E0B', '#D97706', '#FFFBEB'],
    weight: 'pesada',
  },
  {
    id: 'educacion',
    name: 'Educador Profesional',
    description: 'Ideal para docentes y profesionales de la educación',
    colors: ['#8B5CF6', '#7C3AED', '#F5F3FF'],
    weight: 'regular',
  },
  {
    id: 'pink',
    name: 'Pink Cute',
    description: 'Diseño cute y profesional en tonos rosa',
    colors: ['#EC4899', '#F472B6', '#FDF2F8'],
    weight: 'pesada',
    badges: ['Cute'],
    defaults: {
      colorAccent: '#EC4899',
      colorHeaderBg: '#FDF2F8',
      colorHeaderText: '#831843',
      colorBodyText: '#3F3F46',
    },
  },
  {
    id: 'designer',
    name: 'Diseñador Creative',
    description: 'Diseño moderno para diseñadores y creativos',
    colors: ['#8B5CF6', '#A855F7', '#F5F3FF'],
    weight: 'pesada',
    badges: ['Editorial'],
  },
  {
    id: 'tech',
    name: 'Tech Developer',
    description: 'Estilo terminal para desarrolladores tech',
    colors: ['#06B6D4', '#0891B2', '#ECFEFF'],
    weight: 'pesada',
  },
  {
    id: 'corporate',
    name: 'Corporate Blue',
    description: 'Diseño corporativo tradicional azul',
    colors: ['#1E3A8A', '#1D4ED8', '#DBEAFE'],
    weight: 'regular',
  },
  {
    id: 'senior',
    name: 'Senior Executive',
    description: 'Diseño elegante para profesionales senior',
    colors: ['#CA8A04', '#D97706', '#FEF9C3'],
    weight: 'ligera',
  },
  {
    id: 'psychologist',
    name: 'Psicólogo Empático',
    description: 'Formato cálido y ordenado pensado para terapia y coaching',
    colors: ['#F472B6', '#F9A8D4', '#FEF2F2'],
    weight: 'ligera',
    badges: ['Cute'],
  },
  {
    id: 'software-engineer',
    name: 'Ingeniero Claro',
    nameEn: 'Clean Engineer',
    description: 'Perfil tecnológico con barras limpias y acentos mint',
    descriptionEn: 'Tech profile with clean bars and mint accents',
    colors: ['#14B8A6', '#0F766E', '#ECFEFF'],
    weight: 'regular',
    badges: ['ATS'],
  },
  {
    id: 'visual-designer',
    name: 'Diseñador Visual',
    description: 'Impacto creativo con tipografía moderna y contraste',
    colors: ['#C026D3', '#7C2DAD', '#F5E8FF'],
    weight: 'pesada',
    badges: ['Editorial'],
  },
  {
    id: 'customer-care',
    name: 'Atención al Cliente',
    description: 'Organizado para call centers y soporte con toques naranja',
    colors: ['#F97316', '#EA580C', '#FFF7ED'],
    weight: 'regular',
  },
  {
    id: 'chat-specialist',
    name: 'Especialista Chat',
    description: 'Diseño conversacional y limpio para soporte en vivo',
    colors: ['#0EA5E9', '#0369A1', '#E0F2FE'],
    weight: 'ligera',
    badges: ['ATS'],
  },
  {
    id: 'marketing-strategist',
    name: 'Marketing Magnético',
    description: 'Estilo audaz, ideal para roles en estrategia y remarketing',
    colors: ['#F43F5E', '#B91C1C', '#FFF1F2'],
    weight: 'pesada',
    badges: ['Editorial'],
  },
  {
    id: 'sakura-bloom',
    name: 'Sakura Bloom',
    description: 'Kawaii profesional en rosa polvo, ligera y delicada',
    descriptionEn: 'Professional kawaii in powder pink: light and delicate',
    colors: ['#E88AAE', '#B85C7C', '#FFF7FA'],
    weight: 'ligera',
    badges: ['Cute', 'ATS', 'Ligera'],
    defaults: {
      colorAccent: '#E88AAE',
      colorHeaderBg: '#FFF7FA',
      colorHeaderText: '#B85C7C',
      colorBodyText: '#4B5563',
    },
  },
  {
    id: 'cherry-ribbon',
    name: 'Cherry Ribbon',
    description: 'Cute profesional compacta con cintas y chips suaves',
    colors: ['#F472B6', '#DB2777', '#FFF1F7'],
    weight: 'ligera',
    badges: ['Cute', 'Ligera'],
    defaults: {
      colorAccent: '#F472B6',
      colorHeaderBg: '#FFF1F7',
      colorHeaderText: '#9D174D',
      colorBodyText: '#374151',
    },
  },
  {
    id: 'candy-editorial',
    name: 'Candy Editorial',
    description: 'Plantilla cute editorial con bloques grandes y ritmo visual',
    colors: ['#FB7185', '#EA580C', '#FFF7ED'],
    weight: 'regular',
    badges: ['Editorial', 'Cute'],
    defaults: {
      colorAccent: '#FB7185',
      colorHeaderBg: '#FFF7ED',
      colorHeaderText: '#9A3412',
      colorBodyText: '#334155',
    },
  },
  {
    id: 'peach-magazine',
    name: 'Peach Magazine',
    description: 'Estilo revista suave con aire femenino y moderno',
    colors: ['#FDBA74', '#EA580C', '#FFF7ED'],
    weight: 'regular',
    badges: ['Editorial'],
    defaults: {
      colorAccent: '#FB923C',
      colorHeaderBg: '#FFF7ED',
      colorHeaderText: '#9A3412',
      colorBodyText: '#334155',
    },
  },
  {
    id: 'bubble-minimal',
    name: 'Bubble Minimal',
    description: 'Cute minimal muy ligera, ideal para exportación limpia',
    colors: ['#F9A8D4', '#EC4899', '#FFF8FC'],
    weight: 'ligera',
    badges: ['Cute', 'ATS', 'Ligera'],
    defaults: {
      colorAccent: '#F472B6',
      colorHeaderBg: '#FFF8FC',
      colorHeaderText: '#9D174D',
      colorBodyText: '#374151',
    },
  },
];

const TEMPLATE_PRESENTATION_META: Partial<
  Record<BaseTemplateId, Pick<BaseTemplateMeta, 'useCase' | 'tone'>>
> = {
  'editorial-bold': {
    useCase: 'Impacto inmediato para diseno, marketing y portafolios.',
    tone: 'creative',
  },
  'pastel-pro': {
    useCase: 'Moderno y amable; excelente para cualquier vacante formal.',
    tone: 'ats',
  },
  'mono-statement': {
    useCase: 'Minimalismo tech con un acento que no pasa desapercibido.',
    tone: 'balanced',
  },
  'neon-modern': {
    useCase: 'Maxima personalidad para perfiles creativos y desarrolladores.',
    tone: 'creative',
  },
  'ink-elegant': {
    useCase: 'Sobria y atemporal; impecable en procesos tradicionales.',
    tone: 'ats',
  },
  'green-fresh': {
    useCase: 'Natural y clara; ideal para salud, bienestar y sostenibilidad.',
    tone: 'ats',
  },
  moderno: {
    useCase: 'Segura para perfiles corporativos y administrativos.',
    tone: 'balanced',
  },
  minimalista: {
    useCase: 'Ideal para portales y procesos con filtro automatico.',
    tone: 'ats',
  },
  creativo: {
    useCase: 'Impacto visual para perfiles creativos y tech.',
    tone: 'creative',
  },
  'customer-service': {
    useCase: 'Compacta y clara para soporte, ventas y servicio.',
    tone: 'ats',
  },
  student: {
    useCase: 'Buena para primera experiencia y perfiles junior.',
    tone: 'light',
  },
  developer: {
    useCase: 'Pensada para destacar stack y proyectos tecnicos.',
    tone: 'balanced',
  },
  'creative-pro': {
    useCase: 'Mas expresiva para portafolios y roles visuales.',
    tone: 'creative',
  },
  ejecutivo: {
    useCase: 'Clasica y sobria para liderazgo o gestion.',
    tone: 'light',
  },
  medico: {
    useCase: 'Ordenada y confiable para salud y bienestar.',
    tone: 'light',
  },
  legal: {
    useCase: 'Muy formal y compatible con procesos tradicionales.',
    tone: 'ats',
  },
  finance: {
    useCase: 'Estructurada para analisis, banca y finanzas.',
    tone: 'balanced',
  },
  marketing: {
    useCase: 'Mas visual para marketing, marca y growth.',
    tone: 'creative',
  },
  educacion: {
    useCase: 'Equilibrada para educacion, cursos y docencia.',
    tone: 'balanced',
  },
  pink: {
    useCase: 'Kawaii profesional para perfiles con sello personal.',
    tone: 'creative',
  },
  designer: {
    useCase: 'Alta presencia visual para branding y diseno.',
    tone: 'creative',
  },
  tech: {
    useCase: 'Con personalidad para desarrolladores y perfiles geek.',
    tone: 'creative',
  },
  corporate: {
    useCase: 'Facil de defender en sectores formales y corporativos.',
    tone: 'balanced',
  },
  senior: {
    useCase: 'Compacta y premium para roles senior.',
    tone: 'light',
  },
  psychologist: {
    useCase: 'Calida y amable para terapia, educacion o coaching.',
    tone: 'light',
  },
  'software-engineer': {
    useCase: 'Tecnica y limpia para vacantes de software.',
    tone: 'ats',
  },
  'visual-designer': {
    useCase: 'Editorial con impacto para diseno y arte visual.',
    tone: 'creative',
  },
  'customer-care': {
    useCase: 'Directa y funcional para atencion al cliente.',
    tone: 'balanced',
  },
  'chat-specialist': {
    useCase: 'Ligera y muy clara para soporte por chat o remoto.',
    tone: 'ats',
  },
  'marketing-strategist': {
    useCase: 'Audaz para estrategia, contenido y marketing creativo.',
    tone: 'creative',
  },
  'sakura-bloom': {
    useCase: 'Cute profesional y limpia para portales y vacantes formales.',
    tone: 'ats',
  },
  'cherry-ribbon': {
    useCase: 'Compacta y linda para destacar sin cargar el PDF.',
    tone: 'light',
  },
  'candy-editorial': {
    useCase: 'Editorial dulce para roles creativos con personalidad.',
    tone: 'creative',
  },
  'peach-magazine': {
    useCase: 'Aire revista para branding, social media y arte.',
    tone: 'creative',
  },
  'bubble-minimal': {
    useCase: 'Muy ligera y limpia para exportacion segura y bonita.',
    tone: 'ats',
  },
};

const TEMPLATE_CATEGORY_ROLES: Record<
  BaseTemplateId,
  Pick<BaseTemplateMeta, 'category' | 'roles'>
> = {
  'editorial-bold': { category: 'creativo', roles: ['diseno', 'marketing', 'desarrollo'] },
  'pastel-pro': { category: 'moderno', roles: ['general', 'primera-experiencia', 'atencion-cliente', 'diseno'] },
  'mono-statement': { category: 'moderno', roles: ['desarrollo', 'ingenieria', 'diseno'] },
  'neon-modern': { category: 'creativo', roles: ['desarrollo', 'marketing', 'diseno'] },
  'ink-elegant': { category: 'corporativo', roles: ['legal', 'finanzas', 'administrativo', 'ventas'] },
  'green-fresh': { category: 'sencillo', roles: ['salud', 'general', 'primera-experiencia', 'docencia'] },
  moderno: { category: 'corporativo', roles: ['administrativo', 'ventas', 'general', 'desarrollo'] },
  minimalista: { category: 'sencillo', roles: ['general', 'primera-experiencia', 'administrativo', 'desarrollo'] },
  creativo: { category: 'creativo', roles: ['diseno', 'marketing', 'desarrollo'] },
  'customer-service': { category: 'sencillo', roles: ['atencion-cliente', 'ventas', 'general'] },
  student: { category: 'sencillo', roles: ['primera-experiencia', 'docencia', 'general'] },
  developer: { category: 'moderno', roles: ['desarrollo', 'ingenieria'] },
  'creative-pro': { category: 'creativo', roles: ['diseno', 'marketing'] },
  ejecutivo: { category: 'corporativo', roles: ['administrativo', 'finanzas', 'legal', 'ventas'] },
  medico: { category: 'corporativo', roles: ['salud'] },
  legal: { category: 'corporativo', roles: ['legal', 'administrativo'] },
  finance: { category: 'corporativo', roles: ['finanzas', 'administrativo'] },
  marketing: { category: 'creativo', roles: ['marketing', 'diseno'] },
  educacion: { category: 'moderno', roles: ['docencia', 'general'] },
  pink: { category: 'creativo', roles: ['diseno', 'marketing', 'primera-experiencia'] },
  designer: { category: 'creativo', roles: ['diseno', 'marketing'] },
  tech: { category: 'moderno', roles: ['desarrollo', 'ingenieria'] },
  corporate: { category: 'corporativo', roles: ['administrativo', 'finanzas', 'ingenieria', 'general'] },
  senior: { category: 'corporativo', roles: ['ventas', 'finanzas', 'administrativo'] },
  psychologist: { category: 'sencillo', roles: ['salud', 'docencia'] },
  'software-engineer': { category: 'moderno', roles: ['desarrollo', 'ingenieria'] },
  'visual-designer': { category: 'creativo', roles: ['diseno', 'marketing'] },
  'customer-care': { category: 'moderno', roles: ['atencion-cliente', 'ventas'] },
  'chat-specialist': { category: 'sencillo', roles: ['atencion-cliente', 'general'] },
  'marketing-strategist': { category: 'creativo', roles: ['marketing', 'diseno'] },
  'sakura-bloom': { category: 'creativo', roles: ['primera-experiencia', 'diseno', 'general'] },
  'cherry-ribbon': { category: 'creativo', roles: ['primera-experiencia', 'diseno'] },
  'candy-editorial': { category: 'creativo', roles: ['diseno', 'marketing'] },
  'peach-magazine': { category: 'creativo', roles: ['diseno', 'marketing'] },
  'bubble-minimal': { category: 'sencillo', roles: ['primera-experiencia', 'general', 'administrativo'] },
};

export function getBaseTemplateMeta(templateId: string): BaseTemplateMeta | undefined {
  const template = BASE_TEMPLATES.find((baseTemplate) => baseTemplate.id === templateId);
  if (!template) return undefined;

  return {
    ...template,
    ...TEMPLATE_PRESENTATION_META[template.id],
    ...TEMPLATE_CATEGORY_ROLES[template.id],
  };
}

/** Plantillas recomendadas para un cargo (mejor match primero). */
export function getTemplatesForRole(role: RoleKey): BaseTemplateMeta[] {
  const scored = BASE_TEMPLATES.map((template) => {
    const meta = getBaseTemplateMeta(template.id)!;
    const roles = meta.roles || [];
    let score = 0;
    if (roles.includes(role)) score += 2;
    if (roles.includes('general')) score += 1;
    return { meta, score };
  });
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.meta);
}

export function getUserTemplates(profileId: string): UserTemplateConfig[] {
  return readStorageJSON<UserTemplateConfig[]>(USER_TEMPLATES_KEY + profileId, []);
}

export function saveUserTemplate(profileId: string, config: Omit<UserTemplateConfig, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): UserTemplateConfig {
  const templates = getUserTemplates(profileId);
  const now = new Date().toISOString();

  let finalConfig: UserTemplateConfig;

  if (config.id) {
    const index = templates.findIndex((template) => template.id === config.id);
    finalConfig = {
      ...templates[index],
      ...config,
      id: config.id as string,
      updatedAt: now,
    };
    templates[index] = finalConfig;
  } else {
    finalConfig = {
      ...config,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    } as UserTemplateConfig;
    templates.push(finalConfig);
  }

  writeStorageJSON(USER_TEMPLATES_KEY + profileId, templates);
  return finalConfig;
}

export function deleteUserTemplate(profileId: string, templateId: string): void {
  const templates = getUserTemplates(profileId);
  const filtered = templates.filter((template) => template.id !== templateId);
  writeStorageJSON(USER_TEMPLATES_KEY + profileId, filtered);
}

export function getTemplateRatings(profileId: string): TemplateRating[] {
  return readStorageJSON<TemplateRating[]>(RATINGS_KEY + profileId, []);
}

export function saveTemplateRating(profileId: string, templateId: string, score: number): void {
  const ratings = getTemplateRatings(profileId);
  const index = ratings.findIndex((rating) => rating.templateId === templateId);

  if (index >= 0) {
    ratings[index].totalScore += score;
    ratings[index].votes += 1;
  } else {
    ratings.push({ templateId, totalScore: score, votes: 1 });
  }

  writeStorageJSON(RATINGS_KEY + profileId, ratings);
}

export function getTemplatesRanking(profileId: string): TemplateWithRating[] {
  const ratings = getTemplateRatings(profileId);
  const userTemplates = getUserTemplates(profileId);

  const all: TemplateWithRating[] = [];

  BASE_TEMPLATES.forEach((base) => {
    const rating = ratings.find((item) => item.templateId === base.id);
    all.push({
      templateId: base.id,
      name: base.name,
      isUserTemplate: false,
      averageScore: rating ? rating.totalScore / rating.votes : 0,
      votes: rating ? rating.votes : 0,
    });
  });

  userTemplates.forEach((template) => {
    const rating = ratings.find((item) => item.templateId === template.id);
    all.push({
      templateId: template.id,
      name: template.name,
      isUserTemplate: true,
      averageScore: rating ? rating.totalScore / rating.votes : 0,
      votes: rating ? rating.votes : 0,
      config: template,
    });
  });

  return all.sort((a, b) => {
    if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
    return b.votes - a.votes;
  });
}
