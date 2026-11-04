import { CVData, PaperSize } from './types';
import { formatDateRange } from './date-utils';
import { sectionLabels } from './sectionLabels';
import type { Locale } from './i18n/config';

// ============================================================
// Utilidades compartidas de exportación
// ============================================================

/** Convierte un color hex (#RGB / #RRGGBB) a componentes RGB. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return { r: 0, g: 51, b: 160 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

type Rgb = { r: number; g: number; b: number };

/** Mezcla dos colores (t = 0 devuelve c1, t = 1 devuelve c2). */
function mixColor(c1: Rgb, c2: Rgb, t: number): Rgb {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  };
}

/** Luminancia relativa (0 = negro, 1 = blanco) para decidir contraste de texto. */
function luminance(c: Rgb): number {
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const INK: Rgb = { r: 17, g: 24, b: 39 };
const SLATE: Rgb = { r: 71, g: 85, b: 105 };
const MUTED: Rgb = { r: 100, g: 116, b: 139 };

interface LoadedImage {
  dataUrl: string;
  format: 'JPEG' | 'PNG' | 'WEBP';
  width: number;
  height: number;
}

/**
 * Carga una imagen (data URL o URL http/same-origin) para incrustarla en el
 * PDF. Devuelve null si no se puede cargar o el formato no es soportado.
 */
async function loadImageAsDataURL(url: string): Promise<LoadedImage | null> {
  try {
    let dataUrl = url;
    if (!url.startsWith('data:')) {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) return null;
      const blob = await response.blob();
      dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
      if (!dataUrl) return null;
    }
    const format = dataUrl.startsWith('data:image/png')
      ? 'PNG'
      : dataUrl.startsWith('data:image/webp')
        ? 'WEBP'
        : 'JPEG';
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      if (typeof Image === 'undefined') {
        resolve({ width: 1, height: 1 });
        return;
      }
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
      img.onerror = () => resolve({ width: 1, height: 1 });
      img.src = dataUrl;
    });
    return { dataUrl, format, width: dims.width, height: dims.height };
  } catch {
    return null;
  }
}

/** Nombre por defecto cuando la hoja todavía no tiene nombre. */
function defaultName(locale: Locale): string {
  return locale === 'es' ? 'Tu Nombre' : 'Your Name';
}

/** Etiquetas de los campos de contacto del PDF con diseño. */
const CONTACT_LABELS: Record<Locale, { email: string; phone: string; link: string; location: string }> = {
  es: { email: 'Correo', phone: 'Teléfono', link: 'Enlace', location: 'Ubicación' },
  en: { email: 'Email', phone: 'Phone', link: 'Link', location: 'Location' },
};

/** Convierte un nombre en un slug seguro para nombres de archivo. */
function slugify(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return slug || 'mi-hoja-de-vida';
}

/** Normaliza un valor de contacto (LinkedIn, web) a URL clicable. */
function toExternalUrl(value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (v.includes('.') || v.includes('/')) return `https://${v}`;
  return v;
}

interface ContactSegment {
  text: string;
  url?: string;
}

/** Segmenta los datos de contacto para renderizarlos con enlaces. */
function buildContactSegments(data: CVData): ContactSegment[] {
  const { personalInfo } = data;
  const segments: ContactSegment[] = [
    { text: personalInfo.email?.trim() || '', url: personalInfo.email ? `mailto:${personalInfo.email.trim()}` : undefined },
    { text: personalInfo.phone?.trim() || '', url: personalInfo.phone ? `tel:${personalInfo.phone.replace(/[^+\d]/g, '')}` : undefined },
    { text: personalInfo.location?.trim() || '' },
    { text: personalInfo.linkedin?.trim() || '', url: personalInfo.linkedin ? toExternalUrl(personalInfo.linkedin) : undefined },
    { text: personalInfo.website?.trim() || '', url: personalInfo.website ? toExternalUrl(personalInfo.website) : undefined },
  ];
  return segments.filter((segment) => Boolean(segment.text));
}

/** Construye la hoja de vida como texto plano (para copiar al portapapeles). */
export function buildPlainTextCV(data: CVData, locale: Locale = 'es'): string {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = data;
  const lines: string[] = [];

  lines.push(personalInfo.fullName || defaultName(locale));
  if (personalInfo.title) lines.push(personalInfo.title);
  const contact = buildContactSegments(data).map((s) => s.text).join(' | ');
  if (contact) lines.push(contact);

  if (summary) {
    lines.push('', L.summary.toUpperCase(), summary);
  }

  if (experience.length > 0) {
    lines.push('', L.experienceJobs.toUpperCase());
    for (const exp of experience) {
      const head = exp.position + (exp.company ? ` — ${exp.company}` : '');
      const dateStr = formatDateRange(exp.startDate, exp.endDate, exp.current, locale);
      lines.push(head + (dateStr ? ` (${dateStr})` : ''));
      for (const achievement of exp.achievements) {
        if (achievement) lines.push(`- ${achievement}`);
      }
    }
  }

  if (education.length > 0) {
    lines.push('', L.educationShort.toUpperCase());
    for (const edu of education) {
      const degree = edu.degree + (edu.field ? `${locale === 'es' ? ' en ' : ' in '}${edu.field}` : '');
      const dateStr = formatDateRange(edu.startDate, edu.endDate, edu.current, locale);
      lines.push(degree + (edu.institution ? ` — ${edu.institution}` : '') + (dateStr ? ` (${dateStr})` : ''));
    }
  }

  if (skills.length > 0) {
    lines.push('', L.skills.toUpperCase(), skills.join(' · '));
  }

  if (languages.length > 0) {
    lines.push('', L.languages.toUpperCase(), languages.map((l) => `${l.name}: ${l.level}`).join(' · '));
  }

  if (references.length > 0) {
    lines.push('', L.references.toUpperCase());
    for (const ref of references) {
      const refContact = [ref.phone, ref.email].filter(Boolean).join(' | ');
      lines.push(`${ref.name} — ${ref.position}, ${ref.company}` + (refContact ? ` (${refContact})` : ''));
    }
  }

  return lines.join('\n');
}

// ============================================================
// Exportación Word (.docx)
// ============================================================

export interface WordOptions {
  /** Color de acento para nombre y títulos (hex). Por defecto azul corporativo. */
  accentColor?: string;
  /** Idioma del documento: decide los títulos de sección. */
  locale?: Locale;
  /** Fuente del documento. Por defecto Calibri (máxima compatibilidad con Word). */
  fontFamily?: string;
}

/**
 * Genera un archivo Word (.docx) a partir del CVData, con texto real,
 * enlaces clicables y metadatos del documento.
 */
export async function generateWord(data: CVData, paperSize: PaperSize = 'letter', options: WordOptions = {}): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, PageOrientation, ExternalHyperlink } = await import('docx');

  const { personalInfo, summary, skills, experience, education, languages, references } = data;
  // Sin # y en mayúsculas: es lo que espera docx para los colores.
  const accentHex = (options.accentColor || '#0033A0').replace('#', '').toUpperCase();
  const font = options.fontFamily || 'Calibri';
  const locale = options.locale || 'es';
  const L = sectionLabels(locale);
  const fullName = personalInfo.fullName?.trim() || defaultName(locale);

  const children: InstanceType<typeof Paragraph>[] = [];

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: fullName,
          bold: true,
          size: 32,
          font,
          color: accentHex,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  if (personalInfo.title) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: personalInfo.title,
            size: 24,
            color: accentHex,
            font,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );
  }

  const contactSegments = buildContactSegments(data);
  if (contactSegments.length > 0) {
    const contactChildren: Array<InstanceType<typeof TextRun> | InstanceType<typeof ExternalHyperlink>> = [];
    contactSegments.forEach((segment, index) => {
      if (index > 0) {
        contactChildren.push(
          new TextRun({ text: '  |  ', size: 18, color: '777777', font })
        );
      }
      if (segment.url) {
        contactChildren.push(
          new ExternalHyperlink({
            link: segment.url,
            children: [
              new TextRun({ text: segment.text, size: 18, color: '1D4ED8', underline: {}, font }),
            ],
          })
        );
      } else {
        contactChildren.push(
          new TextRun({ text: segment.text, size: 18, color: '777777', font })
        );
      }
    });
    children.push(
      new Paragraph({
        children: contactChildren,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  const addSeparator = () => {
    children.push(
      new Paragraph({
        border: {
          bottom: { color: 'CCCCCC', size: 1, style: BorderStyle.SINGLE, space: 1 },
        },
        spacing: { after: 200 },
      })
    );
  };

  const addSectionTitle = (title: string) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 24, font, color: accentHex })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );
    addSeparator();
  };

  if (summary) {
    addSectionTitle(L.summary.toUpperCase());
    children.push(
      new Paragraph({
        children: [new TextRun({ text: summary, size: 20, font })],
        spacing: { after: 200 },
      })
    );
  }

  if (experience.length > 0) {
    addSectionTitle(L.experienceJobs.toUpperCase());

    for (const exp of experience) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.position, bold: true, size: 22, font }),
            new TextRun({ text: `  -  ${exp.company}`, size: 22, font, color: '555555' }),
          ],
          spacing: { before: 100 },
        })
      );

      const dateStr = formatDateRange(exp.startDate, exp.endDate, exp.current, locale);
      if (dateStr) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: dateStr, size: 18, italics: true, color: '888888', font })],
            spacing: { after: 50 },
          })
        );
      }

      for (const achievement of exp.achievements) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `• ${achievement}`, size: 20, font })],
            indent: { left: 260, hanging: 160 },
            spacing: { after: 30 },
          })
        );
      }
    }
  }

  if (education.length > 0) {
    addSectionTitle(L.educationShort.toUpperCase());

    for (const edu of education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 22, font }),
            new TextRun({ text: edu.field ? `${locale === 'es' ? ' en ' : ' in '}${edu.field}` : '', size: 22, font }),
          ],
        })
      );

      const eduDateStr = formatDateRange(edu.startDate, edu.endDate, edu.current, locale);
      const eduChildren: InstanceType<typeof TextRun>[] = [
        new TextRun({ text: edu.institution, size: 20, color: '555555', font }),
      ];

      if (eduDateStr) {
        eduChildren.push(
          new TextRun({
            text: `  |  ${eduDateStr}`,
            size: 18,
            italics: true,
            color: '888888',
            font,
          })
        );
      }

      children.push(
        new Paragraph({
          children: eduChildren,
          spacing: { after: 100 },
        })
      );
    }
  }

  if (skills.length > 0) {
    addSectionTitle(L.skills.toUpperCase());
    children.push(
      new Paragraph({
        children: [new TextRun({ text: skills.join('  ·  '), size: 20, font })],
        spacing: { after: 200 },
      })
    );
  }

  if (languages.length > 0) {
    addSectionTitle(L.languages.toUpperCase());

    for (const lang of languages) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${lang.name}: `, bold: true, size: 20, font }),
            new TextRun({ text: lang.level, size: 20, font, color: '555555' }),
          ],
          spacing: { after: 30 },
        })
      );
    }
  }

  if (references.length > 0) {
    addSectionTitle(L.references.toUpperCase());

    for (const ref of references) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: ref.name, bold: true, size: 20, font }),
            new TextRun({ text: ` - ${ref.position}, ${ref.company}`, size: 20, color: '555555', font }),
          ],
        })
      );

      const refContact = [ref.phone, ref.email].filter(Boolean).join('  |  ');
      if (refContact) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: refContact, size: 18, color: '888888', font })],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // Page size in twips (1 inch = 1440 twips)
  const pageSizes: Record<string, { width: number; height: number }> = {
    letter: { width: 12240, height: 15840 },  // 8.5" x 11"
    legal: { width: 12240, height: 20160 },   // 8.5" x 14"
    a4: { width: 11906, height: 16838 },       // 210mm x 297mm
  };
  const pageSize = pageSizes[paperSize] || pageSizes.letter;

  const doc = new Document({
    title: `${fullName}${personalInfo.title ? ` — ${personalInfo.title}` : ''}`,
    subject: 'Hoja de vida',
    creator: 'Talentia',
    keywords: skills.join(', '),
    description: summary ? summary.slice(0, 200) : 'Hoja de vida generada con Talentia',
    lastModifiedBy: 'Talentia',
    revision: 1,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageSize.width,
              height: pageSize.height,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slugify(fullName)}.docx`;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// Exportación PDF con texto real (ATS / IA friendly)
// ============================================================

export interface TextPDFOptions {
  /** Color de acento para títulos (hex). Por defecto azul corporativo. */
  accentColor?: string;
  /** Idioma del documento: decide los títulos de sección. */
  locale?: Locale;
}

/**
 * Genera un PDF con TEXTO REAL: seleccionable, buscable, copiable y
 * legible por sistemas ATS e IAs de reclutamiento.
 *
 * - Fuente estándar Helvetica (máxima compatibilidad de parseo)
 * - Layout de una columna, sin foto (evita sesgos y problemas de parseo)
 * - Enlaces clicables en email, teléfono, LinkedIn y web
 * - Metadatos del documento (título, autor, palabras clave)
 * - Paginación con pie de página
 */
export async function generateTextPDF(data: CVData, paperSize: PaperSize = 'letter', options: TextPDFOptions = {}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { personalInfo, summary, skills, experience, education, languages, references } = data;

  const isContinuous = paperSize === 'continuous';
  const format = paperSize === 'legal' ? 'legal' : paperSize === 'a4' ? 'a4' : 'letter';

  const accent = hexToRgb(options.accentColor || '#0033A0');
  const bodyColor = { r: 30, g: 41, b: 59 };
  const mutedColor = { r: 100, g: 116, b: 139 };
  const linkColor = { r: 37, g: 99, b: 235 };

  const locale = options.locale || 'es';
  const L = sectionLabels(locale);
  const fullName = personalInfo.fullName?.trim() || defaultName(locale);
  const margin = 48;
  const startY = margin + 10;

  // Superficie de dibujo mínima que usa el cuerpo del documento. La real
  // pinta en el PDF; la de medición solo mide con las mismas métricas de
  // Helvética (no dependen del tamaño de hoja), para dimensionar la hoja
  // única del modo continuo sin blanco sobrante.
  interface TextSurface {
    setFont(style: 'normal' | 'bold' | 'italic'): void;
    setFontSize(size: number): void;
    setTextColor(r: number, g: number, b: number): void;
    setDrawColor(r: number, g: number, b: number): void;
    setLineWidth(w: number): void;
    split(text: string, maxWidth: number): string[];
    width(text: string): number;
    text(t: string, x: number, y: number): void;
    link(t: string, x: number, y: number, url: string): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    addPage(): void;
  }

  type JsPdfInstance = InstanceType<typeof jsPDF>;
  const toSurface = (doc: JsPdfInstance, measuring: boolean): TextSurface => ({
    setFont: (style) => doc.setFont('helvetica', style),
    setFontSize: (size) => doc.setFontSize(size),
    setTextColor: (r, g, b) => doc.setTextColor(r, g, b),
    setDrawColor: (r, g, b) => doc.setDrawColor(r, g, b),
    setLineWidth: (w) => doc.setLineWidth(w),
    split: (text, maxWidth) => doc.splitTextToSize(text, maxWidth) as string[],
    width: (text) => doc.getTextWidth(text),
    text: (t, x, y) => { if (!measuring) doc.text(t, x, y); },
    link: (t, x, y, url) => { if (!measuring) doc.textWithLink(t, x, y, { url }); },
    line: (x1, y1, x2, y2) => { if (!measuring) doc.line(x1, y1, x2, y2); },
    addPage: () => { if (!measuring) doc.addPage(); },
  });

  interface TextCtx {
    s: TextSurface;
    st: { y: number };
    ensureSpace: (needed: number) => void;
    contentWidth: number;
  }

  const writeLine = (ctx: TextCtx, text: string, opts: {
    size?: number;
    style?: 'normal' | 'bold' | 'italic';
    color?: { r: number; g: number; b: number };
    indent?: number;
    lineHeight?: number;
    url?: string;
  } = {}) => {
    const size = opts.size ?? 10;
    const indent = opts.indent ?? 0;
    const x = margin + indent;
    const maxWidth = ctx.contentWidth - indent;
    ctx.s.setFont(opts.style ?? 'normal');
    ctx.s.setFontSize(size);
    const lineColor = opts.color ?? bodyColor;
    ctx.s.setTextColor(lineColor.r, lineColor.g, lineColor.b);
    const lines = ctx.s.split(text, maxWidth);
    const lineHeight = size * (opts.lineHeight ?? 1.35);
    lines.forEach((line, index) => {
      ctx.ensureSpace(lineHeight);
      if (opts.url && index === 0) {
        ctx.s.link(line, x, ctx.st.y, opts.url);
      } else {
        ctx.s.text(line, x, ctx.st.y);
      }
      ctx.st.y += lineHeight;
    });
  };

  const addSectionHeading = (ctx: TextCtx, label: string) => {
    ctx.ensureSpace(40);
    ctx.st.y += 10;
    ctx.s.setFont('bold');
    ctx.s.setFontSize(11);
    ctx.s.setTextColor(accent.r, accent.g, accent.b);
    ctx.s.text(label.toUpperCase(), margin, ctx.st.y);
    ctx.st.y += 5;
    ctx.s.setDrawColor(accent.r, accent.g, accent.b);
    ctx.s.setLineWidth(0.8);
    ctx.s.line(margin, ctx.st.y, margin + ctx.contentWidth, ctx.st.y);
    ctx.st.y += 13;
  };

  const addBullet = (ctx: TextCtx, text: string) => {
    const indent = 14;
    ctx.s.setFont('normal');
    ctx.s.setFontSize(10);
    const lines = ctx.s.split(text, ctx.contentWidth - indent);
    const lineHeight = 10 * 1.35;
    lines.forEach((line, index) => {
      ctx.ensureSpace(lineHeight);
      if (index === 0) {
        ctx.s.text('•', margin + 2, ctx.st.y);
      }
      ctx.s.text(line, margin + indent, ctx.st.y);
      ctx.st.y += lineHeight;
    });
  };

  // Emite encabezado + secciones. Misma secuencia en modo fijo y continuo:
  // en continuo primero se mide (sin pintar) y luego se pinta en la hoja
  // exacta, así el "flujo continuo" es de verdad una sola hoja.
  const contactSegments = buildContactSegments(data);
  const emitBody = (ctx: TextCtx) => {
    // ---- Encabezado ----
    writeLine(ctx, fullName, { size: 22, style: 'bold', color: accent, lineHeight: 1.15 });
    if (personalInfo.title) {
      writeLine(ctx, personalInfo.title, { size: 12, color: mutedColor, lineHeight: 1.25 });
    }

    if (contactSegments.length > 0) {
      ctx.s.setFont('normal');
      ctx.s.setFontSize(9.5);
      let x = margin;
      ctx.st.y += 2;
      contactSegments.forEach((segment, index) => {
        if (index > 0) {
          const separator = '  |  ';
          const separatorWidth = ctx.s.width(separator);
          if (x + separatorWidth > margin + ctx.contentWidth) {
            ctx.ensureSpace(13);
            x = margin;
            ctx.st.y += 13;
          }
          ctx.s.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
          ctx.s.text(separator, x, ctx.st.y);
          x += separatorWidth;
        }
        const textWidth = ctx.s.width(segment.text);
        if (x + textWidth > margin + ctx.contentWidth) {
          ctx.ensureSpace(13);
          x = margin;
          ctx.st.y += 13;
        }
        const color = segment.url ? linkColor : mutedColor;
        ctx.s.setTextColor(color.r, color.g, color.b);
        if (segment.url) {
          ctx.s.link(segment.text, x, ctx.st.y, segment.url);
        } else {
          ctx.s.text(segment.text, x, ctx.st.y);
        }
        x += textWidth;
      });
      ctx.st.y += 8;
    }

    ctx.s.setDrawColor(203, 213, 225);
    ctx.s.setLineWidth(1);
    ctx.s.line(margin, ctx.st.y, margin + ctx.contentWidth, ctx.st.y);
    ctx.st.y += 6;

    // ---- Secciones ----
    if (summary) {
      addSectionHeading(ctx, L.summary);
      writeLine(ctx, summary);
    }

    if (experience.length > 0) {
      addSectionHeading(ctx, L.experienceJobs);
      for (const exp of experience) {
        ctx.ensureSpace(42);
        const head = exp.position + (exp.company ? ` — ${exp.company}` : '');
        writeLine(ctx, head, { size: 10.5, style: 'bold' });
        const dateStr = formatDateRange(exp.startDate, exp.endDate, exp.current, locale);
        if (dateStr) {
          writeLine(ctx, dateStr, { size: 9, style: 'italic', color: mutedColor, lineHeight: 1.25 });
        }
        for (const achievement of exp.achievements) {
          if (achievement) addBullet(ctx, achievement);
        }
        ctx.st.y += 5;
      }
    }

    if (education.length > 0) {
      addSectionHeading(ctx, L.educationShort);
      for (const edu of education) {
        ctx.ensureSpace(30);
        const degree = edu.degree + (edu.field ? `${locale === 'es' ? ' en ' : ' in '}${edu.field}` : '');
        writeLine(ctx, degree, { size: 10.5, style: 'bold' });
        const eduDetails = [
          edu.institution,
          formatDateRange(edu.startDate, edu.endDate, edu.current, locale) || undefined,
        ].filter(Boolean).join('  |  ');
        if (eduDetails) {
          writeLine(ctx, eduDetails, { size: 9.5, color: mutedColor });
        }
        ctx.st.y += 4;
      }
    }

    if (skills.length > 0) {
      addSectionHeading(ctx, L.skills);
      writeLine(ctx, skills.join('  ·  '));
    }

    if (languages.length > 0) {
      addSectionHeading(ctx, L.languages);
      writeLine(ctx, languages.map((lang) => `${lang.name}: ${lang.level}`).join('  ·  '));
    }

    if (references.length > 0) {
      addSectionHeading(ctx, L.references);
      for (const ref of references) {
        ctx.ensureSpace(28);
        const refLine = [ref.name, [ref.position, ref.company].filter(Boolean).join(', ')].filter(Boolean).join(' — ');
        writeLine(ctx, refLine, { size: 10, style: 'bold' });
        const refContact = [ref.phone, ref.email].filter(Boolean).join('  |  ');
        if (refContact) {
          writeLine(ctx, refContact, { size: 9.5, color: mutedColor });
        }
        ctx.st.y += 4;
      }
    }
  };

  let pdf: JsPdfInstance;
  let pageWidth: number;
  let pageHeight: number;

  if (!isContinuous) {
    pdf = new jsPDF({ orientation: 'p', unit: 'pt', format });
    pageWidth = pdf.internal.pageSize.getWidth();
    pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    const bottomLimit = pageHeight - 64;
    const st = { y: startY };
    const ensureSpace = (needed: number) => {
      if (st.y + needed > bottomLimit) {
        pdf.addPage();
        st.y = startY;
      }
    };
    emitBody({ s: toSurface(pdf, false), st, ensureSpace, contentWidth });

    // ---- Pie de página con nombre y numeración ----
    const totalPages = pdf.getNumberOfPages();
    for (let page = 1; page <= totalPages; page += 1) {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`${fullName}  ·  ${page} / ${totalPages}`, pageWidth / 2, pageHeight - 24, { align: 'center' });
    }
  } else {
    const meter = new jsPDF({ orientation: 'p', unit: 'pt', format: 'letter' });
    pageWidth = meter.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    const measureSt = { y: startY };
    emitBody({ s: toSurface(meter, true), st: measureSt, ensureSpace: () => {}, contentWidth });
    // Mismo aire inferior que el límite de hoja fija (64pt).
    const finalH = Math.min(Math.max(Math.ceil(measureSt.y + 64), 400), 14000);
    pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: [pageWidth, finalH] });
    pageHeight = finalH;
    const st = { y: startY };
    const ensureSpace = (needed: number) => {
      // Salvaguarda: con la medición exacta no debería saltar nunca.
      if (st.y + needed > finalH - 64) {
        pdf.addPage();
        st.y = startY;
      }
    };
    emitBody({ s: toSurface(pdf, false), st, ensureSpace, contentWidth });

    // ---- Pie simple sin numeración (una sola hoja) ----
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(fullName, pageWidth / 2, pageHeight - 24, { align: 'center' });
  }

  // ---- Metadatos: ayudan a indexadores e IAs a entender el documento ----
  pdf.setProperties({
    title: `${fullName}${personalInfo.title ? ` — ${personalInfo.title}` : ''}`,
    subject: `Hoja de vida · actualizada ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    author: fullName,
    keywords: skills.slice(0, 25).join(', '),
    creator: 'Talentia — HDV Gratis',
  });

  pdf.save(`${slugify(fullName)}.pdf`);
}

// ============================================================
// Exportación PDF moderna: diseño vectorial + texto real
// ============================================================

export interface StyledPDFOptions {
  /** Color de acento para la barra lateral y títulos (hex). */
  accentColor?: string;
  /** Etiqueta de rol/plantilla (p. ej. "Atención al Cliente"). Se muestra
      como chip bajo el cargo para dar identidad al perfil. */
  roleLabel?: string;
  /** Idioma del documento: decide los títulos de sección. */
  locale?: Locale;
}

/** Geometría de la columna donde se dibuja un bloque. */
interface ColumnCtx {
  /** Distancia al borde izquierdo de la columna. */
  x: number;
  /** Ancho útil de la columna. */
  w: number;
  /** Centro horizontal de la columna. */
  center: number;
  /** true si la columna se apoya en el fondo oscuro de la barra lateral. */
  onDark: boolean;
}

interface PdfBlock {
  /** Alto total del bloque en puntos. */
  h: number;
  /** Alto mínimo del bloque siguiente que debe quedar en la misma página. */
  keepWithNext?: number;
  render: (ctx: ColumnCtx, y: number) => void;
}

/**
 * Un bloque se construye justo antes de dibujarse porque su alto depende del
 * ancho de la columna destino: eso es lo que permite reubicar una sección y
 * recalcular cómo parte el texto. Las fábricas que no aplican a la columna
 * actual devuelven `h: 0` y el motor de flujo las descarta.
 */
type BlockFactory = (ctx: ColumnCtx) => PdfBlock;

/**
 * Unidad de contenido que el balanceo puede mover de una columna a otra.
 * Se trasladan secciones enteras, nunca trozos sueltos, para no romper el
 * orden de lectura ni dejar títulos de sección huérfanos.
 */
interface Section {
  id: string;
  blocks: BlockFactory[];
  /** Columnas donde la sección se lee bien sin quedar ilegible. */
  columns: Array<'side' | 'main'>;
  /** Columna natural; el balanceo solo se aparta de ella si compensa. */
  prefer: 'side' | 'main';
}

/** Paleta de una columna: los bloques se pintan con los colores del fondo
 *  sobre el que caen, así la misma sección sirve en ambos lados. */
interface ColumnPalette {
  heading: Rgb;
  rule: Rgb;
  body: Rgb;
  muted: Rgb;
  strong: Rgb;
  chipFill: Rgb;
  chipText: Rgb;
}

/**
 * Genera un PDF moderno de dos columnas: barra lateral de color (contacto,
 * habilidades como chips, idiomas, foto o iniciales) y columna principal con
 * la experiencia. Todo el contenido es TEXTO REAL seleccionable, así que el
 * diseño llamativo no sacrifica la legibilidad por ATS e IAs.
 *
 * Las columnas se equilibran automáticamente: antes de dibujar se miden todas
 * las secciones en cada ancho posible y se reparten buscando el mínimo número
 * de páginas con las dos columnas lo más parecidas. Sin ese reparto fijo, la
 * barra lateral se quedaba a media hoja mientras la columna principal se
 * desbordaba a la página 2.
 */
export async function generateStyledPDF(data: CVData, paperSize: PaperSize = 'letter', options: StyledPDFOptions = {}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { personalInfo, summary, skills, experience, education, languages, references } = data;
  const locale = options.locale || 'es';
  const L = sectionLabels(locale);
  const C = CONTACT_LABELS[locale];

  // "Continuo" = una sola hoja de alto exacto. Se mide primero con una
  // instancia temporal (las métricas de Helvética no dependen del tamaño de
  // hoja) y luego se crea la hoja real a medida, sin blanco sobrante.
  const isContinuous = paperSize === 'continuous';
  const format = paperSize === 'legal' ? 'legal' : paperSize === 'a4' ? 'a4' : 'letter';
  let pdf = new jsPDF({ orientation: 'p', unit: 'pt', format });
  const pageW = pdf.internal.pageSize.getWidth();
  let pageH = pdf.internal.pageSize.getHeight();

  // ---- Paleta derivada del color de acento ----
  const accentRaw = hexToRgb(options.accentColor || '#0033A0');
  const sideBg = luminance(accentRaw) > 0.55 ? mixColor(accentRaw, INK, 0.45) : mixColor(accentRaw, INK, 0.1);
  const sideText: Rgb = luminance(sideBg) > 0.55 ? INK : WHITE;
  // En fondo blanco los títulos necesitan contraste: oscurecer acentos claros
  const headingColor = luminance(accentRaw) > 0.6 ? mixColor(accentRaw, INK, 0.45) : accentRaw;

  // Cada columna lleva su propia paleta: una sección que se mueve al otro
  // lado se repinta sola con el contraste correcto.
  const sidePalette: ColumnPalette = {
    heading: sideText,
    rule: mixColor(sideText, sideBg, 0.6),
    body: sideText,
    muted: mixColor(sideText, sideBg, 0.42),
    strong: sideText,
    chipFill: mixColor(sideText, sideBg, 0.86),
    chipText: sideText,
  };
  const mainPalette: ColumnPalette = {
    heading: headingColor,
    rule: mixColor(headingColor, WHITE, 0.65),
    body: SLATE,
    muted: MUTED,
    strong: INK,
    chipFill: mixColor(headingColor, WHITE, 0.9),
    chipText: mixColor(headingColor, INK, 0.3),
  };

  const setFill = (c: Rgb) => pdf.setFillColor(c.r, c.g, c.b);
  const setDraw = (c: Rgb) => pdf.setDrawColor(c.r, c.g, c.b);
  const setText = (c: Rgb) => pdf.setTextColor(c.r, c.g, c.b);

  // ---- Geometría ----
  const sidebarW = Math.min(200, Math.round(pageW * 0.32));
  const sideX = 26;
  const sideW = sidebarW - sideX * 2;
  const sideTop = 46;
  let sideBottom = pageH - 30;
  const mainX = sidebarW + 34;
  const mainW = pageW - mainX - 44;
  const mainTop = 64;
  let mainBottom = pageH - 48;
  // Las páginas de continuación no repiten la barra lateral: si la principal
  // se desborda, sigue a lo ancho completo en vez de dejar un bloque oscuro
  // vacío al lado de cuatro líneas de texto.
  const contX = 44;
  const contW = pageW - contX * 2;
  const contTop = 46;
  let contBottom = pageH - 48;

  const sideCtx: ColumnCtx = { x: sideX, w: sideW, center: sidebarW / 2, onDark: true };
  const mainCtx: ColumnCtx = { x: mainX, w: mainW, center: mainX + mainW / 2, onDark: false };
  const contCtx: ColumnCtx = { x: contX, w: contW, center: contX + contW / 2, onDark: false };

  const fullName = personalInfo.fullName?.trim() || defaultName(locale);
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'CV';
  const contactSegments = buildContactSegments(data);

  // ---- Preparación de la foto (con fallback a iniciales) ----
  const photo = personalInfo.photoUrl ? await loadImageAsDataURL(personalInfo.photoUrl) : null;

  const wrap = (font: 'normal' | 'bold' | 'italic', size: number, text: string, width: number): string[] => {
    pdf.setFont('helvetica', font);
    pdf.setFontSize(size);
    return pdf.splitTextToSize(text, width) as string[];
  };

  const paletteOf = (ctx: ColumnCtx): ColumnPalette => (ctx.onDark ? sidePalette : mainPalette);

  /**
   * Título de sección con regla inferior. Mantiene la jerarquía de cada
   * columna: en la principal manda más tamaño que en la barra lateral.
   */
  const headingBlock = (label: string): BlockFactory => (ctx) => ({
    h: ctx.onDark ? 34 : 32,
    keepWithNext: ctx.onDark ? 26 : 30,
    render: (c, y) => {
      const p = paletteOf(c);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(c.onDark ? 9.5 : 10.5);
      setText(p.heading);
      pdf.text(label.toUpperCase(), c.x, y + 8, { charSpace: c.onDark ? 0.5 : 0.6 });
      setDraw(p.rule);
      pdf.setLineWidth(c.onDark ? 0.7 : 1);
      pdf.line(c.x, y + 14, c.x + c.w, y + 14);
    },
  });

  // ---- Secciones: el balanceo decide en cuál columna vive cada una ----
  // El orden del array es el orden de lectura canónico. Al repartirlas se
  // respeta: dentro de cada columna las secciones nunca se desordenan.
  const sections: Section[] = [];

  // Foto o iniciales. Ancla el bloque de color, así que no se mueve.
  sections.push({
    id: 'avatar',
    columns: ['side'],
    prefer: 'side',
    blocks: [() => ({
      h: 94,
      render: (ctx, y) => {
        const p = paletteOf(ctx);
        const cy = y + 34;
        if (photo) {
          const scale = Math.min(68 / photo.width, 68 / photo.height);
          const w = photo.width * scale;
          const h = photo.height * scale;
          setDraw(p.rule);
          pdf.setLineWidth(2);
          pdf.circle(ctx.center, cy, 35, 'S');
          try {
            pdf.addImage(photo.dataUrl, photo.format, ctx.center - w / 2, cy - h / 2, w, h);
          } catch {
            // imagen corrupta: dejamos solo el aro
          }
        } else {
          setFill(p.chipFill);
          pdf.circle(ctx.center, cy, 34, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(20);
          setText(p.chipText);
          pdf.text(initials, ctx.center, cy + 7, { align: 'center' });
        }
      },
    })],
  });

  /** Dato de contacto con su etiqueta; se ve igual en ambas columnas. */
  const contactField = (label: string, value: string, url?: string): BlockFactory => (ctx) => {
    const lines = wrap('normal', 9, value, ctx.w);
    return {
      h: 11 + lines.length * 11.5 + 9,
      render: (c, y) => {
        const p = paletteOf(c);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        setText(p.muted);
        pdf.text(label.toUpperCase(), c.x, y + 7, { charSpace: 0.4 });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        setText(p.body);
        lines.forEach((line, index) => {
          const ly = y + 18 + index * 11.5;
          if (url && index === 0) {
            pdf.textWithLink(line, c.x, ly, { url });
          } else {
            pdf.text(line, c.x, ly);
          }
        });
      },
    };
  };

  /**
   * Parte un párrafo en trozos de un alto máximo. No es paginación (eso la
   * hace el flujo), solo impide que un bloque supere el alto de la hoja.
   */
  const chunkedParagraph = (text: string, maxLines = 20): BlockFactory[] => {
    // La columna más estrecha entra ~12 caracteres por línea: ese es el peor
    // caso, así que la cantidad de trozos es una cota segura.
    const count = Math.max(1, Math.ceil(Math.ceil(text.length / 12) / maxLines));
    return Array.from({ length: count }, (_, chunkIndex) => (ctx: ColumnCtx): PdfBlock => {
      const lines = wrap('normal', 9.5, text, ctx.w);
      const slice = lines.slice(chunkIndex * maxLines, (chunkIndex + 1) * maxLines);
      if (slice.length === 0) return { h: 0, render: () => {} };
      const lh = 13.5;
      return {
        h: slice.length * lh + 4,
        render: (c, y) => {
          const p = paletteOf(c);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9.5);
          setText(p.body);
          slice.forEach((line, index) => pdf.text(line, c.x, y + 10 + index * lh));
        },
      };
    });
  };

  // Nombre y cargo. Fija a la columna principal: es lo primero que se lee.
  // Si hay etiqueta de rol (nombre de la plantilla de rol), se muestra como
  // chip bajo el cargo: identificador visual del perfil.
  const roleLabel = options.roleLabel?.trim();
  sections.push({
    id: 'name',
    columns: ['main'],
    prefer: 'main',
    blocks: [(ctx) => {
      const nameLines = wrap('bold', 25, fullName, ctx.w);
      const titleLines = personalInfo.title ? wrap('normal', 12, personalInfo.title, ctx.w) : [];
      return {
        h: nameLines.length * 27 + (titleLines.length ? titleLines.length * 15 + 6 : 0) + (roleLabel ? 20 : 0) + 14,
        render: (c, y) => {
          let cy = y;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(25);
          setText(mainPalette.strong);
          nameLines.forEach((line) => {
            cy += 22;
            pdf.text(line, c.x, cy);
            cy += 5;
          });
          if (titleLines.length) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
            setText(mainPalette.heading);
            titleLines.forEach((line) => {
              cy += 13;
              pdf.text(line, c.x, cy);
            });
          }
          if (roleLabel) {
            const chipLabel = roleLabel.toUpperCase();
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7.5);
            const chipW = Math.min(pdf.getTextWidth(chipLabel) + 16, c.w);
            setFill(mainPalette.chipFill);
            pdf.roundedRect(c.x, cy + 4, chipW, 13, 6.5, 6.5, 'F');
            setText(mainPalette.chipText);
            pdf.text(chipLabel, c.x + 8, cy + 12.5);
            cy += 17;
          }
          setFill(mainPalette.heading);
          pdf.roundedRect(c.x, cy + 8, 44, 3, 1.5, 1.5, 'F');
        },
      };
    }],
  });

  if (summary) {
    // El resumen vive siempre en la columna principal: es lo primero que lee
    // un reclutador (humano o IA) y minimizado en la barra lateral pierde
    // jerarquía. Por eso no participa del balanceo.
    sections.push({
      id: 'summary',
      columns: ['main'],
      prefer: 'main',
      blocks: [headingBlock(L.summary), ...chunkedParagraph(summary)],
    });
  }

  // Experiencia: es la sección más larga, por eso queda anclada a la columna
  // principal. En la barra lateral las viñetas quedarían ilegibles.
  if (experience.length > 0) {
    const expBlocks: BlockFactory[] = [headingBlock(L.experienceJobs)];
    for (const exp of experience) {
      const head = exp.position + (exp.company ? ` — ${exp.company}` : '');
      const dateStr = formatDateRange(exp.startDate, exp.endDate, exp.current, locale);
      const bullets = exp.achievements.filter(Boolean);
      // Se trocea por viñetas y no por líneas: el corte queda estable sin
      // importar el ancho de la columna donde termine cada trozo.
      const CHUNK = 4;
      const totalChunks = Math.max(1, Math.ceil(bullets.length / CHUNK));
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
        const isFirst = chunkIndex === 0;
        const slice = bullets.slice(chunkIndex * CHUNK, (chunkIndex + 1) * CHUNK);
        expBlocks.push((ctx) => {
          const headLines = wrap('bold', 10.5, head, ctx.w);
          const lh = 13;
          const bulletLines = slice.map((bullet) => wrap('normal', 9.5, bullet, ctx.w - 14));
          const totalLines = bulletLines.reduce((sum, lines) => sum + lines.length, 0);
          return {
            h: headLines.length * 14 + (isFirst && dateStr ? 12 : 0) + totalLines * lh + 18,
            keepWithNext: isFirst ? 26 : undefined,
            render: (c, y) => {
              const p = paletteOf(c);
              let cy = y;
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(10.5);
              setText(p.strong);
              headLines.forEach((line) => {
                cy += 12;
                pdf.text(line, c.x, cy);
              });
              if (isFirst && dateStr) {
                pdf.setFont('helvetica', 'italic');
                pdf.setFontSize(8.5);
                setText(p.muted);
                pdf.text(dateStr, c.x + c.w, cy + 11, { align: 'right' });
                cy += 11;
              }
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(9.5);
              for (const lines of bulletLines) {
                setText(p.heading);
                pdf.text('•', c.x + 2, cy + 11);
                setText(p.body);
                lines.forEach((line, index) => {
                  pdf.text(line, c.x + 14, cy + 11 + index * lh);
                });
                cy += lines.length * lh;
              }
            },
          };
        });
      }
    }
    sections.push({ id: 'experience', columns: ['main'], prefer: 'main', blocks: expBlocks });
  }

  if (education.length > 0) {
    const eduBlocks: BlockFactory[] = [headingBlock(L.educationShort)];
    for (const edu of education) {
      const degree = edu.degree + (edu.field ? `${locale === 'es' ? ' en ' : ' in '}${edu.field}` : '');
      const details = [edu.institution, formatDateRange(edu.startDate, edu.endDate, edu.current, locale) || undefined]
        .filter(Boolean)
        .join('  |  ');
      eduBlocks.push((ctx) => {
        const degreeLines = wrap('bold', 10.5, degree, ctx.w);
        return {
          h: degreeLines.length * 14 + (details ? 12 : 0) + 12,
          render: (c, y) => {
            const p = paletteOf(c);
            let cy = y;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10.5);
            setText(p.strong);
            degreeLines.forEach((line) => {
              cy += 12;
              pdf.text(line, c.x, cy);
            });
            if (details) {
              cy += 11;
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(9);
              setText(p.muted);
              pdf.text(details, c.x, cy);
            }
          },
        };
      });
    }
    sections.push({ id: 'education', columns: ['side', 'main'], prefer: 'main', blocks: eduBlocks });
  }

  if (contactSegments.length > 0) {
    const contactBlocks: BlockFactory[] = [headingBlock(L.contact)];
    const labelFor = (segment: ContactSegment, index: number): string => {
      if (segment.url?.startsWith('mailto:')) return C.email;
      if (segment.url?.startsWith('tel:')) return C.phone;
      if (index === 0) return L.contact;
      return segment.url ? C.link : C.location;
    };
    contactSegments.forEach((segment, index) => {
      contactBlocks.push(contactField(labelFor(segment, index), segment.text, segment.url));
    });
    sections.push({ id: 'contact', columns: ['side', 'main'], prefer: 'side', blocks: contactBlocks });
  }

  if (skills.length > 0) {
    /** Agrupa las habilidades en filas de chips que caben en el ancho dado. */
    const chipRows = (width: number): string[][] => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      const rows: string[][] = [[]];
      let rowWidth = 0;
      for (const skill of skills) {
        const chipW = Math.min(pdf.getTextWidth(skill) + 12, width);
        if (rowWidth + chipW > width && rows[rows.length - 1].length > 0) {
          rows.push([]);
          rowWidth = 0;
        }
        rows[rows.length - 1].push(skill);
        rowWidth += chipW + 5;
      }
      return rows.filter((row) => row.length > 0);
    };
    const skillBlocks: BlockFactory[] = [headingBlock(L.skills)];
    // Una fábrica por fila como cota superior: las que no apliquen al ancho
    // actual devuelven altura 0 y el flujo las omite.
    skills.forEach((_skill, index) => {
      skillBlocks.push((ctx) => {
        const row = chipRows(ctx.w)[index];
        if (!row) return { h: 0, render: () => {} };
        return {
          h: 19,
          render: (c, y) => {
            const p = paletteOf(c);
            let cx = c.x;
            pdf.setFontSize(8.5);
            for (const skill of row) {
              pdf.setFont('helvetica', 'normal');
              const chipW = Math.min(pdf.getTextWidth(skill) + 12, c.w);
              setFill(p.chipFill);
              pdf.roundedRect(cx, y, chipW, 14, 7, 7, 'F');
              setText(p.chipText);
              pdf.text(skill, cx + chipW / 2, y + 9.6, { align: 'center' });
              cx += chipW + 5;
            }
          },
        };
      });
    });
    sections.push({ id: 'skills', columns: ['side', 'main'], prefer: 'side', blocks: skillBlocks });
  }

  if (languages.length > 0) {
    const langBlocks: BlockFactory[] = [headingBlock(L.languages)];
    for (const lang of languages) {
      const line = `${lang.name} — ${lang.level}`;
      langBlocks.push((ctx) => {
        const lines = wrap('normal', 9, line, ctx.w);
        return {
          h: lines.length * 11.5 + 3.5,
          render: (c, y) => {
            const p = paletteOf(c);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            setText(p.body);
            lines.forEach((text, index) => pdf.text(text, c.x, y + 8 + index * 11.5));
          },
        };
      });
    }
    sections.push({ id: 'languages', columns: ['side', 'main'], prefer: 'side', blocks: langBlocks });
  }

  if (references.length > 0) {
    const refBlocks: BlockFactory[] = [headingBlock(L.references)];
    for (const ref of references) {
      const refLine = [ref.name, [ref.position, ref.company].filter(Boolean).join(', ')].filter(Boolean).join(' — ');
      const refContact = [ref.phone, ref.email].filter(Boolean).join('  |  ');
      refBlocks.push((ctx) => {
        const refLines = wrap('bold', 10, refLine, ctx.w);
        return {
          h: refLines.length * 13 + (refContact ? 11 : 0) + 10,
          render: (c, y) => {
            const p = paletteOf(c);
            let cy = y;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            setText(p.strong);
            refLines.forEach((line) => {
              cy += 11;
              pdf.text(line, c.x, cy);
            });
            if (refContact) {
              cy += 10;
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(9);
              setText(p.muted);
              pdf.text(refContact, c.x, cy);
            }
          },
        };
      });
    }
    sections.push({ id: 'references', columns: ['side', 'main'], prefer: 'main', blocks: refBlocks });
  }

  // ---- Balanceo de columnas ----
  // Se prueban todos los repartos posibles de las secciones flexibles y gana el
  // que usa menos páginas; a igualdad de páginas, el que deja las dos columnas
  // más parejas. El orden de lectura nunca se rompe: las secciones siempre se
  // recorren en orden canónico, solo cambia en qué columna cae cada una.

  /**
   * Simula el llenado de una columna sin dibujar y devuelve cuánto ocupa en
   * cada hoja. replica exactamente lo que hará `flowColumn`, así que el
   * balanceo decide con los mismos números que verá el lector.
   */
  const simulateFills = (
    factories: BlockFactory[],
    ctxFor: (page: number) => ColumnCtx,
    topFor: (page: number) => number,
    bottomFor: (page: number) => number,
  ): number[] => {
    const fills: number[] = [];
    let page = 1;
    let ctx = ctxFor(page);
    let y = topFor(page);
    let index = 0;
    while (index < factories.length) {
      const block = factories[index](ctx);
      if (block.h > 0) {
        const next = index + 1 < factories.length ? factories[index + 1](ctx) : undefined;
        const reserve = block.keepWithNext && next ? Math.min(block.keepWithNext, next.h) : 0;
        if (y > topFor(page) && y + block.h + reserve > bottomFor(page)) {
          fills[page - 1] = y - topFor(page);
          page += 1;
          ctx = ctxFor(page);
          y = topFor(page);
          continue;
        }
        y += block.h;
      }
      index += 1;
    }
    fills[page - 1] = y - topFor(page);
    return fills;
  };

  // En continuo no hay saltos de página: los límites son infinitos y todo lo
  // que no sea la primera hoja usa la misma geometría (mismo diseño siempre).
  const sideCtxFor = () => sideCtx;
  const sideTopFor = () => sideTop;
  const sideBottomFor = () => (isContinuous ? Infinity : sideBottom);
  const mainCtxFor = (page: number) => (isContinuous || page === 1 ? mainCtx : contCtx);
  const mainTopFor = (page: number) => (isContinuous || page === 1 ? mainTop : contTop);
  const mainBottomFor = (page: number) => (isContinuous || page === 1 ? mainBottom : contBottom);

  const flexible = sections.filter((section) => section.columns.length > 1);
  let best: { side: Section[]; main: Section[]; score: number } | null = null;
  for (let mask = 0; mask < 1 << flexible.length; mask += 1) {
    const side: Section[] = [];
    const main: Section[] = [];
    for (const section of sections) {
      const slot = flexible.indexOf(section);
      const column = slot === -1
        ? section.prefer
        : (mask >> slot) & 1 ? 'side' : 'main';
      (column === 'side' ? side : main).push(section);
    }
    const sideFills = simulateFills(side.flatMap((s) => s.blocks), sideCtxFor, sideTopFor, sideBottomFor);
    const mainFills = simulateFills(main.flatMap((s) => s.blocks), mainCtxFor, mainTopFor, mainBottomFor);
    // El desequilibrio se mide en las hojas donde conviven las dos columnas.
    let imbalance = 0;
    for (let i = 0; i < Math.min(sideFills.length, mainFills.length); i += 1) {
      imbalance = Math.max(imbalance, Math.abs(sideFills[i] - mainFills[i]));
    }
    // Penalización suave por apartarse de la columna natural: desempata a
    // favor del diseño de siempre cuando el balanceo no aporta mejora real.
    const stray = sections.filter((section) => (side.includes(section) ? 'side' : 'main') !== section.prefer).length;
    // Orden de criterios: menos páginas, luego barra lateral de una sola hoja,
    // luego columnas parejas, luego el diseño natural.
    const score =
      Math.max(sideFills.length, mainFills.length) * 1e9 +
      Math.max(0, sideFills.length - 1) * 5e7 +
      imbalance +
      stray * 24;
    if (!best || score < best.score) best = { side, main, score };
  }
  const plan = best ?? { side: [], main: sections, score: 0 };
  const sideBlocks = plan.side.flatMap((section) => section.blocks);
  const mainBlocks = plan.main.flatMap((section) => section.blocks);

  if (isContinuous) {
    // Altura exacta de la hoja única: los altos de bloque solo dependen del
    // ancho de columna, así que la medición con la instancia temporal es
    // exacta y no queda blanco sobrante al final.
    const sideNeed = simulateFills(sideBlocks, sideCtxFor, sideTopFor, () => Infinity);
    const mainNeed = simulateFills(mainBlocks, mainCtxFor, mainTopFor, () => Infinity);
    const needH = Math.ceil(Math.max(
      sideTop + (sideNeed[0] ?? 0) + 30,
      mainTop + (mainNeed[0] ?? 0) + 48,
    ));
    // Tope de seguridad del formato PDF (200 pulgadas); si se supera, el
    // flujo sigue a más hojas con el mismo diseño.
    const finalH = Math.min(Math.max(needH, 400), 14000);
    pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: [pageW, finalH] });
    pageH = finalH;
    sideBottom = pageH - 30;
    mainBottom = pageH - 48;
    contBottom = pageH - 48;
  }

  // ---- Flujo de bloques entre páginas ----
  const paintedSidebar = new Set<number>();
  const ensurePage = (page: number) => {
    while (pdf.getNumberOfPages() < page) pdf.addPage();
  };

  /**
   * Vuelca las fábricas de una columna página a página y devuelve cuánto
   * ocupa en cada hoja. Al cambiar de página reconstruye el bloque con la
   * geometría nueva, porque su alto depende del ancho y las páginas de
   * continuación son más anchas que la primera.
   */
  const flowColumn = (
    factories: BlockFactory[],
    ctxFor: (page: number) => ColumnCtx,
    topFor: (page: number) => number,
    bottomFor: (page: number) => number,
    onPage: (page: number, ctx: ColumnCtx) => void,
  ): Map<number, number> => {
    const usedByPage = new Map<number, number>();
    let page = 1;
    let ctx = ctxFor(page);
    onPage(page, ctx);
    let y = topFor(page);
    let index = 0;
    while (index < factories.length) {
      const block = factories[index](ctx);
      // Las fábricas que no aplican al ancho actual se descartan.
      if (block.h > 0) {
        const next = index + 1 < factories.length ? factories[index + 1](ctx) : undefined;
        const reserve = block.keepWithNext && next ? Math.min(block.keepWithNext, next.h) : 0;
        // Reservar `keepWithNext` evita que un título de sección quede solo al
        // pie de la página. `y > top` evita el bucle infinito: arriba de una
        // página limpia el bloque se dibuja aunque sobrepase el margen.
        if (y > topFor(page) && y + block.h + reserve > bottomFor(page)) {
          usedByPage.set(page, y - topFor(page));
          page += 1;
          ctx = ctxFor(page);
          onPage(page, ctx);
          y = topFor(page);
          continue;
        }
        pdf.setPage(page);
        block.render(ctx, y);
        y += block.h;
      }
      index += 1;
    }
    usedByPage.set(page, y - topFor(page));
    return usedByPage;
  };

  // Cuántas hojas espera ocupar la barra lateral según la simulación.
  const sidePagesExpected = simulateFills(sideBlocks, sideCtxFor, sideTopFor, sideBottomFor).length;

  // La barra lateral se vuelca primero. Si no le cabe en una hoja, lo que
  // sobra se dibuja a ancho completo en la siguiente en vez de alargar una
  // franja de color que quedaría casi vacía.
  const sideUsed = flowColumn(
    sideBlocks,
    (page) => (page <= sidePagesExpected ? sideCtx : contCtx),
    (page) => (page === 1 ? sideTop : contTop),
    (page) => (page === 1 ? sideBottom : contBottom),
    (page, ctx) => {
      ensurePage(page);
      if (!ctx.onDark || paintedSidebar.has(page)) return;
      pdf.setPage(page);
      setFill(sideBg);
      pdf.rect(0, 0, sidebarW, pageH, 'F');
      paintedSidebar.add(page);
    },
  );

  // La principal arranca en la primera hoja; si la barra lateral ocupó
  // espacio arriba, la columna sigue por debajo para no superponerse.
  flowColumn(
    mainBlocks,
    (page) => (page === 1 ? mainCtx : contCtx),
    (page) => (page === 1 ? mainTop : contTop + (sideUsed.get(page) ?? 0)),
    (page) => (page === 1 ? mainBottom : contBottom),
    (page) => ensurePage(page),
  );

  // ---- Pie de página ----
  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    if (!isContinuous && page > 1) {
      // Banda de continuidad: las páginas siguientes se leen como parte del
      // mismo documento en vez de parecer otra hoja en blanco.
      setFill(sideBg);
      pdf.rect(0, 0, pageW, 30, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      setText(WHITE);
      pdf.text(fullName, 44, 19);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      setText(mixColor(WHITE, sideBg, 0.4));
      pdf.text('Hoja de vida', pageW - 44, 19, { align: 'right' });
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    setText(MUTED);
    // Centrado en el área de contenido real: con barra lateral o a ancho completo.
    const center = paintedSidebar.has(page) ? sidebarW + (pageW - sidebarW) / 2 : pageW / 2;
    // En continuo hay una sola hoja: el nombre basta, sin "1 / 1".
    const footerLabel = isContinuous ? fullName : `${fullName}  ·  ${page} / ${totalPages}`;
    pdf.text(footerLabel, center, pageH - 20, { align: 'center' });
  }

  pdf.setProperties({
    title: `${fullName}${personalInfo.title ? ` — ${personalInfo.title}` : ''}`,
    subject: `Hoja de vida · actualizada ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    author: fullName,
    keywords: skills.slice(0, 25).join(', '),
    creator: 'Talentia — HDV Gratis',
  });

  pdf.save(`${slugify(fullName)}.pdf`);
}

// ============================================================
// Exportación PDF con diseño original (captura de imagen)
// ============================================================

/**
 * Genera un PDF a partir del diseño visual de la plantilla (captura la
 * vista previa como imagen). El texto NO es seleccionable: usar solo
 * cuando se necesita conservar el diseño exacto.
 */
export async function generateDesignPDF(data: CVData, paperSize: PaperSize = 'letter'): Promise<void> {
  const element = document.getElementById('cv-preview');

  if (!element) {
    throw new Error('No hay contenido para exportar. Por favor, completa algunos datos en tu hoja de vida primero.');
  }

  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  // Pequeña espera para asegurar que el renderizado se asiente
  await new Promise(r => setTimeout(r, 250));

  // Configuración equilibrada: buena calidad, peso razonable
  const scale = 2;
  const jpegQuality = 0.80;

  const canvas = await html2canvas(element, {
    scale: scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#f3f4f6',
    onclone: (clonedDoc) => {
      const clonedElement = clonedDoc.getElementById('cv-preview');
      if (clonedElement) {
        clonedElement.style.display = 'block';
        clonedElement.style.visibility = 'visible';
        clonedElement.style.height = 'auto';
        clonedElement.style.margin = '0';
        clonedElement.style.padding = '0';
        // Preserve the background color
        clonedElement.style.backgroundColor = '#f3f4f6';
      }
    }
  });

  if (!canvas || canvas.width < 10 || canvas.height < 10) {
    throw new Error('La captura del diseño falló. Intenta de nuevo.');
  }

  // Mapeo de tamaños en puntos (pt)
  const sizes: Record<string, [number, number]> = {
    letter: [612, 792],
    legal: [612, 1008],
    a4: [595, 842],
  };

  const isContinuous = paperSize === 'continuous';
  const [pdfWidth, pdfHeight] = isContinuous
    ? [612, (canvas.height * 612) / canvas.width] // Altura dinámica
    : (sizes[paperSize] || sizes.letter);

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  // Si es continuo, creamos un PDF de una sola página con la altura total
  const pdf = new jsPDF('p', 'pt', isContinuous ? [pdfWidth, pdfHeight] : paperSize);

  if (isContinuous) {
    const imgData = canvas.toDataURL('image/jpeg', jpegQuality);
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    let heightLeft = imgHeight;
    let position = 0;
    const imgData = canvas.toDataURL('image/jpeg', jpegQuality);

    // Primera página
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Páginas adicionales
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, Math.round(position), imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
  }

  const fullName = data.personalInfo.fullName?.trim() || 'Mi-Hoja-de-Vida';
  pdf.setProperties({
    title: `${fullName}${data.personalInfo.title ? ` — ${data.personalInfo.title}` : ''}`,
    subject: `Hoja de vida · actualizada ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    author: fullName,
    creator: 'Talentia — HDV Gratis',
  });
  pdf.save(`${slugify(fullName)}.pdf`);
}
