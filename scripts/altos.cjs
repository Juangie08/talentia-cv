/* Mide el alto de la maqueta en las 35 plantillas con los MISMOS datos.
   Es la señal objetiva de "cuantas paginas ocupa": una maqueta mas alta que
   las demas, con el mismo contenido, significa que esa plantilla wastes
   espacio. Sirve para detectar de un vistazo cuales hay que mirar.

   Uso: node scripts/altos.cjs  */
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3500';
const sample = require('./sample-cv.cjs');

const TEMPLATES = [
  'moderno', 'minimalista', 'creativo', 'customer-service', 'student', 'developer',
  'creative-pro', 'ejecutivo', 'medico', 'legal', 'finance', 'marketing',
  'educacion', 'pink', 'designer', 'tech', 'corporate', 'senior', 'psychologist',
  'software-engineer', 'visual-designer', 'customer-care', 'chat-specialist',
  'marketing-strategist', 'sakura-bloom', 'cherry-ribbon', 'candy-editorial',
  'peach-magazine', 'bubble-minimal', 'editorial-bold', 'pastel-pro',
  'mono-statement', 'neon-modern', 'ink-elegant', 'green-fresh',
];

// Plantillas con barra lateral real donde se aplico el balanceo.
const CONVERTIDAS = new Set([
  'moderno', 'editorial-bold', 'finance', 'ejecutivo', 'marketing',
  'designer', 'pink', 'senior', 'cherry-ribbon', 'creative-pro',
]);

const PAGE_PX = { letter: 1056, a4: 1123, legal: 1344, continuous: 1123 };

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const rows = [];
  try {
    for (const template of TEMPLATES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1600, height: 1200 });
      try {
        await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.evaluate((data, tpl) => {
          localStorage.setItem('talentia-cv-data', JSON.stringify(data));
          localStorage.setItem('talentia-template', tpl);
          localStorage.setItem('talentia.onboarded.v1', '1');
          // OJO: no se toca 'talentia-customization'. Sobrescribirla con un
          // objeto parcial borra sectionsVisible y la maqueta queda vacia.
        }, sample, template);
        await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await new Promise((r) => setTimeout(r, 2500));
        const m = await page.evaluate(() => {
          const el = document.querySelector('#cv-preview');
          if (!el) return null;
          const r = el.getBoundingClientRect();
          // altura real del contenido, no la caja escalada del visor
          return { w: Math.round(r.width), h: Math.round(el.scrollHeight) };
        });
        rows.push({ template, ...(m || { w: 0, h: 0 }), err: m ? null : 'sin maqueta' });
      } catch (e) {
        rows.push({ template, w: 0, h: 0, err: e.message.slice(0, 40) });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const validas = rows.filter((r) => !r.err);
  const alturas = validas.map((r) => r.h);
  const mediana = [...alturas].sort((a, b) => a - b)[Math.floor(alturas.length / 2)];
  const unaPagina = PAGE_PX.letter;

  console.log(`contenido de referencia: ~${unaPagina}px = 1 pagina (carta)`);
  console.log(`mediana de las 35 plantillas: ${mediana}px\n`);

  const porPagina = validas.map((r) => ({ ...r, paginas: r.h / unaPagina }));
  porPagina.sort((a, b) => b.paginas - a.paginas);
  console.log('plantilla                alto   paginas  estado');
  for (const r of porPagina) {
    const pag = r.paginas.toFixed(2);
    const estado = r.paginas > 2 ? 'REVISAR: mas de 2 paginas'
      : r.paginas > 1.4 ? 'revisar: 2 paginas'
        : 'ok: 1 pagina';
    const marca = CONVERTIDAS.has(r.template) ? '*' : ' ';
    console.log(`${marca} ${r.template.padEnd(22)} ${String(r.h).padStart(5)}  ${pag.padStart(7)}  ${estado}`);
  }
  const conError = rows.filter((r) => r.err);
  if (conError.length) {
    console.log('\ncon error:');
    for (const r of conError) console.log(`   ${r.template}: ${r.err}`);
  }
  console.log('\n* = convertida al balanceo de columnas');
})().catch((e) => { console.error(e); process.exit(1); });
