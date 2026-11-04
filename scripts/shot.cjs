/* Captura la vista previa del editor para plantilla, usando el Chrome del
   sistema. Sirve para verificar de verdad lo que ve el usuario, que es lo
   que no se puede comprobar solo con typecheck y lint.

   Uso: node scripts/shot.cjs <templateId> [...]  */
const fs = require('fs');
const { OUT } = require('./paths.cjs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3500';
const OUT = outPath('shots');
fs.mkdirSync(OUT, { recursive: true });

// Datos con contenido realista y holgado, que es donde se ve el
// desequilibrio entre columnas: experiencia larga, muchas habilidades,
// referencias y un nombre largo para forzar el corte de linea.
const cv = {
  personalInfo: {
    fullName: 'Juan David Meza Arango',
    title: 'Ingeniero de Sistemas Senior | Backend & Plataformas',
    email: 'juan david.meza.arango@correoelectronico.com',
    phone: '+57 310 555 4433',
    location: 'Medellín, Antioquia, Colombia',
    linkedin: 'linkedin.com/in/juandavidmezaarango',
    website: 'https://juandavidmeza.dev',
    photoUrl: '',
  },
  summary: 'Ingeniero de sistemas con 11 años de experiencia construyendo plataformas de alto volumen y microservicios en Java y Spring Boot. Especialista en confiabilidad, observabilidad y automatización de despliegues. Lideré la migración de un monolito legacy a una arquitectura orientada a eventos que hoy procesa 40 millones de transacciones mensuales.',
  skills: ['Java', 'Spring Boot', 'Kotlin', 'Microservicios', 'Kafka', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Terraform', 'AWS', 'Observabilidad', 'Liderazgo técnico', 'Mentoría'],
  experience: [
    { id: 'e1', company: 'Servicios Financieros S.A.S.', position: 'Ingeniero de Plataforma Senior', startDate: 'Mar 2021', endDate: '', current: true, achievements: [
      'Diseñé y construí la plataforma de pagos que procesa 40 millones de transacciones mensuales con 99,98% de disponibilidad.',
      'Migré 40 microservicios de Java 8 a Java 21 reduciendo el tiempo de arranque un 65%.',
      'Reduje el tiempo medio de recuperación de incidentes de 45 a 8 minutos introduciendo observabilidad con OpenTelemetry.',
      'Diseñé la estrategia de pruebas de contrato adopted por 7 equipos de producto.',
      'Lideré la mentoría de 5 ingenieros junior durante sus primeros 18 meses en la empresa.',
    ] },
    { id: 'e2', company: 'Consultora de Tecnología Andina', position: 'Ingeniero de Software Backend', startDate: 'Jul 2018', endDate: 'Feb 2021', current: false, achievements: [
      'Desarrollé APIs REST y de eventos para clientes del sector retail y financiero.',
      'Automaticé el despliegue con Terraform y GitHub Actions pasando de despliegues mensuales a diarios.',
      'Implementeé circuit breakers y reintentos que redujeron los errores en cascada un 38%.',
    ] },
    { id: 'e3', company: 'Startup de Pagos Digitales', position: 'Desarrollador Backend Jr.', startDate: 'Ene 2016', endDate: 'Jun 2018', current: false, achievements: [
      'Construí el servicio de conciliación que procesa 1.2 millones de transacciones semanales.',
      'Migré la base de datos de MySQL a PostgreSQL sin p�rdida de datos.',
    ] },
  ],
  education: [
    { id: 'f1', institution: 'Universidad Nacional de Colombia, Sede Medellín', degree: 'Ingeniería de Sistemas', field: 'Ingeniería de Sistemas', startDate: '2010', endDate: '2015', current: false },
    { id: 'f2', institution: 'Instituto Tecnológico Metropolitano', degree: 'Técnico en Programación', field: '', startDate: '2008', endDate: '2010', current: false },
  ],
  languages: [
    { id: 'l1', name: 'Español', level: 'Nativo' },
    { id: 'l2', name: 'Inglés', level: 'Avanzado' },
    { id: 'l3', name: 'Portugués', level: 'Intermedio' },
  ],
  references: [
    { id: 'r1', name: 'María Fernanda Rodríguez', position: 'Directora de Tecnología', company: 'Servicios Financieros S.A.S.', phone: '+57 311 222 3344', email: 'maria.rodriguez@ejemplo.com' },
    { id: 'r2', name: 'Carlos Andrés Pérez', position: 'Gerente de Ingeniería', company: 'Consultora Andina', phone: '+57 312 333 4455', email: 'carlos.perez@ejemplo.com' },
    { id: 'r3', name: 'Lucía Ramírez Ortiz', position: 'CTO', company: 'Startup de Pagos', phone: '+57 313 444 5566', email: 'lucia.ramirez@ejemplo.com' },
  ],
};

(async () => {
  const templates = process.argv.slice(2);
  if (templates.length === 0) {
    console.error('uso: node scripts/shot.cjs <templateId> [...]');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
  });

  try {
    for (const template of templates) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 });

      // Sembramos los datos antes de que la app los lea.
      await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.evaluate((data, tpl) => {
        localStorage.setItem('talentia-cv-data', JSON.stringify(data));
        // El id de plantilla se guarda como string plano, no como JSON.
        localStorage.setItem('talentia-template', tpl);
        // Silenciar el modal de bienvenida para no tapar la maqueta.
        localStorage.setItem('talentia.onboarded.v1', '1');
      }, cv, template);
      // 'networkidle0' no sirve: la app llama a /api/ai/usage y /api/auth
      // que tardan decenas de segundos y dejarian la red ocupada todo el rato.
      await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      // Margen para que el hook mida y reubique secciones.
      await new Promise((r) => setTimeout(r, 4000));

      const el = await page.$('#cv-preview');
      if (!el) {
        console.log(`${template}: NO se encontro #cv-preview`);
        await page.close();
        continue;
      }
      const file = path.join(OUT, `${template}.png`);
      await el.screenshot({ path: file });
      const box = await el.boundingBox();
      console.log(`${template}: ${Math.round(box.width)}x${Math.round(box.height)}px -> ${path.basename(file)}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
