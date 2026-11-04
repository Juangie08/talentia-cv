import { CVData } from './types';
import {
  extractTextFromFile,
  parseResumeText,
  isImageFile,
  imageFileToDataUrl,
  renderPDFPagesToImages,
  MAX_VISION_PAGES,
} from './parsers';
import { mergeWithDefaultCVData, describeExtracted } from './cvNormalize';

export interface ImportResult {
  data: CVData;
  /** 'ai' = extracción con IA; 'vision' = IA leyendo imagen; 'regex' = parser de respaldo. */
  source: 'ai' | 'vision' | 'regex';
  /** Secciones que se pudieron llenar, en lenguaje simple. */
  found: string[];
}

async function extractWithServer(text: string): Promise<ImportResult | null> {
  // Intento 1: IA
  try {
    const response = await fetch('/api/ai/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      const payload = await response.json();
      const data = mergeWithDefaultCVData(payload?.data);
      const found: string[] = Array.isArray(payload?.found) ? payload.found : describeExtracted(payload?.data || {});
      if (found.length > 0) {
        return { data, source: 'ai', found };
      }
    }
  } catch {
    // red caída, 503 (sin key), 429 (límite): se usa el respaldo
  }
  return null;
}

async function extractWithVision(images: string[]): Promise<ImportResult | null> {
  try {
    const response = await fetch('/api/ai/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    });

    if (response.ok) {
      const payload = await response.json();
      const data = mergeWithDefaultCVData(payload?.data);
      const found: string[] = Array.isArray(payload?.found) ? payload.found : describeExtracted(payload?.data || {});
      if (found.length > 0) {
        return { data, source: 'vision', found };
      }
    }
  } catch {
    // red caída, 503 (sin key), 429 (límite): se usa el respaldo
  }
  return null;
}

function fallbackFromText(text: string): ImportResult {
  const parsed = parseResumeText(text);
  const data = mergeWithDefaultCVData(parsed);
  const found = describeExtracted(parsed);
  return { data, source: 'regex', found };
}

/**
 * Importa una hoja de vida desde un archivo:
 *  - PDF/Word/TXT con texto: extracción estructurada con IA.
 *  - PDF escaneado o imagen (JPG/PNG/foto): el modelo multimodal
 *    transcribe las páginas y luego la IA ordena los datos.
 * Si no hay IA disponible o falla, usa el parser de respaldo con reglas.
 */
export async function importCVFromFile(file: File): Promise<ImportResult> {
  // Caso 1: imágenes sueltas (foto o captura de la hoja de vida).
  if (isImageFile(file)) {
    const images = [await imageFileToDataUrl(file)];
    const vision = await extractWithVision(images);
    if (vision) return vision;
    throw new Error('No pudimos leer la imagen. Intenta con un PDF o escribe tus datos como texto.');
  }

  // Caso 2: PDF, Word o TXT.
  const text = await extractTextFromFile(file);

  if (text && text.trim().length >= 40) {
    const ai = await extractWithServer(text);
    if (ai) return ai;
    return fallbackFromText(text);
  }

  // Caso 3: poco o nada de texto → probablemente un PDF escaneado.
  if (/\.pdf$/i.test(file.name)) {
    const images = await renderPDFPagesToImages(file, MAX_VISION_PAGES);
    const vision = await extractWithVision(images);
    if (vision) return vision;
  }

  throw new Error(
    'El archivo no tiene texto legible y no pudimos leerlo como imagen. Si es un escaneo, toma una foto clara o escribe tus datos como texto.',
  );
}

/**
 * Importa una hoja de vida a partir de un texto libre escrito por el usuario
 * (todo de corrido, como se le ocurriría: quién es, su experiencia, qué busca…).
 */
export async function importCVFromText(text: string): Promise<ImportResult> {
  const trimmed = text.trim();
  if (trimmed.length < 40) {
    throw new Error('Escribe un poco más sobre ti (al menos un par de líneas) para que la IA pueda ayudarte.');
  }

  const ai = await extractWithServer(trimmed);
  if (ai) return ai;

  // Respaldo: el texto narrado no es un CV estructurado, así que se va tal
  // cual al perfil y no se inventa nada más.
  return {
    data: mergeWithDefaultCVData({ summary: trimmed.slice(0, 1200) }),
    source: 'regex',
    found: ['perfil'],
  };
}
