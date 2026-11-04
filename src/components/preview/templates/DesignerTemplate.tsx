'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { Mail, Phone, MapPin, Linkedin, Palette, Briefcase, GraduationCap, Award, Globe } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, formatDateRange, rhythm } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

/** DesignerTemplate: Diseño moderno para diseñadores y creativos */
export default function DesignerTemplate({ cv, accentColor, showPhoto = true, density = 'normal', locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  const rootRef = useRef<HTMLDivElement>(null);

  const experienceBlock = experience.length > 0 ? (
    <section className={r.sectionMb}>
      <div className={`flex items-center gap-2 ${r.heading}`}>
        <Briefcase className="w-5 h-5 shrink-0" style={{ color: accentColor }} />
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: accentColor }}>
          {L.experienceProjects}
        </h2>
      </div>

      <div className={r.item}>
        {experience.map((exp) => (
          <article key={exp.id} className="group relative p-5 bg-slate-50 rounded-2xl">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: accentColor }} />

            <div className="flex justify-between items-start mb-2 pl-3">
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-800">{exp.position}</h4>
                <p className="text-sm font-medium" style={{ color: accentColor }}>{exp.company}</p>
              </div>
              <span className="text-xs bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-500 shrink-0">
                {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
              </span>
            </div>

            {exp.achievements.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3 pl-3">
                {exp.achievements.filter(Boolean).map((achievement, idx) => (
                  <div key={idx} className="text-xs text-slate-600 flex items-start gap-1">
                    <span className="text-lg shrink-0" style={{ color: accentColor }}>•</span>
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
      <div className={`flex items-center gap-2 ${r.heading}`}>
        <GraduationCap className="w-5 h-5 shrink-0" style={{ color: accentColor }} />
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: accentColor }}>
          {L.educationPlain}
        </h2>
      </div>

      <div className={r.item}>
        {education.map((edu) => (
          <article key={edu.id} className={`flex items-center gap-4 ${r.cardPad} bg-slate-50 rounded-xl`}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: accentColor + '20' }}>
              <GraduationCap className="w-6 h-6" style={{ color: accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800">{edu.degree}</h4>
              <p className="text-xs text-slate-600">{edu.institution}</p>
              {edu.field && <p className="text-xs" style={{ color: accentColor }}>{edu.field}</p>}
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
            </span>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const skillsBlock = skills.length > 0 ? (
    <div className={`cv-dark-panel ${r.cardPad} bg-slate-900 rounded-2xl text-white`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider ${r.heading} flex items-center gap-2`}>
        <Palette className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
        Herramientas & Skills
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span key={idx} className="px-3 py-2 rounded-lg text-xs font-medium border border-white/20">
            {skill}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <div className={`${r.cardPad} bg-slate-50 rounded-2xl`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider ${r.heading}`} style={{ color: accentColor }}>{L.languages}</h3>
      {languages.map((lang) => (
        <article key={lang.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
          <span className="text-sm font-medium text-slate-700">{lang.name}</span>
          <span className="text-xs px-2 py-1 rounded shrink-0" style={{ backgroundColor: accentColor + '20', color: accentColor }}>
            {lang.level}
          </span>
        </article>
      ))}
    </div>
  ) : null;

  const referencesBlock = references.length > 0 ? (
    <div className={`${r.cardPad} bg-slate-50 rounded-2xl`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider ${r.heading}`} style={{ color: accentColor }}>{L.references}</h3>
      {references.filter(Boolean).map((ref) => (
        <article key={ref.id} className={`${r.itemMb} ${r.cardPad} bg-white rounded-xl shadow-sm`}>
          <p className="text-sm font-bold text-slate-800">{ref.name}</p>
          <p className="text-xs text-slate-500">{ref.position}</p>
          <p className="text-xs text-slate-400">{ref.company}</p>
        </article>
      ))}
    </div>
  ) : null;

  // El encabezado y el "Acerca de Mi" ocupan todo el ancho sobre el grid.
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
    <div ref={rootRef} className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, Poppins, sans-serif)" }}>
      {/* Header con diseño creativo */}
      <header className="cv-dark-panel relative bg-slate-900 text-white overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl" style={{ backgroundColor: accentColor }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl" style={{ backgroundColor: '#EC4899' }} />
        </div>

        <div className={`relative ${r.page}`}>
          <div className="flex items-start gap-8">
            {showPhoto && personalInfo.photoUrl && (
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl flex-shrink-0">
                <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <Palette className="w-8 h-8 shrink-0" style={{ color: accentColor }} />
                <h1 className="text-3xl font-bold tracking-tight">{personalInfo.fullName || 'Nombre Completo'}</h1>
              </div>
              <p className="text-xl font-medium mb-4" style={{ color: accentColor }}>{personalInfo.title || 'Diseñador'}</p>

              <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                {personalInfo.email && (
                  <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                    <Mail className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                    <span className="break-all">{personalInfo.email}</span>
                  </span>
                )}
                {personalInfo.phone && (
                  <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                    <Phone className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                    {personalInfo.phone}
                  </span>
                )}
                {personalInfo.location && (
                  <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                    {personalInfo.location}
                  </span>
                )}
                {personalInfo.linkedin && (
                  <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                    <Linkedin className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                    <span className="break-all">{stripUrlProtocol(personalInfo.linkedin)}</span>
                  </span>
                )}
                {personalInfo.website && (
                  <span className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                    <Globe className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                    <span className="break-all">{stripUrlProtocol(personalInfo.website)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className={r.page}>
        {/* Resumen con estilo destacado */}
        {summary && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <Award className="w-5 h-5 shrink-0" style={{ color: accentColor }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: accentColor }}>
                Acerca de Mí
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Grid de 2 columnas asimétrico */}
        <div className="grid grid-cols-12 gap-8">
          {/* Columna principal - Experiencia */}
          <div ref={columns.leftRef} className="col-span-8">
            {columns.left}
          </div>

          {/* Sidebar - Habilidades y más */}
          <div ref={columns.rightRef} className={`col-span-4 ${r.section}`}>
            {columns.right}
          </div>
        </div>
      </main>
      {columns.probe}
    </div>
  );
}
