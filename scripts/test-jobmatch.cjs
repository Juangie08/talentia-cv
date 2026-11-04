/**
 * Pruebas del motor de coincidencia CV ⇄ oferta.
 *
 * Cubre lo que hace útil el "Modo vacante": puntaje ponderado, clasificación
 * por evidencia, requisitos vs. deseables, título objetivo y años de experiencia.
 */
const {
  analyzeVacancy,
  candidateExperienceYears,
  extractTargetTitle,
} = require('./.build/jobMatch.js');

const failures = [];

function expect(label, condition, detail) {
  if (!condition) failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

const offer = `Analista de datos

Buscamos analista de datos con 3 años de experiencia para el equipo comercial.

Requisitos:
- SQL avanzado
- Excel
- Power BI

Deseable: Python`;

const baseCV = {
  personalInfo: {
    fullName: 'Ana Gómez',
    title: 'Analista de datos',
    email: 'ana@ejemplo.com',
    phone: '+57 300 000 0000',
    location: 'Bogotá, Colombia',
    linkedin: '',
    website: '',
    photoUrl: '',
  },
  summary: 'Analista de datos con 4 años de experiencia en reportería comercial.',
  skills: ['SQL', 'Excel', 'Power BI'],
  experience: [
    {
      id: 'e1',
      company: 'ACME',
      position: 'Analista de datos',
      startDate: 'Mar 2019',
      endDate: '',
      current: true,
      achievements: ['Escribí consultas SQL para el tablero comercial y reduje el reporte manual en 6 horas.'],
    },
  ],
  education: [
    { id: 'd1', institution: 'Universidad Nacional', degree: 'Estadístico', field: 'Estadística', startDate: '2014', endDate: '2018', current: false },
  ],
  languages: [{ id: 'l1', name: 'Inglés', level: 'Intermedio' }],
  references: [],
};

const analysis = analyzeVacancy(baseCV, offer);
const byTerm = (term) => analysis.keywords.find((keyword) => keyword.term === term);

// ---- Puntaje y forma del resultado ----
expect('score en rango', analysis.score >= 0 && analysis.score <= 100, String(analysis.score));
expect('score alto con CV alineado', analysis.score >= 55, `obtuvo ${analysis.score}`);
expect('banda coherente', ['good', 'ideal', 'over'].includes(analysis.band), analysis.band);
expect('categorías suman 100 de peso', analysis.categories.reduce((sum, item) => sum + item.weight, 0) === 100);
expect('5 categorías', analysis.categories.length === 5);

// ---- Evidencia vs. declaración ----
expect('SQL dentro de un logro es evidencia', byTerm('sql')?.status === 'evidence', byTerm('sql')?.status);
expect('Excel solo en la lista es declaración', byTerm('excel')?.status === 'listed', byTerm('excel')?.status);

// ---- Requisitos vs. deseables ----
expect('Python (deseable) no es hueco crítico', !analysis.criticalGaps.includes('python'), analysis.criticalGaps.join(','));
expect('años pedidos = 3', analysis.yearsRequired === 3, String(analysis.yearsRequired));
expect('años del candidato > 5', candidateExperienceYears(baseCV) > 5, String(candidateExperienceYears(baseCV)));
expect('título objetivo detectado', extractTargetTitle(offer) === 'Analista de datos', extractTargetTitle(offer));
expect('título alineado', analysis.titleMatch !== 'different', analysis.titleMatch);

// ---- Huecos críticos con un CV que no cumple ----
const weakCV = {
  ...baseCV,
  personalInfo: { ...baseCV.personalInfo, title: 'Auxiliar administrativo' },
  skills: ['Word'],
  experience: [
    {
      id: 'e2',
      company: 'Otra',
      position: 'Auxiliar',
      startDate: 'Ene 2024',
      endDate: '',
      current: true,
      achievements: ['Organicé archivo.'],
    },
  ],
};
const weak = analyzeVacancy(weakCV, 'Requisitos: Kubernetes, Terraform y Docker para el equipo de plataforma.');
expect('CV débil puntúa bajo', weak.score < 45, String(weak.score));
expect('detecta Kubernetes como crítico', weak.criticalGaps.includes('kubernetes'), weak.criticalGaps.join(','));
expect('detecta Terraform como crítico', weak.criticalGaps.includes('terraform'), weak.criticalGaps.join(','));
expect('sin experiencia coincidente no hay evidencia', weak.evidence.length === 0, weak.evidence.join(','));

// ---- Avisos de formato ----
expect(
  'los consejos ATS vienen en los dos idiomas',
  analysis.atsTipsEs.length === analysis.atsTipsEn.length,
  `${analysis.atsTipsEs.length}/${analysis.atsTipsEn.length}`,
);
expect(
  'los consejos ATS están traducidos, no copiados',
  analysis.atsTipsEs.every((tip, index) => tip !== analysis.atsTipsEn[index]),
);
expect(
  'los consejos ATS respetan el máximo de cinco',
  analysis.atsTipsEs.length <= 5,
  String(analysis.atsTipsEs.length),
);
expect('no marca sobre-optimización sin motivo', !analysis.overOptimized || analysis.score >= 95);

if (failures.length > 0) {
  console.error(`✗ ${failures.length} problema(s) en el motor de coincidencia:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('✓ Motor de coincidencia: puntaje, evidencia, requisitos y huecos correctos');
