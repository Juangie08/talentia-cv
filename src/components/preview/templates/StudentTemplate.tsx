'use client';

/* eslint-disable @next/next/no-img-element */
import { Mail, Phone, MapPin, Linkedin, Globe, GraduationCap, BookText } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, getLanguageLevelWidth, formatDateRange, rhythm } from './shared';
import { sectionLabels } from '@/lib/sectionLabels';

/** StudentTemplate: layout optimizado para perfiles iniciales o de primer empleo */
export default function StudentTemplate({
  locale,
  cv,
  accentColor,
  fontFamily = 'var(--cv-font-body, Inter, sans-serif)',
  density = 'normal',
  showPhoto = true,
}: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages } = cv;

  const r = rhythm(density);

  return (
    <div className={`${r.page} w-full bg-slate-50 text-slate-900 border cv-template-wrapper`} style={{ fontFamily, minHeight: '1056px' }}>
      <div className={r.section}>
        <header className="text-center relative max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-slate-800 uppercase">
            {personalInfo.fullName || 'Tu Nombre Completo'}
          </h1>
          {personalInfo.title && <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">{personalInfo.title}</p>}
          <div className="flex items-center justify-center gap-6 text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-6 border-y border-slate-200 py-3">
            {personalInfo.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> {personalInfo.email}
              </span>
            )}
            {personalInfo.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> {personalInfo.phone}
              </span>
            )}
            {personalInfo.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> {personalInfo.location}
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 text-[10px] text-blue-500 font-bold">
            {personalInfo.linkedin && (
              <span className="flex items-center gap-1.5 tracking-tighter">
                <Linkedin className="w-3 h-3" /> {stripUrlProtocol(personalInfo.linkedin)}
              </span>
            )}
            {personalInfo.website && (
              <span className="flex items-center gap-1.5 tracking-tighter">
                <Globe className="w-3 h-3" /> {stripUrlProtocol(personalInfo.website)}
              </span>
            )}
          </div>

          {showPhoto && personalInfo.photoUrl && (
            <div className="absolute -top-4 right-0 w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md hidden md:block">
              <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          )}
        </header>

        {summary && (
          <section className="max-w-xl mx-auto text-center">
            <p className="text-sm text-slate-600 leading-loose font-medium italic">&quot;{summary}&quot;</p>
          </section>
        )}

        <div className={`max-w-3xl mx-auto ${r.section}`}>
          {education.length > 0 && (
            <section>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 pb-2 inline-block ${r.heading}`}>
                <GraduationCap className="w-4 h-4 text-blue-500 inline mr-2 mb-1" />
                {L.educationAndTraining}
              </h2>
              <div className={r.item}>
                {education.map((edu) => (
                  <div key={edu.id} className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div className="space-y-1">
                      <h3 className="font-black text-slate-800 text-base leading-tight">
                        {edu.degree}
                        {edu.field ? ` en ${edu.field}` : ''}
                      </h3>
                      <p className="text-slate-500 text-xs font-bold leading-relaxed">{edu.institution}</p>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full whitespace-nowrap">
                      {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {experience.length > 0 && (
            <section>
              <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 pb-2 inline-block ${r.heading}`}>
                <BookText className="w-4 h-4 text-emerald-600 inline mr-2 mb-1" />
                {L.experienceProjects}
              </h2>
              <div className={r.item}>
                {experience.map((exp) => (
                  <div key={exp.id} className={`space-y-3 bg-white rounded-2xl border border-slate-100 shadow-sm ${r.cardPad}`}>
                    <div className="flex justify-between items-baseline gap-4">
                      <h3 className="font-extrabold text-slate-800 text-sm">{exp.position}</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
                      </span>
                    </div>
                    <p className="font-black text-xs uppercase tracking-wider" style={{ color: accentColor }}>
                      {exp.company}
                    </p>
                    <ul className={r.tight}>
                      {exp.achievements.map((achievement, index) => (
                        <li key={index} className="text-xs text-slate-600 pl-4 relative before:content-['>'] before:absolute before:left-0 before:text-blue-500 before:font-black">
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {skills.length > 0 && (
              <section>
                <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2 ${r.heading}`}>{L.skills}</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <span key={index} className="text-xs text-slate-700 bg-white border-b-2 border-slate-200 px-3 py-1 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {languages.length > 0 && (
              <section>
                <h2 className={`text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2 ${r.heading}`}>{L.languages}</h2>
                <div className={r.item}>
                  {languages.map((language) => (
                    <div key={language.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-800 uppercase tracking-wider">{language.name}</span>
                        <span className="text-slate-400 font-bold text-[10px] pb-0.5 px-2 bg-slate-100 rounded tracking-tighter">
                          {language.level}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: getLanguageLevelWidth(language.level) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
