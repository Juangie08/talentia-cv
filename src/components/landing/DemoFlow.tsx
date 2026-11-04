'use client';

import { ArrowRight, Camera, Gauge, ScanLine, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/LocaleProvider';

const MOCK_NAME = 'Laura Gómez';
const MOCK_ACCENT = '#2563EB';

/**
 * Página de CV reducida, dibujada con CSS. Se usa como "después" para mostrar
 * cómo quedan los datos ya organizados, sin depender de imágenes externas.
 */
function MiniCVPage({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl bg-white p-3.5 shadow-xl ring-1 ring-slate-900/5">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 flex-none rounded-full" style={{ backgroundColor: MOCK_ACCENT }} />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold leading-tight text-slate-800">{MOCK_NAME}</p>
          <p className="truncate text-[9px] font-semibold leading-tight" style={{ color: MOCK_ACCENT }}>
            {t('landing.demo.mock.roleValue')}
          </p>
        </div>
      </div>

      <div className="mt-3 h-px w-full" style={{ backgroundColor: '#E2E8F0' }} />

      <div className="mt-3 space-y-2.5">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.14em]" style={{ color: MOCK_ACCENT }}>
            {t('landing.demo.mock.experience')}
          </p>
          <div className="mt-1.5 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-200" />
            <div className="h-1.5 w-4/5 rounded-full bg-slate-200" />
            {!compact && <div className="h-1.5 w-11/12 rounded-full bg-slate-200" />}
          </div>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.14em]" style={{ color: MOCK_ACCENT }}>
            {t('landing.demo.mock.skills')}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {['SQL', 'Power BI', 'Python'].map((skill) => (
              <span
                key={skill}
                className="rounded-full px-1.5 py-0.5 text-[8px] font-semibold text-white"
                style={{ backgroundColor: MOCK_ACCENT }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Falso escaneo: una hoja torcida, algo desenfocada, dentro de un marco de foto. */
function ScanMock() {
  const { t } = useI18n();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950/70 p-3 ring-1 ring-white/10">
      <div className="relative overflow-hidden rounded-xl bg-slate-800/80 p-2.5">
        <div className="rotate-[-2.5deg] rounded-lg bg-[#f7f4ed] p-3.5 shadow-2xl">
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 flex-none rounded-full bg-slate-300" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-2 w-2/3 rounded-full bg-slate-400" />
              <div className="h-1.5 w-1/2 rounded-full bg-slate-300" />
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-slate-300" />
            <div className="h-1.5 w-11/12 rounded-full bg-slate-300" />
            <div className="h-1.5 w-4/5 rounded-full bg-slate-300" />
            <div className="h-1.5 w-full rounded-full bg-slate-300" />
            <div className="h-1.5 w-2/3 rounded-full bg-slate-300" />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 w-9/12 rounded-full bg-slate-300" />
            <div className="h-1.5 w-full rounded-full bg-slate-300" />
          </div>
        </div>

        {/* Línea de escaneo: refuerza la idea de "imagen leída por la IA". */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-10 bg-gradient-to-b from-transparent via-blue-400/35 to-transparent motion-safe:animate-pulse"
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
        <Camera className="h-3.5 w-3.5" aria-hidden="true" />
        <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
        {t('landing.demo.before.title')}
      </div>
    </div>
  );
}

/** Vista "por dentro": editor con el aviso de siguiente paso y la vista previa. */
function InsideMock() {
  const { t } = useI18n();

  const fields = [
    { label: t('landing.demo.mock.fullName'), value: MOCK_NAME },
    { label: t('landing.demo.mock.role'), value: t('landing.demo.mock.roleValue') },
    { label: t('landing.demo.mock.experience'), value: t('landing.demo.mock.experienceValue') },
    { label: t('landing.demo.mock.skills'), value: t('landing.demo.mock.skillsValue') },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
          {t('landing.demo.editor.formLabel')}
        </div>
        <span className="rounded-full border border-blue-300/25 bg-blue-500/15 px-2.5 py-1 text-[10px] font-semibold text-blue-100">
          {t('landing.demo.mock.aiFilled')}
        </span>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-3 py-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 flex-none text-amber-300" aria-hidden="true" />
            <p className="text-xs font-semibold text-amber-100">{t('landing.demo.editor.nextStep')}</p>
          </div>

          {fields.map((field) => (
            <div key={field.label}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {field.label}
              </p>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                {field.value}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {t('landing.demo.editor.previewLabel')}
            </span>
            <span className="flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
              <span className="relative flex h-7 w-7 items-center justify-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 h-7 w-7 -rotate-90" aria-hidden="true">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="82 100"
                  />
                </svg>
                82
              </span>
              {t('landing.demo.editor.score')}
            </span>
          </div>
          <MiniCVPage />
        </div>
      </div>
    </div>
  );
}

/**
 * Sección de demostración: prueba visual del producto (logo real hoy en día:
 * escaneo → datos ordenados → editor con vista previa).
 */
export default function DemoFlow({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();

  return (
    <section id="demo" className="relative z-10 border-b border-white/10 bg-slate-950/60 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
            <Gauge className="h-4 w-4" aria-hidden="true" />
            {t('landing.demo.eyebrow')}
          </p>
          <h2 className="text-3xl font-black text-white md:text-4xl">{t('landing.demo.title')}</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300 md:text-base">{t('landing.demo.desc')}</p>
        </div>

        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <Card className="border-white/10 bg-slate-900/60 p-5">
            <span className="mb-3 inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
              {t('landing.demo.before.label')}
            </span>
            <ScanMock />
            <h3 className="mt-4 text-base font-bold text-white">{t('landing.demo.before.title')}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{t('landing.demo.before.desc')}</p>
          </Card>

          <div className="flex flex-col items-center gap-2 lg:px-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-950/50">
              <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" aria-hidden="true" />
            </span>
            <span className="max-w-[140px] text-center text-[11px] font-semibold leading-tight text-slate-400">
              {t('landing.demo.bridge')}
            </span>
          </div>

          <Card className="border-white/10 bg-slate-900/60 p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                {t('landing.demo.after.label')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/25 bg-blue-500/15 px-2.5 py-1 text-[10px] font-semibold text-blue-100">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {t('landing.demo.mock.aiFilled')}
              </span>
            </div>
            <MiniCVPage />
            <h3 className="mt-4 text-base font-bold text-white">{t('landing.demo.after.title')}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{t('landing.demo.after.desc')}</p>
          </Card>
        </div>

        <div className="mt-8">
          <div className="mb-4 max-w-2xl">
            <h3 className="text-xl font-bold text-white">{t('landing.demo.editor.title')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{t('landing.demo.editor.desc')}</p>
          </div>
          <InsideMock />
        </div>

        <div className="mt-8 text-center">
          <Button
            onClick={onStart}
            size="lg"
            className="h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-7 text-white shadow-lg shadow-blue-900/30 hover:from-blue-600 hover:to-indigo-600"
          >
            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('landing.demo.cta')}
          </Button>
        </div>
      </div>
    </section>
  );
}
