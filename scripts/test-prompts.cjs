/**
 * Contrato de los prompts de IA.
 *
 * Cada prompt termina pidiendo un JSON concreto que la ruta parsea tal cual.
 * Si alguien edita un prompt y rompe el contrato (o se le olvida el idioma),
 * esto falla en CI antes de que el usuario vea un 502.
 */
const {
  buildSuggestPrompt,
  buildImprovePrompt,
  buildAdaptPrompt,
  buildExtractPrompt,
  buildTranslatePrompt,
  buildVisionPrompt,
  buildTailorPrompt,
  buildCoverLetterPrompt,
  buildInterviewPrompt,
} = require('./.build/prompts.js');

const LOCALES = ['es', 'en'];
const failures = [];

function expect(label, condition, detail) {
  if (!condition) failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

const suggestData = {
  role: 'Analista de datos',
  company: 'ACME',
  yearsHint: '4 años',
  skills: ['SQL', 'Power BI'],
  achievements: ['Tableros de ventas'],
  currentText: 'Analista',
};

const cv = {
  summary: 'Analista de datos con 4 años de experiencia.',
  skills: ['SQL'],
  experience: [{ id: 'e1', position: 'Analista', company: 'ACME', achievements: ['Tableros en Power BI.'] }],
  education: [{ id: 'd1', institution: 'Universidad Nacional', degree: 'Estadístico', field: 'Estadística' }],
};

const languageMarker = { es: 'español', en: 'English' };

for (const locale of LOCALES) {
  const marker = languageMarker[locale];

  for (const field of ['title', 'achievement', 'summary']) {
    const prompt = buildSuggestPrompt(field, suggestData, locale);
    expect(`suggest/${field}/${locale}: contrato JSON`, prompt.includes('"variants"'));
    expect(`suggest/${field}/${locale}: idioma de salida`, prompt.includes(marker), `falta "${marker}"`);
  }

  expect(`improve/${locale}: contrato JSON`, buildImprovePrompt('resumen', cv.experience, locale).includes('"achievements"'));
  expect(`improve/${locale}: idioma`, buildImprovePrompt('resumen', cv.experience, locale).includes(marker));

  const adapt = buildAdaptPrompt(cv, 'Oferta de ejemplo con SQL', locale);
  expect(`adapt/${locale}: contrato summary`, adapt.includes('"summary"'));
  expect(`adapt/${locale}: contrato skillsAdd`, adapt.includes('"skillsAdd"'));
  expect(`adapt/${locale}: contrato experienceRewrites`, adapt.includes('"experienceRewrites"'));
  expect(`adapt/${locale}: ids incluidos`, adapt.includes('id=e1'));
  expect(`adapt/${locale}: idioma`, adapt.includes(marker));

  const extract = buildExtractPrompt('Texto del CV', locale);
  expect(`extract/${locale}: contrato personalInfo`, extract.includes('"personalInfo"'));
  expect(`extract/${locale}: contrato references`, extract.includes('"references"'));
  expect(`extract/${locale}: texto del usuario`, extract.includes('Texto del CV'));

  expect(`vision/${locale}: instrucción presente`, buildVisionPrompt(locale).length > 80);

  const toEn = buildTranslatePrompt(cv, 'en');
  expect(`translate/en: contrato experience`, toEn.includes('"experience"'));
  expect(`translate/en: idioma`, toEn.includes('English'));
  expect(`translate/en: ids incluidos`, toEn.includes('id=e1') && toEn.includes('id=d1'));

  const toEs = buildTranslatePrompt(cv, 'es');
  expect(`translate/es: contrato education`, toEs.includes('"education"'));
  expect(`translate/es: idioma`, toEs.includes('español'));
}

// ---- Modo vacante: personalización, carta y entrevista ----
const brief = {
  cv: {
    summary: 'Analista de datos con 4 años de experiencia.',
    title: 'Analista de datos',
    skills: ['SQL'],
    languages: ['Inglés'],
    experience: [{ id: 'e1', position: 'Analista', company: 'ACME', achievements: ['Tableros comerciales.'] }],
    education: [{ id: 'd1', institution: 'Universidad Nacional', degree: 'Estadístico', field: 'Estadística' }],
  },
  offer: 'Buscamos analista de datos con SQL y Power BI para reportería comercial.',
  company: 'ACME',
  role: 'Analista de datos',
  tone: 'equilibrado',
  diagnosis: {
    score: 62,
    titleTarget: 'Analista de datos',
    seniority: 'mid',
    yearsRequired: 3,
    candidateYears: 4,
    evidence: ['sql'],
    listed: [],
    criticalGaps: ['power bi'],
    missing: ['power bi'],
  },
};

for (const locale of LOCALES) {
  const marker = languageMarker[locale];

  const tailor = buildTailorPrompt(brief, locale);
  expect(`tailor/${locale}: contrato headlines`, tailor.includes('"headlines"'));
  expect(`tailor/${locale}: contrato gapAdvice`, tailor.includes('"gapAdvice"'));
  expect(`tailor/${locale}: marcador de cifra`, tailor.includes('[X]'));
  expect(`tailor/${locale}: ids del CV`, tailor.includes('id=e1'));
  expect(`tailor/${locale}: diagnóstico incluido`, tailor.includes('62'));
  expect(`tailor/${locale}: idioma`, tailor.includes(marker), `falta "${marker}"`);

  const letter = buildCoverLetterPrompt(brief, locale);
  expect(`letter/${locale}: contrato linkedinHeadline`, letter.includes('"linkedinHeadline"'));
  expect(`letter/${locale}: contrato body`, letter.includes('"body"'));
  expect(`letter/${locale}: marcador de cifra`, letter.includes('[X]'));
  expect(`letter/${locale}: idioma`, letter.includes(marker));

  const interview = buildInterviewPrompt(brief, locale);
  expect(`interview/${locale}: contrato starHint`, interview.includes('"starHint"'));
  expect(`interview/${locale}: contrato questionsToAsk`, interview.includes('"questionsToAsk"'));
  expect(`interview/${locale}: huecos a preparar`, interview.includes('power bi'));
  expect(`interview/${locale}: idioma`, interview.includes(marker));
}

// Los dos idiomas no pueden ser el mismo texto: si lo fueran, la "paridad"
// sería decorativa y todo el mundo recibiría respuestas en un solo idioma.
expect(
  'paridad real es/en',
  buildSuggestPrompt('summary', suggestData, 'es') !== buildSuggestPrompt('summary', suggestData, 'en'),
);

if (failures.length > 0) {
  console.error(`✗ ${failures.length} problema(s) en los prompts:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('✓ Prompts: contrato JSON e idioma correctos en es y en');
