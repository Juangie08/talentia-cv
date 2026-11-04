/**
 * Fuente sugerida por plantilla (primera del arreglo = la recomendada).
 * La elección es estética: cada plantilla tiene una tipografía que le queda.
 */
export const FONT_PRESETS: Record<string, string[]> = {
  // Corporativas — legibilidad y sobriedad
  moderno: ['Source Sans 3', 'Inter', 'IBM Plex Sans'],
  corporate: ['IBM Plex Sans', 'Source Sans 3', 'Inter'],
  ejecutivo: ['Lora', 'Playfair Display', 'Source Sans 3'],
  senior: ['Playfair Display', 'Lora', 'Source Sans 3'],
  legal: ['Lora', 'Source Sans 3', 'Merriweather'],
  medico: ['Source Sans 3', 'Inter', 'Lora'],
  finance: ['IBM Plex Sans', 'Source Sans 3', 'Inter'],

  // Tecnológicas — geométricas y limpias
  developer: ['Space Grotesk', 'Outfit', 'IBM Plex Sans'],
  tech: ['Space Grotesk', 'Source Code Pro', 'Outfit'],
  'software-engineer': ['Outfit', 'Space Grotesk', 'Inter'],
  'chat-specialist': ['DM Sans', 'Inter', 'Outfit'],

  // Creativas — carácter y personalidad
  creativo: ['Outfit', 'Space Grotesk', 'Poppins'],
  'creative-pro': ['Outfit', 'Poppins', 'Space Grotesk'],
  designer: ['Poppins', 'Outfit', 'Playfair Display'],
  'visual-designer': ['Playfair Display', 'Poppins', 'Outfit'],
  marketing: ['Poppins', 'Outfit', 'DM Sans'],
  'marketing-strategist': ['Space Grotesk', 'Outfit', 'Poppins'],
  educacion: ['DM Sans', 'Source Sans 3', 'Lora'],

  // Simples / ATS — neutras y claras
  minimalista: ['Inter', 'Source Sans 3', 'IBM Plex Sans'],
  'customer-service': ['Inter', 'DM Sans', 'Source Sans 3'],
  student: ['DM Sans', 'Inter', 'Source Sans 3'],
  'bubble-minimal': ['DM Sans', 'Inter', 'Outfit'],

  // Cute — redondeadas y amables
  pink: ['Poppins', 'Quicksand', 'DM Sans'],
  psychologist: ['Quicksand', 'DM Sans', 'Poppins'],
  'sakura-bloom': ['Manrope', 'Quicksand', 'DM Sans'],
  'cherry-ribbon': ['Quicksand', 'Manrope', 'DM Sans'],
  'candy-editorial': ['Poppins', 'DM Sans', 'Manrope'],
  'peach-magazine': ['DM Sans', 'Poppins', 'Manrope'],

  // Nuevas plantillas modernas
  'editorial-bold': ['Playfair Display', 'Space Grotesk', 'Outfit'],
  'pastel-pro': ['Outfit', 'DM Sans', 'Quicksand'],
  'mono-statement': ['Space Grotesk', 'Source Code Pro', 'Outfit'],
  'neon-modern': ['Outfit', 'Space Grotesk', 'Poppins'],
  'ink-elegant': ['Playfair Display', 'Lora', 'Cormorant Garamond'],
  'green-fresh': ['Outfit', 'DM Sans', 'Source Sans 3'],
};

/** Presets claros/oscuros para el fondo del encabezado (con contraste automático). */
export const HEADER_BG_PRESETS = [
  { name: 'Blanco', value: '#FFFFFF' },
  { name: 'Gris claro', value: '#F1F5F9' },
  { name: 'Menta', value: '#ECFDF5' },
  { name: 'Crema', value: '#FFFBEB' },
  { name: 'Rosa suave', value: '#FDF2F8' },
  { name: 'Lavanda', value: '#F5F3FF' },
  { name: 'Azul suave', value: '#EFF6FF' },
  { name: 'Grafito', value: '#1E293B' },
  { name: 'Azul noche', value: '#0F172A' },
  { name: 'Verde bosque', value: '#064E3B' },
  { name: 'Vino', value: '#4C0519' },
  { name: 'Añil', value: '#312E81' },
];
