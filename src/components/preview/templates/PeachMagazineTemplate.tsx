'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { CustomTemplateProps, formatDateRange, getLanguageLevelWidth, stripUrlProtocol, rhythm } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

export default function PeachMagazineTemplate({
  locale,
  cv,
  accentColor = 'var(--cv-color-accent, #FDBA74)',
  fontFamily = 'var(--cv-font-body, "DM Sans", sans-serif)',
  showPhoto = true,
  density = 'normal',
}: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, experience, education, skills, languages } = cv;
  const r = rhythm(density);

  const rootRef = useRef<HTMLDivElement>(null);

  const summaryBlock = summary ? (
    <section className={`rounded-[30px] bg-[#fff7ed] px-5 ${r.cardPad}`}>
      <h2 className={`text-[11px] font-black uppercase tracking-[0.3em] ${r.heading}`} style={{ color: accentColor }}>{L.profile}</h2>
      <p className="text-sm leading-6 text-slate-600">{summary}</p>
    </section>
  ) : null;

  const skillsBlock = skills.length > 0 ? (
    <section>
      <h2 className={`text-[11px] font-black uppercase tracking-[0.3em] ${r.heading}`} style={{ color: accentColor }}>Skills</h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            {skill}
          </span>
        ))}
      </div>
    </section>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <section>
      <h2 className={`text-[11px] font-black uppercase tracking-[0.3em] ${r.heading}`} style={{ color: accentColor }}>{L.languages}</h2>
      <div className={r.item}>
        {languages.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between text-xs text-slate-600">
              <span>{item.name}</span>
              <span className="font-semibold shrink-0">{item.level}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-orange-100">
              <div className="h-full rounded-full" style={{ width: getLanguageLevelWidth(item.level), backgroundColor: accentColor }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const experienceBlock = experience.length > 0 ? (
    <div>
      <h2 className={`text-[11px] font-black uppercase tracking-[0.3em] ${r.heading}`} style={{ color: accentColor }}>{L.experience}</h2>
      <div className={r.item}>
        {experience.map((item) => (
          <article key={item.id} className="border-t border-orange-100 pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-slate-900">{item.position}</h3>
                <p className="text-sm font-semibold" style={{ color: accentColor }}>{item.company}</p>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 shrink-0">
                {formatDateRange(item.startDate, item.endDate, item.current, locale)}
              </span>
            </div>
            {item.achievements.length > 0 ? (
              <ul className={`mt-3 text-sm leading-6 text-slate-600 ${r.tight}`}>
                {item.achievements.filter(Boolean).map((achievement, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  ) : null;

  // Antes era una rejilla de dos columnas. En la barra estrecha (340px) cada
  // tarjeta se quedaba en 160px y el titulo del grado se partia a media
  // palabra, asi que ahora es una sola columna y se lee bien en ambos lados.
  const educationBlock = education.length > 0 ? (
    <div>
      <h2 className={`text-[11px] font-black uppercase tracking-[0.3em] ${r.heading}`} style={{ color: accentColor }}>{L.educationShort}</h2>
      <div className={`grid grid-cols-1 ${r.cardGap}`}>
        {education.map((item) => (
          <article key={item.id} className={`rounded-[24px] border border-orange-100 bg-[#fffdfa] px-4 ${r.cardPad}`}>
            <h3 className="text-base font-bold text-slate-900">{item.degree}</h3>
            <p className="text-xs text-slate-500">{item.institution}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              {formatDateRange(item.startDate, item.endDate, item.current, locale)}
            </p>
          </article>
        ))}
      </div>
    </div>
  ) : null;

  const sections = [
    { id: 'summary', node: summaryBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'skills', node: skillsBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'languages', node: languagesBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
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
    <div ref={rootRef} className="cv-template-wrapper min-h-[1056px] border border-orange-100 bg-[#fffdfa] text-slate-800 shadow-sm print:shadow-none" style={{ fontFamily }}>
      <header className="grid grid-cols-[1.1fr_0.9fr] border-b border-orange-100">
        <div className={`px-8 ${r.page}`}>
          <h1 className="text-5xl font-black leading-none text-slate-900">{personalInfo.fullName || 'Tu Nombre'}</h1>
          <p className="mt-3 text-xl font-semibold" style={{ color: accentColor }}>{personalInfo.title || 'Profesional creativa'}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
            {personalInfo.email ? <span>{personalInfo.email}</span> : null}
            {personalInfo.phone ? <span>{personalInfo.phone}</span> : null}
            {personalInfo.linkedin ? <span>{stripUrlProtocol(personalInfo.linkedin)}</span> : null}
          </div>
        </div>
        <div className="flex items-center justify-center border-l border-orange-100 bg-gradient-to-br from-[#fff7ed] to-[#fff1f2] p-8">
          {showPhoto && personalInfo.photoUrl ? (
            <div className="h-40 w-32 overflow-hidden rounded-[36px] border border-white bg-white shadow-md">
              <Image src={personalInfo.photoUrl} alt="Foto" width={140} height={180} className="h-full w-full object-cover" unoptimized />
            </div>
          ) : (
            <div className="flex h-40 w-32 items-center justify-center rounded-[36px] border border-white bg-white shadow-md">
              <div className="h-20 w-20 rounded-full border-8 border-orange-100" />
            </div>
          )}
        </div>
      </header>

      <main className={`grid grid-cols-[0.85fr_1.15fr] gap-8 px-8 ${r.page}`}>
        <aside ref={columns.leftRef} className={r.section}>
          {columns.left}
        </aside>

        <section ref={columns.rightRef} className={r.section}>
          {columns.right}
        </section>
      </main>
      {columns.probe}
    </div>
  );
}
