'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { Mail, Phone, MapPin, Linkedin, TrendingUp, Briefcase, GraduationCap, Award } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, formatDateRange, rhythm } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

/** FinanceTemplate: Diseño especializado para profesionales financieros */
export default function FinanceTemplate({ cv, accentColor, density = 'normal', showPhoto = true, locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  const rootRef = useRef<HTMLDivElement>(null);

  const summaryBlock = summary ? (
    <div className={r.sectionMb}>
      <h3 className={`text-xs font-bold uppercase tracking-widest ${r.heading} flex items-center gap-2`} style={{ color: accentColor }}>
        <Award className="w-4 h-4" />
        {L.profile}
      </h3>
      <p className="text-xs text-slate-600 leading-relaxed">{summary}</p>
    </div>
  ) : null;

  const skillsBlock = skills.length > 0 ? (
    <div className={r.sectionMb}>
      <h3 className={`text-xs font-bold uppercase tracking-widest ${r.heading} flex items-center gap-2`} style={{ color: accentColor }}>
        <TrendingUp className="w-4 h-4" />
        {L.skills}
      </h3>
      <div className={r.tight}>
        {skills.map((skill, idx) => (
          <article key={idx} className="text-xs text-slate-700 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
            {skill}
          </article>
        ))}
      </div>
    </div>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <div className={r.sectionMb}>
      <h3 className={`text-xs font-bold uppercase tracking-widest ${r.heading}`} style={{ color: accentColor }}>{L.languages}</h3>
      {languages.map((lang) => (
        <article key={lang.id} className={`flex justify-between text-xs ${r.itemMb}`}>
          <span className="text-slate-700">{lang.name}</span>
          <span className="font-medium shrink-0" style={{ color: accentColor }}>{lang.level}</span>
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
          <p className="text-[10px] text-slate-400">{ref.email}</p>
        </article>
      ))}
    </div>
  ) : null;

  const experienceBlock = experience.length > 0 ? (
    <div className={r.sectionMb}>
      <h3 className={`text-sm font-bold uppercase tracking-widest ${r.heading} flex items-center gap-2 pb-2 border-b-2`} style={{ borderColor: accentColor, color: accentColor }}>
        <Briefcase className="w-4 h-4" />
        {L.experienceProfessional}
      </h3>
      <div className={r.item}>
        {experience.map((exp) => (
          <article key={exp.id}>
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-800">{exp.position}</h4>
                <p className="text-xs font-medium" style={{ color: accentColor }}>{exp.company}</p>
              </div>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 shrink-0">
                {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
              </span>
            </div>
            {exp.achievements.length > 0 && (
              <ul className={`text-xs text-slate-600 ${r.tight}`}>
                {exp.achievements.filter(Boolean).map((achievement, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="shrink-0" style={{ color: accentColor }}>▸</span>
                    {achievement}
                  </li>
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
          <article key={edu.id} className={`flex justify-between items-start ${r.cardPad} bg-slate-50 rounded`}>
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

  // El encabezado con nombre, cargo y contacto es a todo el ancho: no
  // pertenece a ninguna columna y por eso no se balancea.
  const sections = [
    { id: 'summary', node: summaryBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'skills', node: skillsBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'languages', node: languagesBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'references', node: referencesBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
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
    <div ref={rootRef} className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, Arial, sans-serif)" }}>
      {/* Header con gradiente verde */}
      <header className={`bg-gradient-to-r from-slate-800 to-slate-900 text-white ${r.page}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-8 h-8 shrink-0" style={{ color: accentColor }} />
              <h1 className="text-3xl font-bold">{personalInfo.fullName || 'Nombre Completo'}</h1>
            </div>
            <p className="text-lg font-medium mb-4" style={{ color: accentColor }}>{personalInfo.title || 'Profesional Financiero'}</p>

            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
              {personalInfo.email && (
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                  <span className="break-all">{personalInfo.email}</span>
                </span>
              )}
              {personalInfo.phone && (
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                  {personalInfo.phone}
                </span>
              )}
              {personalInfo.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                  {personalInfo.location}
                </span>
              )}
              {personalInfo.linkedin && (
                <span className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                  <span className="break-all">{stripUrlProtocol(personalInfo.linkedin)}</span>
                </span>
              )}
            </div>
          </div>

          {showPhoto && personalInfo.photoUrl && (
            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 shadow-lg shrink-0" style={{ borderColor: accentColor }}>
              <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          )}
        </div>
      </header>

      {/* Contenido en 2 columnas */}
      <div className="grid grid-cols-12 gap-0">
        {/* Sidebar izquierdo */}
        <aside ref={columns.leftRef} className="col-span-4 bg-slate-50 p-6 border-r">
          {columns.left}
        </aside>

        {/* Columna derecha principal */}
        <div ref={columns.rightRef} className="col-span-8 p-6">
          {columns.right}
        </div>
      </div>
      {columns.probe}
    </div>
  );
}
