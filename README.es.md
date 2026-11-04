# Talentia — Generador de hojas de vida open source

[![Licencia: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/talentia-hdv/talentia/actions/workflows/ci.yml/badge.svg)](https://github.com/talentia-hdv/talentia/actions/workflows/ci.yml)
[![PRs bienvenidos](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)

> **English:** [Read this in English](README.md)

Talentia es un generador de hojas de vida **gratis, open source y
auto-hospedable**. Ayuda a cualquier persona a tener una hoja de vida
profesional y personalizada en minutos: la IA lee el CV que ya tiene (PDF, Word,
escaneos o fotos) o su relato escrito de corrido, y lo convierte en un documento
ordenado y compatible con los filtros automáticos (ATS).

Está pensado para ser **usable, auditable y fácil de bifurcar**: sin muros de
pago, sin trucos, sin dependencia de un proveedor y con un sistema de créditos
por visitante para que una clave de IA compartida alcance para todos.

![Landing de Talentia](public/landing/hero-bg.png)

## ✨ Funciones

- **Editor guiado** — siete secciones (datos, perfil, habilidades, experiencia,
  educación, idiomas, referencias) con flujo paso a paso, puntuación de calidad
  en vivo y consejos claros en cada pantalla.
- **IA que lee de todo** — PDF, DOCX, TXT, JPG/PNG o WEBP. Las hojas de vida
  escaneadas y las fotos se leen con un modelo de visión, y un analizador local
  de respaldo mantiene la app útil incluso sin clave de IA.
- **Modo "escribe de corrido"** — pega o escribe tu historia y la IA la organiza
  en los campos correctos.
- **Adaptación a una oferta** — pega la vacante y obtén el porcentaje de
  coincidencia y acciones de un clic para las palabras clave que faltan.
- **Sugerencias de IA** — tres variantes para el título, el perfil y los logros,
  generadas con tus datos reales.
- **Más de 25 plantillas**, control de paleta y tamaño de papel, y vista previa
  en vivo con conteo de páginas, zoom y efecto de documento real.
- **Exporta donde lo necesites** — PDF con texto seleccionable (compatible con
  ATS), PDF con diseño, Word o texto plano para pegar en formularios web.
- **Interfaz bilingüe (español / inglés)** con detección automática del idioma
  del navegador y selector manual.
- **Privacidad por defecto** — tu hoja de vida vive en el almacenamiento del
  navegador; la cuenta es opcional y solo sirve para sincronizar.
- **Protección antiabuso** — créditos diarios de IA por usuario/IP y límite de
  peticiones por minuto para no agotar claves compartidas.

## 🚀 Puesta en marcha

Requiere **Node.js 20+**.

```bash
git clone https://github.com/talentia-hdv/talentia.git
cd talentia
npm install
cp .env.example .env      # completa solo lo que necesites (todo es opcional)
npm run dev               # http://localhost:3500
```

Sin base de datos y sin registro: cada hoja de vida se guarda en el navegador.

Sin clave de IA la aplicación funciona igual usando los analizadores locales.

### Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `AI_API_KEY` | ❌ | Clave de cualquier endpoint compatible con OpenAI |
| `AI_BASE_URL` | ❌ | URL base de ese endpoint, p. ej. `https://api.ejemplo.com/v1` |
| `AI_MODEL` | ❌ | Modelo principal (por defecto `auto`) |
| `AI_VISION_MODEL` | ❌ | Modelo multimodal para leer escaneos y fotos |
| `AI_MOCK` | ❌ | `1` responde con ejemplos deterministas: producto completo, sin clave ni créditos |
| `AI_REQUESTS_PER_MINUTE` | ❌ | Límite antiabuso por IP y minuto (por defecto `15`); sin cuota diaria |
| `NEXT_PUBLIC_GITHUB_URL` | ❌ | URL de tu repositorio o fork para los enlaces de la interfaz |
| `NEXT_PUBLIC_SITE_URL` | ❌ | URL canónica del sitio para la metadata |

## 🤖 Configurar la IA

Talentia habla con **cualquier endpoint compatible con OpenAI**:

```bash
AI_BASE_URL="https://api.ejemplo.com/v1"
AI_API_KEY="tu-clave"
AI_MODEL="auto"            # o el nombre exacto de un modelo
AI_VISION_MODEL="auto"     # modelo multimodal para escaneos y fotos
```

La clave y la URL solo se leen en el servidor: nunca llegan al navegador. Guárdalas
en las variables de tu hosting (Netlify, Vercel, Docker) y jamás en una variable
`NEXT_PUBLIC_*`.

Costos en créditos: `extract` (leer una hoja de vida) = 1, `improve` (reescribir
texto) = 2, `adapt` (adaptar a una oferta) = 2, `suggest` (generar variantes) = 1.
Cuando se agotan, la mejora de texto cae a una versión local gratuita en lugar
de fallar.

## 🌍 Idiomas

La interfaz incluye **inglés** y **español**. En la primera visita el idioma se
negocia con la cabecera `Accept-Language` en `src/middleware.ts`, se guarda en
una cookie y se usa en el servidor para renderizar `<html lang>` y la metadata.
El visitante puede cambiarlo cuando quiera con el selector de la barra superior
o del pie de página.

Añadir un idioma son tres ediciones: mira
[Añadir una traducción](CONTRIBUTING.md#adding-a-translation). Como el
diccionario español define el tipo de las claves, TypeScript no compila un
idioma incompleto.

## 📦 Estructura del proyecto

```
src/
  app/                 App Router (landing, editor, autenticación, API)
    api/ai/            Endpoints de IA: extract, suggest, adapt, usage
    api/improve/       Endpoint de mejora de texto
  components/
    editor/            Chrome del editor, diálogos, onboarding, widgets de IA
    forms/             Un formulario por sección de la hoja de vida
    preview/           Vista previa en vivo y plantillas HTML
    style-panel/       Plantilla, colores y tamaño de papel
  lib/
    i18n/              Configuración de locales, diccionarios y provider
    aiQuota.ts         Resumen de uso de IA (sin cuotas, antiabuso por IP)
    cv-quality.ts      Puntuación de calidad y recomendaciones
    export.ts          Exportadores a PDF / Word / texto
    templates.ts       Registro y metadata de plantillas
scripts/               Scripts de verificación (plantillas, export, contraste)
docs/                  Notas de diseño y planes
```

## 🧪 Comandos

```bash
npm run dev      # servidor de desarrollo en :3500
npm run build    # build de producción
npm run start    # sirve el build de producción
npm run lint     # ESLint
npx tsc --noEmit # verificación de tipos
```

### Verificación

Estas comprobaciones cazan lo que el compilador no ve: una sección que deja de
dibujarse, una exportación que pierde contenido, texto del mismo color que su
fondo. `test:all` corre en CI en cada push y pull request.

```bash
npm run test:all        # todo lo de abajo salvo las comprobaciones de navegador
npm run test:export     # PDF de texto puro: contenido, paginación, enlaces
npm run test:styled     # PDF con diseño: el texto sigue siendo seleccionable
npm run test:balance    # las maquetas de dos columnas no desbordan a media hoja
npm run test:quality    # puntuación de calidad, sesgos, palabras clave ATS
npm run test:prompts    # cada prompt de IA conserva su contrato JSON en los dos idiomas
npm run check:templates # cada plantilla renderiza sus secciones
```

`check:contrast` y los scripts visuales usan un navegador real, así que
necesitan el servidor levantado en `http://localhost:3500`:

```bash
npm run dev
npm run check:contrast        # texto e iconos por debajo de 3:1 sobre su fondo
npm run check:density         # todas las plantillas responden al control de espaciado
node scripts/altos.cjs        # alto renderizado de las 35 plantillas
node scripts/why.cjs <plantilla> "<texto visible>"   # por qué un elemento tomó ese color
node scripts/shot.cjs <plantilla> [...]             # capturas
```

## 🎯 Modo vacante (personalización para una oferta)

Pega el anuncio y Talentia lo convierte en un plan para ese cargo y esa empresa concretos. El diagnóstico corre en tu navegador: es instantáneo y no gasta créditos.

- **Puntaje ponderado** con la misma jerarquía que publican los grandes del sector (habilidades duras 40, título del cargo 20, formación 10, blandas 15, otras palabras clave 15), más un pequeño bono por las palabras clave respaldadas dentro de la experiencia con fechas.
- **Evidencia por palabra clave, no una lista plana**: verde si aparece dentro de un logro, ámbar si solo vive en tu lista de habilidades, rojo si falta (un clic la añade a tus habilidades).
- **Requisitos vs. deseables** leídos del propio anuncio, con los huecos críticos primero.
- **Consejos de ATS** sobre lo que de verdad rompe el parseo: contacto en el cuerpo, título exacto del anuncio, logros medibles y longitud de cada línea.
- **Aviso de sobre-optimización** por encima del rango recomendado (75–90), para que nadie entregue una hoja de vida rellena de palabras clave.

Después la IA —solo donde aporta— reescribe con tres tonos (conservador, equilibrado, directo) y nunca inventa datos: si un logro necesita una cifra que no está en tu hoja de vida, deja un marcador `[X]` para que la completes tú.

| Ruta | Créditos | Devuelve |
| --- | --- | --- |
| `POST /api/ai/tailor` | 3 | titular, perfil, habilidades priorizadas, logros reescritos, consejo por hueco, ángulo para la empresa y objeciones probables |
| `POST /api/ai/cover-letter` | 2 | carta de presentación, titular y «Acerca de» de LinkedIn, nota de seguimiento |
| `POST /api/ai/interview` | 2 | 8 preguntas probables con qué evalúa cada una y una pista STAR armada con tus hechos |

Cada cifra del texto generado se contrasta con tu hoja de vida y la oferta; lo que no tiene respaldo vuelve como aviso antes de aplicarlo. Con `AI_MOCK=1` todo el flujo funciona sin conexión y con respuestas deterministas.

## ☁️ Despliegue

1. Configura `NEXT_PUBLIC_SITE_URL` y, si quieres la IA, las variables `AI_*`.
2. Despliega en **Vercel** (importa el repo, sin configuración): guía completa
   en [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md). Netlify también funciona
   ([DEPLOY-NETLIFY.md](DEPLOY-NETLIFY.md)); en ninguno hay base de datos,
   sesiones ni migraciones que ejecutar.

### Todo en un comando (Docker)

```bash
cp .env.example .env      # opcional: solo variables de IA
docker compose up --build # http://localhost:3500
```

La imagen construye la app y la sirve; no hay base de datos ni migraciones que
ejecutar. Añade `AI_MOCK=1` para probar el producto completo con respuestas de
ejemplo y sin clave de IA.

## 🤝 Contribuir

Toda contribución suma: traducciones, plantillas, accesibilidad, documentación o
mejoras en los prompts de IA. Empieza por [CONTRIBUTING.md](CONTRIBUTING.md) y
busca los issues con la etiqueta `good first issue`.

Este proyecto se rige por el [Código de Conducta](CODE_OF_CONDUCT.md). Los
problemas de seguridad se reportan según [SECURITY.md](SECURITY.md).

## 📜 Licencia

[MIT](LICENSE) © Talentia contributors. Úsalo, forkéalo, véndelo, auto-hospédalo;
solo conserva el aviso de licencia.
