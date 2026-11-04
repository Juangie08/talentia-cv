'use client';

import { ArrowRight, CheckCircle2, Download, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompletionSummary, EditorSectionKey, getSectionAdvice } from '@/lib/editor-metrics';
import type { CVData } from '@/lib/types';
import { useUiText } from '@/lib/i18n/uiText';

interface NextStepCardProps {
  summary: CompletionSummary;
  steps: Array<{ key: EditorSectionKey; label: string }>;
  activeKey: EditorSectionKey;
  data: CVData;
  onGoTo: (key: EditorSectionKey) => void;
  onShowPreview: () => void;
  onExport: () => void;
}

/**
 * Guía permanente del editor: siempre hay una sola acción recomendada, con el
 * motivo y un botón que lleva directo a la sección. Evita que el usuario tenga
 * que adivinar qué hacer o qué falta.
 */
export default function NextStepCard({
  summary,
  steps,
  activeKey,
  data,
  onGoTo,
  onShowPreview,
  onExport,
}: NextStepCardProps) {
  const tr = useUiText();
  const orderedSteps = steps.map((step, index) => ({
    ...step,
    stepNumber: index + 1,
    state: summary.states.find((stateItem) => stateItem.key === step.key),
  }));

  const nextStep = orderedSteps.find((step) => step.state?.required && !step.state?.completed);
  const pendingOptional = orderedSteps.filter((step) => step.state && !step.state.required && !step.state.completed);
  const isWorkingOnNext = nextStep?.key === activeKey;
  const isReady = summary.isReadyToExport;

  if (isReady || !nextStep) {
    const title = isReady ? tr('Tu hoja de vida está completa') : tr('Ya puedes descargar tu hoja de vida');
    const detail = isReady
      ? tr('Revísala y descárgala en PDF o Word. Puedes seguir ajustando el diseño cuando quieras.')
      : pendingOptional.length > 0
        ? `Ya tienes lo esencial. Si quieres, añade ${pendingOptional
            .slice(0, 2)
            .map((step) => step.label.toLowerCase())
            .join(' y ')} — son opcionales, pero suman.`
        : tr('Revisa la vista previa y descarga el PDF o el Word.');

    return (
      <div className="flex-none border-b border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-900">{title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-800/80">{detail}</p>
            </div>
          </div>
          <div className="flex flex-none gap-2">
            <Button variant="outline" size="sm" onClick={onShowPreview} className="rounded-full border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50">
              <Eye className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              Ver mi CV
            </Button>
            <Button size="sm" onClick={onExport} className="rounded-full bg-emerald-600 text-white hover:bg-emerald-500">
              <Download className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {tr('Descargar')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-none border-b border-amber-200 bg-amber-50/80 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white"
            aria-hidden="true"
          >
            {nextStep.stepNumber}
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs font-bold text-slate-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              {tr('Siguiente paso:')} {nextStep.label}
              <span className="font-medium text-slate-400">
                · {tr('paso')} {nextStep.stepNumber} {tr('de')} {steps.length}
              </span>
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
              {tr(getSectionAdvice(nextStep.key, data))}
            </p>
          </div>
        </div>

        {isWorkingOnNext ? (
          <span className="flex-none rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            {tr('Estás aquí')}
          </span>
        ) : (
          <Button
            size="sm"
            onClick={() => onGoTo(nextStep.key)}
            className="flex-none rounded-full bg-slate-900 text-white hover:bg-slate-800"
          >
            {tr('Ir al paso')} {nextStep.stepNumber}
            <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
