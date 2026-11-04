/* Revisa el contraste de TODAS las plantillas en un navegador real.
   Busca títulos, iconos y texto cuyo color se Parezca al fondo: eso es
   texto invisible, y no se detecta con typecheck ni con lint.
   Uso: npm run check:contrast  */
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

function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function parse(css) {
  const srgb = css.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (srgb) return [srgb[1], srgb[2], srgb[3]].map((v) => Math.round(Number(v) * 255));
  return (css.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const findings = [];

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
        }, sample, template);
        await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await new Promise((r) => setTimeout(r, 2200));

        const items = await page.evaluate(() => {
          const root = document.querySelector('#cv-preview');
          if (!root) return [];
          const out = [];
          root.querySelectorAll('h1,h2,h3,h4,svg,p,li,span').forEach((el) => {
            if (el.offsetParent === null) return;
            if (el.closest('[data-cvs]') && el.closest('[data-cvs]') !== el) return;
            const text = (el.textContent || '').trim().slice(0, 32);
            const isSvg = el.tagName.toLowerCase() === 'svg';
            if (!text && !isSvg) return;
            const st = getComputedStyle(el);
            // Fondo del primer ancestro realmente pintado. Se descartan los
            // fondos semitransparentes: comparar texto contra un tinte al 12%
            // daria contrastes falsos.
            let node = el;
            let bg = null;
            while (node && node !== root) {
              const c = getComputedStyle(node).backgroundColor;
              if (!c || /transparent/.test(c)) { node = node.parentElement; continue; }
              const m = c.match(/rgba?\(([^)]+)\)/);
              if (!m) { node = node.parentElement; continue; }
              const parts = m[1].split(',').map((x) => Number(x.trim()));
              const alpha = parts.length === 4 ? parts[3] : 1;
              if (alpha >= 0.6) { bg = c; break; }
              node = node.parentElement;
            }
            if (!bg) return;
            out.push({ tag: el.tagName, text, color: st.color, bg, size: st.fontSize });
          });
          return out;
        });

        for (const it of items) {
          const r = ratio(parse(it.color), parse(it.bg));
          if (r < 3) findings.push({ template, r, ...it });
        }
      } catch (e) {
        findings.push({ template, r: 0, tag: '!', text: `error: ${e.message}`, color: '', bg: '', size: '' });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  // Un resumen por plantilla: qué texto es invisible y por qué.
  const porPlantilla = new Map();
  for (const f of findings) {
    if (!porPlantilla.has(f.template)) porPlantilla.set(f.template, []);
    porPlantilla.get(f.template).push(f);
  }

  if (porPlantilla.size === 0) {
    console.log(`OK: ${TEMPLATES.length} plantillas, ningun texto por debajo de 3:1.`);
    process.exit(0);
  }

  console.log(`PLANTILLAS CON TEXTO ILEGIBLE (contraste < 3:1): ${porPlantilla.size} de ${TEMPLATES.length}\n`);
  for (const [tpl, list] of porPlantilla) {
    const peor = list.reduce((m, f) => Math.min(m, f.r), 99);
    console.log(`  ${tpl}  (${list.length} elementos, peor ${peor.toFixed(2)}:1)`);
    for (const f of list.slice(0, 5)) {
      console.log(`      ${f.r.toFixed(2)}:1  ${f.tag} ${f.size} "${f.text}"  texto=${f.color}  fondo=${f.bg}`);
    }
    if (list.length > 5) console.log(`      ... y ${list.length - 5} mas`);
  }
  process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
