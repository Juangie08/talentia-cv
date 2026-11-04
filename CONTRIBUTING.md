# Contributing to Talentia

First of all: **thank you**. Talentia is an open source resume builder, and every
template, translation, fix or idea helps someone land a better job.

> Español: mira la sección [Contribuir en español](#contribuir-en-español) al final.

## Table of contents

- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Project structure](#project-structure)
- [Adding a translation](#adding-a-translation)
- [Adding a resume template](#adding-a-resume-template)
- [Code style](#code-style)
- [Commit and PR guidelines](#commit-and-pr-guidelines)
- [Good first issues](#good-first-issues)

## Ways to contribute

| I want to... | Do this |
| --- | --- |
| Report a bug | Open an [issue](https://github.com/talentia-hdv/talentia/issues/new/choose) with steps to reproduce |
| Request a feature | Open a feature request issue describing the user problem |
| Translate the app | Add or complete a dictionary in `src/lib/i18n/` |
| Add a design | Follow [Adding a resume template](#adding-a-resume-template) |
| Improve accessibility | Keyboard navigation, contrast, screen reader labels |
| Improve the AI prompts | `src/app/api/ai/*` and `src/lib/aiClient.ts` |
| Improve docs | README, `docs/`, code comments |

## Development setup

Requirements: **Node.js 20+** and npm.

```bash
git clone https://github.com/talentia-hdv/talentia.git
cd talentia
npm install
cp .env.example .env    # fill in the values you need
npm run dev             # http://localhost:3500
```

Everything works offline: without an AI key the app falls back to local parsers
and rule-based improvements.

Useful commands:

```bash
npx tsc --noEmit     # type check
npm run lint         # ESLint
npm run build        # production build
npm run test:all     # template + export checks (also what CI runs)
```

`npm run check:contrast`, `npm run check:density` and the scripts in `scripts/`
need `npm run dev` running on `http://localhost:3500` — they drive a real browser.

## Project structure

```
src/
  app/                 Next.js App Router (pages + API routes)
    api/ai/            AI endpoints: extract, suggest, adapt, usage
    api/improve/       Text improvement endpoint
    editor/            The CV editor (guided step-by-step flow)
  components/
    editor/            Editor chrome, dialogs, coaching, AI widgets
    forms/             One form per CV section
    preview/           Live preview + HTML resume templates
    style-panel/       Template, palette and paper size controls
    ui/                Base primitives (button, dialog, tabs, ...)
  lib/
    i18n/              Locale config, dictionaries and React provider
    aiQuota.ts         Daily AI credits per user/IP
    cv-quality.ts      Resume quality scoring and recommendations
    export.ts          PDF / Word / plain text exporters
    templates.ts       Template metadata and registry
scripts/               Verification scripts (see "Verification" in README.md)
```

## Adding a translation

Translations are plain TypeScript objects. The **Spanish dictionary is the
source of truth** for keys:

1. Open `src/lib/i18n/es.ts` and add your language branch only if you are
   creating a brand new locale.
2. Copy `src/lib/i18n/en.ts` into e.g. `src/lib/i18n/pt.ts` and translate the
   values (never the keys).
3. Register the locale in `src/lib/i18n/config.ts` (`LOCALES`, `LOCALE_LABELS`,
   `INTL_LOCALE`) and in `src/lib/i18n/index.ts` (`DICTIONARIES`).
4. Run `npx tsc --noEmit`: TypeScript fails if any key is missing, so you cannot
   ship an incomplete dictionary by accident.

Keys use flat dot notation, for example `landing.hero.cta`. Variables are
interpolated with braces: `"Step {current} of {total}"`.

## Adding a resume template

1. Add the visual component in `src/components/preview/templates/`.
2. Register its metadata in `src/lib/templates.ts` (`BASE_TEMPLATES`): `id`,
   `name`, `description`, `colors`, `weight`, optional `badges`, `roles` and
   `defaults`.
3. Provide `nameEn` / `descriptionEn` so the gallery looks right in English.
4. Run `npm run test:all` — `check:templates` fails if your template drops a
   section, and the export suites cover the PDF paths.
5. With `npm run dev` running, run `npm run check:contrast` and
   `npm run check:density`. A template whose text sits below 3:1 on its own
   background is unreadable; a template whose rendered height does not move
   between Compacto and Amplio is not listening to the spacing control.
6. `node scripts/altos.cjs` shows the rendered height of all 35 templates with
   the same data. A template far above the others is wasting space.
7. Export a PDF from the editor and confirm the page still fits in 1–2 pages.

New templates get their vertical rhythm from `rhythm(density)` in
`src/components/preview/templates/shared.ts`, not from hand-written `space-y-*`
per density: `check:templates` fails if a template does not use it.

## Code style

- TypeScript strict, no `any` unless unavoidable.
- Tailwind CSS for styling; follow the existing design tokens and spacing.
- Server logic belongs in `src/lib` or route handlers, never in components.
- Keep components accessible: real `<button>` elements, `aria-label` on
  icon-only controls, visible focus states.
- No new runtime dependency without explaining why in the PR description.

## Commit and PR guidelines

- Small, focused branches: `feat/template-card`, `fix/export-spacing`.
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- Every PR should include: what changed, why, and how you tested it (screenshots
  help a lot for visual changes).
- Never commit secrets. `.env` is gitignored; use `.env.example` for new
  variables and document them.

## Good first issues

Issues labeled `good first issue` are scoped for a first contribution: small
copy fixes, new template metadata, a missing translation, accessibility labels.
If you want to work on something bigger, open an issue first so we can align on
the approach.

---

## Contribuir en español

¡Gracias por querer aportar! Talentia es un generador de hojas de vida open
source: cada plantilla, traducción o corrección ayuda a que alguien consiga un
mejor empleo.

**Puesta en marcha**

```bash
git clone https://github.com/talentia-hdv/talentia.git
cd talentia
npm install
cp .env.example .env    # completa solo lo que necesites
npm run dev             # http://localhost:3500
```

Sin clave de IA todo sigue funcionando con los analizadores locales.

**Cómo aportar**

- **Traducciones**: el diccionario en español (`src/lib/i18n/es.ts`) es la fuente
  de verdad de las claves. TypeScript obliga a que cualquier idioma nuevo tenga
  todas las claves antes de compilar.
- **Plantillas**: añade el componente en `src/components/preview/templates/` y su
  metadata en `src/lib/templates.ts` (con `nameEn`/`descriptionEn`).
- **Bugs**: abre un issue con pasos para reproducirlo.
- **Estilo**: TypeScript estricto, Tailwind, componentes accesibles y sin
  dependencias nuevas sin justificar.

Antes de abrir el PR corre `npx tsc --noEmit`, `npm run lint` y `npm run test:all`
(lo mismo que corre CI). Si tocaste la exportación, añade `npm run build` y una
descarga real en PDF y Word. Si tocaste una plantilla, con `npm run dev` levantado
corre `npm run check:contrast` y `npm run check:density`: una plantilla cuyo texto
queda por debajo de 3:1 sobre su propio fondo es ilegible, y una cuyo alto
renderizado no se mueve entre Compacto y Amplio ha dejado de escuchar el control
de espaciado.

**Nunca subas secretos**: `.env` está ignorado por git; documenta las variables
nuevas en `.env.example`.
