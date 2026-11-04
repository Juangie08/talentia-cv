'use client';

/* eslint-disable @next/next/no-img-element */
import { Mail, Phone, MapPin, Linkedin, Stethoscope, GraduationCap, Award } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, formatDateRange, rhythm } from './shared';
import { sectionLabels } from '@/lib/sectionLabels';

/** MedicoTemplate: Diseño limpio para profesionales de la salud */
export default function MedicoTemplate({ cv, accentColor, density = 'normal', showPhoto = true, locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  return (
    <div className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, Segoe UI, sans-serif)" }}>
      {/* Header - Azul médico */}
      <header className="bg-white border-b-4" style={{ borderColor: accentColor }}>
        <div className={`${r.page} pb-6`}>
          <div className="flex items-center gap-6">
            {showPhoto && personalInfo.photoUrl && (
              <div className="w-24 h-24 rounded-lg overflow-hidden border-2 shadow-md flex-shrink-0" style={{ borderColor: accentColor }}>
                <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Stethoscope className="w-6 h-6" style={{ color: accentColor }} />
                <h1 className="text-2xl font-bold text-slate-800">{personalInfo.fullName || 'Nombre Completo'}</h1>
              </div>
              <p className="text-lg font-medium mb-4" style={{ color: accentColor }}>{personalInfo.title || 'Profesional de la Salud'}</p>
              
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
            <h2 className={`text-sm font-bold uppercase tracking-wider ${r.heading} flex items-center gap-2`} style={{ color: accentColor }}>
              <Award className="w-4 h-4" />
              {L.profileProfessional}
            </h2>
            <p className={`text-sm text-slate-700 leading-relaxed bg-slate-50 ${r.cardPad} rounded-lg border-l-4`} style={{ borderColor: accentColor }}>
              {summary}
            </p>
          </section>

        )}

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-2 gap-8">
          {/* Columna Izquierda */}
          <div>
            {/* Experiencia */}
            {experience.length > 0 && (
              <section className={r.sectionMb}>
                <h2 className={`text-sm font-bold uppercase tracking-wider ${r.heading} flex items-center gap-2 pb-2 border-b`} style={{ borderColor: accentColor, color: accentColor }}>
                  <Stethoscope className="w-4 h-4" />
                  {L.experienceClinical}
                </h2>
                <div className={r.item}>
                  {experience.map((exp) => (
                    <div key={exp.id} className="relative pl-4 border-l-2" style={{ borderColor: accentColor }}>
                      <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
                      <h4 className="text-sm font-bold text-slate-800">{exp.position}</h4>
                      <p className="text-xs font-medium mb-1" style={{ color: accentColor }}>{exp.company}</p>
                      <span className="text-xs text-slate-500">{formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}</span>
                      {exp.achievements.length > 0 && (
                        <ul className={`mt-2 text-xs text-slate-600 ${r.tight}`}>
                          {exp.achievements.filter(Boolean).map((achievement, idx) => (
                            <li key={idx}>• {achievement}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Educación Médica */}
            {education.length > 0 && (
              <section className={r.sectionMb}>
                <h2 className={`text-sm font-bold uppercase tracking-wider ${r.heading} flex items-center gap-2 pb-2 border-b`} style={{ borderColor: accentColor, color: accentColor }}>
                  <GraduationCap className="w-4 h-4" />
                  {L.educationMedical}
                </h2>
                <div className={r.item}>
                  {education.map((edu) => (
                    <div key={edu.id} className="relative pl-4 border-l-2" style={{ borderColor: accentColor }}>
                      <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
                      <h4 className="text-sm font-bold text-slate-800">{edu.degree}</h4>
                      <p className="text-xs text-slate-600">{edu.institution}</p>
                      {edu.field && <p className="text-xs text-slate-500">{edu.field}</p>}
                      <span className="text-xs text-slate-500">{formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Columna Derecha */}
          <div>
            {/* Habilidades Clínicas */}
            {skills.length > 0 && (
              <section className={r.sectionMb}>
                <h2 className={`text-sm font-bold uppercase tracking-wider ${r.heading} flex items-center gap-2 pb-2 border-b`} style={{ borderColor: accentColor, color: accentColor }}>
                  <Award className="w-4 h-4" />
                  {L.competencies}
                </h2>
                <div className={r.tight}>
                  {skills.map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                      <span className="text-sm text-slate-700">{skill}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Idiomas */}
            {languages.length > 0 && (
              <section className={r.sectionMb}>
                <h2 className={`text-sm font-bold uppercase tracking-wider ${r.heading}`} style={{ color: accentColor }}>{L.languages}</h2>
                <div className={r.item}>
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">{lang.name}</span>
                      <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
                        {lang.level}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Referencias */}
            {references.length > 0 && (
              <section>
                <h2 className={`text-sm font-bold uppercase tracking-wider ${r.heading}`} style={{ color: accentColor }}>{L.references}</h2>
                <div className={r.item}>
                  {references.filter(Boolean).map((ref) => (
                    <div key={ref.id} className={`${r.cardPad} bg-slate-50 rounded-lg`}>
                      <p className="text-sm font-bold text-slate-800">{ref.name}</p>
                      <p className="text-xs text-slate-500">{ref.position} - {ref.company}</p>
                      <p className="text-xs text-slate-400">{ref.email}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
