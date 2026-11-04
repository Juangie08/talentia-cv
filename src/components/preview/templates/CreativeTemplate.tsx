'use client';
/* eslint-disable @next/next/no-img-element */

import { useRef } from 'react';
import { CVData } from '@/lib/types';
import { Mail, Phone, MapPin, Linkedin, Globe, Palette, Sparkles, Languages, Award } from 'lucide-react';
import { formatDateRange, getLanguageLevelWidth, rhythm, stripUrlProtocol } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import type { Locale } from '@/lib/i18n/config';
import { sectionLabels } from '@/lib/sectionLabels';

interface Props {
  locale?: Locale;
  cv: CVData;
  accentColor?: string;
  fontFamily?: string;
  density?: 'compact' | 'normal' | 'spacious';
  showPhoto?: boolean;
  showWatermark?: boolean;
}

/**
 * CreativeTemplate:
 * 2-column visual style with linear DOM flow.
 * Optimized for creative profiles.
 */
export default function CreativeTemplate({
  locale,
  cv,
  accentColor,
  fontFamily = 'var(--cv-font-body, Inter, sans-serif)',
  density = 'normal',
  showPhoto = true,
}: Props) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages } = cv;
  const r = rhythm(density);

  const rootRef = useRef<HTMLDivElement>(null);

  // La barra de color lleva foto, nombre, contacto, skills e idiomas. Los tres
  // ultimos usan blanco y translucidez sobre fondo oscuro, asi que quedan fijos
  // ahi: en la columna blanca se perderian.
  const identity = (
    <header className="flex flex-col items-center gap-6 text-center md:items-start md:text-left">
      {showPhoto && personalInfo.photoUrl && (
        <div className="h-32 w-32 rotate-3 overflow-hidden rounded-3xl border-4 border-white/20 shadow-2xl">
          <img src={personalInfo.photoUrl} alt="Foto" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        </div>
      )}
      <div>
        <h1 className="mb-4 text-4xl font-black leading-none tracking-tighter">
          {personalInfo.fullName || 'Talento Creativo'}
        </h1>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">
          {personalInfo.title || 'Creative Professional'}
        </p>
      </div>
    </header>
  );

  const contact = (
    <section>
      <h2 className={`flex items-center gap-2 border-b border-white/10 pb-2 text-[10px] font-black uppercase tracking-widest text-white/50 ${r.heading}`}>
        <Palette className="h-3.5 w-3.5" />
        {L.contact}
      </h2>
      <ul className={`${r.item} text-[11px] font-medium text-white/90`}>
        {personalInfo.email && (
          <li className="flex items-center gap-3">
            <Mail className="h-3.5 w-3.5 shrink-0 opacity-50" /> <span className="break-all">{personalInfo.email}</span>
          </li>
        )}
        {personalInfo.phone && (
          <li className="flex items-center gap-3">
            <Phone className="h-3.5 w-3.5 shrink-0 opacity-50" /> {personalInfo.phone}
          </li>
        )}
        {personalInfo.location && (
          <li className="flex items-center gap-3">
            <MapPin className="h-3.5 w-3.5 shrink-0 opacity-50" /> {personalInfo.location}
          </li>
        )}
        {personalInfo.linkedin && (
          <li className="flex items-center gap-3">
            <Linkedin className="h-3.5 w-3.5 shrink-0 opacity-50" /> <span className="break-all">{stripUrlProtocol(personalInfo.linkedin)}</span>
          </li>
        )}
        {personalInfo.website && (
          <li className="flex items-center gap-3">
            <Globe className="h-3.5 w-3.5 shrink-0 opacity-50" /> <span className="break-all">{stripUrlProtocol(personalInfo.website)}</span>
          </li>
        )}
      </ul>
    </section>
  );

  const skillsBlock = skills.length > 0 ? (
    <section>
      <h2 className={`flex items-center gap-2 border-b border-white/10 pb-2 text-[10px] font-black uppercase tracking-widest text-white/50 ${r.heading}`}>
        <Sparkles className="h-3.5 w-3.5" />Skills</h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span key={index} className="rounded border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white">
            {skill}
          </span>
        ))}
      </div>
    </section>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <section>
      <h2 className={`flex items-center gap-2 border-b border-white/10 pb-2 text-[10px] font-black uppercase tracking-widest text-white/50 ${r.heading}`}>
        <Languages className="h-3.5 w-3.5" />
        {L.languages}
      </h2>
      <div className={r.item}>
        {languages.map((language) => (
          <div key={language.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>{language.name}</span>
              <span className="shrink-0 text-[9px] uppercase tracking-tighter opacity-50">{language.level}</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-white/80" style={{ width: getLanguageLevelWidth(language.level) }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const summaryBlock = summary ? (
    <section>
      <h2 className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ${r.heading}`}>
        <span className="h-1 w-8" style={{ backgroundColor: accentColor }} />
        {L.summaryShort}
      </h2>
      <p className="text-xl font-medium leading-snug text-slate-700">{summary}</p>
    </section>
  ) : null;

  const experienceBlock = experience.length > 0 ? (
    <section>
      <h2 className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ${r.heading}`}>
        <span className="h-1 w-8" style={{ backgroundColor: accentColor }} />
        {L.experienceCreative}
      </h2>
      <div className={r.item}>
        {experience.map((exp) => (
          <div key={exp.id} className="group relative">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <h3 className="text-2xl font-black leading-none text-slate-900">{exp.position}</h3>
              <span className="shrink-0 text-[10px] font-bold text-slate-500">
                {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
              </span>
            </div>
            <p className="mb-4 text-sm font-black uppercase tracking-widest italic" style={{ color: accentColor }}>
              {exp.company}
            </p>
            <ul className={r.tight}>
              {exp.achievements.filter(Boolean).map((achievement, index) => (
                <li key={index} className="relative pl-6 text-sm font-medium leading-relaxed text-slate-600">
                  <span className="absolute left-0 top-2.5 h-0.5 w-2.5 opacity-30" style={{ backgroundColor: accentColor }} />
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  // Antes esta rejilla era de dos columnas; en la barra estrecha de 320px
  // dejaba cada titulo en 150px y se partian a media palabra.
  const educationBlock = education.length > 0 ? (
    <section>
      <h2 className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ${r.heading}`}>
        <span className="h-1 w-8" style={{ backgroundColor: accentColor }} />
        {L.educationPlain}
      </h2>
      <div className={`grid grid-cols-1 ${r.cardGap}`}>
        {education.map((edu) => (
          <div key={edu.id} className="space-y-2">
            <h3 className="text-sm font-black uppercase leading-tight text-slate-800">{edu.degree}</h3>
            <p className="text-xs font-bold text-slate-500">{edu.institution}</p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
              {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
            </p>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const sections = [
    { id: 'identity', node: identity, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'contact', node: contact, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'skills', node: skillsBlock, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'languages', node: languagesBlock, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'summary', node: summaryBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'experience', node: experienceBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'education', node: educationBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
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
    <div ref={rootRef} className="w-full min-h-[1056px] overflow-hidden border bg-white md:flex" style={{ fontFamily }}>
        <aside ref={columns.leftRef} className={`cv-dark-panel flex w-full shrink-0 flex-col gap-10 text-white md:w-80 ${r.page}`} style={{ backgroundColor: accentColor }}>
        {columns.left}
      </aside>

      <main ref={columns.rightRef} className={`flex-1 bg-white text-slate-800 ${r.page}`}>
        <div className={r.section}>
          {columns.right}
          <section className="border-t border-slate-50 pt-10">
            <div className="flex items-center gap-2 grayscale opacity-10">
              <Award className="h-10 w-10" />
              <Award className="h-10 w-10" />
              <Award className="h-10 w-10" />
            </div>
          </section>
        </div>
      </main>
      {columns.probe}
    </div>
  );
}
