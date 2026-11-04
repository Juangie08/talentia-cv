/* Prueba funcional de generateTextPDF: genera el PDF en Node, extrae el
   texto con pdfjs-dist y verifica contenido, paginación y enlaces.

   Ejecutar con: npm run test:export
   (compila src/lib/export.ts a scripts/.build y corre este script) */
const fs = require('fs');
const { outPath, built } = require('./paths.cjs');
const path = require('path');

const jspdfModule = require('jspdf');
const RealJsPDF = jspdfModule.jsPDF;

let savedFile = null;

// jsPDF define save() como propiedad de cada instancia, así que envolvemos
// el constructor para interceptar la instancia y escribir el PDF a disco.
function PatchedJsPDF(...args) {
  const instance = new RealJsPDF(...args);
  instance.save = function saveToDisk(filename) {
    const buf = Buffer.from(this.output('arraybuffer'));
    savedFile = outPath(filename);
    fs.writeFileSync(savedFile, buf);
    return this;
  };
  return instance;
}

require.cache[require.resolve('jspdf')].exports = Object.assign({}, jspdfModule, { jsPDF: PatchedJsPDF });

const { generateTextPDF, buildPlainTextCV } = require(built('export'));

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
  skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS', 'Testing', 'SQL', 'AWS', 'Docker', 'Comunicación', 'Trabajo en equipo'],
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
    { id: 'e2', institution: 'Platzi', degree: 'Certificado', field: 'Arquitectura Frontend', startDate: '2020', endDate: '2021', current: false },
  ],
  languages: [
    { id: 'l1', name: 'Español', level: 'Nativo' },
    { id: 'l2', name: 'Inglés', level: 'Avanzado' },
  ],
  references: [
    { id: 'r1', name: 'María Rodríguez', position: 'Gerente de Ingeniería', company: 'Tech Solutions', phone: '+57 310 555 0101', email: 'maria@example.com' },
  ],
};

(async () => {
  await generateTextPDF(CVData, 'letter', { accentColor: '#0033A0' });
  if (!savedFile) throw new Error('No se generó ningún archivo');

  const bytes = fs.statSync(savedFile).size;
  const data = new Uint8Array(fs.readFileSync(savedFile));

  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const doc = await pdfjs.getDocument({ data, useSystemFonts: false }).promise;

  let allText = '';
  const links = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    allText += tc.items.map((i) => i.str).join(' ') + '\n';
    for (const annot of await page.getAnnotations()) {
      if (annot.url) links.push(annot.url);
      if (annot.action) links.push('action:' + annot.action);
    }
  }

  const checks = [
    'Juan Pérez Gómez',
    'EXPERIENCIA LABORAL',
    'EDUCACIÓN',
    'RESUMEN PROFESIONAL',
    'HABILIDADES',
    'IDIOMAS',
    'REFERENCIAS',
    'Tech Solutions S.A.S.',
    'Lideré la migración',
    'Universidad Nacional de Colombia',
    'Español: Nativo',
    'Bogotá, Colombia',
  ];
  const upper = allText.toUpperCase();
  let failed = 0;
  for (const c of checks) {
    const ok = upper.includes(c.toUpperCase());
    if (!ok) failed += 1;
    console.log((ok ? 'OK   ' : 'FAIL ') + c);
  }

  console.log('\nPáginas:', doc.numPages);
  console.log('Tamaño:', (bytes / 1024).toFixed(1), 'KB');
  console.log('Enlaces encontrados:', links);
  const expectedLinks = ['mailto:juan.perez@example.com', 'https://linkedin.com/in/juanperez', 'https://juanperez.co'];
  for (const l of expectedLinks) {
    const ok = links.some((found) => found.toLowerCase().replace(/\/$/, '') === l.toLowerCase());
    if (!ok) failed += 1;
    console.log((ok ? 'OK   link ' : 'FAIL link ') + l);
  }

  const plain = buildPlainTextCV(CVData);
  const plainOk = plain.includes('EXPERIENCIA LABORAL') && plain.includes('- Lideré la migración');
  console.log((plainOk ? 'OK   ' : 'FAIL ') + 'buildPlainTextCV');
  if (!plainOk) failed += 1;

  // ---- Prueba de paginación: CV largo debe ocupar varias páginas ----
  savedFile = null;
  const longCV = JSON.parse(JSON.stringify(CVData));
  longCV.experience = [];
  for (let i = 1; i <= 6; i += 1) {
    longCV.experience.push({
      id: `x${i}`,
      company: `Empresa Ficticia ${i} S.A.S.`,
      position: `Cargo Profesional ${i}`,
      startDate: `Ene 201${(i % 9) + 1}`,
      endDate: '',
      current: i === 6,
      achievements: Array.from({ length: 5 }, (_, j) => `Logro ${j + 1} del cargo ${i}: coordiné equipos multidisciplinarios, automatizé procesos internos con herramientas modernas y mejoré métricas de producto de forma sostenible durante varios trimestres consecutivos.`),
    });
  }
  await generateTextPDF(longCV, 'a4', { accentColor: '#7c3aed' });
  if (!savedFile) throw new Error('No se generó el CV largo');
  const longData = new Uint8Array(fs.readFileSync(savedFile));
  const longDoc = await pdfjs.getDocument({ data: longData, useSystemFonts: false }).promise;
  let footerOk = false;
  let longText = '';
  for (let p = 1; p <= longDoc.numPages; p += 1) {
    const page = await longDoc.getPage(p);
    const tc = await page.getTextContent();
    const pageText = tc.items.map((i) => i.str).join(' ');
    longText += pageText + '\n';
    if (new RegExp(`${p}\\s*/\\s*${longDoc.numPages}`).test(pageText)) footerOk = true;
  }
  const lastJobVisible = longText.includes('Cargo Profesional 6');
  const pagesOk = longDoc.numPages > 1;
  console.log((pagesOk ? 'OK   ' : 'FAIL ') + `paginación automática (${longDoc.numPages} páginas)`);
  console.log((footerOk ? 'OK   ' : 'FAIL ') + 'pie de página con numeración');
  console.log((lastJobVisible ? 'OK   ' : 'FAIL ') + 'contenido completo en multipágina');
  if (!pagesOk) failed += 1;
  if (!footerOk) failed += 1;
  if (!lastJobVisible) failed += 1;

  // ---- Prueba de continuo: el CV largo debe salir en UNA sola hoja alta ----
  savedFile = null;
  await generateTextPDF(longCV, 'continuous', { accentColor: '#7c3aed' });
  if (!savedFile) throw new Error('No se generó el CV continuo');
  const contData = new Uint8Array(fs.readFileSync(savedFile));
  const contDoc = await pdfjs.getDocument({ data: contData, useSystemFonts: false }).promise;
  const contPage = await contDoc.getPage(1);
  const contViewport = contPage.getViewport({ scale: 1 });
  const contTc = await contPage.getTextContent();
  const contText = contTc.items.map((i) => i.str).join(' ');
  const contSingle = contDoc.numPages === 1;
  const contTall = contViewport.height > 842; // más alta que una carta
  const contFull = contText.includes('Cargo Profesional 6') && contText.includes('Juan Pérez Gómez');
  const contNoNumbers = !new RegExp(`1\\s*/\\s*1`).test(contText);
  console.log((contSingle ? 'OK   ' : 'FAIL ') + `continuo en una sola hoja (${contDoc.numPages} página(s), alto ${Math.round(contViewport.height)}pt)`);
  console.log((contTall ? 'OK   ' : 'FAIL ') + 'continuo más alto que carta');
  console.log((contFull ? 'OK   ' : 'FAIL ') + 'continuo con contenido completo');
  console.log((contNoNumbers ? 'OK   ' : 'FAIL ') + 'continuo sin numeración 1 / 1');
  if (!contSingle) failed += 1;
  if (!contTall) failed += 1;
  if (!contFull) failed += 1;
  if (!contNoNumbers) failed += 1;

  console.log(failed === 0 ? '\nTODAS LAS PRUEBAS PASARON' : `\n${failed} PRUEBAS FALLARON`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
