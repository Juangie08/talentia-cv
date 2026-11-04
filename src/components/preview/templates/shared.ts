import { CVData } from '@/lib/types';
import type { Locale } from '@/lib/i18n/config';
import { formatDateRange as formatDateRangeUtil } from '@/lib/date-utils';

export interface TemplateDataProps {
  data: CVData;
}

export interface CustomTemplateProps {
  cv: CVData;
  accentColor?: string;
  fontFamily?: string;
  density?: 'compact' | 'normal' | 'spacious';
  showPhoto?: boolean;
  showWatermark?: boolean;
  /** Idioma del documento: decide los títulos de sección impresos. */
  locale?: Locale;
}

export function stripUrlProtocol(value: string): string {
  return value.trim().replace(/^https?:\/\//, '');
}

export type Density = 'compact' | 'normal' | 'spacious';

/**
 * Vocabulario de espaciado que responde al control "Compacto / Normal / Amplio".
 *
 * Existe porque el control se ofrecía a las 36 plantillas pero solo 6 lo
 * escuchaban: en las otras 30 pulsarlo no cambiaba nada, que es peor que no
 * ofrecerlo. Cada plantilla toma de aquí los pocos huecos que llevan su ritmo
 * vertical —el que decide cuántas páginas ocupa la hoja— y deja el resto de sus
 * clases intactas.
 *
 * Los valores son clases COMPLETAS y no se arman por interpolación a propósito:
 * Tailwind escanea el código fuente buscando literales, así que un `space-y-${n}`
 * no generaría CSS. Que todas aparezcan escritas aquí es lo que las hace existir.
 */
export interface Rhythm {
  /** Relleno del contenedor principal de la hoja. */
  page: string;
  /** Separación entre secciones, para quien las apila con `space-y-*`. */
  section: string;
  /** Lo mismo, para quien da margen a cada `<section>` suelto. */
  sectionMb: string;
  /** Separación entre bloques dentro de una sección. */
  item: string;
  /** Lo mismo, como margen inferior de cada bloque. */
  itemMb: string;
  /** Separación entre renglones de una misma lista. */
  tight: string;
  /** Hueco entre un título de sección y su contenido. */
  heading: string;
  /** Cuadrícula de tarjetas: separación y relleno. */
  cardGap: string;
  cardPad: string;
}

const RHYTHM: Record<Density, Rhythm> = {
  compact: {
    page: 'p-5',
    section: 'space-y-4',
    sectionMb: 'mb-5',
    item: 'space-y-2',
    itemMb: 'mb-3',
    tight: 'space-y-1',
    heading: 'mb-2',
    cardGap: 'gap-2',
    cardPad: 'p-3',
  },
  normal: {
    page: 'p-8',
    section: 'space-y-6',
    sectionMb: 'mb-8',
    item: 'space-y-4',
    itemMb: 'mb-4',
    tight: 'space-y-1.5',
    heading: 'mb-4',
    cardGap: 'gap-4',
    cardPad: 'p-4',
  },
  spacious: {
    page: 'p-11',
    section: 'space-y-8',
    sectionMb: 'mb-11',
    item: 'space-y-6',
    itemMb: 'mb-6',
    tight: 'space-y-2',
    heading: 'mb-6',
    cardGap: 'gap-6',
    cardPad: 'p-6',
  },
};

/** Escala de espaciado de la plantilla según la densidad elegida. */
export function rhythm(density: Density = 'normal'): Rhythm {
  return RHYTHM[density] ?? RHYTHM.normal;
}

export function getLanguageLevelWidth(level: string): string {
  const normalized = level.toLowerCase();
  if (normalized.includes('nativo') || normalized.includes('avanzado')) return '90%';
  if (normalized.includes('intermedio')) return '60%';
  return '30%';
}

export const formatDateRange = formatDateRangeUtil;
