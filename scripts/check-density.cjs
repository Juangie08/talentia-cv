/* Comprueba que el control de espaciado Compacto / Normal / Amplio hace algo.
   Uso: npm run check:density   (necesita `npm run dev` en :3500)

   El control se ofrecia a las 36 plantillas pero solo 6 lo escuchaban: en las
   otras 30 pulsarlo no cambiada nada, que es peor que no ofrecerlo. Aqui se
   renderizan las tres densidades con los MISMOS datos y se mide el alto real de
   cada maqueta. Una plantilla que no cambia de alto no esta escuchando.

   Es la comprobacion que hace imposible volver a introducir el bug en
   silencio, porque se ejecuta en cada push. */
const puppeteer = require('puppeteer-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.TALENTIA_BASE || 'http://localhost:3500';
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

const DENSITIES = ['compact', 'normal', 'spacious'];

// Una plantilla que responde al control debe separarse de la mediana de las
// demas por mas de esto. Por debajo es ruido de reflow, no un cambio real.
const MIN_DELTA_PX = 12;

async function measure(browser, template, density) {
  // Sembrar el valor ANTES de que corra cualquier script de la pagina. Si se
  // escribe despues, el autoguardado del editor (5s) y el debounce de
  // personalizacion (200ms) lo pisan y se mide la densidad anterior.
  // Una pagina por medicion: `evaluateOnNewDocument` es permanente, y here
  // interesa que cada medicion parta de un estado limpio.
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1600, height: 1200 });
    await page.evaluateOnNewDocument((data, tpl, sp) => {
      localStorage.setItem('talentia-cv-data', JSON.stringify(data));
      localStorage.setItem('talentia-template', tpl);
      localStorage.setItem('talentia.onboarded.v1', '1');
      localStorage.setItem('talentia-customization', JSON.stringify({ spacing: sp }));
    }, sample, template, density);
    await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    // Las plantillas se cargan con import dinamico: medir en el instante
    // justo tras domcontentloaded mide un esqueleto vacio, no la maqueta. Se
    // espera a que haya contenido real y a que el alto se estabilice.
    let last = -1;
    for (let i = 0; i < 40; i += 1) {
      await new Promise((r) => setTimeout(r, 200));
      const shot = await page.evaluate((sp) => {
        const stored = JSON.parse(localStorage.getItem('talentia-customization') || '{}').spacing;
        const el = document.querySelector('#cv-preview');
        if (!el || stored !== sp) return { painted: false, height: 0 };
        // El alto minimo de la hoja (1056px) es indistinguible de una maqueta
        // que SI cabe en una pagina. Lo que las separa es que haya texto.
        return { painted: (el.textContent || '').trim().length > 80, height: el.scrollHeight };
      }, density);
      if (shot.painted && shot.height === last) return shot.height;
      last = shot.painted ? shot.height : -1;
    }
    return 0;
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const rows = [];
  try {
    for (const template of TEMPLATES) {
      const heights = {};
      try {
        for (const density of DENSITIES) heights[density] = await measure(browser, template, density);
      } catch (e) {
        rows.push({ template, error: e.message.slice(0, 50) });
        continue;
      }
      rows.push({ template, ...heights });
    }
  } finally {
    await browser.close();
  }

  const rowsOk = rows.filter((r) => !r.error);
  const inert = [];
  const unpainted = [];
  console.log('plantilla                compacto  normal  amplio   delta');
  for (const row of rowsOk) {
    // Desestructura en vez de leer con punto: `obj.spacious` devuelve
    // `undefined` en algunos runtimes de Node y la comprobacion pasaria por
    // rota sin serlo.
    const { template, compact, normal, spacious } = row;
    if (!compact || !normal || !spacious) {
      unpainted.push(template);
      continue;
    }
    const delta = spacious - compact;
    const ok = delta > MIN_DELTA_PX;
    if (!ok) inert.push(template);
    console.log(
      `${template.padEnd(22)}${String(compact).padStart(8)}${String(normal).padStart(8)}${String(spacious).padStart(8)}` +
      `${String(delta).padStart(8)}  ${ok ? '' : '<- NO RESPONDE'}`,
    );
  }
  for (const r of rows.filter((x) => x.error)) console.log(`  ${r.template}: ERROR ${r.error}`);

  if (unpainted.length) {
    console.log(`\n${unpainted.length} plantillas no llegaron a pintarse (no se puede medir):`);
    for (const t of unpainted) console.log(`  - ${t}`);
  }
  if (inert.length) {
    console.log(`\n${inert.length} de ${rowsOk.length - unpainted.length} plantillas NO responden al control de espaciado:`);
    for (const t of inert) console.log(`  - ${t}`);
  }
  if (inert.length || unpainted.length) process.exit(1);
  console.log(`\nOK: las ${rowsOk.length} plantillas responden al control de espaciado.`);
})().catch((e) => { console.error(e); process.exit(1); });
