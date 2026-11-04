'use client';

import { Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAiSuggest, SuggestContext, SuggestField } from './useAiSuggest';
import { useUiText } from '@/lib/i18n/uiText';

interface SuggestButtonProps {
  /** Campo para el que se piden sugerencias. */
  field: SuggestField;
  /** Clave única del campo (ej. `${exp.id}:3`) para aislar estados. */
  suggestKey: string;
  /** Contexto para la IA. */
  context: SuggestContext;
  /** Recibe la variante elegida. */
  onPick: (value: string) => void;
  /** Texto opcional del botón. */
  label?: string;
  /** Deshabilita el botón (ej. faltan datos mínimos). */
  disabled?: boolean;
  /** Título del popover con las variantes. */
  popoverTitle?: string;
  compact?: boolean;
}

/**
 * Botón "✨ Sugerir" + popover con 3 variantes de IA.
 * El usuario SIEMPRE elige: nada se escribe en el CV sin su clic.
 * Las variantes se pueden regenerar (cuesta 1 crédito cada consulta).
 */
export default function SuggestButton({
  field,
  suggestKey,
  context,
  onPick,
  label,
  disabled,
  popoverTitle,
  compact,
}: SuggestButtonProps) {
  const tr = useUiText();
  const { fetchSuggestions, dismiss, isLoadingFor, isOpenFor, state } = useAiSuggest();
  const loading = isLoadingFor(suggestKey);
  const open = isOpenFor(suggestKey) && !loading && state.variants.length > 0;

  const handleClick = () => {
    if (open) {
      dismiss();
      return;
    }
    fetchSuggestions(field, context, suggestKey);
  };

  const regenerate = () => fetchSuggestions(field, context, suggestKey);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={`inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40 ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        }`}
        title={disabled ? tr('Completa primero el cargo y la empresa') : tr('Sugerir con IA (1 crédito)')}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {loading ? 'Sugiriendo…' : label || 'Sugerir con IA'}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/10">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              {popoverTitle || tr('Elige una sugerencia')}
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label={tr('Cerrar sugerencias')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            {state.variants.map((variant, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onPick(variant);
                  dismiss();
                }}
                className="group flex w-full items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left transition hover:border-violet-300 hover:bg-violet-50"
              >
                <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-violet-100 text-[9px] font-black text-violet-700 group-hover:bg-violet-200">
                  {index + 1}
                </span>
                <span className="text-xs leading-snug text-slate-700">{variant}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-slate-400">{tr('Nada se aplica sin tu clic.')}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={regenerate}
              className="h-7 rounded-full px-2.5 text-[11px] text-violet-600 hover:bg-violet-50"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Regenerar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
