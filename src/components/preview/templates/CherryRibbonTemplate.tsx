'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Heart, Mail, MapPin, Phone, Sparkles } from 'lucide-react';
import { CustomTemplateProps, formatDateRange, rhythm, stripUrlProtocol } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

export default function CherryRibbonTemplate({
  locale,
  cv,
  accentColor = 'var(--cv-color-accent, #F472B6)',
  fontFamily = 'var(--cv-font-body, Manrope, sans-serif)',
  showPhoto = true,
  showWatermark = false,
  density = 'normal',
}: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, experience, education, skills, languages } = cv;
  const r = rhythm(density);

  const rootRef = useRef<HTMLDivElement>(null);

  const summaryBlock = summary ? (
    <section className={`rounded-[28px] border border-rose-100 bg-white ${r.cardPad}`}>
      <div className={`${r.heading} inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em]`} style={{ color: accentColor }}>
        <Sparkles className="h-3.5 w-3.5" />
        {L.profile}
      </div>
      <p className="text-sm leading-6 text-slate-600">{summary}</p>
    </section>
  ) : null;

  const experienceBlock = experience.length > 0 ? (
    <section className={`rounded-[28px] border border-rose-100 bg-white ${r.cardPad}`}>
      <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.28em]`} style={{ color: accentColor }}>{L.experience}</h2>
      <div className={r.item}>
        {experience.map((item) => (
          <article key={item.id} className="rounded-2xl bg-rose-50/50 px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-800">{item.position}</h3>
                <p className="text-xs font-semibold" style={{ color: accentColor }}>{item.company}</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 shrink-0">
                {formatDateRange(item.startDate, item.endDate, item.current, locale)}
              </span>
            </div>
            {item.achievements.length > 0 ? (
              <ul className={`mt-3 ${r.tight} text-xs leading-5 text-slate-600`}>
                {item.achievements.filter(Boolean).map((achievement, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const educationBlock = education.length > 0 ? (
    <section className={`rounded-[28px] border border-rose-100 bg-white ${r.cardPad}`}>
      <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.28em]`} style={{ color: accentColor }}>{L.educationShort}</h2>
      <div className={r.item}>
        {education.map((item) => (
          <article key={item.id} className="rounded-2xl border border-rose-100 bg-[#fffafd] px-4 py-3">
            <h3 className="text-sm font-bold text-slate-800">{item.degree}</h3>
            <p className="text-xs text-slate-500">{item.institution}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
              {formatDateRange(item.startDate, item.endDate, item.current, locale)}
            </p>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const skillsBlock = skills.length > 0 ? (
    <section className={`rounded-[28px] border border-rose-100 bg-white ${r.cardPad}`}>
      <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.28em]`} style={{ color: accentColor }}>{L.skills}</h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: accentColor }}>
            {skill}
          </span>
        ))}
      </div>
    </section>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <section className={`rounded-[28px] border border-rose-100 bg-white ${r.cardPad}`}>
      <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.28em]`} style={{ color: accentColor }}>{L.languages}</h2>
      <div className={`${r.item} text-xs text-slate-600`}>
        {languages.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl bg-rose-50/60 px-3 py-2">
            <span>{item.name}</span>
            <span className="font-semibold shrink-0" style={{ color: accentColor }}>{stripUrlProtocol(item.level)}</span>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const sections = [
    { id: 'summary', node: summaryBlock, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'experience', node: experienceBlock, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'education', node: educationBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
    { id: 'skills', node: skillsBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
    { id: 'languages', node: languagesBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
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
    <div ref={rootRef} className="cv-template-wrapper min-h-[1056px] border border-rose-100 bg-[#fff8fb] text-slate-800 shadow-sm print:shadow-none" style={{ fontFamily }}>
      <header className={`border-b border-rose-100 bg-white ${r.page}`}>
        <div className="flex items-start gap-6">
          {showPhoto && personalInfo.photoUrl ? (
            <div className="h-24 w-24 overflow-hidden rounded-[28px] border-4 border-rose-100 bg-white shadow-sm">
              <Image src={personalInfo.photoUrl} alt="Foto" width={120} height={120} className="h-full w-full object-cover" unoptimized />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border-4 border-rose-100 bg-rose-50 text-rose-400 shadow-sm">
              <Heart className="h-10 w-10" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="cv-name text-4xl font-black tracking-tight text-slate-900">{personalInfo.fullName || 'Tu Nombre'}</h1>
            <p className="mt-2 text-lg font-semibold" style={{ color: accentColor }}>{personalInfo.title || 'Perfil profesional'}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
              {personalInfo.email ? <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" style={{ color: accentColor }} />{personalInfo.email}</span> : null}
              {personalInfo.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" style={{ color: accentColor }} />{personalInfo.phone}</span> : null}
              {personalInfo.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" style={{ color: accentColor }} />{personalInfo.location}</span> : null}
            </div>
          </div>
        </div>
      </header>

      <main className={`grid grid-cols-[1.2fr_0.8fr] gap-6 ${r.page}`}>
        <div ref={columns.leftRef} className={r.section}>
          {columns.left}
        </div>

        <div ref={columns.rightRef} className={r.section}>
          {columns.right}
        </div>
      </main>
      {columns.probe}

      {showWatermark ? (
        <footer className="border-t border-rose-100 px-8 py-3 text-[10px] uppercase tracking-[0.24em] text-slate-400">
          Talentia
        </footer>
      ) : null}
    </div>
  );
}
