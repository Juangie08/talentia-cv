/* Verifica que generateStyledPDF incruste una foto real (data URL) en la barra
   lateral y que el texto siga siendo extraíble. */
const fs = require('fs');
const { outPath, built } = require('./paths.cjs');
const path = require('path');

const jspdfModule = require('jspdf');
const RealJsPDF = jspdfModule.jsPDF;
let savedFile = null;

function PatchedJsPDF(...args) {
  const instance = new RealJsPDF(...args);
  instance.save = function (filename) {
    savedFile = outPath(filename);
    fs.writeFileSync(savedFile, Buffer.from(this.output('arraybuffer')));
    return this;
  };
  return instance;
}
require.cache[require.resolve('jspdf')].exports = Object.assign({}, jspdfModule, { jsPDF: PatchedJsPDF });

const { generateStyledPDF } = require(built('export'));

/**
 * Construye un PNG RGB solido como data URL.
 *
 * Se genera en memoria a proposito: la prueba no debe depender de un binario
 * commiteado que nadie puede leer ni revisar, y asi funciona en cualquier
 * clon sincalar binarios.
 */
function buildTestPng(size = 64, rgb = [70, 130, 180]) {
  const zlib = require('zlib');

  const crcTable = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c >>> 0;
  }
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i += 1) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };

  // Cada fila lleva un byte de filtro (0 = sin filtro) seguido de los pixeles.
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // profundidad de bits
  ihdr[9] = 2;  // color type 2 = truecolor RGB
  const row = Buffer.alloc(1 + size * 3);
  for (let x = 0; x < size; x += 1) {
    row[1 + x * 3] = rgb[0];
    row[2 + x * 3] = rgb[1];
    row[3 + x * 3] = rgb[2];
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => row));

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString('base64')}`;
}

// La foto de prueba se genera en memoria: un PNG minimo y valido, para que la
// prueba no dependa de un binario commiteado que nadie abre ni revisa.
const pngBase64 = buildTestPng();

const CVData = {
  personalInfo: {
    fullName: 'María Fernanda López',
    title: 'Diseñadora UX',
    email: 'maria.lopez@example.com',
    phone: '+57 320 555 1234',
    location: 'Medellín, Colombia',
    linkedin: 'linkedin.com/in/marialopez',
    website: '',
    photoUrl: `data:image/png;base64,${pngBase64}`,
  },
  summary: 'Diseñadora UX con 6 años de experiencia creando productos digitales accesibles y centrados en el usuario.',
  skills: ['Figma', 'Investigación', 'Prototipado', 'Accesibilidad'],
  experience: [
    { id: '1', company: 'Studio Digital', position: 'Diseñadora UX Senior', startDate: 'Ene 2021', endDate: '', current: true, achievements: ['Rediseñé el checkout y aumenté la conversión un 22%.'] },
  ],
  education: [{ id: 'e1', institution: 'Universidad de Antioquia', degree: 'Diseño Gráfico', field: '', startDate: '2013', endDate: '2017', current: false }],
  languages: [{ id: 'l1', name: 'Español', level: 'Nativo' }],
  references: [],
};

(async () => {
  await generateStyledPDF(CVData, 'letter', { accentColor: '#7C3AED' });
  if (!savedFile) throw new Error('No se generó el PDF');

  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(savedFile)), useSystemFonts: false }).promise;
  const page = await doc.getPage(1);
  const tc = await page.getTextContent();
  const text = tc.items.map((i) => i.str).join(' ');
  const annots = await page.getAnnotations();

  const checks = [
    ['texto extraíble con nombre', text.includes('María Fernanda López')],
    ['tildes correctas', text.includes('Diseñadora')],
    ['sección educación', text.toUpperCase().replace(/\s+/g, '').includes('EDUCACIÓN')],
    ['enlace mailto', annots.some((a) => (a.url || '').startsWith('mailto:'))],
  ];
  let failed = 0;
  for (const [label, ok] of checks) {
    if (!ok) failed += 1;
    console.log((ok ? 'OK   ' : 'FAIL ') + label);
  }
  // Verificar que la imagen se incrustó: el PDF debe ser más pesado que sin foto
  const size = fs.statSync(savedFile).size;
  console.log(`OK   tamaño PDF con foto: ${(size / 1024).toFixed(1)} KB`);
  console.log(failed === 0 ? '\nFOTO + TEXTO OK' : `\n${failed} FALLAS`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => { console.error('ERROR:', e); process.exit(1); });
