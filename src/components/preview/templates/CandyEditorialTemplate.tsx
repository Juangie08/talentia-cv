'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { CustomTemplateProps, formatDateRange, rhythm, stripUrlProtocol } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

export default function CandyEditorialTemplate({
  locale,
  cv,
  accentColor = 'var(--cv-color-accent, #FB7185)',
  fontFamily = 'var(--cv-font-body, "Cormorant Garamond", serif)',
  showPhoto = true,
  density = 'normal',
}: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, experience, education, skills, languages, references } = cv;
  const r = rhythm(density);

  const rootRef = useRef<HTMLDivElement>(null);

  // Bloque de identidad: nombre, cargo, perfil y contacto viven juntos y
  // comparten estilo. Se quedan fijos en la barra: si el perfil se separara del
  // nombre perdería el sentido de cabecera.
  const identity = (
    <>
      <h1 className="text-5xl font-semibold leading-none text-slate-900">{personalInfo.fullName || 'Tu Nombre'}</h1>
      <p className="mt-3 text-xl font-semibold italic" style={{ color: accentColor }}>{personalInfo.title || 'Perfil creativo'}</p>
      <p className="mt-6 text-sm leading-7 text-slate-600">{summary || 'Un perfil con sensibilidad visual, cuidado editorial y una presentación memorable.'}</p>

      <div className={`mt-8 ${r.item} text-xs text-slate-600`}>
        {personalInfo.email ? <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} /><span className="break-all">{personalInfo.email}</span></div> : null}
        {personalInfo.phone ? <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />{personalInfo.phone}</div> : null}
        {personalInfo.location ? <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: accentColor }} />{personalInfo.location}</div> : null}
      </div>
    </>
  );

  const skillsBlock = skills.length > 0 ? (
    <div className="mt-8">
      <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.28em]`} style={{ color: accentColor }}>Skills</h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm">
            {skill}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  const experienceBlock = experience.length > 0 ? (
    <section className={r.sectionMb}>
      <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.32em]`} style={{ color: accentColor }}>{L.experience}</h2>
      <div className={r.item}>
        {experience.map((item, index) => (
          <article key={item.id} className="relative pl-8">
            <span className="absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-white shadow" style={{ backgroundColor: accentColor }} />
            {index !== experience.length - 1 ? <span className="absolute left-[7px] top-6 h-[calc(100%+8px)] w-[2px] bg-rose-100" /> : null}
            <div className="rounded-[28px] border border-rose-100 bg-[#fffaf8] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-slate-900">{item.position}</h3>
                  <p className="text-sm font-semibold" style={{ color: accentColor }}>{item.company}</p>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 shrink-0">
                  {formatDateRange(item.startDate, item.endDate, item.current, locale)}
                </span>
              </div>
              {item.achievements.length > 0 ? (
                <ul className={`mt-3 ${r.tight} text-sm leading-6 text-slate-600`}>
                  {item.achievements.filter(Boolean).map((achievement, achievementIndex) => (
                    <li key={achievementIndex}>· {achievement}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const educationBlock = education.length > 0 ? (
    <section className={r.sectionMb}>
      <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.32em]`} style={{ color: accentColor }}>{L.educationShort}</h2>
      <div className={r.item}>
        {education.map((item) => (
          <article key={item.id} className="rounded-[24px] border border-rose-100 bg-white px-4 py-4">
            <h3 className="text-base font-semibold text-slate-900">{item.degree}</h3>
            <p className="text-xs text-slate-500">{item.institution}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              {formatDateRange(item.startDate, item.endDate, item.current, locale)}
            </p>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <div className={r.sectionMb}>
      <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.32em]`} style={{ color: accentColor }}>{L.languages}</h2>
      <div className={r.item}>
        {languages.map((item) => (
          <div key={item.id} className="rounded-[22px] border border-rose-100 bg-[#fffaf8] px-4 py-3 text-sm text-slate-600">
            <div className="flex justify-between gap-4">
              <span>{item.name}</span>
              <span className="font-semibold shrink-0" style={{ color: accentColor }}>{item.level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const referencesBlock = references.length > 0 ? (
    <div>
      <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.32em]`} style={{ color: accentColor }}>{L.references}</h2>
      <div className={r.item}>
        {references.filter(Boolean).map((item) => (
          <article key={item.id} className="rounded-[22px] border border-rose-100 bg-white px-4 py-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-800">{item.name}</p>
            <p>{item.position} · {item.company}</p>
            <p className="mt-1 break-all">{item.email || stripUrlProtocol(item.phone)}</p>
          </article>
        ))}
      </div>
    </div>
  ) : null;

  const sections = [
    { id: 'identity', node: identity, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'skills', node: skillsBlock, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'experience', node: experienceBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'education', node: educationBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
    { id: 'languages', node: languagesBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
    { id: 'references', node: referencesBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
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
    <div ref={rootRef} className="cv-template-wrapper min-h-[1056px] overflow-hidden border border-rose-100 bg-[#fffaf8] text-slate-800 shadow-sm print:shadow-none" style={{ fontFamily }}>
      <div className="grid min-h-[1056px] grid-cols-[0.9fr_1.1fr]">
        <aside ref={columns.leftRef} className={`relative overflow-hidden border-r border-rose-100 bg-gradient-to-b from-[#fff1f4] via-[#fff7f1] to-white ${r.page}`}>
          <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-rose-200/40 blur-2xl" />
          <div className="absolute bottom-8 right-0 h-32 w-32 rounded-full bg-orange-200/40 blur-2xl" />
          <div className="relative z-10">
            {columns.left}
          </div>
        </aside>

        <main ref={columns.rightRef} className={`bg-white ${r.page}`}>
          <div className={`${r.sectionMb} flex items-start justify-between gap-6`}>
            <div className="max-w-xl">
              <div className="mt-2 h-1.5 w-24 rounded-full" style={{ backgroundColor: accentColor }} />
            </div>
            {showPhoto && personalInfo.photoUrl ? (
              <div className="h-28 w-24 overflow-hidden rounded-[32px] border border-rose-100 bg-[#fffaf8] shadow-sm">
                <Image src={personalInfo.photoUrl} alt="Foto" width={120} height={160} className="h-full w-full object-cover" unoptimized />
              </div>
            ) : null}
          </div>
          {columns.right}
        </main>
      </div>
      {columns.probe}
    </div>
  );
}
