/* Mide el balance real de las columnas del PDF de dos columnas.
   Para cada página calcula hasta dónde baja el texto de la mitad izquierda
   (barra lateral) y de la derecha (columna principal). Si el reparto está
   bien, ambas mitades terminan a una altura parecida y no queda media hoja
   vacía abajo a la izquierda.
   Ejecutar con: npm run test:balance  */
const fs = require('fs');
const { outPath, built } = require('./paths.cjs');
const path = require('path');

const jspdfModule = require('jspdf');
const RealJsPDF = jspdfModule.jsPDF;
const saved = [];

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

const base = {
  personalInfo: {
    fullName: 'Juan Pérez Gómez', title: 'Desarrollador Frontend Senior',
    email: 'juan.perez@example.com', phone: '+57 300 123 4567',
    location: 'Bogotá, Colombia', linkedin: 'linkedin.com/in/juanperez',
    website: '', photoUrl: '',
  },
  summary: 'Desarrollador frontend con 8 años de experiencia construyendo aplicaciones web en React y TypeScript. Apasionado por la accesibilidad, el rendimiento y el diseño de interfaces que usan personas reales. He liderado equipos pequeños y migrado sistemas legacy a arquitecturas modernas.',
  skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS', 'Testing', 'SQL', 'AWS', 'Docker', 'Comunicación', 'Trabajo en equipo', 'Liderazgo'],
  experience: [
    { id: '1', company: 'Tech Solutions S.A.S.', position: 'Desarrollador Frontend Senior', startDate: 'Ene 2022', endDate: '', current: true,
      achievements: [
        'Lideré la migración de una aplicación jQuery a React 18, reduciendo el tiempo de carga en un 45%.',
        'Implementé una librería interna de componentes que usan 6 equipos de producto, con documentación y pruebas automatizadas.',
        'Reducí los errores en producción en un 30% introduciendo pruebas E2E con Playwright en el pipeline de CI.',
      ] },
    { id: '2', company: 'Digital Creativa', position: 'Desarrollador Web', startDate: 'Mar 2019', endDate: 'Dic 2021', current: false,
      achievements: [
        'Desarrollé más de 20 sitios corporativos con Next.js y un CMS headless, mejorando el SEO orgánico de los clientes.',
        'Automaticé el despliegue con GitHub Actions y Vercel, pasando de releases semanales a despliegues diarios.',
      ] },
  ],
  education: [{ id: 'e1', institution: 'Universidad Nacional de Colombia', degree: 'Ingeniería de Sistemas', field: '', startDate: '2014', endDate: '2018', current: false }],
  languages: [{ id: 'l1', name: 'Español', level: 'Nativo' }, { id: 'l2', name: 'Inglés', level: 'Avanzado' }],
  references: [{ id: 'r1', name: 'María Rodríguez', position: 'Gerente de Ingeniería', company: 'Tech Solutions', phone: '+57 310 555 0101', email: 'maria@example.com' }],
};

const clone = (o) => JSON.parse(JSON.stringify(o));

const cases = [];

// 1. CV corto: todo debería caber en una página bien repartido.
{
  const cv = clone(base);
  cv.experience = [clone(base.experience[0])];
  cv.experience[0].achievements = cv.experience[0].achievements.slice(0, 1);
  cv.references = [];
  cases.push({ name: 'corto', cv });
}

// 2. CV mediano: el caso de la prueba funcional.
cases.push({ name: 'mediano', cv: clone(base) });

// 3. CV que antes se desbordaba a 2 páginas con la mitad izquierda vacía.
{
  const cv = clone(base);
  cv.experience = [];
  for (let i = 1; i <= 3; i += 1) {
    cv.experience.push({
      id: `x${i}`, company: `Empresa Ficticia ${i} S.A.S.`, position: `Cargo Profesional ${i}`,
      startDate: `Ene 201${(i % 9) + 1}`, endDate: '', current: i === 3,
      achievements: Array.from({ length: 4 }, (_, j) => `Logro ${j + 1}: coordiné equipos multidisciplinarios, automatizé procesos internos con herramientas modernas y mejoré métricas de producto de forma sostenible durante varios trimestres.`),
    });
  }
  cv.references = [
    { id: 'r1', name: 'María Rodríguez', position: 'Gerente de Ingeniería', company: 'Tech Solutions', phone: '+57 310 555 0101', email: 'maria@example.com' },
    { id: 'r2', name: 'Carlos Ruiz', position: 'CTO', company: 'Digital Creativa', phone: '+57 311 222 3333', email: 'carlos@example.com' },
  ];
  cases.push({ name: 'desbordado', cv });
}

// 5. CV desbordado en modo continuo: debe salir en UNA sola hoja alta,
//    sin importar que en carta ocupe 2 páginas.
{
  const cv = clone(base);
  cv.experience = [];
  for (let i = 1; i <= 3; i += 1) {
    cv.experience.push({
      id: `x${i}`, company: `Empresa Ficticia ${i} S.A.S.`, position: `Cargo Profesional ${i}`,
      startDate: `Ene 201${(i % 9) + 1}`, endDate: '', current: i === 3,
      achievements: Array.from({ length: 4 }, (_, j) => `Logro ${j + 1}: coordiné equipos multidisciplinarios, automatizé procesos internos con herramientas modernas y mejoré métricas de producto de forma sostenible durante varios trimestres.`),
    });
  }
  cases.push({ name: 'continuo', cv, paper: 'continuous', expectPages: 1, skipBalance: true });
}

// 5. CV muy largo: varias páginas.
{
  const cv = clone(base);
  cv.skills = [...cv.skills, 'Kubernetes', 'GraphQL', 'Redis', 'CI/CD', 'Scrum', 'Git', 'Python', 'Java', 'Figma', ' Scrum'.trim()];
  cv.experience = [];
  for (let i = 1; i <= 7; i += 1) {
    cv.experience.push({
      id: `x${i}`, company: `Empresa Ficticia ${i} S.A.S.`, position: `Cargo Profesional ${i}`,
      startDate: `Ene 201${(i % 9) + 1}`, endDate: '', current: i === 7,
      achievements: Array.from({ length: 5 }, (_, j) => `Logro ${j + 1}: coordiné equipos multidisciplinarios, automatizé procesos internos con herramientas modernas y mejoré métricas de producto de forma sostenible durante varios trimestres.`),
    });
  }
  cases.push({ name: 'muy largo', cv });
}

async function analyze(file) {
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: false }).promise;
  const SIDEBAR_W = 196; // min(200, 612 * 0.32) para carta
  const SIDE_X = 26;
  const out = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const vp = page.getViewport({ scale: 1 });
    const items = tc.items.filter((i) => {
      const y = i.transform[5];
      return y >= 34 && y <= vp.height - 34; // ignora pie y encabezado técnico
    });
    // La barra lateral dibuja su contacto en x=26; la columna principal
    // arranca en x=230 (pág. 1) o x=44 (continuación). Ese margen permite
    // distinguir una página con barra lateral de una que ya no la tiene.
    const hasSidebar = items.some((i) => i.transform[4] < SIDE_X + 6);
    let left = Infinity;
    let right = Infinity;
    let minX = Infinity;
    for (const item of items) {
      const x = item.transform[4];
      const y = item.transform[5];
      minX = Math.min(minX, x);
      if (hasSidebar) {
        if (x < SIDEBAR_W) left = Math.min(left, y);
        else right = Math.min(right, y);
      } else {
        right = Math.min(right, y);
      }
    }
    out.push({ page: p, left, right, hasSidebar, minX, height: vp.height });
  }
  return { pages: doc.numPages, detail: out };
}

(async () => {
  let bad = 0;
  for (const c of cases) {
    saved.length = 0;
    await generateStyledPDF(c.cv, c.paper || 'letter', { accentColor: '#0033A0' });
    const r = await analyze(saved[0]);
    console.log(`\n[${c.name}] páginas=${r.pages}`);
    if (c.expectPages !== undefined && r.pages !== c.expectPages) {
      bad += 1;
      console.log(`   >> SE ESPERABAN ${c.expectPages} PÁGINA(S)`);
    }
    for (const d of r.detail) {
      const L = d.left === Infinity ? '   —  ' : String(Math.round(d.left)).padStart(5);
      const R = d.right === Infinity ? '   —  ' : String(Math.round(d.right)).padStart(5);
      const delta = d.left === Infinity || d.right === Infinity ? '—' : `${Math.round(Math.abs(d.left - d.right))}pt`;
      console.log(`   pág ${d.page}${d.hasSidebar ? ' [con barra lateral]' : ' [ancho completo ]'}: x_min=${Math.round(d.minX)}  fin izq=${L}pt  fin der=${R}pt  diferencia=${delta}`);
    }
    // El desequilibrio solo importa donde hay dos columnas que comparar.
    const withSidebar = r.detail.filter((d) => d.hasSidebar && d.left !== Infinity && d.right !== Infinity);
    const worst = withSidebar.reduce((m, d) => Math.max(m, Math.abs(d.left - d.right)), 0);
    const last = r.detail[r.detail.length - 1];
    const lastBottom = Math.max(
      last.left === Infinity ? 0 : last.left,
      last.right === Infinity ? 0 : last.right,
    );
    const lastFill = (lastBottom / last.height) * 100;
    // Páginas donde la barra lateral se derramó: franjas de color casi vacías.
    const straySidebarPages = r.detail.filter((d) => d.hasSidebar && d.page > 1 && d.left > 400).length;
    console.log(`   peor desequilibrio: ${Math.round(worst)}pt | última página al ${lastFill.toFixed(0)}% | páginas con barra lateral sobrante: ${straySidebarPages}`);
    // En continuo hay una sola hoja alta: el "desequilibrio" entre columnas
    // es espacio sobre la barra de color (intencional), no una hoja vacía.
    // Ahí solo importa que sea una página con barra lateral.
    if (worst > 140 && !c.skipBalance) { bad += 1; console.log('   >> DESEQUILIBRADO'); }
    if (straySidebarPages > 0) { bad += 1; console.log('   >> BARRA LATERAL DERRAMADA'); }
  }
  console.log(bad === 0 ? '\nBALANCE OK' : `\n${bad} CASOS DESEQUILIBRADOS`);
  process.exit(bad === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
