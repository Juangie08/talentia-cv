/* Diagnostico puntual: por que un elemento dentro de un panel oscuro no
   toma el color claro. Uso: node scripts/why.cjs <templateId> <textoVisible> */
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3500';
const sample = require('./sample-cv.cjs');

(async () => {
  const [template, needle] = process.argv.slice(2);
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200 });
    await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate((data, tpl) => {
      localStorage.setItem('talentia-cv-data', JSON.stringify(data));
      localStorage.setItem('talentia-template', tpl);
      localStorage.setItem('talentia.onboarded.v1', '1');
    }, sample, template);
    await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await new Promise((r) => setTimeout(r, 3500));

    const info = await page.evaluate((text) => {
      const root = document.querySelector('#cv-preview');
      const out = [];
      root.querySelectorAll('*').forEach((el) => {
        const own = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .join(' ');
        if (!own.includes(text)) return;
        const panel = el.closest('.cv-dark-panel');
        const probe = el.closest('[data-cvs]');
        out.push({
          tag: el.tagName,
          classes: el.className,
          hasStyleAttr: el.hasAttribute('style'),
          styleAttr: el.getAttribute('style') || '',
          color: getComputedStyle(el).color,
          inDarkPanel: Boolean(panel),
          panelTag: panel ? panel.tagName + '.' + panel.className.slice(0, 40) : null,
          inProbe: Boolean(probe),
          matchesSelector: panel
            ? el.matches('.cv-template-wrapper .cv-dark-panel ' + el.tagName.toLowerCase() + ':not(.text-transparent)')
            : false,
        });
      });
      return out;
    }, needle);

    if (info.length === 0) { console.log(`no se encontro el texto "${needle}"`); process.exit(1); }
    for (const i of info) {
      console.log(`<${i.tag}> "${needle}"`);
      console.log(`  clases        : ${i.classes}`);
      console.log(`  atributo style: ${i.hasStyleAttr ? i.styleAttr : '(ninguno)'}`);
      console.log(`  color calculado: ${i.color}`);
      console.log(`  dentro de .cv-dark-panel : ${i.inDarkPanel}${i.panelTag ? ' -> ' + i.panelTag : ''}`);
      console.log(`  dentro de la capa de medicion : ${i.inProbe}`);
      console.log(`  matchea el selector de la regla : ${i.matchesSelector}`);
      console.log('');
    }
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
