/* Prueba funcional de cv-quality: checklist de buenas prácticas, detección de
   sesgos, orden cronológico y analizador de oferta (palabras clave ATS).
   Ejecutar con: npm run test:quality */
const assert = require('assert');

const { built } = require('./paths.cjs');

const {
  getQualityReport,
  analyzeJobMatch,
  extractKeywords,
  estimatePages,
} = require(built('cv-quality'));

const goodCV = {
  personalInfo: {
    fullName: 'Juan Pérez Gómez',
    title: 'Desarrollador Frontend Senior',
    email: 'juan.perez@gmail.com',
    phone: '+57 300 123 4567',
    location: 'Bogotá, Colombia',
    linkedin: 'linkedin.com/in/juanperez',
    website: '',
    photoUrl: '',
  },
  summary:
    'Desarrollador frontend con 8 años de experiencia construyendo aplicaciones web en React y TypeScript. Especialista en accesibilidad y rendimiento: reduje el tiempo de carga un 45% liderando equipos pequeños.',
  skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Comunicación', 'Liderazgo'],
  experience: [
    {
      id: '1',
      company: 'Tech Solutions S.A.S.',
      position: 'Desarrollador Frontend Senior',
      startDate: 'Ene 2022',
      endDate: '',
      current: true,
      achievements: [
        'Lideré la migración a React 18 reduciendo el tiempo de carga en un 45%.',
        'Implementé una librería de componentes usada por 6 equipos.',
      ],
    },
    {
      id: '2',
      company: 'Digital Creativa',
      position: 'Desarrollador Web',
      startDate: 'Mar 2019',
      endDate: 'Dic 2021',
      current: false,
      achievements: [
        'Desarrollé más de 20 sitios corporativos con Next.js mejorando el SEO en un 30%.',
      ],
    },
  ],
  education: [
    { id: 'e1', institution: 'Universidad Nacional de Colombia', degree: 'Ingeniería de Sistemas', field: '', startDate: '2014', endDate: '2018', current: false },
  ],
  languages: [
    { id: 'l1', name: 'Español', level: 'Nativo' },
    { id: 'l2', name: 'Inglés', level: 'Avanzado' },
  ],
  references: [],
};

let failed = 0;
const check = (label, ok) => {
  if (!ok) failed += 1;
  console.log((ok ? 'OK   ' : 'FAIL ') + label);
};

// ---- CV completo y bien estructurado ----
const good = getQualityReport(goodCV);
check('CV completo: score >= 80', good.score >= 80);
check('CV completo: ready (sin fallos)', good.ready);
check('CV completo: contacto ok', good.checks.find((c) => c.id === 'contact-basic').status === 'ok');
check('CV completo: ciudad y país ok', good.checks.find((c) => c.id === 'contact-location').status === 'ok');
check('CV completo: sin sesgos ok', good.checks.find((c) => c.id === 'bias-free').status === 'ok');
check('CV completo: orden cronológico ok', good.checks.find((c) => c.id === 'exp-order').status === 'ok');
check('CV completo: logros medibles ok', good.checks.find((c) => c.id === 'exp-achievements').status === 'ok');
check('CV completo: 1 página', estimatePages(goodCV) <= 2);

// ---- CV con problemas ----
const badCV = JSON.parse(JSON.stringify(goodCV));
badCV.personalInfo.email = '';
badCV.personalInfo.location = 'Bogotá';
badCV.personalInfo.linkedin = '';
badCV.summary = 'Tengo 35 años, estado civil casado, cédula 1017201345, vivo en Calle 123 #45-67.';
badCV.experience = badCV.experience.slice().reverse(); // orden incorrecto
badCV.experience.forEach((exp) => {
  exp.achievements = ['Encargado de tareas del día a día en el área.'];
});
badCV.skills = ['React'];
badCV.languages = [];
const bad = getQualityReport(badCV);
check('CV con problemas: score bajo', bad.score < 60);
check('CV con problemas: listo pero no ready', !bad.ready);
check('CV con problemas: detecta sesgos (edad/estado civil/documento/dirección)', (() => {
  const bias = bad.checks.find((c) => c.id === 'bias-free');
  return bias.status !== 'ok' && /edad|civil|documento|dirección/i.test(bias.detail);
})());
check('CV con problemas: orden cronológico fail', bad.checks.find((c) => c.id === 'exp-order').status === 'fail');
check('CV con problemas: perfil con edad no da ok', bad.checks.find((c) => c.id === 'summary').status !== 'ok');
check('CV con problemas: habilidades desbalanceadas warn', bad.checks.find((c) => c.id === 'skills').status === 'warn');

// ---- Analizador de oferta (ATS) ----
const offer = 'Buscamos desarrollador frontend con sólida experiencia en React, TypeScript y Vue. Requisitos: APIs REST, Docker, pruebas unitarias con Jest, metodología Scrum y Git. Deseable GraphQL y AWS. Ofrecemos contrato a término indefinido.';
const match = analyzeJobMatch(goodCV, offer);
check('Oferta: score entre 0 y 100', match.score >= 0 && match.score <= 100);
check('Oferta: detecta React y TypeScript como coincidencias', match.matched.includes('react') && match.matched.includes('typescript'));
check('Oferta: detecta faltantes (vue, docker, jest...)', ['vue', 'docker', 'jest', 'scrum'].every((w) => match.missing.includes(w)));
check('Oferta: score parcial coherente', match.score > 10 && match.score < 80);

const keywords = extractKeywords(offer, 10);
check('Oferta: keywords relevantes sin stopwords', keywords.length > 0 && !keywords.some((k) => ['para', 'con', 'buscamos'].includes(k.word)));
check('Oferta vacía: resultado neutro', analyzeJobMatch(goodCV, '   ').score === 0);

// ---- Estimación de páginas ----
const longCV = JSON.parse(JSON.stringify(goodCV));
longCV.experience = Array.from({ length: 6 }, (_, i) => ({
  id: `x${i}`,
  company: `Empresa ${i}`,
  position: `Cargo ${i} con un nombre bastante largo para forzar multiples lineas de texto en el encabezado`,
  startDate: `Ene 201${i}`,
  endDate: '',
  current: i === 5,
  achievements: Array.from({ length: 5 }, (_, j) => `Logro ${j}: coordiné equipos multidisciplinarios, automatizé procesos internos con herramientas modernas y mejoré métricas de producto de forma sostenible durante varios trimestres consecutivos con resultados medibles.`),
}));
check('CV largo: estimación > 1 página', estimatePages(longCV) > 1);

console.log(failed === 0 ? '\nTODAS LAS PRUEBAS PASARON' : `\n${failed} PRUEBAS FALLARON`);
process.exit(failed === 0 ? 0 : 1);
