'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight, Sparkles, X } from 'lucide-react';
import { CompletionSummary, EditorSectionKey } from '@/lib/editor-metrics';
import { useUiText } from '@/lib/i18n/uiText';

interface LiveScoreRingProps {
  summary: CompletionSummary;
  /** Navega a la sección correspondiente al hacer clic en una acción. */
  onGoToSection: (key: EditorSectionKey) => void;
}

interface ScoreAction {
  key: EditorSectionKey;
  label: string;
  hint: string;
}

/**
 * Anillo de progreso en vivo que flota sobre la vista previa del CV
 * (estilo Rezi): muestra el % completado y, al hacer clic, un panel con
 * las 3 acciones de mayor impacto para subir el score ya.
 */
export default function LiveScoreRing({ summary, onGoToSection }: LiveScoreRingProps) {
  const tr = useUiText();
  const [open, setOpen] = useState(false);

  const color = summary.percent >= 100 ? '#10b981' : summary.percent >= 60 ? '#f59e0b' : '#f97316';
  const circumference = 2 * Math.PI * 15.5;

  const actions: ScoreAction[] = useMemo(() => {
    return summary.states
      .filter((state) => state.status === 'incomplete')
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((state) => ({
        key: state.key,
        label: state.label,
        hint: state.qualityLabel === 'vacio' ? tr('Aún vacía') : 'Puede mejorarse',
      }));
  }, [summary.states]);

  // Acciones de calidad aunque las secciones estén "completas": la calidad
  // fuerte es lo que diferencia un CV ganador.
  const qualityActions: ScoreAction[] = useMemo(() => {
    if (actions.length > 0) return [];
    return summary.states
      .filter((state) => state.status === 'complete' && state.qualityScore < 85 && state.key !== 'references')
      .sort((a, b) => a.qualityScore - b.qualityScore)
      .slice(0, 3)
      .map((state) => ({
        key: state.key,
        label: state.label,
        hint: `Calidad ${Math.round(state.qualityScore)}% · sube detalles y logros`,
      }));
  }, [actions.length, summary.states]);

  const shown = actions.length > 0 ? actions : qualityActions;

  return (
    <div className="absolute left-4 top-4 z-20 xl:left-6 xl:top-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg shadow-slate-900/10 transition hover:scale-105"
        aria-label={`Progreso del CV: ${summary.percent}%. Ver acciones para mejorar`}
      >
        <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(summary.percent / 100) * circumference} ${circumference}`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span className="absolute flex flex-col items-center">
          <span className="text-sm font-black leading-none text-slate-800">{summary.percent}%</span>
          <span className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.14em] text-slate-400">CV</span>
        </span>
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
            summary.isReadyToExport ? 'bg-emerald-500' : 'bg-amber-400'
          }`}
        >
          {summary.isReadyToExport ? <CheckCircle2 className="h-2.5 w-2.5 text-white" /> : <Sparkles className="h-2.5 w-2.5 text-white" />}
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full mt-2 w-[300px] rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-900/10">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              {summary.isReadyToExport ? tr('Llévalo al siguiente nivel') : tr('Sube tu score ya')}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={tr('Cerrar')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {summary.isReadyToExport ? (
            <p className="mb-2 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {tr('¡CV listo para exportar!')}
            </p>
          ) : null}

          {shown.length > 0 ? (
            <ul className="space-y-1.5">
              {shown.map((action) => (
                <li key={action.key}>
                  <button
                    type="button"
                    onClick={() => {
                      onGoToSection(action.key);
                      setOpen(false);
                    }}
                    className="group flex w-full items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-slate-800">{action.label}</span>
                      <span className="block text-[10px] leading-snug text-slate-500">{action.hint}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 flex-none text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-amber-600" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] leading-snug text-slate-500">
              {tr('Todo completo. Prueba «Validar CV» para verificar calidad ATS y adaptarlo a una oferta.')}
            </p>
          )}

          <p className="mt-2.5 flex items-center gap-1 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
            <ChevronRight className="h-3 w-3" />
            {tr('El score sube en vivo mientras llenas secciones')}
          </p>
        </div>
      ) : null}
    </div>
  );
}
