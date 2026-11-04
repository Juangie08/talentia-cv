'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { Mail, Phone, MapPin, Linkedin, Briefcase, GraduationCap, Award } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, getLanguageLevelWidth, formatDateRange, rhythm } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

/** EjecutivoTemplate: Diseño clásico ejecutivo con ribete dorado */
export default function EjecutivoTemplate({ cv, accentColor, density = 'normal', showPhoto = true, locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  const rootRef = useRef<HTMLDivElement>(null);

  const skillsBlock = skills.length > 0 ? (
    <div className={r.sectionMb}>
      <h3 className={`text-xs font-bold uppercase tracking-widest ${r.heading} flex items-center gap-2`} style={{ color: accentColor }}>
        <Award className="w-4 h-4" />
        {L.skills}
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-700">
            {skill}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <div className={r.sectionMb}>
      <h3 className={`text-xs font-bold uppercase tracking-widest ${r.heading}`} style={{ color: accentColor }}>{L.languages}</h3>
      {languages.map((lang) => (
        <article key={lang.id} className={r.itemMb}>
          <div className="flex justify-between text-xs font-medium mb-1">
            <span className="text-slate-700">{lang.name}</span>
            <span className="shrink-0" style={{ color: accentColor }}>{lang.level}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full">
            <div className="h-full rounded-full" style={{ width: getLanguageLevelWidth(lang.level), backgroundColor: accentColor }} />
          </div>
        </article>
      ))}
    </div>
  ) : null;

  const referencesBlock = references.length > 0 ? (
    <div>
      <h3 className={`text-xs font-bold uppercase tracking-widest ${r.heading}`} style={{ color: accentColor }}>{L.references}</h3>
      {references.filter(Boolean).map((ref) => (
        <article key={ref.id} className={`${r.itemMb} ${r.cardPad} bg-white border border-slate-200 rounded`}>
          <p className="text-xs font-bold text-slate-800">{ref.name}</p>
          <p className="text-[10px] text-slate-500">{ref.position}</p>
          <p className="text-[10px] text-slate-500">{ref.company}</p>
        </article>
      ))}
    </div>
  ) : null;

  const summaryBlock = summary ? (
    <div className={r.sectionMb}>
      <h3 className={`text-sm font-bold uppercase tracking-widest ${r.heading} flex items-center gap-2 pb-2 border-b-2`} style={{ borderColor: accentColor, color: accentColor }}>
        <Award className="w-4 h-4" />
        {L.profileProfessional}
      </h3>
      <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
    </div>
  ) : null;

  const experienceBlock = experience.length > 0 ? (
    <div className={r.sectionMb}>
      <h3 className={`text-sm font-bold uppercase tracking-widest ${r.heading} flex items-center gap-2 pb-2 border-b-2`} style={{ borderColor: accentColor, color: accentColor }}>
        <Briefcase className="w-4 h-4" />
        {L.experienceJobs}
      </h3>
      <div className={r.item}>
        {experience.map((exp) => (
          <article key={exp.id}>
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-800">{exp.position}</h4>
                <p className="text-xs font-medium" style={{ color: accentColor }}>{exp.company}</p>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
              </span>
            </div>
            {exp.achievements.length > 0 && (
              <ul className={`text-xs text-slate-600 ${r.tight} ml-4`}>
                {exp.achievements.filter(Boolean).map((achievement, idx) => (
                  <li key={idx} className="list-disc">• {achievement}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  ) : null;

  const educationBlock = education.length > 0 ? (
    <div>
      <h3 className={`text-sm font-bold uppercase tracking-widest ${r.heading} flex items-center gap-2 pb-2 border-b-2`} style={{ borderColor: accentColor, color: accentColor }}>
        <GraduationCap className="w-4 h-4" />
        {L.education}
      </h3>
      <div className={r.item}>
        {education.map((edu) => (
          <article key={edu.id} className="flex justify-between items-start">
            <div className="min-w-0">
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
    </div>
  ) : null;

  // El encabezado con nombre, cargo, foto y contacto ocupa todo el ancho: no
  // pertenece a ninguna columna y por eso no se balancea.
  const sections = [
    { id: 'skills', node: skillsBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'languages', node: languagesBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'references', node: referencesBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'summary', node: summaryBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'experience', node: experienceBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'education', node: educationBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
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
    <div ref={rootRef} className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, Georgia, serif)" }}>
      {/* Header con ribete dorado */}
      <header className={`bg-gradient-to-r from-slate-800 to-slate-900 text-white ${r.page} border-b-4`} style={{ borderColor: accentColor }}>
        <div className="flex items-start gap-6">
          {showPhoto && personalInfo.photoUrl && (
            <div className="w-28 h-28 rounded-full overflow-hidden border-3 border-amber-400 shadow-lg flex-shrink-0">
              <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-wide mb-1">{personalInfo.fullName || 'Nombre Completo'}</h1>
            <p className="text-lg text-amber-400 font-medium mb-4">{personalInfo.title || 'Título Profesional'}</p>

            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
              {personalInfo.email && (
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="break-all">{personalInfo.email}</span>
                </span>
              )}
              {personalInfo.phone && (
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0 text-amber-400" />
                  {personalInfo.phone}
                </span>
              )}
              {personalInfo.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0 text-amber-400" />
                  {personalInfo.location}
                </span>
              )}
              {personalInfo.linkedin && (
                <span className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 shrink-0 text-amber-400" />
                  <span className="break-all">{stripUrlProtocol(personalInfo.linkedin)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="grid grid-cols-3 gap-0">
        {/* Columna izquierda - Fondo claro */}
        <div ref={columns.leftRef} className="col-span-1 bg-slate-50 p-6 border-r">
          {columns.left}
        </div>

        {/* Columna derecha - Contenido principal */}
        <div ref={columns.rightRef} className="col-span-2 p-6">
          {columns.right}
        </div>
      </div>
      {columns.probe}
    </div>
  );
}
