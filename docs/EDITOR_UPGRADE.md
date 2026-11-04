# EDITOR UPGRADE - Plan de Mejora del Editor

> **Proyecto:** HDV Gratis / Talentia  
> **Stack:** Next.js 14 (App Router) + Prisma + SQLite + TypeScript + Tailwind CSS + Radix UI  
> **URL local:** http://localhost:3500  
> **Fecha:** 2026-03-24  

---

## 1. Estado actual del editor

### 1.1 Layout actual (2 zonas)

```
┌──────────────────────┬────────────────────────────────────┐
│   PANEL IZQUIERDO    │       VISTA PREVIA CV              │
│   (formularios)      │       (plantilla renderizada)      │
│   lg:w-[480px]       │       flex-1                       │
│   xl:w-[520px]       │                                  │
└──────────────────────┴────────────────────────────────────┘
```

- **Ruta:** `/editor` (`src/app/editor/page.tsx`)
- **Panel izquierdo:** Tabs con formularios (DATOS, PERFIL, HABS, EXP, EDU, IDM, REF)
- **Panel derecho:** Vista previa del CV con zoom controls
- **Header:** Botones de acciones (IA, Guardar, Zoom, Exportar PDF/Word, Limpiar)
- **Mobile:** Toggle entre formulario y preview

### 1.2 Archivos clave del editor

| Archivo | Responsabilidad |
|---------|----------------|
| `src/app/editor/page.tsx` | Página principal del editor (628 líneas). Layout de 2 columnas, tabs, acciones de guardar/exportar |
| `src/lib/hooks.ts` | Hook `useCVData` - estado global del CV con persistencia en localStorage |
| `src/lib/types.ts` | Interfaces: `CVData`, `PersonalInfo`, `UserTemplateConfig`, `BaseTemplateId`, etc. |
| `src/lib/templates.ts` | Gestión de plantillas base (24) y personalizadas (localStorage). Ratings. |
| `src/lib/profiles.ts` | Gestión de perfiles locales y CVs guardados (localStorage). Límite: 3 CVs por perfil |
| `src/lib/export.ts` | Exportación a PDF (html2canvas + jsPDF) y Word (docx) |
| `src/lib/date-utils.ts` | Utilidades de formato de fechas |
| `src/lib/aiClient.ts` | Cliente para mejorar texto con IA (configurable por usuario) |
| `src/components/preview/CVPreview.tsx` | Router de plantillas: resuelve template ID -> componente base. Inyecta overrides (accentColor, fontFamily, density, showPhoto). Control de paginación. |
| `src/components/forms/PersonalInfoForm.tsx` | Formulario de datos personales + subida de foto |
| `src/components/TemplateSelector.tsx` | Selector de plantillas (dialog con tabs: Base, Mías, Top) |
| `src/components/UserTemplateBuilderDialog.tsx` | Dialog para crear/editar plantillas personalizadas (nombre, base, color, fuente, densidad, mostrar foto) |
| `src/components/SavedCVsDialog.tsx` | Dialog para gestionar CVs guardados y perfiles |
| `src/components/preview/templates/*.tsx` | 24 componentes de plantilla (cada uno con su layout fijo) |
| `src/components/preview/templates/shared.ts` | Utilidades compartidas para templates (`CustomTemplateProps`, `stripUrlProtocol`, `getLanguageLevelWidth`) |
| `src/components/ui/*.tsx` | Componentes UI de Radix (accordion, dialog, tabs, select, checkbox, etc.) |
| `src/app/globals.css` | Variables CSS de tema (shadcn), scrollbar custom, animaciones |
| `prisma/schema.prisma` | Schema SQLite: User, Account, Session, CV, CustomTemplate, Rating |

### 1.3 Estado del guardado en Prisma/SQLite

**Funciona correctamente para usuarios autenticados:**
- API: `POST /api/cvs` - Crea o actualiza un CV (upsert por `id`)
- API: `GET /api/cvs` - Lista CVs del usuario
- API: `DELETE /api/cvs?id=...` - Elimina un CV
- Al guardar: guarda en localStorage + envía POST a `/api/cvs`
- El JSON de `CVData` se serializa como string en el campo `data` del modelo `CV`

**Problema identificado:**
- El campo `data` del modelo CV almacena `CVData` como string JSON, pero NO incluye la `customization` (personalización visual)
- No hay columna para personalización ni para `customization` JSONB
- Si se añade un panel de estilos, hay que extender el modelo CV

### 1.4 Cómo se renderizan las plantillas actualmente

1. `CVPreview` recibe `template` (nombre de plantilla) y `customConfig` opcional (overrides del UserTemplateBuilderDialog)
2. Resuelve si es plantilla base o personalizada
3. Renderiza el componente de plantilla correspondiente pasando `cv` + overrides
4. Cada plantilla tiene su layout fijo con Tailwind + estilos inline
5. Los overrides actuales solo soportan: `accentColor`, `fontFamily`, `density`, `showPhoto`
6. **NO hay CSS variables** - todo está hardcodeado o inline en cada plantilla
7. **NO hay soporte para**: tipografía avanzada, tamaños de fuente, colores de fondo, espaciado, secciones toggle/reorder, marca de agua

### 1.5 Cómo se maneja la foto de perfil actualmente

- **Panel izquierdo** (`PersonalInfoForm.tsx`):
  - Input file que acepta `image/*`
  - Valida tipo y tamaño (max 2MB)
  - Si hay sesión: sube a `/api/upload` -> guarda en `public/uploads/photos/` -> obtiene URL -> la guarda en `formData.photoUrl`
  - Si no hay sesión: convierte a base64 -> guarda en `talentia.photo` de localStorage -> la guarda en `formData.photoUrl`
  - Vista previa de la foto con overlay de eliminar
  - Input de texto para pegar URL externa

- **Templates:** Cada plantilla lee `cv.personalInfo.photoUrl` directamente (ejemplo: `ModernoTemplate.tsx:20`)

- **Problema:** La foto se guarda como base64 en localStorage (ocupa ~2MB) o como ruta local del servidor. No hay Supabase Storage configurado.

### 1.6 Dependencias ya instaladas relevantes

| Paquete | Uso actual |
|---------|-----------|
| `@radix-ui/react-accordion` | Ya instalado - componente `Accordion` en `src/components/ui/accordion.tsx` |
| `@radix-ui/react-checkbox` | Ya instalado - usado en UserTemplateBuilderDialog |
| `@radix-ui/react-dialog` | Ya instalado - diálogos del editor |
| `@radix-ui/react-select` | Ya instalado - selectores |
| `@radix-ui/react-label` | Ya instalado - labels |
| `@radix-ui/react-tabs` | Ya instalado - tabs del editor |
| `@radix-ui/react-tooltip` | Ya instalado - tooltips |
| `lucide-react` | Íconos (v0.577.0) |
| `sonner` | Toast notifications |
| `html2canvas` | Captura de preview para PDF |
| `jspdf` | Generación de PDF |
| `docx` | Generación de Word |
| `tailwind-merge` | Merge de clases Tailwind |

### 1.7 Lo que NO existe y se necesita instalar

| Paquete | Propósito |
|---------|-----------|
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag & drop para reordenar secciones |
| `react-image-crop` | Cropper para foto de perfil circular |

### 1.8 Observaciones sobre Supabase

**El proyecto NO usa Supabase.** Usa:
- **SQLite** via Prisma para la base de datos
- **NextAuth** para autenticación
- **localStorage** para datos anónimos
- **API routes de Next.js** para uploads de fotos

Si se quiere añadir funcionalidad tipo Supabase (Storage, etc.), se debe:
1. Instalar `@supabase/supabase-js`
2. Configurar credenciales de Supabase
3. Crear bucket de Storage
4. O usar la API de upload existente con extensiones

---

## 2. Arquitectura propuesta

### 2.1 Nuevo layout de 3 columnas

```
┌──────────────┬──────────────────────┬─────────────────┐
│ PANEL IZQ    │   VISTA PREVIA CV    │  PANEL DER      │
│ (formularios)│   (plantilla)        │  (estilos)      │
│ ~360px       │   flex-1             │  ~272px         │
└──────────────┴──────────────────────┴─────────────────┘
```

**Responsive:**
- Desktop (>=1280px): 3 columnas
- Tablet (992-1279px): 2 columnas (izq + preview), panel der como drawer
- Mobile (<992px): Toggle izq/preview, panel der como overlay

### 2.2 Nuevos componentes a crear

| Componente | Ubicación | Responsabilidad |
|-----------|-----------|----------------|
| `StylePanel` | `src/components/style-panel/StylePanel.tsx` | Contenedor principal del panel derecho. Header con toggle colapsable. Scroll interno. |
| `StylePanelHeader` | `src/components/style-panel/StylePanelHeader.tsx` | Header del panel con ícono de pincel, título "Estilo", botón de colapsar |
| `StyleSection` | `src/components/style-panel/StyleSection.tsx` | Wrapper genérico para secciones colapsables (usa Radix Accordion) |
| `ProfileSection` | `src/components/style-panel/ProfileSection.tsx` | Sección 0: Foto de perfil con upload/cropper |
| `TypographySection` | `src/components/style-panel/TypographySection.tsx` | Sección 1: Selector de fuente, sliders de tamaño, toggles de formato |
| `ColorsSection` | `src/components/style-panel/ColorsSection.tsx` | Sección 2: Color accent, fondo header, texto header, texto cuerpo, swatches |
| `SpacingSection` | `src/components/style-panel/SpacingSection.tsx` | Sección 3: Segmented control densidad, slider margenes |
| `SectionsSection` | `src/components/style-panel/SectionsSection.tsx` | Sección 4: Lista de secciones con toggle + drag & drop |
| `WatermarkSection` | `src/components/style-panel/WatermarkSection.tsx` | Sección 5: Toggle marca de agua |
| `ColorInput` | `src/components/style-panel/shared/ColorInput.tsx` | Input de color + swatches sincronizados |
| `SliderInput` | `src/components/style-panel/shared/SliderInput.tsx` | Slider + input numérico sincronizado |
| `SegmentedControl` | `src/components/style-panel/shared/SegmentedControl.tsx` | Control segmentado (Compacto/Normal/Amplio) |
| `PhotoCropperModal` | `src/components/style-panel/PhotoCropperModal.tsx` | Modal con react-image-crop para recortar foto circular |
| `CVWatermark` | `src/components/preview/CVWatermark.tsx` | Componente de marca de agua superpuesto |

### 2.3 Cambios a componentes existentes

| Archivo | Cambio |
|---------|--------|
| `src/app/editor/page.tsx` | Cambiar layout de 2 a 3 columnas. Añadir `StylePanel` como tercer columna. Exponer `customization` state. Agregar CSS var injection. |
| `src/lib/hooks.ts` | Añadir estado de `customization` (CVCustomization). Extender persistencia en localStorage. Crear hook `useCustomization`. |
| `src/lib/types.ts` | Añadir interfaz `CVCustomization`. Añadir `sectionsVisible` y `sectionsOrder` a `CVData`. |
| `src/components/preview/CVPreview.tsx` | Inyectar CSS variables en el wrapper. Pasar `customization` a templates. Renderizar `CVWatermark` condicionalmente. Soportar `sectionsVisible` y `sectionsOrder` para filtrar/reordenar secciones. |
| `src/components/forms/PersonalInfoForm.tsx` | Mantener foto existente + sincronizar con panel derecho (mismo `formData.photoUrl`). |
| `src/components/preview/templates/*.tsx` (cada uno) | Agregar wrapper con clases CSS variables (`cv-template-wrapper`, `cv-section-title`, `cv-name`, `cv-header-bg`). Usar clases en lugar de estilos inline donde aplique. |
| `src/app/globals.css` | Añadir definición de CSS variables del CV. Estilos del wrapper de plantilla. |
| `prisma/schema.prisma` | Añadir campo `customization String?` al modelo CV para serializar la personalización como JSON. |

### 2.4 Interface CVCustomization (TypeScript)

```typescript
export interface CVCustomization {
  // Tipografía
  fontBody: string;                      // 'Inter', 'Roboto', 'Georgia', etc.
  fontSizeBase: number;                  // 8-14px, default 10
  fontSizeHeading: number;               // 10-18px, default 12
  fontSizeName: number;                  // 18-36px, default 26
  fontWeightBody: 'normal' | 'bold';
  fontStyleBody: 'normal' | 'italic';
  decorationHeading: 'none' | 'underline';
  transformHeading: 'none' | 'uppercase';

  // Colores
  colorAccent: string;                   // '#2563EB'
  colorHeaderBg: string;                 // '#1E293B' (depende de plantilla)
  colorHeaderText: string;               // '#FFFFFF'
  colorBodyText: string;                 // '#1A1A1A'

  // Espaciado
  spacing: 'compact' | 'normal' | 'spacious';
  pagePadding: number;                   // 16-48px, default 32

  // Secciones
  sectionsVisible: {
    photo: boolean;
    summary: boolean;
    skills: boolean;
    experience: boolean;
    education: boolean;
    languages: boolean;
    references: boolean;
  };
  sectionsOrder: string[];               // ['photo', 'summary', 'skills', ...]

  // Marca de agua
  showWatermark: boolean;                // default: true

  // Metadata
  updatedAt?: string;
}
```

**Valor por defecto:**

```typescript
export const defaultCustomization: CVCustomization = {
  fontBody: 'Inter',
  fontSizeBase: 10,
  fontSizeHeading: 12,
  fontSizeName: 26,
  fontWeightBody: 'normal',
  fontStyleBody: 'normal',
  decorationHeading: 'none',
  transformHeading: 'uppercase',
  colorAccent: '#2563EB',
  colorHeaderBg: '#1E293B',
  colorHeaderText: '#FFFFFF',
  colorBodyText: '#1A1A1A',
  spacing: 'normal',
  pagePadding: 32,
  sectionsVisible: {
    photo: true,
    summary: true,
    skills: true,
    experience: true,
    education: true,
    languages: true,
    references: true,
  },
  sectionsOrder: ['photo', 'summary', 'experience', 'education', 'skills', 'languages', 'references'],
  showWatermark: true,
};
```

### 2.5 CSS Variables que se inyectarán en las plantillas

```css
:root {
  /* Estas variables se inyectan dinámicamente vía JS */
  --cv-font-body: 'Inter', sans-serif;
  --cv-font-size-base: 10px;
  --cv-font-size-heading: 12px;
  --cv-font-size-name: 26px;
  --cv-font-weight-body: normal;
  --cv-font-style-body: normal;
  --cv-decoration-heading: none;
  --cv-transform-heading: uppercase;
  --cv-color-accent: #2563EB;
  --cv-color-header-bg: #1E293B;
  --cv-color-header-text: #FFFFFF;
  --cv-color-body-text: #1A1A1A;
  --cv-spacing-section: 16px;
  --cv-page-padding: 32px;
}

.cv-template-wrapper {
  font-family: var(--cv-font-body);
  font-size: var(--cv-font-size-base);
  color: var(--cv-color-body-text);
  padding: var(--cv-page-padding);
}

.cv-section-title {
  font-size: var(--cv-font-size-heading);
  font-weight: 700;
  text-transform: var(--cv-transform-heading);
  text-decoration: var(--cv-decoration-heading);
  color: var(--cv-color-accent);
}

.cv-name {
  font-size: var(--cv-font-size-name);
  color: var(--cv-color-body-text);
}

.cv-header-bg {
  background-color: var(--cv-color-header-bg);
  color: var(--cv-color-header-text);
}
```

### 2.6 Esquema de la tabla CV (actualización Prisma)

```prisma
model CV {
    id              String   @id @default(cuid())
    userId          String
    name            String
    data            String   // CVData serializado como JSON
    template        String   @default("moderno")
    customization   String?  // CVCustomization serializado como JSON (nuevo)
    user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
}
```

**Nota:** El proyecto usa SQLite, no Supabase. La personalización se guarda como JSON string. Para migrar a PostgreSQL en el futuro, se puede usar un campo JSONB real.

### 2.7 Bucket de Storage para avatars

**Opción A (localStorage existente - para usuarios anónimos):**
- Se mantiene el sistema actual de base64 en localStorage
- No requiere configuración adicional

**Opción B (API upload existente - para usuarios autenticados):**
- Se mantiene `/api/upload` que guarda en `public/uploads/photos/`
- Ya funcional, no requiere cambios mayores

**Opción C (Futuro - Supabase Storage o S3):**
- Requiere instalar `@supabase/supabase-js` o SDK de AWS
- Crear bucket `avatars`
- Ruta: `user-{userId}/avatar-{timestamp}.webp`
- Actualizar `handlePhotoUpload` en el panel derecho

### 2.8 Mapa de dependencias del panel de estilos

```
StylePanel (contenedor)
├── StylePanelHeader (toggle + título)
├── Accordion (Radix)
│   ├── AccordionItem "Perfil y Foto"
│   │   └── ProfileSection
│   │       └── PhotoCropperModal (react-image-crop)
│   ├── AccordionItem "Tipografía"
│   │   └── TypographySection
│   │       ├── Select (fuente)
│   │       ├── SliderInput (tamaños) × 3
│   │       └── Toggle pills × 4
│   ├── AccordionItem "Colores"
│   │   └── ColorsSection
│   │       ├── ColorInput (accent) + swatches
│   │       ├── ColorInput (header bg)
│   │       ├── ColorInput (header text)
│   │       └── ColorInput (body text)
│   ├── AccordionItem "Espaciado"
│   │   └── SpacingSection
│   │       ├── SegmentedControl (density)
│   │       └── SliderInput (padding)
│   ├── AccordionItem "Secciones"
│   │   └── SectionsSection
│   │       ├── DndContext (@dnd-kit)
│   │       └── SortableItem × 7
│   └── AccordionItem "Marca de agua"
│       └── WatermarkSection
│           └── Switch toggle
```

---

## 3. Plan de implementación por fases

### Fase 1: Infraestructura (CSS Variables + Store de Customización)

**Objetivo:** Crear la base para que todas las plantillas respondan a CSS variables y manejar el estado de personalización.

- [ ] 1.1 Crear interfaz `CVCustomization` y valor por defecto en `src/lib/types.ts`
- [ ] 1.2 Crear hook `useCustomization` en `src/lib/hooks.ts` (o archivo separado `src/lib/useCustomization.ts`)
- [ ] 1.3 Agregar CSS variables del CV en `src/app/globals.css`
- [ ] 1.4 Crear componente wrapper `CVTemplateWrapper` o agregar clases directamente en templates
- [ ] 1.5 Inyectar CSS variables dinámicamente en `CVPreview.tsx` mediante `useRef` + `style.setProperty`
- [ ] 1.6 Refactorizar al menos 2 templates (Moderno + Minimalista) para usar clases CSS variables
- [ ] 1.7 Verificar que export PDF y Word siguen funcionando

### Fase 2: Panel derecho - Estructura base

**Objetivo:** Crear el panel derecho funcional con colapsado y scroll.

- [ ] 2.1 Crear componente `StylePanel` con layout base (272px, border, bg-white)
- [ ] 2.2 Crear `StylePanelHeader` con toggle colapsable y persistencia en localStorage
- [ ] 2.3 Integrar Radix Accordion como base de secciones colapsables
- [ ] 2.4 Modificar `editor/page.tsx` para layout de 3 columnas
- [ ] 2.5 Agregar responsive: drawer overlay en < 1280px
- [ ] 2.6 Crear componente flotante de toggle (pestaña 🎨 en el borde derecho)

### Fase 3: Panel derecho - Sección Perfil y Foto

**Objetivo:** Widget de foto de perfil en el panel derecho, sincronizado con panel izquierdo.

- [ ] 3.1 Crear componente `ProfileSection` con foto circular 80px centrado
- [ ] 3.2 Agregar overlay de edición al hover (ícono cámara + "Cambiar foto")
- [ ] 3.3 Instalar `react-image-crop` y crear `PhotoCropperModal`
- [ ] 3.4 Implementar upload a `public/uploads/photos/` (reutilizar `/api/upload`)
- [ ] 3.5 Sincronizar `photoUrl` bidireccionalmente entre panel izquierdo y derecho
- [ ] 3.6 Agregar botón "Quitar foto" que limpia `formData.photoUrl`
- [ ] 3.7 Mostrar spinner durante upload, toast de error descriptivo
- [ ] 3.8 Actualizar preview instantáneamente al cambiar foto

### Fase 4: Panel derecho - Tipografía

**Objetivo:** Controles de tipografía completos que modifiquen CSS variables.

- [ ] 4.1 Crear `TypographySection` con Radix Accordion interno
- [ ] 4.2 Selector de fuente (Inter, Roboto, Georgia, Playfair Display, Montserrat, Open Sans, Lato, Raleway) con preview de cada fuente
- [ ] 4.3 Sliders de tamaño: Texto (8-14px), Títulos (10-18px), Nombre (18-36px) con input numérico sincronizado
- [ ] 4.4 Toggle pills de formato: B, I, U̲, TT
- [ ] 4.5 Inyectar cambios en CSS variables en tiempo real

### Fase 5: Panel derecho - Colores

**Objetivo:** Controles de colores para accent, header bg, header text, body text.

- [ ] 5.1 Crear componente `ColorInput` (input color + texto #RRGGBB sincronizados)
- [ ] 5.2 Sección de color de accent con 8 swatches predefinidos
- [ ] 5.3 Inputs para header bg, header text, body text
- [ ] 5.4 Botón "Restablecer colores" que vuelve a los defaults de la plantilla activa
- [ ] 5.5 Inyectar colores en CSS variables

### Fase 6: Panel derecho - Espaciado

**Objetivo:** Controles de densidad y márgenes.

- [ ] 6.1 Crear `SpacingSection`
- [ ] 6.2 Segmented control: Compacto / Normal / Amplio
- [ ] 6.3 Slider de márgenes de página (16-48px)
- [ ] 6.4 Inyectar en CSS variables

### Fase 7: Panel derecho - Secciones (Toggle + Drag & Drop)

**Objetivo:** Permitir mostrar/ocultar y reordenar secciones del CV.

- [ ] 7.1 Instalar `@dnd-kit/core` + `@dnd-kit/sortable`
- [ ] 7.2 Crear `SectionsSection` con lista de secciones
- [ ] 7.3 Toggle ON/OFF para cada sección (Foto, Resumen, Habilidades, Experiencia, Educación, Idiomas, Referencias)
- [ ] 7.4 Handle ⠿ para drag & drop reordenar
- [ ] 7.5 Guardar orden y visibilidad en `customization`
- [ ] 7.6 Actualizar `CVPreview` para respetar `sectionsVisible` y `sectionsOrder`

### Fase 8: Panel derecho - Marca de agua

**Objetivo:** Control de marca de agua en todas las plantillas.

- [ ] 8.1 Crear componente `CVWatermark` (position absolute, bottom-right, z-index alto, opacity 0.35)
- [ ] 8.2 Crear `WatermarkSection` con badge de estado + toggle
- [ ] 8.3 Integrar `CVWatermark` en `CVPreview` (renderizado condicional)
- [ ] 8.4 Asegurar que el PDF export respeta el setting de watermark
- [ ] 8.5 Guardar `showWatermark` en `customization`

### Fase 9: Fix del guardado + Auto-save

**Objetivo:** Que el guardado en Prisma funcione correctamente con la nueva personalización.

- [ ] 9.1 Agregar campo `customization` al modelo CV en Prisma
- [ ] 9.2 Ejecutar `npx prisma db push` para migrar el schema
- [ ] 9.3 Actualizar API `/api/cvs` POST para recibir y guardar `customization`
- [ ] 9.4 Actualizar API `/api/cvs` GET para devolver `customization`
- [ ] 9.5 Implementar auto-save con debounce de 30 segundos
- [ ] 9.6 Indicador en header: punto verde = guardado / amarillo = pendiente
- [ ] 9.7 Toast real: "Guardado" o "Error: [mensaje]"
- [ ] 9.8 Guardar customization en localStorage para usuarios anónimos

### Fase 10: Refactorizar TODAS las plantillas

**Objetivo:** Todas las 24 plantillas deben soportar CSS variables.

- [ ] 10.1 ModernoTemplate (ya comenzado en Fase 1)
- [ ] 10.2 MinimalistaTemplate
- [ ] 10.3 CreativoTemplate
- [ ] 10.4 CustomerServiceTemplate
- [ ] 10.5 StudentTemplate
- [ ] 10.6 DeveloperTemplate
- [ ] 10.7 CreativeTemplate
- [ ] 10.8 EjecutivoTemplate
- [ ] 10.9 MedicoTemplate
- [ ] 10.10 LegalTemplate
- [ ] 10.11 FinanceTemplate
- [ ] 10.12 MarketingTemplate
- [ ] 10.13 EducacionTemplate
- [ ] 10.14 PinkTemplate
- [ ] 10.15 DesignerTemplate
- [ ] 10.16 TechTemplate
- [ ] 10.17 CorporateTemplate
- [ ] 10.18 SeniorTemplate
- [ ] 10.19 PsychologistTemplate
- [ ] 10.20 ProgrammerTemplate
- [ ] 10.21 VisualDesignerTemplate
- [ ] 10.22 CustomerCareTemplate
- [ ] 10.23 ChatSpecialistTemplate
- [ ] 10.24 MarketingStrategistTemplate

### Fase 11: Múltiples HDVs (Mis HDV)

**Objetivo:** Sistema de guardado automático con nombres únicos.

- [ ] 11.1 Al modificar una plantilla del sistema por primera vez, guardar automáticamente como "Mi HDV"
- [ ] 11.2 Si existe "Mi HDV", crear "Mi HDV (1)", luego "Mi HDV (2)", máximo 3
- [ ] 11.3 Toast: "Tu hoja de vida fue guardada como 'Mi HDV'"

---

## 4. Checklist de cambios (resumen consolidado)

### Infraestructura
- [ ] Interfaz `CVCustomization` + defaults en `types.ts`
- [ ] Hook `useCustomization` con persistencia localStorage
- [ ] CSS variables del CV en `globals.css`
- [ ] Inyección de CSS variables en `CVPreview.tsx`
- [ ] Clases CSS para templates: `.cv-template-wrapper`, `.cv-section-title`, `.cv-name`, `.cv-header-bg`
- [ ] Campo `customization` en modelo Prisma CV + migración

### Panel de estilos (StylePanel)
- [ ] Componente `StylePanel` (estructura base, colapsable, scroll)
- [ ] Componente `StylePanelHeader`
- [ ] Toggle flotante (pestaña 🎨 en borde)
- [ ] Responsive (drawer en < 1280px)

### Sección: Perfil y Foto
- [ ] Componente `ProfileSection`
- [ ] Foto circular 80px + overlay hover
- [ ] Upload con validación (2MB, formatos)
- [ ] Modal cropper (`react-image-crop`)
- [ ] Sincronización bidireccional photoUrl
- [ ] Botón quitar foto
- [ ] Spinner + toasts

### Sección: Tipografía
- [ ] Selector de fuente (8 opciones con preview)
- [ ] Slider tamaño texto (8-14px)
- [ ] Slider tamaño títulos (10-18px)
- [ ] Slider tamaño nombre (18-36px)
- [ ] Toggle B (negrita)
- [ ] Toggle I (cursiva)
- [ ] Toggle U̲ (subrayado títulos)
- [ ] Toggle TT (mayúsculas títulos)

### Sección: Colores
- [ ] Color accent con input + 8 swatches
- [ ] Color header background
- [ ] Color header text
- [ ] Color body text
- [ ] Botón restablecer colores

### Sección: Espaciado
- [ ] Segmented control densidad
- [ ] Slider margenes (16-48px)

### Sección: Secciones
- [ ] Toggle ON/OFF × 7 secciones
- [ ] Drag & drop reordenar (@dnd-kit)
- [ ] Guardar en customization
- [ ] CVPreview respeta visibilidad y orden

### Sección: Marca de agua
- [ ] Componente `CVWatermark`
- [ ] Toggle mostrar/ocultar
- [ ] Badge de estado
- [ ] PDF respeta setting

### Guardado
- [ ] API Prisma guarda customization
- [ ] Auto-save debounce 30s
- [ ] Indicador estado guardado
- [ ] Toast feedback

### Templates (24 plantillas)
- [ ] Cada plantilla soporta CSS variables
- [ ] Cada plantilla usa clases CSS variables
- [ ] Export PDF funciona
- [ ] Export Word funciona

### Dependencias nuevas
- [ ] `@dnd-kit/core`
- [ ] `@dnd-kit/sortable`
- [ ] `react-image-crop`

### Testing
- [ ] Panel izquierdo: todos los formularios funcionan igual
- [ ] Panel derecho: todos los controles afectan preview en tiempo real
- [ ] Foto: upload, preview, quitar, sincronización
- [ ] Export PDF: respeta customization
- [ ] Export Word: respeta customization
- [ ] Guardado en Prisma: guarda customization
- [ ] Mobile: drawer funciona correctamente
- [ ] Colapsado: persiste en localStorage
