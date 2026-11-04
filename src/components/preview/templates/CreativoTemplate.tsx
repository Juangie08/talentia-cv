'use client';

import { useRef } from 'react';
import { Github, Globe, Linkedin, Mail, Phone, MapPin, Terminal, Code2, Cpu } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, formatDateRange, rhythm } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

/** Template Creativo: Optimizado para Desarrolladores / Sector Tech / Diseno */
export default function CreativoTemplate({ cv, accentColor, fontFamily, density = 'normal', locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);
  const accent = accentColor || 'var(--cv-color-accent, #2563EB)';
  const resolvedFont = fontFamily || 'var(--cv-font-body, Inter, sans-serif)';

  const rootRef = useRef<HTMLDivElement>(null);

  const skillsBlock = skills.length > 0 ? (
    <section>
      <h2 className={`text-xs font-black uppercase tracking-widest text-slate-500 ${r.heading} flex items-center gap-2`}>
        <Code2 className="w-4 h-4" style={{ color: accent }} />
        Tech Stack
      </h2>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span key={index} className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
            {skill}
          </span>
        ))}
      </div>
    </section>
  ) : null;

  const educationBlock = education.length > 0 ? (
    <section>
      <h2 className={`text-xs font-black uppercase tracking-widest text-slate-500 ${r.heading} flex items-center gap-2`}>
        <Cpu className="w-4 h-4" style={{ color: accent }} />
        {L.educationPlain}
      </h2>
      <div className={r.item}>
        {education.map((edu) => (
          <article key={edu.id} className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm leading-tight">{edu.degree}</h3>
            <p className="text-xs text-slate-500 font-medium">{edu.institution}</p>
            <p className="text-[10px] font-mono text-slate-500">{formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}</p>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <section>
      <h2 className={`text-xs font-black uppercase tracking-widest text-slate-500 ${r.heading}`}>{L.languages}</h2>
      <div className={r.item}>
        {languages.map((language) => (
          <article key={language.id} className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">{language.name}</span>
            <span className="font-mono text-[10px]" style={{ color: accent }}>{language.level}</span>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const summaryBlock = summary ? (
    <section>
      <p className="text-lg text-slate-600 leading-relaxed font-medium border-l-4 pl-6 py-2" style={{ borderColor: accent }}>{summary}</p>
    </section>
  ) : null;

  const experienceBlock = experience.length > 0 ? (
    <section>
      <h2 className={`text-xs font-black uppercase tracking-widest text-slate-500 ${r.heading} border-b pb-2`}>{L.experienceProfessional}</h2>
      <div className={r.item}>
        {experience.map((exp) => (
          <article key={exp.id} className="group">
            <div className="flex justify-between items-baseline mb-2">
              <h3 className="text-xl font-bold text-slate-900 transition-colors uppercase tracking-tighter" style={{ color: accent }}>
                {exp.position}
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
              </span>
            </div>
            <p className="font-mono font-bold text-sm mb-4" style={{ color: accent }}>{exp.company}</p>
            <ul className="grid grid-cols-1 gap-2">
              {exp.achievements.filter(Boolean).map((achievement, index) => (
                <li
                  key={index}
                  className="text-sm text-slate-600 leading-relaxed pl-4 relative"
                >
                  <span className="absolute left-0 top-2 h-1 w-1 rounded-full" style={{ backgroundColor: accent }} />
                  {achievement}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  // La rejilla de dos columnas no sobrevive a una barra de 300px: cada
  // referencia se quedaba en 120px. Cuando esto baje a la barra lateral se
  // muestra en una sola columna.
  const referencesBlock = references.length > 0 ? (
    <section className="pt-10 border-t border-slate-100">
      <h2 className={`text-xs font-black uppercase tracking-widest text-slate-500 ${r.heading}`}>{L.references}</h2>
      <div className={`grid grid-cols-1 ${r.cardGap}`}>
        {references.filter(Boolean).map((reference) => (
          <article key={reference.id} className="text-xs">
            <p className="font-bold text-slate-700">{reference.name}</p>
            <p className="text-slate-500">
              {reference.position} @ {reference.company}
            </p>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const sections = [
    { id: 'skills', node: skillsBlock, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'education', node: educationBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'languages', node: languagesBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'summary', node: summaryBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'experience', node: experienceBlock, columns: ['right'] as const, prefer: 'right' as const },
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
    <div ref={rootRef} className="min-h-[1056px] bg-slate-50 flex flex-col cv-template-wrapper" style={{ fontFamily: resolvedFont }}>
      <header className="cv-dark-panel bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Terminal className="w-64 h-64 rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className={r.item}>
            <h1 className="text-5xl font-black tracking-tighter" style={{ color: accent }}>
              {personalInfo.fullName || 'Tu Nombre'}
            </h1>
            <p className="text-xl font-mono" style={{ color: accent }}>&gt; {personalInfo.title || 'Full Stack Developer'}</p>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
              {personalInfo.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {personalInfo.email}
                </span>
              )}
              {personalInfo.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {personalInfo.phone}
                </span>
              )}
              {personalInfo.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {personalInfo.location}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {personalInfo.linkedin && (
              <a
                href={personalInfo.linkedin}
                className="flex items-center gap-2 text-xs font-bold text-slate-300 transition-colors bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700"
                style={{ color: accent, borderColor: `${accent}40` }}
                target="_blank"
                rel="noreferrer"
              >
                <Linkedin className="w-4 h-4" /> {stripUrlProtocol(personalInfo.linkedin)}
              </a>
            )}
            {personalInfo.website && (
              <a
                href={personalInfo.website}
                className="flex items-center gap-2 text-xs font-bold text-slate-300 transition-colors bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700"
                style={{ color: accent, borderColor: `${accent}40` }}
                target="_blank"
                rel="noreferrer"
              >
                <Github className="w-4 h-4" /> {stripUrlProtocol(personalInfo.website)}
              </a>
            )}
          </div>
        </div>
      </header>

      <div className={`flex-1 ${r.page} grid grid-cols-1 md:grid-cols-3 gap-12 bg-white`}>
        <aside ref={columns.leftRef} className={r.section}>
          {columns.left}
        </aside>

        <main ref={columns.rightRef} className={`md:col-span-2 ${r.section}`}>
          {columns.right}
        </main>
      </div>
      {columns.probe}

      <footer className="mt-auto p-12 bg-slate-50 border-t text-center">
        <div className="flex justify-center gap-8 opacity-20 filter grayscale">
          <Globe className="w-8 h-8" />
          <Terminal className="w-8 h-8" />
          <Code2 className="w-8 h-8" />
        </div>
      </footer>
    </div>
  );
}
