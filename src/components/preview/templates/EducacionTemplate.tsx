'use client';

/* eslint-disable @next/next/no-img-element */
import { Mail, Phone, MapPin, Linkedin, BookOpen, GraduationCap, Award, Users } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, getLanguageLevelWidth, formatDateRange, rhythm } from './shared';
import { sectionLabels } from '@/lib/sectionLabels';

/** EducacionTemplate: Diseño para docentes y profesionales de la educación */
export default function EducacionTemplate({ cv, accentColor, density = 'normal', showPhoto = true, locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  return (
    <div className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, Calibri, sans-serif)" }}>
      {/* Header estilo académico */}
      <header className="bg-white border-b-4" style={{ borderColor: accentColor }}>
        <div className={`${r.page} pb-6`}>
          <div className="flex items-start gap-8">
            {showPhoto && personalInfo.photoUrl && (
              <div className="w-28 h-28 rounded-xl overflow-hidden shadow-lg flex-shrink-0" style={{ borderBottom: `4px solid ${accentColor}` }}>
                <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-8 h-8" style={{ color: accentColor }} />
                <h1 className="text-2xl font-bold text-slate-800">{personalInfo.fullName || 'Nombre Completo'}</h1>
              </div>
              <p className="text-lg font-medium mb-4" style={{ color: accentColor }}>{personalInfo.title || 'Educador / Docente'}</p>
              
              <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                {personalInfo.email && (
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: accentColor }} />
                    {personalInfo.email}
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
        </div>
      </header>

      {/* Contenido */}
      <main className={r.page}>
        {/* Resumen Profesional */}
        {summary && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <Award className="w-5 h-5" style={{ color: accentColor }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                {L.profileProfessional}
              </h2>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pl-7">{summary}</p>
          </section>
        )}

        {/* Experiencia Docente */}
        {experience.length > 0 && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <Users className="w-5 h-5" style={{ color: accentColor }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                {L.experienceTeaching}
              </h2>
            </div>
            
            <div className={`${r.item} pl-7`}>
              {experience.map((exp) => (
                <div key={exp.id} className="relative">
                  <div className={`flex justify-between items-start ${r.itemMb}`}>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">{exp.position}</h4>
                      <p className="text-sm font-medium" style={{ color: accentColor }}>{exp.company}</p>
                    </div>
                    <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
                    </span>
                  </div>
                  
                  {exp.achievements.length > 0 && (
                    <div className={`bg-slate-50 rounded-lg ${r.cardPad}`}>
                      <ul className={`text-xs text-slate-600 ${r.tight}`}>
                        {exp.achievements.map((achievement, idx) => (
                          <li key={idx} className="flex gap-2">
                            <BookOpen className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Formación Académica */}
        {education.length > 0 && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <GraduationCap className="w-5 h-5" style={{ color: accentColor }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                {L.education}
              </h2>
            </div>
            
            <div className={`${r.item} pl-7`}>
              {education.map((edu) => (
                <div key={edu.id} className={`flex gap-4 ${r.cardPad} bg-white border border-slate-200 rounded-lg shadow-sm`}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentColor + '20' }}>
                    <GraduationCap className="w-6 h-6" style={{ color: accentColor }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">{edu.degree}</h4>
                    <p className="text-xs text-slate-600">{edu.institution}</p>
                    {edu.field && <p className="text-xs text-slate-500">{edu.field}</p>}
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap self-center">
                    {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Habilidades Pedagógicas */}
        {skills.length > 0 && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <BookOpen className="w-5 h-5" style={{ color: accentColor }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                {L.skillsPedagogical}
              </h2>
            </div>
            
            <div className={`grid grid-cols-3 ${r.cardGap} pl-7`}>
              {skills.map((skill, idx) => (
                <div key={idx} className={`flex items-center gap-2 ${r.cardPad} bg-slate-50 rounded-lg border-l-3`} style={{ borderLeftColor: accentColor }}>
                  <BookOpen className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                  <span className="text-xs font-medium text-slate-700">{skill}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Idiomas y Referencias */}
        <div className="grid grid-cols-2 gap-8 pl-7">
          {languages.length > 0 && (
            <section>
              <div className={`flex items-center gap-2 ${r.heading}`}>
                <Award className="w-5 h-5" style={{ color: accentColor }} />
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                  {L.languages}
                </h2>
              </div>
              
              <div className={r.item}>
                {languages.map((lang) => (
                  <div key={lang.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm font-medium text-slate-700">{lang.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: getLanguageLevelWidth(lang.level), backgroundColor: accentColor }} />
                      </div>
                      <span className="text-xs text-slate-500 w-16">{lang.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {references.length > 0 && (
            <section>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${r.heading}`} style={{ color: accentColor }}>
                {L.references}
              </h2>
              <div className={r.item}>
                {references.filter(Boolean).map((ref) => (
                  <div key={ref.id} className={`${r.cardPad} bg-white border border-slate-200 rounded-lg`}>
                    <p className="text-sm font-bold text-slate-800">{ref.name}</p>
                    <p className="text-xs text-slate-500">{ref.position}</p>
                    <p className="text-xs text-slate-400">{ref.company}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
