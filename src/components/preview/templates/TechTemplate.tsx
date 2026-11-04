'use client';

/* eslint-disable @next/next/no-img-element */
import { Mail, Phone, MapPin, Linkedin, Code, Briefcase, GraduationCap, Award } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, formatDateRange, rhythm } from './shared';
import { sectionLabels } from '@/lib/sectionLabels';

/** TechTemplate: Diseño moderno para profesionales tech */
export default function TechTemplate({ cv, accentColor, showPhoto = true, density = 'normal', locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  return (
    <div className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, JetBrains Mono, monospace)" }}>
      {/* Header tech */}
      <header className="cv-dark-panel bg-slate-800 p-8 border-b-4" style={{ borderColor: accentColor }}>
        <div className="flex items-start gap-8">
          {showPhoto && personalInfo.photoUrl && (
            <div className="w-28 h-28 rounded-lg overflow-hidden border-2 shadow-lg flex-shrink-0" style={{ borderColor: accentColor }}>
              <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Code className="w-8 h-8" style={{ color: accentColor }} />
              <h1 className="text-2xl font-bold text-white">{personalInfo.fullName || 'Nombre Completo'}</h1>
            </div>
            <p className="text-lg font-medium mb-4" style={{ color: accentColor }}>{personalInfo.title || 'Desarrollador'}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              {personalInfo.email && (
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: accentColor }} />
                  <span className="text-cyan-400">{personalInfo.email}</span>
                </span>
              )}
              {personalInfo.phone && (
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" style={{ color: accentColor }} />
                  {personalInfo.phone}
                </span>
              )}
              {personalInfo.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" style={{ color: accentColor }} />
                  {personalInfo.location}
                </span>
              )}
              {personalInfo.linkedin && (
                <span className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" style={{ color: accentColor }} />
                  {stripUrlProtocol(personalInfo.linkedin)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="p-8">
        {/* Resumen */}
        {summary && (
          <section className={`rounded-lg bg-slate-800/50 border border-slate-700 ${r.sectionMb} ${r.cardPad}`}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <Award className="w-4 h-4" style={{ color: accentColor }} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                &gt; {L.summaryShort}
              </h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Experiencia */}
        {experience.length > 0 && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <Briefcase className="w-4 h-4" style={{ color: accentColor }} />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                &gt; {L.experience}
              </h2>
            </div>
            
            <div className={r.item}>
              {experience.map((exp) => (
                <div key={exp.id} className={`rounded-lg bg-slate-800/30 border-l-2 ${r.cardPad}`} style={{ borderColor: accentColor }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{exp.position}</h4>
                      <p className="text-xs font-medium" style={{ color: accentColor }}>{exp.company}</p>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
                    </span>
                  </div>
                  {exp.achievements.length > 0 && (
                    <ul className={`text-xs text-slate-400 mt-2 ${r.tight}`}>
                      {exp.achievements.filter(Boolean).map((achievement, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span style={{ color: accentColor }}>{'>'}</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Grid 2 columnas */}
        <div className="grid grid-cols-2 gap-8">
          {/* Educación */}
          {education.length > 0 && (
            <section>
              <div className={`flex items-center gap-2 ${r.heading}`}>
                <GraduationCap className="w-4 h-4" style={{ color: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  &gt; {L.education}
                </h2>
              </div>
              
              <div className={r.item}>
                {education.map((edu) => (
                  <div key={edu.id} className={`rounded bg-slate-800/30 ${r.cardPad}`}>
                    <h4 className="text-sm font-bold text-white">{edu.degree}</h4>
                    <p className="text-xs text-slate-400">{edu.institution}</p>
                    {edu.field && <p className="text-xs" style={{ color: accentColor }}>{edu.field}</p>}
                    <span className="text-xs text-slate-500 font-mono">{formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <section>
              <div className={`flex items-center gap-2 ${r.heading}`}>
                <Code className="w-4 h-4" style={{ color: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  &gt; Tech Stack
                </h2>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span key={idx} className="cv-dark-panel px-3 py-1.5 rounded text-xs font-mono bg-slate-800 border border-slate-700" style={{ color: accentColor }}>
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Idiomas y Referencias */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          {languages.length > 0 && (
            <section>
              <h2 className={`text-xs font-bold uppercase tracking-wider text-slate-400 ${r.heading}`}>{L.languages}</h2>
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between text-sm py-1 border-b border-slate-800">
                  <span className="text-slate-300">{lang.name}</span>
                  <span style={{ color: accentColor }}>{lang.level}</span>
                </div>
              ))}
            </section>
          )}

          {references.length > 0 && (
            <section>
              <h2 className={`text-xs font-bold uppercase tracking-wider text-slate-400 ${r.heading}`}>{L.references}</h2>
              {references.filter(Boolean).map((ref) => (
                <div key={ref.id} className={`${r.itemMb} bg-slate-800/30 rounded ${r.cardPad}`}>
                  <p className="text-sm font-bold text-white">{ref.name}</p>
                  <p className="text-xs text-slate-400">{ref.position}</p>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
