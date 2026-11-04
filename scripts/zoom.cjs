/* Recorta una region concreta de la maqueta para poder leerla de cerca.
   Uso: node scripts/zoom.cjs <templateId> <selector> <salida.png> [scale] */
const fs = require('fs');
const { OUT } = require('./paths.cjs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3500';
const OUT = outPath('shots');
fs.mkdirSync(OUT, { recursive: true });

const sample = require('./sample-cv.cjs');

(async () => {
  const [template, selector, outName, scaleArg] = process.argv.slice(2);
  const scale = Number(scaleArg || 2);
  if (!template || !selector || !outName) {
    console.error('uso: node scripts/zoom.cjs <templateId> <selector> <salida.png> [scale]');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: scale });
    await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.evaluate((data, tpl) => {
      localStorage.setItem('talentia-cv-data', JSON.stringify(data));
      localStorage.setItem('talentia-template', tpl);
      localStorage.setItem('talentia.onboarded.v1', '1');
    }, sample, template);
    await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await new Promise((r) => setTimeout(r, 4000));

    const el = await page.$(selector);
    if (!el) {
      console.log(`no encontrado: ${selector}`);
      process.exit(1);
    }
    const file = path.join(OUT, outName);
    await el.screenshot({ path: file });
    const box = await el.boundingBox();
    console.log(`${outName}: ${Math.round(box.width)}x${Math.round(box.height)} @${scale}x`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
