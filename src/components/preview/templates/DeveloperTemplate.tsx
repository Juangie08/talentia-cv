'use client';

/* eslint-disable @next/next/no-img-element */
import { useMemo } from 'react';
import { Mail, Phone, MapPin, Linkedin, Github, Terminal, Code2, Braces, Briefcase, GraduationCap, Laptop, Languages } from 'lucide-react';
import { CustomTemplateProps, formatDateRange, rhythm } from './shared';
import { sectionLabels } from '@/lib/sectionLabels';

function categorizeSkills(list: string[]): Array<[string, string[]]> {
  const categories: Record<string, string[]> = {
    Frontend: [],
    Backend: [],
    Database: [],
    'DevOps / Cloud': [],
    Otras: [],
  };

  const keywords: Record<string, string[]> = {
    Frontend: ['react', 'next', 'vue', 'angular', 'css', 'html', 'tailwind', 'javascript', 'typescript', 'frontend', 'sass'],
    Backend: ['node', 'python', 'java', 'go', 'laravel', 'php', 'ruby', 'backend', 'express', 'django', 'fastapi'],
    Database: ['sql', 'postgres', 'mongo', 'redis', 'mysql', 'prisma', 'database', 'mariadb'],
    'DevOps / Cloud': ['aws', 'docker', 'kubernetes', 'azure', 'cicd', 'jenkins', 'devops', 'linux', 'cloud', 'vercel'],
  };

  for (const skill of list) {
    const lower = skill.toLowerCase();
    let matched = false;

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some((word) => lower.includes(word))) {
        categories[category].push(skill);
        matched = true;
        break;
      }
    }

    if (!matched) categories.Otras.push(skill);
  }

  return Object.entries(categories).filter(([, values]) => values.length > 0);
}

/** DeveloperTemplate: layout para roles de desarrollo */
export default function DeveloperTemplate({
  locale,
  cv,
  accentColor,
  fontFamily = 'var(--cv-font-body, Inter, sans-serif)',
  density = 'normal',
  showPhoto = true,
}: CustomTemplateProps) {
  const L = sectionLabels(locale);
  const { personalInfo, summary, skills, experience, education, languages } = cv;

  const categorizedSkills = useMemo(() => categorizeSkills(skills), [skills]);
  const r = rhythm(density);

  return (
    <div className="w-full border bg-white text-slate-900" style={{ fontFamily, minHeight: '1056px' }}>
        <header className="cv-dark-panel relative overflow-hidden bg-slate-900 p-12 text-white">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Terminal className="h-48 w-48 rotate-12" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h1 className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-5xl font-extrabold tracking-tighter text-transparent">
                {personalInfo.fullName || 'Nombre del Dev'}
              </h1>
              <p className="mt-2 font-mono text-xl text-blue-400">&gt; {personalInfo.title || 'Full Stack Developer'}</p>
            </div>
            {showPhoto && personalInfo.photoUrl && (
              <div className="hidden h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-slate-700 md:block">
                <img src={personalInfo.photoUrl} alt="Foto de perfil" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 border-t border-slate-800 pt-2 font-mono text-xs text-slate-500">
            {personalInfo.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {personalInfo.email}
              </span>
            )}
            {personalInfo.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {personalInfo.phone}
              </span>
            )}
            {personalInfo.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {personalInfo.location}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-3">
            {personalInfo.linkedin && (
              <a
                href={personalInfo.linkedin}
                className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-[10px] font-bold text-slate-400 transition-colors hover:border-blue-500/50 hover:bg-slate-800"
                target="_blank"
                rel="noreferrer"
              >
                <Linkedin className="h-3 w-3" /> LINKEDIN
              </a>
            )}
            {personalInfo.website && (
              <a
                href={personalInfo.website}
                className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-[10px] font-bold text-slate-400 transition-colors hover:border-emerald-500/50 hover:bg-slate-800"
                target="_blank"
                rel="noreferrer"
              >
                <Github className="h-3 w-3" /> PORTAFOLIO / GITHUB
              </a>
            )}
          </div>
        </div>
      </header>

      <div className={`${r.page} ${r.section}`}>
        {summary && (
          <section>
            <h2 className={`flex items-center gap-2 border-b border-slate-100 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500 ${r.heading}`}>
              <Laptop className="h-4 w-4 text-blue-500" />
              {L.profileProfessional}
            </h2>
            <p className="border-l-4 border-slate-900 py-1 pl-6 text-sm font-medium italic leading-relaxed text-slate-600">{summary}</p>
          </section>
        )}

        {categorizedSkills.length > 0 && (
          <section>
            <h2 className={`flex items-center gap-2 border-b border-slate-100 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500 ${r.heading}`}>
              <Code2 className="h-4 w-4 text-emerald-600" />
              Stack Tecnico
            </h2>
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${r.cardGap}`}>
              {categorizedSkills.map(([category, list]) => (
                <article key={category}>
                  <h3 className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800 ${r.heading}`}>
                    <Braces className="h-3 w-3 text-slate-500" />
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {list.map((skill, index) => (
                      <span key={index} className="rounded border border-slate-100 bg-slate-50 px-2 py-1 font-mono text-[10px] font-bold text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <h2 className={`flex items-center gap-2 border-b border-slate-100 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500 ${r.heading}`}>
              <Briefcase className="h-4 w-4 text-amber-600" />
              {L.experienceProjects}
            </h2>
            <div className={r.item}>
              {experience.map((exp) => (
                <article key={exp.id} className="group">
                  <div className="mb-2 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-baseline">
                    <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
                      {exp.position}
                    </h3>
                    <span className="rounded border border-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-500">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current, locale)}
                    </span>
                  </div>
                  <p className="mb-3 font-mono text-xs font-black" style={{ color: accentColor }}>
                    {exp.company}
                  </p>
                  <ul className={r.tight}>
                    {exp.achievements.map((achievement, index) => (
                      <li
                        key={index}
                        className="relative pl-4 text-xs leading-relaxed text-slate-600 before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-blue-300/50 before:transition-colors group-hover:before:bg-blue-500"
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

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {education.length > 0 && (
            <section>
              <h2 className={`flex items-center gap-2 border-b border-slate-100 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500 ${r.heading}`}>
                <GraduationCap className="h-4 w-4 text-indigo-500" />
                {L.educationShort}
              </h2>
              <div className={r.item}>
                {education.map((edu) => (
                  <article key={edu.id} className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-800">{edu.degree}</h3>
                    <p className="text-[11px] font-medium text-slate-500">{edu.institution}</p>
                    <p className="text-[11px] font-bold uppercase tracking-tighter text-slate-500" style={{ color: accentColor }}>
                      {formatDateRange(edu.startDate, edu.endDate, edu.current, locale)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h2 className={`flex items-center gap-2 border-b border-slate-100 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-500 ${r.heading}`}>
                <Languages className="h-4 w-4 text-rose-500" />
                {L.languages}
              </h2>
              <div className={r.item}>
                {languages.map((language) => (
                  <article key={language.id} className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-widest text-slate-700">{language.name}</span>
                    <span className="font-mono text-[10px] font-black text-blue-500">{language.level}</span>
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
