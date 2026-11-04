import { CVData, Experience, Education, Language, generateId } from './types';

/**
 * Parsea texto plano extraído de un CV y lo convierte en CVData.
 * Usa heurísticas con regex para detectar secciones comunes.
 */
export function parseResumeText(text: string): Partial<CVData> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result: Partial<CVData> = {
    personalInfo: {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
      photoUrl: '',
    },
    summary: '',
    skills: [],
    experience: [],
    education: [],
    languages: [],
    references: [],
  };

  // Extraer email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) result.personalInfo!.email = emailMatch[0];

  // Extraer teléfono
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  if (phoneMatch) result.personalInfo!.phone = phoneMatch[1].trim();

  // Extraer LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) result.personalInfo!.linkedin = 'https://' + linkedinMatch[0];

  // Extraer website
  const websiteMatch = text.match(/https?:\/\/(?!.*linkedin)[\w.-]+\.\w+[/\w.-]*/i);
  if (websiteMatch) result.personalInfo!.website = websiteMatch[0];

  // Extraer ubicación (línea con 📍 o etiqueta "Ubicación: ...").
  const locationMatch = text.match(/📍\s*([^\n]{2,80})|ubicaci[oó]n\s*:\s*([^\n]{2,80})/i);
  if (locationMatch) {
    result.personalInfo!.location = (locationMatch[1] || locationMatch[2] || '').trim();
  }

  // Detectar secciones por headers comunes (se define antes porque el nombre
  // y el titular se validan contra estos patrones).
  const sectionPatterns: Record<string, RegExp> = {
    summary: /^(resumen|perfil|sobre m[ií]|acerca de|summary|profile|about|objetivo)/i,
    experience: /^(experiencia|experience|work|empleo|historial laboral|trayectoria)/i,
    education: /^(educaci[oó]n|formaci[oó]n|estudios|education|academic)/i,
    skills: /^(habilidades|competencias|skills|conocimientos|tecnolog[ií]as)/i,
    languages: /^(idiomas|languages|lenguas)/i,
    references: /^(referencias|references)/i,
  };

  // Los títulos pegados de Word/Google Docs suelen traer emojis o viñetas
  // ("🧩 Resumen", "• Experiencia"): se ignoran solo para detectar secciones.
  const cleanHeader = (line: string) => line.replace(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+/, '');
  const isSectionHeader = (line: string) =>
    Object.values(sectionPatterns).some((pattern) => pattern.test(cleanHeader(line)));

  // El primer línea suele ser el nombre
  if (lines.length > 0) {
    const firstLine = cleanHeader(lines[0]);
    if (firstLine.length > 1 && firstLine.length < 60 && !firstLine.includes('@') && !firstLine.match(/^\d/)) {
      result.personalInfo!.fullName = firstLine;
    }
  }

  // La segunda línea suele ser el titular ("Asesor de servicio al cliente").
  if (lines.length > 1) {
    const secondLine = cleanHeader(lines[1]);
    if (
      secondLine.length > 2 &&
      secondLine.length < 80 &&
      !secondLine.includes('@') &&
      !secondLine.match(/^\d/) &&
      !secondLine.match(/https?:\/\//i) &&
      !isSectionHeader(lines[1])
    ) {
      result.personalInfo!.title = secondLine;
    }
  }

  let currentSection = '';
  const sectionContent: Record<string, string[]> = {};

  for (const line of lines) {
    let matched = false;
    const header = cleanHeader(line);
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(header)) {
        currentSection = section;
        sectionContent[section] = [];
        matched = true;
        break;
      }
    }
    if (!matched && currentSection) {
      sectionContent[currentSection]?.push(line);
    }
  }

  // Procesar resumen
  if (sectionContent.summary) {
    result.summary = sectionContent.summary.join(' ').substring(0, 500);
  }

  // Procesar habilidades
  if (sectionContent.skills) {
    const skillsText = sectionContent.skills.join(', ');
    result.skills = skillsText
      .split(/[,;•·|\n]/)
      .map((s) => s.trim().replace(/^[([{'"«¿¡]+|[)\]}'"»?!.:;]+$/g, '').trim())
      .filter((s) => s.length > 1 && s.length < 50);
  }

  // Procesar experiencia (simplificado)
  if (sectionContent.experience) {
    const expLines = sectionContent.experience;
    const exp: Experience = {
      id: generateId(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      achievements: [],
    };
    for (const line of expLines) {
      if (!exp.position && line.length < 80) {
        exp.position = line;
      } else if (!exp.company && line.length < 80) {
        exp.company = line;
      } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        exp.achievements.push(line.replace(/^[•\-*]\s*/, ''));
      }
    }
    if (exp.position || exp.company) {
      result.experience = [exp];
    }
  }

  // Procesar educación (simplificado)
  if (sectionContent.education) {
    const eduLines = sectionContent.education;
    const edu: Education = {
      id: generateId(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false,
    };
    for (const line of eduLines) {
      if (!edu.degree && line.length < 100) {
        edu.degree = line;
      } else if (!edu.institution && line.length < 100) {
        edu.institution = line;
      }
    }
    if (edu.degree || edu.institution) {
      result.education = [edu];
    }
  }

  // Procesar idiomas
  if (sectionContent.languages) {
    const langLines = sectionContent.languages;
    result.languages = langLines.slice(0, 5).map(l => {
      const parts = l.split(/[-–:]/);
      const lang: Language = {
        id: generateId(),
        name: parts[0]?.trim() || l.trim(),
        level: 'Intermedio',
      };
      const levelText = (parts[1] || '').toLowerCase();
      if (levelText.includes('nativ') || levelText.includes('native')) lang.level = 'Nativo';
      else if (levelText.includes('avanz') || levelText.includes('advanc') || levelText.includes('fluent')) lang.level = 'Avanzado';
      else if (levelText.includes('básic') || levelText.includes('basic') || levelText.includes('beginn')) lang.level = 'Básico';
      return lang;
    });
  }

  return result;
}

/**
 * Extrae texto de un archivo PDF usando pdfjs-dist (client-side).
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Configurar worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

/** Límite de imágenes por documento (páginas del PDF o archivos de imagen). */
export const MAX_VISION_PAGES = 6;

/**
 * Convierte las páginas de un PDF en imágenes JPEG (data URL) para que un
 * modelo multimodal pueda leerlas. Se usa cuando el PDF es un escaneado
 * (imagen sin capa de texto).
 */
export async function renderPDFPagesToImages(file: File, maxPages = MAX_VISION_PAGES): Promise<string[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const images: string[] = [];
  const pagesToRender = Math.min(pdf.numPages, maxPages);
  for (let i = 1; i <= pagesToRender; i++) {
    const page = await pdf.getPage(i);
    // Escala moderada: suficiente para OCR por visión sin saturar la petición.
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext('2d');
    if (!context) continue;
    await page.render({ canvasContext: context, viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg', 0.85));
  }

  return images;
}

/**
 * Convierte un archivo de imagen (PNG/JPG/WebP) en data URL para visión.
 */
export async function imageFileToDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });

  // Las capturas de móvil pueden pesar mucho: re-escala si supera ~1.5 MB.
  if (dataUrl.length > 1_500_000) {
    return downscaleImageDataUrl(dataUrl);
  }
  return dataUrl;
}

/** Re-escala una imagen (data URL) a un ancho máximo de 1600px. */
async function downscaleImageDataUrl(dataUrl: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo procesar la imagen.'));
    image.src = dataUrl;
  });

  const scale = Math.min(1, 1600 / img.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/** true si el archivo es una imagen soportada por el modo visión. */
export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(file.name);
}

/**
 * Extrae texto de un archivo Word (.docx) usando mammoth.
 */
export async function extractTextFromWord(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extrae el texto plano de un archivo subido, según su extensión.
 * Lanza un Error con mensaje legible si el formato no se puede procesar.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }

  if (name.endsWith('.docx')) {
    return extractTextFromWord(file);
  }

  // Word binario antiguo (.doc): mammoth solo soporta .docx
  if (name.endsWith('.doc')) {
    throw new Error('Los archivos .doc antiguos no se pueden leer. Ábrelos en Word y guárdalos como .docx o PDF.');
  }

  if (name.endsWith('.txt') || name.endsWith('.text') || file.type === 'text/plain') {
    return file.text();
  }

  throw new Error('Formato no soportado. Usa PDF, Word (.docx), imagen (JPG/PNG) o texto (.txt).');
}
