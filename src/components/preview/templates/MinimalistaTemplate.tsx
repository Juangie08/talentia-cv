'use client';

import { CustomTemplateProps, stripUrlProtocol, getLanguageLevelWidth, formatDateRange, rhythm } from './shared';
import { sectionLabels } from '@/lib/sectionLabels';

/** Template Minimalista: Optimizado para Estudiantes / Primer Empleo / Practicas */
export default function MinimalistaTemplate({ cv, accentColor, fontFamily, density = 'normal', locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);
  const accent = accentColor || 'var(--cv-color-accent, #2563EB)';
  const resolvedFont = fontFamily || 'var(--cv-font-body, Inter, sans-serif)';

  return (
    <div className={`min-h-[1056px] bg-white text-slate-900 border cv-template-wrapper ${r.page}`} style={{ fontFamily: resolvedFont, padding: 'var(--cv-page-padding, 32px)' }}>
      <header className={`text-center ${r.sectionMb}`}>
        <h1 className="cv-name font-light tracking-tight text-slate-800 mb-2" style={{ fontSize: 'var(--cv-font-size-name, 26px)', color: 'var(--cv-color-body-text, #1f2937)' }}>{personalInfo.fullName || 'Tu Nombre'}</h1>
        {personalInfo.title && <p className="font-bold uppercase tracking-[0.3em] text-slate-400 mb-6" style={{ fontSize: 'var(--cv-font-size-base, 10px)' }}>{personalInfo.title}</p>}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>-</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>-</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
        </div>
        {personalInfo.linkedin && (
          <p className="text-[11px] mt-2 font-medium" style={{ color: accent }}>{stripUrlProtocol(personalInfo.linkedin)}</p>
        )}
      </header>

      {summary && (
        <section className={`${r.sectionMb} max-w-2xl mx-auto text-center`}>
          <p className="text-sm text-slate-600 leading-relaxed italic">&quot;{summary}&quot;</p>
        </section>
      )}

      <div className={`max-w-3xl mx-auto ${r.section}`}>
        {education.length > 0 && (
          <section>
            <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2 ${r.heading}`}>{L.education}</h2>
            <div className={r.item}>
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-start">
                  <div className={r.tight}>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {edu.degree}
                      {edu.field ? ` en ${edu.field}` : ''}
                    </h3>
                    <p className="text-slate-500 text-xs font-medium">{edu.institution}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded">
                    {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2 ${r.heading}`}>{L.experienceProjects}</h2>
            <div className={r.item}>
              {experience.map((exp) => (
                <div key={exp.id} className={r.tight}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-800 text-sm">{exp.position}</h3>
                    <span className="text-[10px] font-bold text-slate-400">{formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}</span>
                  </div>
                  <p className="font-bold text-xs" style={{ color: accent }}>{exp.company}</p>
                  <ul className={r.tight}>
                    {exp.achievements.map((achievement, index) => (
                      <li key={index} className="text-xs text-slate-600 pl-4 relative">
                        <span className="absolute left-0 top-0 font-bold" style={{ color: accent }}>{'>'}</span>
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-12">
          {skills.length > 0 && (
            <section>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2 ${r.heading}`}>{L.skills}</h2>
              <ul className="grid grid-cols-1 gap-1">
                {skills.map((skill, index) => (
                  <li key={index} className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-400 rounded-full" />
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2 ${r.heading}`}>{L.languages}</h2>
              <div className={r.item}>
                {languages.map((language) => (
                  <div key={language.id} className={r.tight}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{language.name}</span>
                      <span className="text-slate-400 italic text-[10px]">{language.level}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: getLanguageLevelWidth(language.level), backgroundColor: accent }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {references.length > 0 && (
          <section>
            <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2 ${r.heading}`}>{L.references}</h2>
            <div className={`grid grid-cols-2 ${r.cardGap}`}>
              {references.map((reference) => (
                <div key={reference.id} className="text-xs">
                  <p className="font-bold text-slate-800">{reference.name}</p>
                  <p className="text-slate-500 font-medium">
                    {reference.position} - {reference.company}
                  </p>
                  <p className="text-[10px] mt-1 font-bold" style={{ color: accent }}>{reference.phone}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
