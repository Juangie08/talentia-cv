'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react';
import { CustomTemplateProps, formatDateRange, rhythm, stripUrlProtocol } from './shared';
import { useBalancedColumns } from './useBalancedColumns';
import { sectionLabels } from '@/lib/sectionLabels';

/**
 * Editorial Bold — estilo revista: titular gigante en serif, numeración
 * editorial de secciones y barra lateral de color con los datos de contacto.
 */
export default function EditorialBoldTemplate({
  locale,
  cv,
  accentColor,
  fontFamily,
  density = 'normal',
  showPhoto = true,
  showWatermark = false,
}: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, experience, education, skills, languages, references } = cv;
  const accent = accentColor || '#F97316';
  const r = rhythm(density);

  // En esta maqueta la barra lateral de color va a la derecha, asi que
  // "left" es la columna principal y "right" la barra estrecha.
  const rootRef = useRef<HTMLDivElement>(null);

  const contactItems = [
    personalInfo.email && { label: personalInfo.email, Icon: Mail },
    personalInfo.phone && { label: personalInfo.phone, Icon: Phone },
    personalInfo.location && { label: personalInfo.location, Icon: MapPin },
    personalInfo.linkedin && { label: stripUrlProtocol(personalInfo.linkedin), Icon: Linkedin },
    personalInfo.website && { label: stripUrlProtocol(personalInfo.website), Icon: Globe },
  ].filter(Boolean) as { label: string; Icon: typeof Mail }[];

  const SectionNumber = ({ n, title }: { n: string; title: string }) => (
    <div className={`flex items-baseline gap-3 ${r.heading}`}>
      <span
        className="text-3xl font-black leading-none tracking-tight"
        style={{ color: accent, fontFamily: "'Space Grotesk', 'Outfit', sans-serif" }}
      >
        {n}
      </span>
      <h2 className="text-sm font-bold uppercase tracking-[0.28em] text-slate-900">{title}</h2>
      <span className="mb-1 h-px flex-1" style={{ backgroundColor: accent, opacity: 0.5 }} />
    </div>
  );

  const header = (
    <header className="mb-6">
      {personalInfo.title && (
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.4em]" style={{ color: accent }}>
          {personalInfo.title}
        </p>
      )}
      <h1 className="text-5xl font-black leading-[1.02] tracking-tight text-slate-950">
        {personalInfo.fullName || 'Nombre Completo'}
      </h1>
    </header>
  );

  // La numeracion editorial sigue al orden canonico de lectura, asi que se
  // mantiene coherente aunque una seccion se vaya a la barra lateral.
  const summaryBlock = summary ? (
    <section>
      <SectionNumber n="01" title={L.profile} />
      <p className="pl-12 text-sm leading-relaxed text-slate-700">{summary}</p>
    </section>
  ) : null;

  const experienceBlock = experience.length > 0 ? (
    <section className="mt-6">
      <SectionNumber n="02" title={L.experience} />
      <div className={`pl-12 ${r.item}`}>
        {experience.map((exp) => (
          <article key={exp.id} className="border-l-2 pl-4" style={{ borderColor: accent }}>
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <h3 className="text-base font-bold text-slate-950">{exp.position}</h3>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
              </span>
            </div>
            <p className="text-xs font-semibold" style={{ color: accent }}>{exp.company}</p>
            {exp.achievements.length > 0 && (
              <ul className={`mt-1.5 ${r.tight} text-sm text-slate-600`}>
                {exp.achievements.filter(Boolean).map((achievement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-3 flex-shrink-0" style={{ backgroundColor: accent }} />
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const educationBlock = education.length > 0 ? (
    <section className="mt-6">
      <SectionNumber n="03" title={L.education} />
      <div className={`pl-12 ${r.item}`}>
        {education.map((edu) => (
          <article key={edu.id} className="flex flex-wrap items-baseline justify-between gap-1">
            <div>
              <h3 className="text-sm font-bold text-slate-950">{edu.degree}</h3>
              <p className="text-xs text-slate-500">
                {edu.institution}
                {edu.field ? ` · ${edu.field}` : ''}
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
            </span>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const referencesBlock = references.length > 0 ? (
    <section className="mt-6">
      <SectionNumber n="04" title={L.references} />
      <div className={`grid grid-cols-1 pl-12 ${r.cardGap}`}>
        {references.filter(Boolean).map((ref) => (
          <article key={ref.id} className="border-t-2 pt-2" style={{ borderColor: accent }}>
            <p className="text-sm font-bold text-slate-950">{ref.name}</p>
            <p className="text-[11px] text-slate-500">{ref.position}</p>
            <p className="text-[11px] text-slate-500">{ref.company}</p>
            <p className="text-[11px] break-all text-slate-500">{ref.email}</p>
          </article>
        ))}
      </div>
    </section>
  ) : null;

  const photo = showPhoto && personalInfo.photoUrl ? (
    <div className="mb-5 h-32 w-32 overflow-hidden rounded-full border-4 border-white/40">
      <Image
        src={personalInfo.photoUrl}
        alt="Foto de perfil"
        width={128}
        height={128}
        className="h-full w-full object-cover"
        unoptimized
      />
    </div>
  ) : null;

  const contact = contactItems.length > 0 ? (
    <div className={`mb-6 ${r.tight}`}>
      <p className={`text-[10px] font-black uppercase tracking-[0.3em] text-white/70 ${r.heading}`}>{L.contact}</p>
      {contactItems.map(({ label, Icon }) => (
        <div key={label} className="flex items-start gap-2 text-[11px] leading-snug">
          <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-white/80" />
          <span className="break-all">{label}</span>
        </div>
      ))}
    </div>
  ) : null;

  const skillsBlock = skills.length > 0 ? (
    <div className="mb-6">
      <p className={`text-[10px] font-black uppercase tracking-[0.3em] text-white/70 ${r.heading}`}>{L.skills}</p>
      <ul className={r.tight}>
        {skills.map((skill) => (
          <li key={skill} className="flex items-center gap-2 text-xs font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
            {skill}
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  const languagesBlock = languages.length > 0 ? (
    <div>
      <p className={`text-[10px] font-black uppercase tracking-[0.3em] text-white/70 ${r.heading}`}>{L.languages}</p>
      <ul className={r.tight}>
        {languages.map((lang) => (
          <li key={lang.id} className="text-xs text-white">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{lang.name}</span>
              <span className="text-[10px] text-white/80">{lang.level}</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: lang.level.toLowerCase().includes('nativo') || lang.level.toLowerCase().includes('avanzado') ? '90%' : lang.level.toLowerCase().includes('intermedio') ? '60%' : '35%' }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  // Orden canonico: la foto abre la barra de color, el titular y las
  // secciones numeradas van en la principal, y los datos cortos al final
  // (se ordenan solos dentro de la barra).
  // Contacto, habilidades e idiomas están pintados en blanco y translúcido
  // porque viven sobre la barra de color. Si bajaran a la columna clara se
  // perderían (las barras de idioma quedarían blancas sobre blanco), así que
  // quedan fijas en la barra. La formación sí puede cruzar: usa tinta oscura y
  // el panel oscuro la repinta en claro.
  const sections = [
    { id: 'photo', node: photo, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'header', node: header, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'summary', node: summaryBlock, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'experience', node: experienceBlock, columns: ['left'] as const, prefer: 'left' as const },
    { id: 'education', node: educationBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'references', node: referencesBlock, columns: ['left', 'right'] as const, prefer: 'left' as const },
    { id: 'contact', node: contact, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'skills', node: skillsBlock, columns: ['right'] as const, prefer: 'right' as const },
    { id: 'languages', node: languagesBlock, columns: ['right'] as const, prefer: 'right' as const },
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
    <div
      ref={rootRef}
      className="min-h-[1056px] bg-white text-slate-900 flex cv-template-wrapper"
      style={{ fontFamily: fontFamily ? fontFamily : "'Playfair Display', serif" }}
    >
      {/* Columna principal */}
      <div ref={columns.leftRef} className={`flex-1 ${r.page}`}>
        {columns.left}
        {showWatermark && (
          <p className="mt-8 text-[9px] uppercase tracking-[0.3em] text-slate-300">Talentia</p>
        )}
      </div>

      {/* Barra lateral de color */}
      <aside ref={columns.rightRef} className="cv-dark-panel w-64 flex-shrink-0 py-8 pl-6 pr-7 text-white" style={{ backgroundColor: accent }}>
        {columns.right}
      </aside>
      {columns.probe}
    </div>
  );
}
