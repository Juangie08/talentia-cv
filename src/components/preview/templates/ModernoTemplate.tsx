'use client';

/* eslint-disable @next/next/no-img-element */
import { useRef } from 'react';
import { Mail, Phone, MapPin, Linkedin, Award, Languages, Users } from 'lucide-react';
import { CustomTemplateProps, stripUrlProtocol, getLanguageLevelWidth, formatDateRange, rhythm } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

/** Template Moderno: Optimizado para perfiles corporativos y de servicios */
export default function ModernoTemplate({ cv, accentColor, fontFamily, showPhoto = true, density = 'normal', locale }: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages, references } = cv;
  const r = rhythm(density);
  const accent = accentColor || 'var(--cv-color-accent, #2563EB)';
  const resolvedFont = fontFamily || 'var(--cv-font-body, Inter, sans-serif)';

  const rootRef = useRef<HTMLDivElement>(null);

  const avatar = showPhoto ? (
    <div className={`text-center ${r.itemMb}`}>
      {personalInfo.photoUrl ? (
        <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-slate-700 mx-auto shadow-inner">
          <img src={personalInfo.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" loading="lazy" decoding="async" />
        </div>
      ) : (
        <div className="w-24 h-24 rounded-2xl mx-auto flex items-center justify-center text-4xl font-black text-white shadow-xl" style={{ backgroundColor: accent }}>
          {personalInfo.fullName?.charAt(0) || '?'}
        </div>
      )}
    </div>
  ) : null;

  const contact = (
    <div className={`${r.sectionMb}`}>
      <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${r.heading}`} style={{ color: accent }}>
        <Users className="w-3.5 h-3.5" />
        {L.contact}
      </h3>
      <ul className={r.item}>
        {personalInfo.email && (
          <li className="flex items-start gap-3">
            <Mail className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accent }} />
            <span className="text-[10px] break-all leading-relaxed text-slate-300">{personalInfo.email}</span>
          </li>
        )}
        {personalInfo.phone && (
          <li className="flex items-start gap-3">
            <Phone className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accent }} />
            <span className="text-[10px] leading-relaxed text-slate-300">{personalInfo.phone}</span>
          </li>
        )}
        {personalInfo.location && (
          <li className="flex items-start gap-3">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accent }} />
            <span className="text-[10px] leading-relaxed text-slate-300">{personalInfo.location}</span>
          </li>
        )}
        {personalInfo.linkedin && (
          <li className="flex items-start gap-3">
            <Linkedin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accent }} />
            <span className="text-[10px] break-all leading-relaxed text-slate-300">{stripUrlProtocol(personalInfo.linkedin)}</span>
          </li>
        )}
      </ul>
    </div>
  );

  const languagesBlock = languages.length > 0 ? (
    <div className={r.sectionMb}>
      <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${r.heading}`} style={{ color: accent }}>
        <Languages className="w-3.5 h-3.5" />
        {L.languages}
      </h3>
      <div className={r.item}>
        {languages.map((language) => (
          <div key={language.id} className={r.tight}>
            <div className="flex justify-between text-[10px] font-bold">
              <span>{language.name}</span>
              <span style={{ color: accent }}>{language.level}</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full" style={{ width: getLanguageLevelWidth(language.level), backgroundColor: accent }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const skillsBlock = skills.length > 0 ? (
    <div>
      <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${r.heading}`} style={{ color: accent }}>
        <Award className="w-3.5 h-3.5" />
        {L.skills}
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span key={index} className="text-[9px] bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700">
            {skill}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  // Nombre y cargo. Es lo primero que se lee, asi que abre la columna
  // principal y no se mueve de ahi.
  const headerBlock = (
    <header className={`text-center sm:text-left ${r.sectionMb}`}>
      <h1 className="cv-name font-extrabold text-slate-900 tracking-tight mb-2" style={{ fontSize: 'var(--cv-font-size-name, 26px)', color: 'var(--cv-color-body-text, #111827)' }}>{personalInfo.fullName || 'Tu Nombre'}</h1>
      {personalInfo.title && <p className="text-lg font-medium" style={{ color: accent }}>{personalInfo.title}</p>}
    </header>
  );

  const summaryBlock = summary ? (
    <section className={r.sectionMb}>
      <h2 className={`cv-section-title text-slate-400 border-b border-slate-100 pb-2 ${r.heading}`} style={{ color: accent, fontSize: 'var(--cv-font-size-heading, 12px)' }}>
        {L.profileProfessional}
      </h2>
      <p className="text-slate-600 leading-relaxed font-medium" style={{ fontSize: 'var(--cv-font-size-base, 10px)' }}>{summary}</p>
    </section>
  ) : null;

  const experienceBlock = experience.length > 0 ? (
    <section className={r.sectionMb}>
      <h2 className={`cv-section-title text-slate-400 border-b border-slate-100 pb-2 ${r.heading}`} style={{ color: accent, fontSize: 'var(--cv-font-size-heading, 12px)' }}>
        {L.experienceJobs}
      </h2>
      <div className={r.item}>
        {experience.map((exp) => (
          <div key={exp.id} className="relative pl-6">
            <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="font-bold text-slate-900" style={{ fontSize: 'var(--cv-font-size-base, 10px)' }}>{exp.position}</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
              </span>
            </div>
            <p className="font-bold text-xs mb-2" style={{ color: accent }}>{exp.company}</p>
            <ul className={r.tight}>
              {exp.achievements.map((achievement, index) => (
                <li key={index} className="text-sm text-slate-600 leading-snug">
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const educationBlock = education.length > 0 ? (
    <section className={r.sectionMb}>
      <h2 className={`cv-section-title text-slate-400 border-b border-slate-100 pb-2 ${r.heading}`} style={{ color: accent, fontSize: 'var(--cv-font-size-heading, 12px)' }}>{L.educationShort}</h2>
      <div className={`grid grid-cols-1 ${r.cardGap}`}>
        {education.map((edu) => (
          <div key={edu.id} className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-900" style={{ fontSize: 'var(--cv-font-size-base, 10px)' }}>
                {edu.degree}
                {edu.field ? ` en ${edu.field}` : ''}
              </h3>
              <p className="text-slate-500 text-xs font-medium">{edu.institution}</p>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}</span>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const referencesBlock = references.length > 0 ? (
    <section>
      <h2 className={`cv-section-title text-slate-400 border-b border-slate-100 pb-2 ${r.heading}`} style={{ color: accent, fontSize: 'var(--cv-font-size-heading, 12px)' }}>
        {L.referencesProfessional}
      </h2>
      <div className={`grid grid-cols-2 ${r.cardGap}`}>
        {references.map((reference) => (
          <div key={reference.id} className="text-xs space-y-0.5">
            <p className="font-bold text-slate-900">{reference.name}</p>
            <p className="text-slate-500 font-medium italic">
              {reference.position} en {reference.company}
            </p>
            <p className="text-slate-400 font-bold tracking-tighter">{reference.phone}</p>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  const sections = [
    // La foto ancla el bloque de color, así que no se mueve.
    { id: 'avatar', node: avatar, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'header', node: headerBlock, columns: ['right'] as const, prefer: 'right' as const },
    // Contacto, habilidades e idiomas llevan colores pensados para el fondo
    // oscuro de la barra (texto claro, pastillas slate-800). Si se movieran a
    // la columna blanca quedarían oscuro sobre oscuro, así que quedan fijas.
    { id: 'contact', node: contact, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'skills', node: skillsBlock, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'languages', node: languagesBlock, columns: ['left'] as const, prefer: 'left' as const },
    // Estas tres sí viajan: son contenido claro que se lee en ambos lados.
    { id: 'summary', node: summaryBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'experience', node: experienceBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'education', node: educationBlock, columns: ['left', 'right'] as const, prefer: 'right' as const },
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
    <div ref={rootRef} className="flex min-h-[1056px] bg-white border shadow-sm print:shadow-none cv-template-wrapper" style={{ fontFamily: resolvedFont }}>
      <aside ref={columns.leftRef} className={`cv-dark-panel w-[240px] bg-slate-900 text-slate-100 flex flex-shrink-0 flex-col ${r.page}`} style={{ backgroundColor: 'var(--cv-color-header-bg, #1e293b)', color: 'var(--cv-color-header-text, #fff)' }}>
        {columns.left}
      </aside>
      <main ref={columns.rightRef} className={`flex-1 bg-white text-slate-800 ${r.page}`}>
        {columns.right}
      </main>
      {columns.probe}
    </div>
  );
}
