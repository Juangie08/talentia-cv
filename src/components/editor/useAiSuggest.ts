'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { fetchWithQuotaHandling, isQuotaError, quotaMessageFromResponse } from '@/lib/quotaClient';
import { notifyAiUsed } from '@/components/editor/AiUsageBadge';
import { useI18n } from '@/lib/i18n/LocaleProvider';

export type SuggestField = 'summary' | 'achievement' | 'title';

export interface SuggestContext {
  role?: string;
  company?: string;
  currentText?: string;
  yearsHint?: string;
  skills?: string[];
  achievements?: string[];
}

interface SuggestState {
  loading: boolean;
  variants: string[];
  open: boolean;
}

/**
 * Hook para pedir sugerencias de IA para un campo del CV.
 * Devuelve 3 variantes para que el usuario elija una (nunca se aplica sola).
 * Cuesta 1 crédito por consulta (gestionado por el servidor).
 */
export function useAiSuggest() {
  const { locale } = useI18n();
  const [state, setState] = useState<SuggestState>({ loading: false, variants: [], open: false });
  const keyRef = useRef<string>('');

  const fetchSuggestions = useCallback(async (field: SuggestField, context: SuggestContext, key: string) => {
    keyRef.current = key;
    setState({ loading: true, variants: [], open: true });
    try {
      const response = await fetchWithQuotaHandling('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, ...context }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudieron obtener sugerencias.');
      }
      const variants: string[] = Array.isArray(payload?.variants) ? payload.variants : [];
      if (variants.length === 0) {
        throw new Error('La IA no generó sugerencias esta vez. Inténtalo de nuevo.');
      }
      notifyAiUsed();
      setState({ loading: false, variants, open: true });
    } catch (error) {
      setState({ loading: false, variants: [], open: false });
      if (isQuotaError(error)) {
        toast.error(quotaMessageFromResponse((error as { body?: unknown }).body, locale), { duration: 8000 });
      } else {
        toast.error(error instanceof Error ? error.message : 'Error al solicitar sugerencias');
      }
    }
  }, []);

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const isLoadingFor = useCallback((key: string) => state.loading && keyRef.current === key, [state.loading]);
  const isOpenFor = useCallback((key: string) => state.open && keyRef.current === key, [state.open]);

  return { state, fetchSuggestions, dismiss, isLoadingFor, isOpenFor };
}
