/* Prueba funcional de generateStyledPDF: genera el PDF moderno en Node,
   extrae el texto con pdfjs-dist y verifica contenido, paginación y enlaces.
   Ejecutar con: npm run test:styled  */
const fs = require('fs');
const { outPath, built } = require('./paths.cjs');
const path = require('path');

const jspdfModule = require('jspdf');
const RealJsPDF = jspdfModule.jsPDF;

const saved = [];

// jsPDF define save() como propiedad de cada instancia: envolvemos el constructor.
function PatchedJsPDF(...args) {
  const instance = new RealJsPDF(...args);
  instance.save = function saveToDisk(filename) {
    const file = outPath(filename);
    fs.writeFileSync(file, Buffer.from(this.output('arraybuffer')));
    saved.push(file);
    return this;
  };
  return instance;
}

require.cache[require.resolve('jspdf')].exports = Object.assign({}, jspdfModule, { jsPDF: PatchedJsPDF });

const { generateStyledPDF } = require(built('export'));

const CVData = {
  personalInfo: {
    fullName: 'Juan Pérez Gómez',
    title: 'Desarrollador Frontend Senior',
    email: 'juan.perez@example.com',
    phone: '+57 300 123 4567',
    location: 'Bogotá, Colombia',
    linkedin: 'linkedin.com/in/juanperez',
    website: 'juanperez.co',
    photoUrl: '',
  },
  summary:
    'Desarrollador frontend con 8 años de experiencia construyendo aplicaciones web en React y TypeScript. Apasionado por la accesibilidad, el rendimiento y el diseño de interfaces que usan personas reales. He liderado equipos pequeños y migrado sistemas legacy a arquitecturas modernas.',
  skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS', 'Testing', 'SQL', 'AWS', 'Docker', 'Comunicación', 'Trabajo en equipo', 'Liderazgo'],
  experience: [
    {
      id: '1',
      company: 'Tech Solutions S.A.S.',
      position: 'Desarrollador Frontend Senior',
      startDate: 'Ene 2022',
      endDate: '',
      current: true,
      achievements: [
        'Lideré la migración de una aplicación jQuery a React 18, reduciendo el tiempo de carga en un 45%.',
        'Implementé una librería interna de componentes que usan 6 equipos de producto, con documentación y pruebas automatizadas.',
        'Reducí los errores en producción en un 30% introduciendo pruebas E2E con Playwright en el pipeline de CI.',
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
        'Desarrollé más de 20 sitios corporativos con Next.js y un CMS headless, mejorando el SEO orgánico de los clientes.',
        'Automaticé el despliegue con GitHub Actions y Vercel, pasando de releases semanales a despliegues diarios.',
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
  references: [
    { id: 'r1', name: 'María Rodríguez', position: 'Gerente de Ingeniería', company: 'Tech Solutions', phone: '+57 310 555 0101', email: 'maria@example.com' },
  ],
};

async function extract(file) {
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: false }).promise;
  let text = '';
  const links = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    text += tc.items.map((i) => i.str).join(' ') + '\n';
    for (const annot of await page.getAnnotations()) {
      if (annot.url) links.push(annot.url);
    }
  }
  return { doc, text, links };
}

(async () => {
  let failed = 0;

  // Caso 1: acento azul clásico
  await generateStyledPDF(CVData, 'letter', { accentColor: '#0033A0' });
  const file1 = saved[0];
  const r1 = await extract(file1);
  const checks = ['Juan Pérez Gómez', 'RESUMEN PROFESIONAL', 'EXPERIENCIA LABORAL', 'EDUCACIÓN', 'REFERENCIAS', 'Tech Solutions S.A.S.', 'CONTACTO', 'HABILIDADES', 'IDIOMAS', 'Universidad Nacional de Colombia', 'Español — Nativo'];
  // Los títulos van con tracking tipográfico: comparamos sin espacios también
  const upper = r1.text.toUpperCase();
  const squashed = upper.replace(/\s+/g, '');
  for (const c of checks) {
    const target = c.toUpperCase();
    const ok = upper.includes(target) || squashed.includes(target.replace(/\s+/g, ''));
    if (!ok) failed += 1;
    console.log((ok ? 'OK   ' : 'FAIL ') + c);
  }
  for (const link of ['mailto:juan.perez@example.com', 'https://linkedin.com/in/juanperez']) {
    const ok = r1.links.some((l) => l.toLowerCase().replace(/\/$/, '') === link);
    if (!ok) failed += 1;
    console.log((ok ? 'OK   link ' : 'FAIL link ') + link);
  }
  console.log('Páginas caso 1:', r1.doc.numPages, '| Tamaño:', (fs.statSync(file1).size / 1024).toFixed(1), 'KB');
  fs.copyFileSync(file1, outPath('styled-azul.pdf'));

  // Caso 2: acento claro (rosa) — prueba de contraste automático
  saved.length = 0;
  await generateStyledPDF(CVData, 'letter', { accentColor: '#F9A8D4' });
  const r2 = await extract(saved[0]);
  const nameOk2 = r2.text.includes('Juan Pérez Gómez');
  console.log((nameOk2 ? 'OK   ' : 'FAIL ') + 'acento claro: texto presente');
  if (!nameOk2) failed += 1;
  fs.copyFileSync(saved[0], outPath('styled-rosa.pdf'));

  // Caso 3: CV largo — paginación
  saved.length = 0;
  const longCV = JSON.parse(JSON.stringify(CVData));
  longCV.skills = [...longCV.skills, 'Kubernetes', 'GraphQL', 'Redis', 'CI/CD', 'Scrum', 'Git', 'Python', 'Java'];
  longCV.experience = [];
  for (let i = 1; i <= 6; i += 1) {
    longCV.experience.push({
      id: `x${i}`,
      company: `Empresa Ficticia ${i} S.A.S.`,
      position: `Cargo Profesional ${i}`,
      startDate: `Ene 201${(i % 9) + 1}`,
      endDate: '',
      current: i === 6,
      achievements: Array.from({ length: 5 }, (_, j) => `Logro ${j + 1} del cargo ${i}: coordiné equipos multidisciplinarios, automatizé procesos internos con herramientas modernas y mejoré métricas de producto de forma sostenible durante varios trimestres.`),
    });
  }
  await generateStyledPDF(longCV, 'letter', { accentColor: '#7c3aed' });
  const r3 = await extract(saved[0]);
  const pagesOk = r3.doc.numPages > 1;
  const lastOk = r3.text.includes('Cargo Profesional 6');
  const footerOk = new RegExp(`1\\s*/\\s*${r3.doc.numPages}`).test(r3.text);
  console.log((pagesOk ? 'OK   ' : 'FAIL ') + `paginación (${r3.doc.numPages} páginas)`);
  console.log((footerOk ? 'OK   ' : 'FAIL ') + 'pie de página');
  console.log((lastOk ? 'OK   ' : 'FAIL ') + 'contenido completo multipágina');
  if (!pagesOk) failed += 1;
  if (!footerOk) failed += 1;
  if (!lastOk) failed += 1;
  fs.copyFileSync(saved[0], outPath('styled-largo.pdf'));

  console.log(failed === 0 ? '\nTODAS LAS PRUEBAS PASARON' : `\n${failed} PRUEBAS FALLARON`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
