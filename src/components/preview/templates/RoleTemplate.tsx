'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { CustomTemplateProps, formatDateRange, getLanguageLevelWidth, rhythm, stripUrlProtocol } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import {
  Icon as LucideIcon,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Briefcase,
  GraduationCap,
  Globe,
} from 'lucide-react';
import { sectionLabels } from '@/lib/sectionLabels';

export interface RoleStyle {
  accent: string;
  accentDark: string;
  accentLight: string;
  baseBackground?: string;
  fontFamily?: string;
}

export interface RoleTemplateProps extends CustomTemplateProps {
  roleName: string;
  tagline: string;
  style: RoleStyle;
  icon: typeof LucideIcon;
  showWatermark?: boolean;
}

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, value));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 3 && cleaned.length !== 6) return null;
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const num = Number.parseInt(full, 16);
  if (Number.isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function adjustHex(hex: string, amount: number): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = clampChannel(rgb.r + amount);
  const g = clampChannel(rgb.g + amount);
  const b = clampChannel(rgb.b + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function withAlpha(hex: string, alpha: number): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function RoleTemplateLayout({
  locale,
  cv,
  style,
  icon: RoleIcon,
  roleName,
  tagline,
  showPhoto = true,
  accentColor,
  fontFamily,
  showWatermark = false,
  density = 'normal',
}: RoleTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, experience, education, skills, languages, references } = cv;
  const resolvedAccent = accentColor ?? style.accent;
  const resolvedAccentDark = accentColor ? adjustHex(accentColor, -40) ?? style.accentDark : style.accentDark;
  const resolvedAccentLight = accentColor ? withAlpha(accentColor, 0.12) ?? style.accentLight : style.accentLight;
  const palette = {
    border: resolvedAccent,
    accent: resolvedAccent,
    accentDark: resolvedAccentDark,
    accentLight: resolvedAccentLight,
  };

  // Densidad: compacta aprieta el contenido para que quepa en menos páginas;
  // amplia lo respira. Aplica a la vez a secciones y listas.
  const r = rhythm(density);

  const contactItems = [
    personalInfo.email && { label: personalInfo.email, Icon: Mail },
    personalInfo.phone && { label: personalInfo.phone, Icon: Phone },
    personalInfo.location && { label: personalInfo.location, Icon: MapPin },
    personalInfo.linkedin && { label: stripUrlProtocol(personalInfo.linkedin), Icon: Linkedin },
    personalInfo.website && { label: stripUrlProtocol(personalInfo.website), Icon: Globe },
  ].filter(Boolean) as { label: string; Icon: typeof LucideIcon }[];

  const rootRef = useRef<HTMLDivElement>(null);

  const summaryBlock = summary ? (
    <section className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${r.cardPad}`}>
      <div className={`flex items-center gap-2 ${r.heading}`}>
        <Briefcase className="w-4 h-4 shrink-0" style={{ color: palette.accent }} />
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">{L.summaryShort}</h2>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
    </section>
  ) : null;

  const experienceBlock = experience.length > 0 ? (
    <section className={r.item}>
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 shrink-0" style={{ color: palette.accent }} />
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {L.experience}
        </h2>
      </div>
      <div className={r.item}>
        {experience.map((exp) => {
          const expDateText = formatDateRange(exp.startDate, exp.endDate, exp.current, locale);
          return (
            <article
              key={exp.id}
              className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${r.cardPad}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{exp.position}</h3>
                  <p className="text-xs font-medium text-slate-500">{exp.company}</p>
                </div>
                {expDateText && (
                  <span
                    className="text-[10px] font-semibold tracking-wide uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-500 shrink-0"
                    style={{ borderColor: palette.accent }}
                  >
                    {expDateText}
                  </span>
                )}
              </div>
              {exp.achievements.length > 0 && (
                <ul className={`text-sm text-slate-600 ${r.tight}`}>
                  {exp.achievements.filter(Boolean).map((achievement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 mt-1 rounded-full shrink-0" style={{ backgroundColor: palette.accent }} />
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  ) : null;

  const educationBlock = education.length > 0 ? (
    <section className={r.item}>
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 shrink-0" style={{ color: palette.accent }} />
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {L.educationPlain}
        </h2>
      </div>
      <div className={r.item}>
        {education.map((edu) => {
          const eduDateText = formatDateRange(edu.startDate, edu.endDate, edu.current, locale);
          return (
            <article
              key={edu.id}
              className={`rounded-2xl border border-slate-100 bg-white shadow-sm flex justify-between gap-4 ${r.cardPad}`}
            >
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">{edu.degree}</h3>
                <p className="text-xs text-slate-500">{edu.institution}</p>
                {edu.field && <p className="text-[10px] text-slate-500">{edu.field}</p>}
              </div>
              {eduDateText && (
                <span className="text-[11px] font-semibold text-slate-500 shrink-0">{eduDateText}</span>
              )}
            </article>
          );
        })}
      </div>
    </section>
  ) : null;

  // Habilidades, idiomas y referencias vivían dentro de una misma <section>.
  // Se separan en tres bloques para que el balanceo pueda moverlos por
  // separado: de lo contrario los tres bajarían juntos a la barra lateral o
  // ninguno, y no hay forma de repartirlos bien.
  const cardTitle = (label: string) => (
    <div className={`flex items-center gap-2 ${r.heading}`}>
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: palette.accent }}
      />
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
        {label}
      </h3>
    </div>
  );

  const skillsBlock = skills.length > 0 ? (
    <section className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${r.cardPad}`}>
      {cardTitle(L.skills)}
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="text-[10px] font-semibold uppercase tracking-[0.3em] px-3 py-1 rounded-full"
            style={{
              backgroundColor: palette.accentLight,
              color: palette.accentDark,
            }}
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <section className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${r.cardPad}`}>
      {cardTitle(L.languages)}
      <div className={r.item}>
        {languages.map((lang) => (
          <article key={lang.id}>
            <div className="flex justify-between text-sm font-semibold text-slate-600">
              <span>{lang.name}</span>
              <span className="shrink-0" style={{ color: palette.accentDark }}>{lang.level}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: getLanguageLevelWidth(lang.level),
                  backgroundColor: palette.accent,
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const referencesBlock = references.length > 0 ? (
    <section className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${r.cardPad}`}>
      {cardTitle(L.references)}
      <div className={r.item}>
        {references.filter(Boolean).map((ref) => (
          <article
            key={ref.id}
            className={`rounded-xl border border-slate-100 bg-slate-50 ${r.cardPad}`}
          >
            <p className="text-sm font-semibold text-slate-800">{ref.name}</p>
            <p className="text-[10px] text-slate-500">{ref.position}</p>
            <p className="text-[10px] text-slate-500">{ref.company}</p>
            <p className="text-[10px] break-all text-slate-500">{ref.email}</p>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const sections = [
    { id: 'summary', node: summaryBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'experience', node: experienceBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'education', node: educationBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
    { id: 'skills', node: skillsBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'languages', node: languagesBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'references', node: referencesBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
  ].filter((section) => section.node !== null);

  const columns = useBalancedColumns(
    sections.map((section) => ({
      id: section.id,
      node: section.node,
      columns: [...section.columns],
      prefer: section.prefer,
    })),
    rootRef,
  );

  return (
    <div
      className="min-h-[1056px] rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm print:shadow-none flex flex-col cv-template-wrapper"
      style={{
        backgroundColor: style.baseBackground ?? '#ffffff',
        fontFamily: fontFamily ? fontFamily : style.fontFamily ? style.fontFamily : 'var(--cv-font-body, Inter, sans-serif)',
      }}
    >
      <header
        className="px-8 py-6 border-b border-slate-100"
        style={{ backgroundColor: palette.accentLight }}
      >
        <div className="flex gap-6 items-center">
          {showPhoto && personalInfo.photoUrl && (
            <div
              className="w-24 h-24 rounded-2xl border-4 border-white shadow-sm overflow-hidden flex-shrink-0"
              style={{ borderColor: palette.accent }}
            >
              <Image
                src={personalInfo.photoUrl}
                alt="Foto de perfil"
                width={120}
                height={120}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 leading-tight">
                {personalInfo.fullName || 'Nombre Completo'}
              </h1>
              <p className="text-sm text-slate-600">{personalInfo.title || 'Profesional destacado'}</p>
              {/* Identificador de rol: icono + nombre del perfil al que apunta
                  la plantilla (p. ej. "Atención al Cliente"). Es lo que hace
                  que la hoja se lea como "de programador" o "de call center"
                  a primer vistazo, sin quitar profesionalismo. */}
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ backgroundColor: palette.accentLight, color: palette.accentDark }}
              >
                {/* @ts-expect-error lucide-react type mismatch */}
                <RoleIcon className="h-3.5 w-3.5" style={{ color: palette.accent }} aria-hidden="true" />
                {roleName}
                <span className="font-medium normal-case tracking-normal opacity-70">· {tagline}</span>
              </span>
            </div>
            {contactItems.length > 0 && (
              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-700 mt-2">
                {contactItems.map(({ label, Icon }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    {/* @ts-expect-error lucide-react type mismatch */}
                    <Icon className="w-4 h-4" style={{ color: palette.accentDark }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm"
              style={{ borderColor: palette.accent }}
            >
              {/* @ts-expect-error lucide-react type mismatch */}
              <RoleIcon className="w-8 h-8" style={{ color: palette.accent }} />
            </div>
          </div>
        </div>
      </header>

      {/* Antes era un <main> de una sola columna con todo apilado: con este
          volumen de contenido llegaba a 1,8 páginas. Ahora se reparte en dos
          columnas y el hook decide qué sección cae en cada lado. */}
      <main className={`flex-1 ${r.page}`}>
        <div className="grid grid-cols-12 gap-8">
          <aside ref={columns.leftRef} className={`col-span-4 ${r.section}`}>
            {columns.left}
          </aside>
          <div ref={columns.rightRef} className={`col-span-8 ${r.section}`}>
            {columns.right}
          </div>
        </div>
      </main>
      {columns.probe}

      {showWatermark && (
        <footer className="px-8 py-4 border-t border-slate-100 text-[10px] uppercase tracking-[0.3em] text-slate-400">
          <span>Talentia</span>
        </footer>
      )}
    </div>
  );
}
