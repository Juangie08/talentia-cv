'use client';

/* eslint-disable @next/next/no-img-element */
import { Mail, Phone, MapPin, Linkedin, Scale, GraduationCap, Briefcase, Award } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, formatDateRange, rhythm } from './shared';
import { sectionLabels } from '@/lib/sectionLabels';

/** LegalTemplate: Diseño formal y profesional para el ámbito jurídico */
export default function LegalTemplate({ cv, density = 'normal', showPhoto = true, locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  return (
    <div className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, Times New Roman, serif)" }}>
      {/* Header formal */}
        <header className={`cv-dark-panel bg-slate-900 text-white ${r.page}`}>
        <div className="flex items-center gap-6">
          {showPhoto && personalInfo.photoUrl && (
            <div className="w-28 h-28 rounded-none overflow-hidden border-2 border-slate-600 flex-shrink-0">
              <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Scale className="w-8 h-8 text-slate-400" />
              <h1 className="text-3xl font-bold tracking-wide">{personalInfo.fullName || 'Nombre Completo'}</h1>
            </div>
            <p className="text-lg font-medium text-slate-300 mb-4">{personalInfo.title || 'Abogado / Asesor Legal'}</p>
            
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
              {personalInfo.email && (
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {personalInfo.email}
                </span>
              )}
              {personalInfo.phone && (
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {personalInfo.phone}
                </span>
              )}
              {personalInfo.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {personalInfo.location}
                </span>
              )}
              {personalInfo.linkedin && (
                <span className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  {stripUrlProtocol(personalInfo.linkedin)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal con línea decorativa */}
      <div className="relative">
        {/* Barra lateral decorativa */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800" />
        
        <div className={`ml-1 ${r.page} pl-10`}>
          {/* Resumen */}
          {summary && (
            <section className={r.sectionMb}>
              <h2 className={`text-sm font-bold uppercase tracking-widest ${r.heading} flex items-center gap-2 text-slate-800 border-b border-slate-300 pb-2`}>
                <Award className="w-4 h-4" />
                {L.profileProfessional}
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed italic">{summary}</p>
            </section>
          )}

          {/* Experiencia Legal */}
          {experience.length > 0 && (
            <section className={r.sectionMb}>
              <h2 className={`text-sm font-bold uppercase tracking-widest ${r.heading} flex items-center gap-2 text-slate-800 border-b border-slate-300 pb-2`}>
                <Briefcase className="w-4 h-4" />
                Trayectoria Profesional
              </h2>
              <div className={r.item}>
                {experience.map((exp) => (
                  <article key={exp.id} className="grid grid-cols-4 gap-4">
                    <div className="text-xs text-slate-500 pt-1">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
                    </div>
                    <div className="col-span-3">
                      <h4 className="text-sm font-bold text-slate-800">{exp.position}</h4>
                      <p className="text-xs font-semibold text-slate-600 mb-1">{exp.company}</p>
                      {exp.achievements.length > 0 && (
                        <ul className={`text-xs text-slate-600 ${r.tight}`}>
                          {exp.achievements.map((achievement, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-slate-400">▪</span>
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Educación */}
          {education.length > 0 && (
            <section className={r.sectionMb}>
              <h2 className={`text-sm font-bold uppercase tracking-widest ${r.heading} flex items-center gap-2 text-slate-800 border-b border-slate-300 pb-2`}>
                <GraduationCap className="w-4 h-4" />
                {L.education}
              </h2>
              <div className={r.item}>
                {education.map((edu) => (
                  <article key={edu.id} className="grid grid-cols-4 gap-4">
                    <div className="text-xs text-slate-500 pt-1">
                      {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
                    </div>
                    <div className="col-span-3">
                      <h4 className="text-sm font-bold text-slate-800">{edu.degree}</h4>
                      <p className="text-xs text-slate-600">{edu.institution}</p>
                      {edu.field && <p className="text-xs text-slate-500">{edu.field}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Habilidades */}
          {skills.length > 0 && (
            <section className={r.sectionMb}>
              <h2 className={`text-sm font-bold uppercase tracking-widest ${r.heading} text-slate-800 border-b border-slate-300 pb-2`}>
                {L.skillsLegal}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {skills.map((skill, idx) => (
                  <article key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                    {skill}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Idiomas y Referencias */}
          <div className="grid grid-cols-2 gap-8">
            {languages.length > 0 && (
              <section>
                <h2 className={`text-sm font-bold uppercase tracking-widest ${r.heading} text-slate-800 border-b border-slate-300 pb-2`}>
                  {L.languages}
                </h2>
                {languages.map((lang) => (
                  <article key={lang.id} className={`flex justify-between text-sm ${r.itemMb}`}>
                    <span className="text-slate-700">{lang.name}</span>
                    <span className="text-slate-500">{lang.level}</span>
                  </article>
                ))}
              </section>
            )}

            {references.length > 0 && (
              <section>
                <h2 className={`text-sm font-bold uppercase tracking-widest ${r.heading} text-slate-800 border-b border-slate-300 pb-2`}>
                  {L.references}
                </h2>
                {references.filter(Boolean).map((ref) => (
                  <article key={ref.id} className={r.itemMb}>
                    <p className="text-sm font-bold text-slate-800">{ref.name}</p>
                    <p className="text-xs text-slate-600">{ref.position}</p>
                    <p className="text-xs text-slate-500">{ref.company}</p>
                  </article>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
