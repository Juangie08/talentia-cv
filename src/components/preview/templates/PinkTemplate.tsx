'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { Mail, Phone, MapPin, Linkedin, Heart, Briefcase, GraduationCap, Award } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, getLanguageLevelWidth, formatDateRange, rhythm } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

/** PinkTemplate: Diseño cute y profesional en tonos rosa */
export default function PinkTemplate({ cv, showPhoto = true, density = 'normal', locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);

  const rootRef = useRef<HTMLDivElement>(null);

  const experienceBlock = experience.length > 0 ? (
    <section className={r.sectionMb}>
      <div className={`flex items-center gap-2 ${r.heading}`}>
        <Briefcase className="w-5 h-5 shrink-0 text-rose-500" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-rose-500">
          {L.experience}
        </h2>
      </div>

      <div className={r.item}>
        {experience.map((exp) => (
          <div key={exp.id} className={`bg-rose-50 rounded-xl border-l-4 border-rose-400 ${r.cardPad}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0">
                <h4 className="text-base font-bold text-slate-800">{exp.position}</h4>
                <p className="text-sm font-medium text-rose-600">{exp.company}</p>
              </div>
              <span className="text-xs bg-white px-3 py-1 rounded-full text-slate-500 shadow-sm shrink-0">
                {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
              </span>
            </div>
            {exp.achievements.length > 0 && (
              <ul className={`text-xs text-slate-600 mt-2 ${r.tight}`}>
                {exp.achievements.filter(Boolean).map((achievement, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="shrink-0 text-rose-400">✦</span>
                    {achievement}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const educationBlock = education.length > 0 ? (
    <section>
      <div className={`flex items-center gap-2 ${r.heading}`}>
        <GraduationCap className="w-5 h-5 shrink-0 text-rose-500" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-rose-500">
          {L.educationShort}
        </h2>
      </div>

      <div className={r.item}>
        {education.map((edu) => (
          <div key={edu.id} className={`flex items-center gap-4 bg-rose-50 rounded-xl ${r.cardPad}`}>
            <div className="w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800">{edu.degree}</h4>
              <p className="text-xs text-slate-600">{edu.institution}</p>
              {edu.field && <p className="text-xs text-rose-600">{edu.field}</p>}
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
              {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
            </span>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const skillsBlock = skills.length > 0 ? (
    <div className={`bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl text-white ${r.cardPad}`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${r.heading}`}>
        <Award className="w-4 h-4 shrink-0" />
        {L.skills}
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span key={idx} className="px-3 py-1.5 bg-white/20 rounded-full text-xs font-medium text-white">
            {skill}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <div className={`bg-pink-50 rounded-xl ${r.cardPad}`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider text-rose-500 ${r.heading}`}>{L.languages}</h3>
      {languages.map((lang) => (
        <div key={lang.id} className={r.itemMb}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">{lang.name}</span>
            <span className="text-rose-500 font-medium shrink-0">{lang.level}</span>
          </div>
          <div className="w-full h-2 bg-pink-200 rounded-full overflow-hidden">
            <div className="h-full bg-rose-400 rounded-full" style={{ width: getLanguageLevelWidth(lang.level) }} />
          </div>
        </div>
      ))}
    </div>
  ) : null;

  const referencesBlock = references.length > 0 ? (
    <div className={`bg-pink-50 rounded-xl ${r.cardPad}`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider text-rose-500 ${r.heading}`}>{L.references}</h3>
      {references.filter(Boolean).map((ref) => (
        <div key={ref.id} className={`${r.itemMb} bg-white rounded-lg shadow-sm ${r.cardPad}`}>
          <p className="text-sm font-bold text-slate-800">{ref.name}</p>
          <p className="text-xs text-slate-500">{ref.position}</p>
          <p className="text-xs text-pink-400">{ref.email}</p>
        </div>
      ))}
    </div>
  ) : null;

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
    <div ref={rootRef} className="min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: "var(--cv-font-body, Nunito, sans-serif)" }}>
      {/* Header rosa con diseño redondeado */}
      <header className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 p-8 pb-16">
          <div className="flex items-center gap-6">
            {showPhoto && personalInfo.photoUrl && (
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
                <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              </div>
            )}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-7 h-7" />
                <h1 className="text-2xl font-bold">{personalInfo.fullName || 'Nombre Completo'}</h1>
              </div>
              <p className="text-lg font-medium mb-4 text-rose-100">{personalInfo.title || 'Profesional'}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-rose-100">
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
        </div>
        
        {/* Onda decorativa */}
        <div className="absolute bottom-0 left-0 right-0 h-8">
          <svg viewBox="0 0 1440 32" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path fill="white" d="M0,16L48,20C96,24,192,32,288,28C384,24,480,16,576,18C672,20,768,30,864,28C960,26,1056,18,1152,16C1248,14,1344,18,1392,20L1440,22L1440,32L1392,32C1344,32,1248,32,1152,32C1056,32,960,32,864,32C768,32,672,32,576,32C480,32,384,32,288,32C192,32,96,32,48,32L0,32Z"></path>
          </svg>
        </div>
      </header>

      {/* Contenido */}
      <main className="p-8 pt-4">
        {/* Resumen */}
        {summary && (
          <section className={r.sectionMb}>
            <div className={`flex items-center gap-2 ${r.heading}`}>
              <Heart className="w-5 h-5 text-rose-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-rose-500">
                {L.summaryShort}
              </h2>
            </div>
            <p className={`text-sm text-slate-600 leading-relaxed bg-rose-50 rounded-xl ${r.cardPad}`}>{summary}</p>
          </section>
        )}

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-12 gap-8">
          {/* Columna izquierda - Experiencia */}
          <div ref={columns.leftRef} className="col-span-8">
            {columns.left}
          </div>

          {/* Columna derecha - Skills e idiomas */}
          <div ref={columns.rightRef} className={`col-span-4 ${r.section}`}>
            {columns.right}
          </div>
        </div>
      </main>
      {columns.probe}
    </div>
  );
}
