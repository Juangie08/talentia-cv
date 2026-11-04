import type { CVData } from './types';
import type { Locale } from './i18n/config';

/**
 * Modo sin clave (`AI_MOCK=1`).
 *
 * Permite probar el producto completo —importación, sugerencias, mejora y
 * adaptación— sin gastar créditos ni configurar un proveedor. Devuelve
 * respuestas fijas y deterministas, así que sirve también para el CI.
 *
 * Nunca se activa solo: exige `AI_MOCK=1` explícito en el entorno.
 */

const FLAG = /^(1|true|yes|on)$/i.test((process.env.AI_MOCK || '').trim());

export function isMockMode(): boolean {
  return FLAG;
}

/** Texto de ejemplo para la transcripción de una imagen o escaneo. */
export function mockVisionTranscript(): string {
  return [
    'Ana María Gómez',
    'Analista de datos',
    'ana.gomez@ejemplo.com · +57 300 000 0000 · Bogotá, Colombia',
    'PERFIL',
    'Analista de datos con 4 años de experiencia en reportería y tableros.',
    'EXPERIENCIA',
    'Analista de datos — ACME, Mar 2021 a la actualidad',
    'Construí tableros en Power BI para el equipo comercial.',
    'EDUCACIÓN',
    'Estadística — Universidad Nacional, 2015 a 2019',
    'HABILIDADES',
    'SQL, Python, Power BI',
    'IDIOMAS',
    'Inglés intermedio',
  ].join('\n');
}

/**
 * Respuesta de chat de ejemplo. El tipo se deduce del contrato JSON que el
 * prompt pide al final, que es justo lo que la ruta va a parsear.
 */
export function mockChatText(prompt: string): string {
  if (prompt.includes('"headlines"')) {
    return JSON.stringify({
      headlines: ['Analista de datos | Reportería y tableros', 'Analista de datos con foco comercial', 'Data Analyst con SQL y Power BI'],
      headline: 'Analista de datos | Reportería y tableros',
      summaries: [
        'Analista de datos con 4 años de experiencia en reportería y tableros para equipos comerciales. Convierto datos en decisiones con SQL y Power BI.',
        'Analista de datos orientada a resultados, especialista en automatizar reportes y sostener indicadores comerciales con evidencia.',
      ],
      summary:
        'Analista de datos con 4 años de experiencia en reportería y tableros para equipos comerciales. Convierto datos en decisiones con SQL y Power BI.',
      skillsAdd: [{ name: 'Power BI', priority: 'must', why: 'Ya construyes tableros en Power BI y el anuncio lo exige.' }],
      achievementRewrites: [],
      gapAdvice: [{ term: 'Airflow', advice: 'No lo inventes: si no lo has usado, oriéntalo como aprendizaje en curso y demuestra tu experiencia con ETL.' }],
      companyAngle: 'El anuncio habla de reportería comercial y tableros de ventas: lidera con el impacto en decisiones comerciales.',
      risks: ['El anuncio pide 5 años y tu CV muestra 4.'],
    });
  }

  if (prompt.includes('"linkedinHeadline"')) {
    return JSON.stringify({
      subject: 'Analista de datos — candidatura',
      body:
        'Estimado equipo de selección:\n\nEscribo para postularme al cargo de Analista de datos. En mis 4 años de experiencia construí tableros en Power BI que sostienen el seguimiento comercial y [X] reportes automatizados para equipos de ventas.\n\nSu anuncio pone el foco en reportería y decisiones basadas en datos, justo donde he aportado valor.\n\nEn los primeros 90 días podría ordenar los indicadores comerciales y dejar un tablero único de seguimiento.\n\nQuedo atenta a una conversación.\n\nCordialmente,\nAna María Gómez',
      linkedinHeadline: 'Analista de datos | SQL y Power BI | Reportería comercial',
      linkedinSummary:
        'Analista de datos con 4 años de experiencia en reportería y tableros. Trabajo con SQL y Power BI para que los equipos comerciales decidan con evidencia.',
      followUp: 'Hola, retomo mi candidatura al cargo de Analista de datos. Quedo atenta a cualquier detalle adicional que necesiten.',
    });
  }

  if (prompt.includes('"starHint"')) {
    return JSON.stringify({
      questions: [
        {
          question: 'Cuéntame un tablero que hayas construido de principio a fin.',
          why: 'Evalúa si dominas el ciclo completo de reportería, no solo la herramienta.',
          starHint: 'Situación: el equipo comercial no tenía visibilidad. Acción: modelo de datos y tablero en Power BI. Resultado: [X] horas de reporte manual ahorradas.',
          keywords: ['Power BI', 'tableros', 'reportería'],
        },
      ],
      questionsToAsk: [
        '¿Cómo se mide el éxito de este cargo a los 6 meses?',
        '¿Qué decisiones dependen hoy de los reportes del equipo?',
      ],
      closingTip: 'Cierro con el indicador que más moví y pregunto cuál es el reto inmediato del equipo.',
    });
  }

  if (prompt.includes('"skillsAdd"')) {
    return JSON.stringify({
      summary:
        'Analista de datos con experiencia en reportería y tableros, enfocada en convertir datos en decisiones para equipos comerciales.',
      skillsAdd: ['Power BI', 'SQL'],
      experienceRewrites: [],
    });
  }

  if (prompt.includes('"personalInfo"')) {
    return JSON.stringify({
      personalInfo: {
        fullName: 'Ana María Gómez',
        title: 'Analista de datos',
        email: 'ana.gomez@ejemplo.com',
        phone: '+57 300 000 0000',
        location: 'Bogotá, Colombia',
        linkedin: '',
        website: '',
      },
      summary:
        'Analista de datos con 4 años de experiencia en reportería y tableros para equipos comerciales.',
      skills: ['SQL', 'Python', 'Power BI'],
      experience: [
        {
          position: 'Analista de datos',
          company: 'ACME',
          startDate: 'Mar 2021',
          endDate: 'Presente',
          current: true,
          achievements: ['Construí tableros en Power BI para el equipo comercial.'],
        },
      ],
      education: [
        {
          institution: 'Universidad Nacional',
          degree: '',
          field: 'Estadística',
          startDate: '2015',
          endDate: '2019',
          current: false,
        },
      ],
      languages: [{ name: 'Inglés', level: 'Intermedio' }],
      references: [],
    });
  }

  if (prompt.includes('"variants"')) {
    return JSON.stringify({
      variants: [
        'Analista de datos con 4 años de experiencia en SQL y Power BI, enfocada en decisiones basadas en evidencia.',
        'Especialista en reportería y tableros que traduce datos en decisiones comerciales.',
        'Analista de datos orientada a resultados, con dominio de SQL, Python y visualización.',
      ],
    });
  }

  if (prompt.includes('"achievements"')) {
    return JSON.stringify({
      summary:
        'Analista de datos con 4 años de experiencia en reportería y tableros, enfocada en convertir datos en decisiones.',
      achievements: [['Construí tableros en Power BI para el equipo comercial.']],
    });
  }

  return '{"ok":true}';
}

/**
 * Traducción de ejemplo: marca el texto en lugar de traducirlo, para que el
 * flujo completo (previsualizar y aplicar) se pueda probar sin proveedor.
 */
export function mockTranslation(cv: CVData, target: 'es' | 'en') {
  const tag = target === 'en' ? '[EN] ' : '[ES] ';
  return {
    summary: cv.summary ? `${tag}${cv.summary}` : '',
    skills: cv.skills,
    experience: cv.experience.map((exp) => ({
      id: exp.id,
      position: `${tag}${exp.position}`,
      achievements: exp.achievements,
    })),
    education: cv.education.map((edu) => ({
      id: edu.id,
      degree: `${tag}${edu.degree}`,
      field: edu.field,
    })),
  };
}

/**
 * Adaptación de ejemplo que sí usa los ids reales del CV, para que la ruta no
 * descarte las reescrituras por "experiencia inexistente".
 */
export function mockAdaptation(cv: CVData) {
  const first = cv.experience[0];
  return {
    summary:
      'Analista de datos con experiencia en reportería, tableros y automatización, enfocada en las métricas que mueve la oferta.',
    skillsAdd: cv.skills.slice(0, 2),
    experienceRewrites: first
      ? [
          {
            id: first.id,
            achievements: first.achievements.length
              ? first.achievements.map((a) => `${a.replace(/\.$/, '')}, priorizando los indicadores de la oferta.`)
              : ['Construí tableros que sostienen el seguimiento de los indicadores clave.'            ],
          },
        ]
      : [],
  };
}

/** Personalización profunda de ejemplo (sin proveedor). */
export function mockTailoring(cv: CVData, locale: Locale = 'es') {
  const first = cv.experience[0];
  const copy =
    locale === 'en'
      ? {
          headlines: ['Data Analyst | Reporting and dashboards', 'Data Analyst with a commercial focus'],
          summary: 'Data Analyst experienced in reporting and dashboards for commercial teams.',
          skillWhy: 'You already prove it in your experience.',
          fallbackAchievement: 'Built dashboards that keep commercial tracking on track.',
          gapAdvice: 'Show the process you already follow when building a dashboard instead of claiming a tool you do not use.',
          companyAngle: 'The post is about commercial reporting: lead with the impact on decisions, not with the tool.',
          risk: 'Check whether the post asks for more years than your resume shows.',
        }
      : {
          headlines: ['Analista de datos | Reportería y tableros', 'Analista de datos con foco comercial'],
          summary: 'Analista de datos con experiencia en reportería y tableros para equipos comerciales.',
          skillWhy: 'Ya la demuestras en tu experiencia.',
          fallbackAchievement: 'Construí tableros que sostienen el seguimiento comercial.',
          gapAdvice: 'Demuestra el proceso que ya haces al construir un tablero en lugar de afirmar una herramienta que no usas.',
          companyAngle: 'El anuncio habla de reportería comercial: lidera con el impacto en decisiones, no con la herramienta.',
          risk: 'Revisa si el anuncio pide más años de los que muestra tu CV.',
        };

  return {
    headlines: copy.headlines,
    headline: copy.headlines[0],
    summaries: [copy.summary],
    summary: copy.summary,
    skillsAdd: cv.skills.slice(0, 3).map((name) => ({ name, priority: 'must' as const, why: copy.skillWhy })),
    achievementRewrites: first
      ? [{ id: first.id, achievements: first.achievements.length ? first.achievements : [copy.fallbackAchievement] }]
      : [],
    gapAdvice: [{ term: 'ETL', advice: copy.gapAdvice }],
    companyAngle: copy.companyAngle,
    risks: [copy.risk],
  };
}

/** Carta y textos de LinkedIn de ejemplo. */
export function mockCoverLetter(locale: Locale = 'es') {
  return locale === 'en'
    ? {
        subject: 'Application — Data Analyst',
        body: 'Dear hiring team:\n\nI am applying for the Data Analyst role. Over my years of experience I have built dashboards and reporting that keep commercial tracking on track.\n\nI would welcome a conversation.\n\nBest regards,',
        linkedinHeadline: 'Data Analyst | SQL and Power BI',
        linkedinSummary: 'Data Analyst experienced in reporting and dashboards for commercial teams.',
        followUp: 'Following up on my application and happy to share any further detail.',
      }
    : {
        subject: 'Candidatura — Analista de datos',
        body: 'Estimado equipo de selección:\n\nMe postulo al cargo de Analista de datos. En mis años de experiencia construí tableros y reportería que sostienen el seguimiento comercial.\n\nQuedo atenta a una conversación.\n\nCordialmente,',
        linkedinHeadline: 'Analista de datos | SQL y Power BI',
        linkedinSummary: 'Analista de datos con experiencia en reportería y tableros para equipos comerciales.',
        followUp: 'Retomo mi candidatura y quedo atenta a cualquier detalle adicional.',
      };
}

/** Entrevista de ejemplo. */
export function mockInterview(locale: Locale = 'es') {
  return locale === 'en'
    ? {
        questions: [
          {
            question: 'Walk me through a dashboard you built end to end.',
            why: 'Evaluates the full reporting cycle.',
            starHint: 'Situation, action and result with [X] for the figure that is missing.',
            keywords: ['Power BI', 'dashboards'],
          },
        ],
        questionsToAsk: ['How is success for this role measured after six months?'],
        closingTip: 'Close with the metric you moved and ask about the immediate challenge.',
      }
    : {
        questions: [
          {
            question: 'Cuéntame un tablero que hayas construido de principio a fin.',
            why: 'Evalúa el ciclo completo de reportería.',
            starHint: 'Situación, acción y resultado con [X] para la cifra que falte.',
            keywords: ['Power BI', 'tableros'],
          },
        ],
        questionsToAsk: ['¿Cómo se mide el éxito de este cargo a los 6 meses?'],
        closingTip: 'Cierra con el indicador que moviste y pregunta por el reto inmediato.',
      };
}
