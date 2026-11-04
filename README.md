# Talentia — Open source resume builder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/talentia-hdv/talentia/actions/workflows/ci.yml/badge.svg)](https://github.com/talentia-hdv/talentia/actions/workflows/ci.yml)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![Made with TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)](https://www.typescriptlang.org/)

> **Español:** [Léelo en español](README.es.md)

Talentia is a **free, open source and self-hostable** resume builder. It helps
anyone produce a professional, personalized CV in minutes — with AI that reads
their current resume (PDF, Word, scans or photos) or their free-form story, and
turns it into a clean, ATS-friendly document.

It is built to be **usable, auditable and forkable**: no paywall, no dark
patterns, no vendor lock-in, and a per-visitor credit system so a shared AI key
can serve everyone without being drained.

![Talentia landing page](public/landing/hero-bg.png)

## ✨ Features

- **Guided editor** — seven sections (personal data, profile, skills,
  experience, education, languages, references) with a step-by-step flow, live
  quality scoring and contextual coaching tips in plain language.
- **AI import that reads anything** — PDF, DOCX, TXT, JPG/PNG or WEBP. Scanned
  resumes and photos of a CV are read with a vision model, and a local regex
  fallback keeps the app useful without any AI key.
- **Write-it-yourself mode** — paste or type your story and the AI structures it
  into the right fields.
- **Tailor to a job post** — paste a job description, get a keyword match score
  and one-click actions for the missing keywords.
- **AI suggestions** — three variants for your headline, summary and
  achievements, generated from your real data.
- **25+ templates**, palette and paper-size controls, and a live preview with
  page count, zoom and a print-like page stack.
- **Export anywhere** — ATS-friendly PDF with selectable text, designed PDF,
  Word, or plain text for pasting into web forms.
- **Bilingual UI (English / Spanish)** with automatic detection from the
  visitor's browser and a manual switcher.
- **Privacy by default** — your resume lives in your browser storage; accounts
  are optional and only needed to sync across devices.
- **Anti-abuse built in** — daily AI credits per user/IP plus per-minute IP rate
  limiting to protect shared keys.

## 🚀 Quick start

Requirements: **Node.js 20+**.

```bash
git clone https://github.com/talentia-hdv/talentia.git
cd talentia
npm install
cp .env.example .env      # fill in what you need (everything is optional)
npm run dev               # http://localhost:3500
```

No database, no sign-up: every resume is stored in the browser. Nothing else
to provision.

Without an AI key, the app still works end to end using local parsers and
rule-based improvements.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `AI_API_KEY` | ❌ | Key of any OpenAI-compatible endpoint |
| `AI_BASE_URL` | ❌ | Base URL of that endpoint, e.g. `https://api.example.com/v1` |
| `AI_MODEL` | ❌ | Main model name (default `auto`) |
| `AI_VISION_MODEL` | ❌ | Multimodal model used to read scans and photos |
| `AI_MOCK` | ❌ | `1` serves deterministic sample answers: whole product, no key, no credits |
| `AI_REQUESTS_PER_MINUTE` | ❌ | Anti-abuse per-IP request limit (default `15`); no daily quota |
| `NEXT_PUBLIC_GITHUB_URL` | ❌ | Your fork/repository URL used by the UI links |
| `NEXT_PUBLIC_SITE_URL` | ❌ | Canonical site URL for metadata |

## 🤖 AI setup

Talentia talks to **any OpenAI-compatible endpoint**, so you can use a hosted
service or your own server:

```bash
AI_BASE_URL="https://api.example.com/v1"
AI_API_KEY="your-key"
AI_MODEL="auto"            # or an explicit model name
AI_VISION_MODEL="auto"     # multimodal model for scans and photos
```

The key and the URL are read on the server only. They are never sent to the
browser, so keep them in your host's environment settings (Netlify, Vercel,
Docker) and never in a `NEXT_PUBLIC_*` variable.

Credit costs: `extract` (read a resume) = 1, `improve` (rewrite text) = 2,
`adapt` (tailor to a job post) = 2, `suggest` (generate variants) = 1. When the
quota runs out, text improvement degrades gracefully to a local, free version
instead of failing.

## 🌍 Languages

The UI ships in **English** and **Spanish**. On the first visit the locale is
negotiated from the browser's `Accept-Language` header by `src/middleware.ts`,
stored in a cookie, and used server-side to render `<html lang>` and the page
metadata. Visitors can override it any time with the switcher in the navbar and
footer.

Adding a language takes three edits — see
[Adding a translation](CONTRIBUTING.md#adding-a-translation). Because the Spanish
dictionary defines the key type, TypeScript refuses to compile a partial locale.

## 📦 Project structure

```
src/
  app/                 Next.js App Router (landing, editor, auth, API routes)
    api/ai/            AI endpoints: extract, suggest, adapt, translate, tailor, cover-letter, interview, usage
    api/improve/       Text improvement endpoint
  components/
    editor/            Editor chrome, dialogs, onboarding, AI widgets
    forms/             One form per resume section
    preview/           Live preview and HTML resume templates
    style-panel/       Template, colors and paper size
  lib/
    i18n/              Locale config, dictionaries, React provider
    aiQuota.ts         AI usage summary (no quotas, per-IP anti-abuse)
    cv-quality.ts      Quality scoring and recommendations
    export.ts          PDF / Word / plain text exporters
    templates.ts       Template registry and metadata
scripts/               Verification scripts (templates, export, contrast)
docs/                  Design notes and plans
```

## 🧪 Scripts

```bash
npm run dev      # development server on :3500
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint
npx tsc --noEmit # type check
```

### Verification

The checks below catch the failures that a compiler cannot: a section that
silently stops rendering, an export that drops content, text whose colour
matches its background. `test:all` runs in CI on every push and pull request.

```bash
npm run test:all        # everything below except the browser checks
npm run test:export     # plain-text PDF: content, pagination, links
npm run test:styled     # designed PDF: text stays selectable, no clipping
npm run test:balance    # two-column layouts do not spill to a half-empty page
npm run test:quality    # quality scoring, bias detection, ATS keywords
npm run test:prompts    # every AI prompt keeps its JSON contract in both languages
npm run check:templates # every template renders its sections
```

`check:contrast` and the visual scripts drive a real browser, so they need a
server running on `http://localhost:3500`:

```bash
npm run dev
npm run check:contrast        # text and icons below 3:1 against their background
npm run check:density         # every template reacts to the spacing control
node scripts/altos.cjs        # rendered height of all 35 templates
node scripts/why.cjs <template> "<visible text>"   # why an element took its colour
node scripts/shot.cjs <template> [...]             # screenshots
```

## 🎯 Job mode (tailoring to one vacancy)

Paste a job post and Talentia turns it into a plan for that exact role and company. The diagnosis runs locally — instantly and without spending a single credit:

- **Weighted match score** with the same hierarchy the big tools publish (hard skills 40, job title 20, education 10, soft skills 15, other keywords 15), plus a small bonus for keywords backed by dated experience.
- **Keyword evidence instead of a flat list**: green when it shows up inside an achievement, amber when it only lives in your skills section, red when it is missing (one click adds it to skills).
- **Requirements vs. nice-to-haves** read from the post itself, with the critical gaps surfaced first.
- **ATS tips** about the things that actually break parsing: contact details in the body, the exact job title, measurable bullets, bullet length.
- **Over-optimization warning** above the 75–90% sweet spot, so nobody ships a keyword-stuffed resume.

Then the AI — only where it adds value — rewrites in three tones (conservative, balanced, direct) and never invents data: when an achievement needs a number that is not in your resume, it leaves a `[X]` placeholder for you to fill in.

| Endpoint | Credits | Returns |
| --- | --- | --- |
| `POST /api/ai/tailor` | 3 | headline, summary, prioritized skills, rewritten achievements, advice per gap, company angle, likely objections |
| `POST /api/ai/cover-letter` | 2 | cover letter, LinkedIn headline and About section, follow-up note |
| `POST /api/ai/interview` | 2 | 8 likely questions with what each one evaluates and a STAR hint built from your own facts |

Every figure in the generated text is checked against your resume and the post; anything unsupported comes back as a warning before you apply it. With `AI_MOCK=1` the whole flow works offline with deterministic fixtures.

## ☁️ Deployment

1. Add `NEXT_PUBLIC_SITE_URL` and, if you want the AI, the `AI_*` variables.
2. Deploy on **Vercel** (import the repo, zero config): full guide in
   [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md). Netlify also works
   ([DEPLOY-NETLIFY.md](DEPLOY-NETLIFY.md)); there is no database, session
   store or migration to run on either.

Any static-friendly host works too; the API routes need a Node runtime.

### Everything in one command (Docker)

```bash
cp .env.example .env      # optional: AI variables only
docker compose up --build # http://localhost:3500
```

The image builds the app and serves it. Add `AI_MOCK=1` to run the whole
product with sample answers and no API key.

## 🗺️ Roadmap

- [ ] Complete the English translation of the editor (forms, coaching tips, style panel).
- [ ] More locales (Portuguese and French next).
- [ ] Shareable read-only resume links.
- [ ] Import from LinkedIn data export.
- [ ] CLI + Docker image for self-hosting.
- [ ] Automated accessibility checks in CI.

Ideas and votes are welcome in the issue tracker.

## 🤝 Contributing

Contributions of every size are welcome: translations, templates, accessibility
fixes, documentation, AI prompt improvements. Start with
[CONTRIBUTING.md](CONTRIBUTING.md) and look for issues labeled
`good first issue`.

Please note that this project is released with a
[Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to abide by
its terms. Security issues should follow [SECURITY.md](SECURITY.md).

## 📜 License

[MIT](LICENSE) © Talentia contributors. Use it, fork it, sell it, self-host it —
just keep the license notice.

## 🙏 Acknowledgements

- Built on the shoulders of free software: Next.js, React, TypeScript, Tailwind
  CSS, Radix UI, jsPDF, docx, pdf.js, mammoth.
- AI features run on open models through an OpenAI-compatible API.
- Developed with the help of AI coding assistants, including
  [OpenAI Codex](https://openai.com/codex) and
  [Claude Code](https://claude.com/claude-code) — this repository aims to be a
  good citizen of the open source ecosystem these programs support.
