/**
 * Verificación anti-invención del texto generado por la IA.
 *
 * El prompt pide "no inventes métricas", pero un modelo puede añadir un
 * "aumenté las ventas 30%" que nunca existió. Antes de aplicar una sugerencia,
 * aquí se comprueba que cada cifra del texto generado aparezca también en el
 * material de origen (CV + oferta). Las cifras sin respaldo se reportan para
 * que la interfaz las muestre y el usuario decida.
 */

const NUMBER_PATTERN = /\d+(?:[.,]\d+)*/g;

/** Normaliza un número: quita separadores de miles y ceros finales sobrantes. */
function canonicalNumber(raw: string): string {
  const withoutThousands = raw.replace(/\.(?=\d{3}\b)/g, '').replace(/,/g, '.');
  const value = Number.parseFloat(withoutThousands);
  if (!Number.isFinite(value)) return withoutThousands;
  return String(value);
}

function numbersIn(text: string): string[] {
  return Array.from(text.matchAll(NUMBER_PATTERN), (match) => canonicalNumber(match[0]));
}

export interface UnsupportedClaim {
  /** Fragmento generado que contiene la cifra. */
  sentence: string;
  /** Cifra tal como apareció en el texto generado. */
  claim: string;
}

/**
 * Devuelve las cifras del texto generado que no existen en el origen.
 * Compara números canónicos, así "30" y "30.0" cuentan igual.
 */
export function findUnsupportedClaims(sourceText: string, generatedText: string): UnsupportedClaim[] {
  if (!generatedText.trim()) return [];

  const sourceNumbers = new Set(numbersIn(sourceText));
  const sentences = generatedText
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const claims: UnsupportedClaim[] = [];
  const seen = new Set<string>();

  for (const sentence of sentences) {
    for (const raw of sentence.match(NUMBER_PATTERN) || []) {
      const canonical = canonicalNumber(raw);
      if (sourceNumbers.has(canonical)) continue;
      const key = `${canonical}|${sentence}`;
      if (seen.has(key)) continue;
      seen.add(key);
      claims.push({ sentence, claim: raw });
    }
  }

  return claims;
}

/** Todo el texto que el usuario aportó: su CV y la oferta. */
export function cvSourceText(cv: {
  summary?: string;
  skills?: string[];
  experience?: Array<{ position?: string; company?: string; achievements?: string[] }>;
  education?: Array<{ institution?: string; degree?: string; field?: string }>;
}, offer = ''): string {
  const parts: string[] = [cv.summary || '', offer];
  parts.push(...(cv.skills || []));
  for (const exp of cv.experience || []) {
    parts.push(exp.position || '', exp.company || '', ...(exp.achievements || []));
  }
  for (const edu of cv.education || []) {
    parts.push(edu.institution || '', edu.degree || '', edu.field || '');
  }
  return parts.join(' \n ');
}

export interface AdaptationLike {
  summary: string;
  skillsAdd: string[];
  experienceRewrites: Array<{ id: string; achievements: string[] }>;
}

/**
 * Revisa una adaptación completa y devuelve los avisos para la interfaz,
 * en el idioma de la petición.
 */
export function reviewAdaptation(
  sourceText: string,
  result: AdaptationLike,
  locale: 'es' | 'en',
): string[] {
  const warnings: string[] = [];
  const seen = new Set<string>();

  const check = (text: string, label?: string) => {
    for (const claim of findUnsupportedClaims(sourceText, text)) {
      const key = `${claim.claim}|${claim.sentence}`;
      if (seen.has(key)) continue;
      seen.add(key);
      warnings.push(
        locale === 'es'
          ? `${label ? `${label}: ` : ''}la cifra «${claim.claim}» no aparece en tu hoja de vida ni en la oferta. Revísala antes de aplicarla.`
          : `${label ? `${label}: ` : ''}the figure “${claim.claim}” does not appear in your resume or in the job post. Check it before applying.`,
      );
    }
  };

  check(result.summary);
  for (const rewrite of result.experienceRewrites) {
    check(rewrite.achievements.join(' '));
  }

  return warnings.slice(0, 5);
}

/**
 * Avisos para un bloque de texto suelto (una carta, un resumen de LinkedIn).
 * Comparte la misma regla: ninguna cifra que no exista en el material de origen.
 */
export function reviewText(sourceText: string, text: string, locale: 'es' | 'en'): string[] {
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const claim of findUnsupportedClaims(sourceText, text)) {
    const key = `${claim.claim}|${claim.sentence}`;
    if (seen.has(key)) continue;
    seen.add(key);
    warnings.push(
      locale === 'es'
        ? `La cifra «${claim.claim}» no aparece en tu hoja de vida ni en la oferta. Revísala antes de usarla.`
        : `The figure “${claim.claim}” does not appear in your resume or in the job post. Check it before using it.`,
    );
  }

  return warnings.slice(0, 5);
}

/** Igual que `reviewAdaptation` pero para la mejora de perfil y logros. */
export function reviewImprovement(
  sourceText: string,
  generated: { summary?: string; experience?: Array<{ achievements: string[] }> },
  locale: 'es' | 'en',
): string[] {
  const warnings: string[] = [];
  const seen = new Set<string>();

  const check = (text: string) => {
    for (const claim of findUnsupportedClaims(sourceText, text)) {
      const key = `${claim.claim}|${claim.sentence}`;
      if (seen.has(key)) continue;
      seen.add(key);
      warnings.push(
        locale === 'es'
          ? `La cifra «${claim.claim}» no aparece en tu texto original. Revísala antes de aplicarla.`
          : `The figure “${claim.claim}” does not appear in your original text. Check it before applying.`,
      );
    }
  };

  check(generated.summary || '');
  for (const exp of generated.experience || []) check(exp.achievements.join(' '));

  return warnings.slice(0, 5);
}
