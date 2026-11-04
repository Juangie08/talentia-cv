'use client';

/* eslint-disable @next/next/no-img-element */
import { Mail, Phone, MapPin, Linkedin, Globe, MessageSquare, Award, BookOpen, Languages } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, formatDateRange, rhythm } from './shared';
import { sectionLabels } from '@/lib/sectionLabels';

/** CustomerServiceTemplate: layout optimizado para roles de servicio al cliente */
export default function CustomerServiceTemplate({
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
    <div className={`${r.page} w-full bg-white text-slate-800 cv-template-wrapper`} style={{ fontFamily, minHeight: '1056px' }}>
      <div className={r.section}>
        <header className="flex flex-col md:flex-row justify-between items-start border-b border-slate-100 pb-6 gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">{personalInfo.fullName || 'Nombre Completo'}</h1>
            <p className="text-lg font-semibold" style={{ color: accentColor }}>
              {personalInfo.title || 'Titulo Profesional'}
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium text-slate-500">
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
            {(personalInfo.linkedin || personalInfo.website) && (
              <div className="flex flex-wrap gap-4 mt-2 text-xs font-medium text-slate-400">
                {personalInfo.linkedin && (
                  <span className="flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5" /> {stripUrlProtocol(personalInfo.linkedin)}
                  </span>
                )}
                {personalInfo.website && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> {stripUrlProtocol(personalInfo.website)}
                  </span>
                )}
              </div>
            )}
          </div>

          {showPhoto && personalInfo.photoUrl && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 shrink-0 shadow-sm self-center md:self-start">
              <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          )}
        </header>

        {summary && (
          <section>
            <h2 className={`text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ${r.heading}`}>
              <MessageSquare className="w-3.5 h-3.5" />
              {L.profileProfessional}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <h2 className={`text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-1 ${r.heading}`}>
              <Award className="w-3.5 h-3.5" />
              {L.experienceProfessional}
            </h2>
            <div className={r.item}>
              {experience.map((exp) => (
                <article key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-900 text-sm">{exp.position}</h3>
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
                    </span>
                  </div>
                  <p className="font-bold text-xs mb-2" style={{ color: accentColor }}>
                    {exp.company}
                  </p>
                  <ul className={r.tight}>
                    {exp.achievements.map((achievement, index) => (
                      <li
                        key={index}
                        className="text-xs text-slate-600 leading-relaxed pl-4 relative before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:bg-slate-300 before:rounded-full"
                      >
                        {achievement}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {skills.length > 0 && (
            <section>
              <h2 className={`text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-1 ${r.heading}`}>
                <Award className="w-3.5 h-3.5" />
                {L.skills}
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h2 className={`text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-1 ${r.heading}`}>
                <Languages className="w-3.5 h-3.5" />
                {L.languages}
              </h2>
              <ul className={r.tight}>
                {languages.map((language) => (
                  <li key={language.id} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">{language.name}</span>
                    <span className="text-[10px] pb-0.5 px-2 bg-slate-50 border border-slate-100 rounded text-slate-500 font-bold uppercase">
                      {language.level}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {education.length > 0 && (
            <section className="md:col-span-2">
              <h2 className={`text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 border-b pb-1 ${r.heading}`}>
                <BookOpen className="w-3.5 h-3.5" />
                {L.educationShort}
              </h2>
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${r.cardGap}`}>
                {education.map((edu) => (
                  <article key={edu.id} className="text-xs">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-bold text-slate-800">{edu.degree}</h3>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{edu.institution}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
