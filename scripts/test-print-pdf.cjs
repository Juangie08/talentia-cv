/* Prueba el botón principal "Descargar": genera el PDF con el motor de
   impresión del navegador (igual a la vista previa) y verifica que el texto
   sea real y seleccionable, no una imagen.

   Uso: npm run test:print   (necesita `npm run dev` en :3500)
   No entra en test:all porque requiere el servidor de desarrollo. */
const puppeteer = require('puppeteer-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.TALENTIA_BASE || 'http://localhost:3500';
const sample = require('./sample-cv.cjs');

// Representativas: barra lateral (moderno), clara de una columna (pastel-pro)
// y de rol con insignia (customer-service).
const TEMPLATES = ['moderno', 'pastel-pro', 'customer-service'];

const squish = (s) => s.toUpperCase().replace(/\s+/g, '');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  let failed = 0;
  try {
    for (const tpl of TEMPLATES) {
      const page = await browser.newPage();
      try {
        await page.evaluateOnNewDocument((data, t) => {
          localStorage.setItem('talentia-cv-data', JSON.stringify(data));
          localStorage.setItem('talentia-template', t);
          localStorage.setItem('talentia.onboarded.v1', '1');
        }, sample, tpl);
        await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.setViewport({ width: 1600, height: 1200 });
        let painted = false;
        for (let i = 0; i < 40; i += 1) {
          await new Promise((r) => setTimeout(r, 250));
          const n = await page.evaluate(
            () => (document.querySelector('#cv-preview')?.textContent || '').trim().length,
          );
          if (n > 200) {
            painted = true;
            break;
          }
        }
        if (!painted) {
          console.log(`FAIL  ${tpl}: la vista no pintó`);
          failed += 1;
          continue;
        }
        // Igual que el botón Descargar: marcar modo impresión y dar un
        // respiro a que aplique el CSS antes de generar el PDF.
        await page.evaluate(() => document.body.classList.add('print-cv'));
        await new Promise((r) => setTimeout(r, 400));
        const buf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
        const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
        const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
        let text = '';
        for (let p = 1; p <= doc.numPages; p += 1) {
          const pg = await doc.getPage(p);
          const tc = await pg.getTextContent();
          text += `${tc.items.map((i) => i.str).join(' ')}\n`;
        }
        const flat = squish(text);
        const checks = [
          sample.personalInfo.fullName,
          sample.personalInfo.email,
          'EXPERIENCIA',
        ];
        const missing = checks.filter((c) => !flat.includes(squish(c)));
        if (missing.length === 0 && doc.numPages >= 1 && doc.numPages <= 4) {
          console.log(`OK    ${tpl}: ${doc.numPages} pág(s), texto seleccionable completo`);
        } else {
          console.log(`FAIL  ${tpl}: páginas=${doc.numPages} falta=${missing.join(', ') || 'nada'}`);
          failed += 1;
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  console.log(failed === 0 ? 'PRINT OK' : `${failed} FALLOS`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
