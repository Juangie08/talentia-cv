'use client';

import { CustomTemplateProps, formatDateRange, getLanguageLevelWidth, rhythm, stripUrlProtocol } from './shared';
import { sectionLabels } from '@/lib/sectionLabels';

export default function BubbleMinimalTemplate({
  locale,
  cv,
  accentColor = 'var(--cv-color-accent, #F9A8D4)',
  fontFamily = 'var(--cv-font-body, "Manrope", sans-serif)',
  density = 'normal',
}: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, experience, education, skills, languages, references } = cv;
  const r = rhythm(density);

  return (
    <div className={`cv-template-wrapper min-h-[1056px] border border-pink-100 bg-white text-slate-800 shadow-sm print:shadow-none ${r.page}`} style={{ fontFamily }}>
      <header className={`${r.sectionMb} text-center`}>
        <div className={`mx-auto ${r.heading} h-3 w-20 rounded-full bg-pink-100`}>
          <div className="h-full rounded-full" style={{ width: '60%', backgroundColor: accentColor }} />
        </div>
        <h1 className="cv-name text-4xl font-extrabold tracking-tight text-slate-900">{personalInfo.fullName || 'Tu Nombre'}</h1>
        <p className="mt-2 text-base font-semibold" style={{ color: accentColor }}>{personalInfo.title || 'Perfil profesional'}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
          {personalInfo.email ? <span>{personalInfo.email}</span> : null}
          {personalInfo.phone ? <span>{personalInfo.phone}</span> : null}
          {personalInfo.location ? <span>{personalInfo.location}</span> : null}
          {personalInfo.linkedin ? <span>{stripUrlProtocol(personalInfo.linkedin)}</span> : null}
        </div>
      </header>

      {summary ? (
        <section className={`${r.sectionMb} rounded-[26px] bg-pink-50 px-5 py-4 text-sm leading-6 text-slate-600`}>
          {summary}
        </section>
      ) : null}

      {experience.length > 0 ? (
        <section className={r.sectionMb}>
          <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.28em]`} style={{ color: accentColor }}>{L.experience}</h2>
          <div className={r.item}>
            {experience.map((item) => (
              <article key={item.id} className="rounded-[24px] border border-pink-100 px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.position}</h3>
                    <p className="text-xs text-slate-500">{item.company}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    {formatDateRange(item.startDate, item.endDate, item.current, locale)}
                  </span>
                </div>
                {item.achievements.length > 0 ? (
                  <ul className={`mt-3 ${r.tight} text-xs leading-5 text-slate-600`}>
                    {item.achievements.filter(Boolean).map((achievement, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-6">
        {education.length > 0 ? (
          <section>
            <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.28em]`} style={{ color: accentColor }}>{L.educationShort}</h2>
              <div className={r.item}>
                {education.map((item) => (
                <article key={item.id} className="rounded-[22px] bg-slate-50 px-4 py-4">
                  <h3 className="text-sm font-bold text-slate-900">{item.degree}</h3>
                  <p className="text-xs text-slate-500">{item.institution}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className={r.section}>
          {skills.length > 0 ? (
            <div>
              <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.28em]`} style={{ color: accentColor }}>{L.skills}</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-pink-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {languages.length > 0 ? (
            <div>
              <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.28em]`} style={{ color: accentColor }}>{L.languages}</h2>
              <div className={r.item}>
                {languages.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{item.name}</span>
                      <span>{item.level}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-pink-100">
                      <div className="h-full rounded-full" style={{ width: getLanguageLevelWidth(item.level), backgroundColor: accentColor }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {references.length > 0 ? (
            <div>
              <h2 className={`${r.heading} text-[11px] font-black uppercase tracking-[0.28em]`} style={{ color: accentColor }}>{L.references}</h2>
              <div className={r.item}>
                {references.filter(Boolean).map((item) => (
                  <article key={item.id} className="rounded-[18px] bg-pink-50 px-4 py-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p>{item.position}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
