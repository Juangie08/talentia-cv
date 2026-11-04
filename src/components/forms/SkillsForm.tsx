'use client';

import { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Star, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionHeader from '@/components/editor/SectionHeader';
import { useUiText } from '@/lib/i18n/uiText';

interface Props {
  skills: string[];
  onChange: (skills: string[]) => void;
  advice?: string;
}

export default function SkillsForm({ skills, onChange, advice }: Props) {
  const tr = useUiText();
  const [input, setInput] = useState('');

  const addSkill = () => {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
      setInput('');
    }
  };

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const suggestions = [
    'Trabajo en equipo', 'Liderazgo', tr('Comunicación'), 'Microsoft Office',
    tr('Resolución de problemas'), 'Adaptabilidad', tr('Organización'), 'Creatividad',
  ].filter((suggestion) => !skills.includes(suggestion));

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Star className="h-4 w-4" />}
        title={tr('Habilidades')}
        description={tr('Agrega habilidades técnicas y blandas que realmente apoyen tu candidatura. Prioriza lo más relevante para el cargo.')}
      />

      <div>
        <Label htmlFor="skill-input" className="text-xs uppercase tracking-[0.18em] text-slate-500">
          {tr('Escribe una habilidad y presiona Enter')}
        </Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="skill-input"
            placeholder={tr('Ej: React, Excel, liderazgo comercial...')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button type="button" size="sm" variant="outline" onClick={addSkill} className="h-11 rounded-xl">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {skills.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setInput('Trabajo en equipo')}
          className="h-14 w-full justify-center rounded-2xl border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          {tr('+ Añadir primeras habilidades')}
        </Button>
      ) : null}

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="flex items-center gap-1 border border-amber-100 bg-amber-50 pl-3 pr-1 py-1.5 text-sm text-amber-800 hover:bg-amber-100"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(i)}
                className="ml-1 rounded-full p-0.5 transition-colors hover:bg-amber-200"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-slate-400">{tr('Sugerencias:')}</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onChange([...skills, suggestion])}
                className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-500 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {advice ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          {advice}
        </div>
      ) : null}
    </div>
  );
}
