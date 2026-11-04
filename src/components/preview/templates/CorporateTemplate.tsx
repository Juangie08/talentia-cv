'use client';

/* eslint-disable @next/next/no-img-element */
import { Mail, Phone, MapPin, Linkedin, Building, Briefcase, GraduationCap, Award } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, formatDateRange, rhythm } from './shared';
import { sectionLabels } from '@/lib/sectionLabels';

/** CorporateTemplate: Diseño corporativo tradicional */
export default function CorporateTemplate({ cv, showPhoto = true, density = 'normal', locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  return (
    <div className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, Arial, sans-serif)" }}>
      {/* Header corporativo azul */}
        <header className={`cv-dark-panel bg-blue-900 text-white ${r.page}`}>
        <div className="flex items-center gap-6">
          {showPhoto && personalInfo.photoUrl && (
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
              <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-wide mb-1">{personalInfo.fullName || 'Nombre Completo'}</h1>
            <p className="text-lg font-medium text-blue-200 mb-4">{personalInfo.title || 'Profesional'}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-blue-200">
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

      {/* Contenido */}
      <main className={r.page}>
        {/* Resumen */}
        {summary && (
          <section className={`${r.sectionMb} ${r.cardPad} bg-blue-50 rounded-lg border-l-4 border-blue-800`}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <Award className="w-5 h-5 text-blue-800" />
              <h2 className="text-sm font-bold uppercase text-blue-800">{L.profileProfessional}</h2>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Experiencia */}
        {experience.length > 0 && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading} pb-2 border-b-2 border-blue-800`}>
              <Briefcase className="w-5 h-5 text-blue-800" />
              <h2 className="text-sm font-bold uppercase text-blue-800">{L.experienceJobs}</h2>
            </div>
            
            <div className={r.item}>
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-base font-bold text-slate-800">{exp.position}</h4>
                      <p className="text-sm font-medium text-blue-700">{exp.company}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
                    </span>
                  </div>
                  {exp.achievements.length > 0 && (
                    <ul className={`text-xs text-slate-600 ${r.tight} ml-4`}>
                      {exp.achievements.map((achievement, idx) => (
                        <li key={idx} className="list-disc">• {achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Educación */}
        {education.length > 0 && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading} pb-2 border-b-2 border-blue-800`}>
              <GraduationCap className="w-5 h-5 text-blue-800" />
              <h2 className="text-sm font-bold uppercase text-blue-800">{L.education}</h2>
            </div>
            
            <div className={r.item}>
              {education.map((edu) => (
                <div key={edu.id} className={`flex justify-between items-start ${r.cardPad} bg-slate-50 rounded-lg`}>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{edu.degree}</h4>
                    <p className="text-xs text-slate-600">{edu.institution}</p>
                    {edu.field && <p className="text-xs text-blue-700">{edu.field}</p>}
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills e Idiomas */}
        <div className="grid grid-cols-2 gap-8">
          {skills.length > 0 && (
            <section>
              <h3 className={`text-sm font-bold uppercase text-blue-800 ${r.heading} flex items-center gap-2`}>
                <Building className="w-4 h-4" />
                {L.competencies}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h3 className={`text-sm font-bold uppercase text-blue-800 ${r.heading}`}>{L.languages}</h3>
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-700">{lang.name}</span>
                  <span className="text-sm text-blue-700 font-medium">{lang.level}</span>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Referencias */}
        {references.length > 0 && (
          <section className="mt-8">
            <h3 className={`text-sm font-bold uppercase text-blue-800 ${r.heading}`}>{L.references}</h3>
            <div className={`grid grid-cols-2 ${r.cardGap}`}>
              {references.filter(Boolean).map((ref) => (
                <div key={ref.id} className={`${r.cardPad} bg-slate-50 rounded-lg`}>
                  <p className="text-sm font-bold text-slate-800">{ref.name}</p>
                  <p className="text-xs text-slate-500">{ref.position}</p>
                  <p className="text-xs text-slate-500">{ref.company}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
