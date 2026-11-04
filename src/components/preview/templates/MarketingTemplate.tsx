'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { Mail, Phone, MapPin, Linkedin, Megaphone, Briefcase, GraduationCap, Award } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, getLanguageLevelWidth, formatDateRange, rhythm } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

/** MarketingTemplate: Diseño creativo y moderno para profesionales de marketing */
export default function MarketingTemplate({ cv, accentColor, density = 'normal', showPhoto = true, locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  const rootRef = useRef<HTMLDivElement>(null);

  const experienceBlock = experience.length > 0 ? (
    <section className={r.sectionMb}>
      <h2 className={`text-sm font-bold uppercase tracking-wider ${r.heading} flex items-center gap-2`} style={{ color: accentColor }}>
        <Briefcase className="w-4 h-4" />
        {L.experience}
      </h2>
      <div className={r.item}>
        {experience.map((exp) => (
          <article key={exp.id} className="relative pl-6">
            <div className="absolute left-0 top-2 w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
            <div className="absolute left-1 top-5 w-px h-full" style={{ backgroundColor: accentColor + '40' }} />

            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-800">{exp.position}</h4>
                <p className="text-sm font-medium" style={{ color: accentColor }}>{exp.company}</p>
              </div>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 shrink-0">
                {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
              </span>
            </div>
            {exp.achievements.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {exp.achievements.filter(Boolean).map((achievement, idx) => (
                  <div key={idx} className="text-xs text-slate-600 flex gap-1">
                    <span className="shrink-0" style={{ color: accentColor }}>★</span>
                    {achievement}
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const educationBlock = education.length > 0 ? (
    <section>
      <h2 className={`text-sm font-bold uppercase tracking-wider ${r.heading} flex items-center gap-2`} style={{ color: accentColor }}>
        <GraduationCap className="w-4 h-4" />
        {L.educationShort}
      </h2>
      <div className={r.item}>
        {education.map((edu) => (
          <article key={edu.id} className={`flex gap-4 ${r.cardPad} bg-slate-50 rounded-lg`}>
            <div className="w-2 h-full rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800">{edu.degree}</h4>
              <p className="text-xs text-slate-600">{edu.institution}</p>
              {edu.field && <p className="text-xs text-slate-500">{edu.field}</p>}
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
              {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
            </span>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const skillsBlock = skills.length > 0 ? (
    <div className={`cv-dark-panel ${r.cardPad} bg-slate-900 rounded-xl`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider ${r.heading} text-white flex items-center gap-2`}>
        <Megaphone className="w-4 h-4 shrink-0" style={{ color: accentColor }} />Skills</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: accentColor }}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <div className={`${r.cardPad} bg-slate-50 rounded-xl`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider ${r.heading}`} style={{ color: accentColor }}>{L.languages}</h3>
      {languages.map((lang) => (
        <article key={lang.id} className={r.itemMb}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">{lang.name}</span>
            <span className="shrink-0" style={{ color: accentColor }}>{lang.level}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: getLanguageLevelWidth(lang.level), backgroundColor: accentColor }} />
          </div>
        </article>
      ))}
    </div>
  ) : null;

  const referencesBlock = references.length > 0 ? (
    <div className={`${r.cardPad} bg-slate-50 rounded-xl`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider ${r.heading}`} style={{ color: accentColor }}>{L.references}</h3>
      {references.filter(Boolean).map((ref) => (
        <article key={ref.id} className={`${r.itemMb} ${r.cardPad} bg-white rounded-lg shadow-sm`}>
          <p className="text-sm font-bold text-slate-800">{ref.name}</p>
          <p className="text-xs text-slate-500">{ref.position}</p>
          <p className="text-xs text-slate-400">{ref.company}</p>
        </article>
      ))}
    </div>
  ) : null;

  // El encabezado y el perfil "Sobre Mi" ocupan todo el ancho por encima del
  // grid, asi que no forman parte de ninguna columna.
  const sections = [
    { id: 'experience', node: experienceBlock, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'education', node: educationBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'skills', node: skillsBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
    { id: 'languages', node: languagesBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
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
    <div ref={rootRef} className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, Verdana, sans-serif)" }}>
      {/* Header con diseño diagonal */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${accentColor} 10px, ${accentColor} 20px)`
        }} />

        <div className={`relative ${r.page} flex items-center gap-8`}>
          {showPhoto && personalInfo.photoUrl && (
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 shadow-2xl flex-shrink-0" style={{ borderColor: accentColor }}>
              <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          )}

          <div className="flex-1 text-white min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Megaphone className="w-8 h-8 shrink-0" style={{ color: accentColor }} />
              <h1 className="text-3xl font-bold tracking-tight">{personalInfo.fullName || 'Nombre Completo'}</h1>
            </div>
            <p className="text-xl font-medium mb-4" style={{ color: accentColor }}>{personalInfo.title || 'Profesional de Marketing'}</p>

            <div className="flex flex-wrap gap-4 text-sm">
              {personalInfo.email && (
                <span className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                  <span className="break-all">{personalInfo.email}</span>
                </span>
              )}
              {personalInfo.phone && (
                <span className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                  {personalInfo.phone}
                </span>
              )}
              {personalInfo.location && (
                <span className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                  {personalInfo.location}
                </span>
              )}
              {personalInfo.linkedin && (
                <span className="flex items-center gap-2 text-slate-300">
                  <Linkedin className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                  <span className="break-all">{stripUrlProtocol(personalInfo.linkedin)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className={r.page}>
        {/* Resumen con estilo destacado */}
        {summary && (
          <section className={`${r.sectionMb} ${r.cardPad} rounded-xl bg-gradient-to-r from-slate-50 to-white border-l-4`} style={{ borderColor: accentColor }}>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${r.heading} flex items-center gap-2`} style={{ color: accentColor }}>
              <Award className="w-4 h-4" />
              {L.summaryShort}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Grid de 2 columnas asimétrico */}
        <div className="grid grid-cols-12 gap-8">
          {/* Columna principal - Experiencia */}
          <div ref={columns.leftRef} className="col-span-8">
            {columns.left}
          </div>

          {/* Sidebar - Habilidades e idiomas */}
          <div ref={columns.rightRef} className={`col-span-4 ${r.section}`}>
            {columns.right}
          </div>
        </div>
      </main>
      {columns.probe}
    </div>
  );
}
