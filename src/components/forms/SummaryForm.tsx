'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlignLeft } from 'lucide-react';
import SectionHeader from '@/components/editor/SectionHeader';
import SuggestButton from '@/components/editor/SuggestButton';
import { PersonalInfo } from '@/lib/types';
import { useUiText } from '@/lib/i18n/uiText';

interface Props {
  summary: string;
  onChange: (summary: string) => void;
  advice?: string;
  /** Datos de contacto para dar contexto a la IA. */
  personalInfo?: PersonalInfo;
  skills?: string[];
  achievements?: string[];
}

export default function SummaryForm({ summary, onChange, advice, personalInfo, skills, achievements }: Props) {
  const tr = useUiText();
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<AlignLeft className="h-4 w-4" />}
        title={tr('Resumen Profesional')}
        description={tr('Cuenta quién eres, cuánta experiencia tienes, en qué te especializas y cuál es tu propuesta de valor.')}
      />
      <div>
        <div className="flex items-end justify-between gap-3">
          <Label htmlFor="summary" className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {tr('Describe brevemente tu perfil profesional (2-4 oraciones)')}
          </Label>
          <SuggestButton
            field="summary"
            suggestKey="summary"
            context={{
              role: personalInfo?.title,
              currentText: summary,
              yearsHint: undefined,
              skills,
              achievements,
            }}
            onPick={onChange}
            popoverTitle="Perfiles sugeridos"
          />
        </div>
        <Textarea
          id="summary"
          placeholder={tr('Ej: Profesional con 5 años de experiencia en... Especializado en... con logros como...')}
          value={summary}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="mt-1 resize-none"
        />
        <p className="mt-1 text-xs text-slate-400">{summary.length}/500 caracteres</p>
      </div>
      {advice ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          {advice}
        </div>
      ) : null}
    </div>
  );
}
