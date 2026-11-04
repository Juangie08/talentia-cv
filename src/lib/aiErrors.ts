import type { Locale } from './i18n/config';

/**
 * Mensajes de error de las rutas de IA en los dos idiomas de la app.
 *
 * Los mensajes vuelven al navegador y se muestran tal cual en un toast, así que
 * tienen que respetar el idioma activo: antes estaban escritos solo en español
 * y la interfaz inglesa mostraba errores en español.
 *
 * Regla: nunca incluir detalles del proveedor (nombres de modelo, URLs, estado
 * interno). Solo lo que la persona puede accionar.
 */
const ERROR_TEXT = {
  origin: {
    es: 'Origen no permitido.',
    en: 'Origin not allowed.',
  },
  rateLimit: {
    es: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.',
    en: 'Too many requests. Wait a moment and try again.',
  },
  badBody: {
    es: 'Cuerpo de la solicitud inválido.',
    en: 'Invalid request body.',
  },
  generic: {
    es: 'Error al procesar la solicitud.',
    en: 'Something went wrong while processing the request.',
  },
  offerShort: {
    es: 'Pega la descripción completa de la oferta (mínimo un par de líneas).',
    en: 'Paste the full job post (at least a couple of lines).',
  },

  // --- Adaptar (ruta histórica) ---
  adaptEmpty: {
    es: 'La IA no generó cambios útiles para esta oferta. Intenta con el texto completo de la convocatoria.',
    en: 'The AI produced no useful changes for this post. Try with the complete job description.',
  },
  adaptFailed: {
    es: 'La IA no pudo adaptar la hoja de vida. Intenta de nuevo.',
    en: 'The AI could not adapt your resume. Try again.',
  },

  // --- Personalizar ---
  tailorEmpty: {
    es: 'La IA no generó cambios útiles. Añade más detalle a tu hoja de vida e intenta de nuevo.',
    en: 'The AI produced no useful changes. Add more detail to your resume and try again.',
  },
  tailorFailed: {
    es: 'La IA no pudo personalizar la hoja de vida. Intenta de nuevo.',
    en: 'The AI could not tailor your resume. Try again.',
  },

  // --- Carta ---
  letterEmpty: {
    es: 'La IA no devolvió una carta utilizable. Intenta de nuevo.',
    en: 'The AI did not return a usable letter. Try again.',
  },
  letterFailed: {
    es: 'La IA no pudo escribir la carta. Intenta de nuevo.',
    en: 'The AI could not write the letter. Try again.',
  },

  // --- Entrevista ---
  interviewEmpty: {
    es: 'La IA no devolvió preguntas. Intenta de nuevo.',
    en: 'The AI did not return any questions. Try again.',
  },
  interviewFailed: {
    es: 'La IA no pudo preparar la entrevista. Intenta de nuevo.',
    en: 'The AI could not prepare the interview. Try again.',
  },

  // --- Extraer ---
  imageTooLarge: {
    es: 'Hay imágenes demasiado grandes. Reduce el tamaño e inténtalo de nuevo.',
    en: 'Some images are too large. Reduce their size and try again.',
  },
  emptyInput: {
    es: 'Envía el texto de tu hoja de vida o al menos una imagen de ella.',
    en: 'Send your resume text or at least one image of it.',
  },
  unreadable: {
    es: 'No pudimos reconocer texto suficiente en el documento o en la imagen. Intenta con una imagen más nítida o escribe tus datos manualmente.',
    en: 'We could not read enough text from the document or image. Try a sharper image or type your details manually.',
  },
  noData: {
    es: 'No pudimos reconocer los datos. Revisa que el documento sea una hoja de vida.',
    en: 'We could not recognize the details. Check that the document is a resume.',
  },
  extractFailed: {
    es: 'La IA no pudo procesar el documento. Intenta de nuevo.',
    en: 'The AI could not process the document. Try again.',
  },

  // --- Sugerencias ---
  unsupportedField: {
    es: 'Campo no soportado.',
    en: 'Unsupported field.',
  },
  missingRole: {
    es: 'Escribe el cargo y la empresa primero: con eso la IA puede sugerir logros coherentes.',
    en: 'Enter the role and the company first: that is what lets the AI suggest coherent achievements.',
  },
  suggestEmpty: {
    es: 'La IA no generó sugerencias esta vez. Inténtalo de nuevo.',
    en: 'The AI produced no suggestions this time. Try again.',
  },
  suggestTimeout: {
    es: 'La IA no respondió a tiempo. Intenta de nuevo.',
    en: 'The AI did not answer in time. Try again.',
  },

  // --- Traducir ---
  translateMissing: {
    es: 'Falta la hoja de vida o el idioma de destino.',
    en: 'The resume or the target language is missing.',
  },
  translateEmpty: {
    es: 'La IA no devolvió una traducción utilizable. Intenta de nuevo.',
    en: 'The AI did not return a usable translation. Try again.',
  },
  translateFailed: {
    es: 'La IA no pudo traducir la hoja de vida. Intenta de nuevo.',
    en: 'The AI could not translate the resume. Try again.',
  },

  // --- Uso ---
  usageFailed: {
    es: 'No se pudo consultar el uso de IA.',
    en: 'Could not read the AI usage status.',
  },
} satisfies Record<string, Record<Locale, string>>;

export type AiErrorKey = keyof typeof ERROR_TEXT;

/** Nombre de la función de IA, para el aviso de "no configurada". */
const FEATURE_NAME = {
  adapt: { es: 'adaptación', en: 'Adaptation' },
  extract: { es: 'extracción', en: 'Extraction' },
  interview: { es: 'entrevista', en: 'Interview' },
  letter: { es: 'carta', en: 'Cover letter' },
  suggest: { es: 'sugerencias', en: 'Suggestion' },
  tailor: { es: 'personalización', en: 'Tailoring' },
  translate: { es: 'traducción', en: 'Translation' },
} as const;

export type AiFeature = keyof typeof FEATURE_NAME;

/** Mensaje de error localizado para las rutas de IA. */
export function aiError(locale: Locale, key: AiErrorKey): string {
  return ERROR_TEXT[key][locale] ?? ERROR_TEXT[key].en;
}

/** "La IA de X no está configurada en el servidor." en el idioma activo. */
export function aiNotConfigured(locale: Locale, feature: AiFeature): string {
  const name = FEATURE_NAME[feature];
  return locale === 'es'
    ? `La IA de ${name.es} no está configurada en el servidor.`
    : `${name.en} AI is not configured on the server.`;
}
