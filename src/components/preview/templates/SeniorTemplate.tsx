'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { Mail, Phone, MapPin, Linkedin, Star, Briefcase, GraduationCap, Award } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, getLanguageLevelWidth, formatDateRange, rhythm } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

/** SeniorTemplate: Diseño para profesionales senior/experiencia */
export default function SeniorTemplate({ cv, showPhoto = true, density = 'normal', locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  const rootRef = useRef<HTMLDivElement>(null);

  const educationBlock = education.length > 0 ? (
    <section>
      <div className={`flex items-center gap-2 ${r.heading}`}>
        <GraduationCap className="w-5 h-5 shrink-0 text-amber-600" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-amber-700">
          {L.education}
        </h2>
      </div>

      <div className={r.item}>
        {education.map((edu) => (
          <div key={edu.id} className={`flex gap-4 bg-amber-50 rounded-lg ${r.cardPad}`}>
            <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-800">{edu.degree}</h4>
              <p className="text-sm text-slate-600">{edu.institution}</p>
              {edu.field && <p className="text-xs text-amber-700">{edu.field}</p>}
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap self-center shrink-0">
              {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
            </span>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const skillsBlock = skills.length > 0 ? (
    <div className={`bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl ${r.cardPad}`}>
      <h3 className={`text-xs font-bold uppercase tracking-widest text-amber-700 flex items-center gap-2 ${r.heading}`}>
        <Star className="w-4 h-4 shrink-0" />
        {L.skillsKey}
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span key={idx} className="px-3 py-1.5 bg-white border border-amber-200 rounded-full text-xs font-semibold text-slate-700">
            {skill}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <div className={`bg-amber-50 rounded-xl ${r.cardPad}`}>
      <h3 className={`text-xs font-bold uppercase tracking-widest text-amber-700 ${r.heading}`}>{L.languages}</h3>
      {languages.map((lang) => (
        <div key={lang.id} className={r.itemMb}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">{lang.name}</span>
            <span className="text-amber-700 font-semibold shrink-0">{lang.level}</span>
          </div>
          <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: getLanguageLevelWidth(lang.level) }} />
          </div>
        </div>
      ))}
    </div>
  ) : null;

  const referencesBlock = references.length > 0 ? (
    <div className={`bg-amber-50 rounded-xl ${r.cardPad}`}>
      <h3 className={`text-xs font-bold uppercase tracking-widest text-amber-700 ${r.heading}`}>{L.references}</h3>
      {references.filter(Boolean).map((ref) => (
        <div key={ref.id} className={`${r.itemMb} bg-white rounded-lg shadow-sm ${r.cardPad}`}>
          <p className="text-sm font-bold text-slate-800">{ref.name}</p>
          <p className="text-xs text-slate-500">{ref.position}</p>
          <p className="text-xs text-slate-400">{ref.company}</p>
        </div>
      ))}
    </div>
  ) : null;

  // El resumen y la experiencia ocupan todo el ancho sobre el grid: se leen
  // primero y no compiten por altura con las columnas.
  const sections = [
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
    <div ref={rootRef} className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, Garamond, serif)" }}>
      {/* Header elegante dorado */}
      <header className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-white p-8">
        <div className="flex items-center gap-8">
          {showPhoto && personalInfo.photoUrl && (
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl flex-shrink-0">
              <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-8 h-8" />
              <h1 className="text-3xl font-bold tracking-wide">{personalInfo.fullName || 'Nombre Completo'}</h1>
            </div>
            <p className="text-xl font-medium mb-4 text-amber-100">{personalInfo.title || 'Profesional Senior'}</p>
            
            <div className="flex flex-wrap gap-6 text-sm text-amber-100">
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

      {/* Contenido principal */}
      <main className="p-8">
        {/* Resumen con estilo ejecutivo */}
        {summary && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-700">
                Trayectoria Profesional
              </h2>
            </div>
            <p className="text-base text-slate-700 leading-relaxed italic border-l-4 border-amber-500 pl-4">{summary}</p>
          </section>
        )}

        {/* Experiencia destacada */}
        {experience.length > 0 && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <Briefcase className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-amber-700">
                {L.experienceProfessional}
              </h2>
            </div>
            
            <div className={r.item}>
              {experience.map((exp) => (
                <div key={exp.id} className="relative pl-6 border-l-2 border-amber-200">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-white" />
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">{exp.position}</h4>
                      <p className="text-sm font-semibold text-amber-700">{exp.company}</p>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
                    </span>
                  </div>
                  
                  {exp.achievements.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {exp.achievements.filter(Boolean).map((achievement, idx) => (
                        <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                          <Star className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span>{achievement}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Grid 2 columnas */}
        <div className="grid grid-cols-12 gap-8">
          {/* Educación */}
          <div ref={columns.leftRef} className="col-span-7">
            {columns.left}
          </div>

          {/* Sidebar */}
          <div ref={columns.rightRef} className={`col-span-5 ${r.section}`}>
            {columns.right}
          </div>
        </div>
      </main>
      {columns.probe}
    </div>
  );
}
