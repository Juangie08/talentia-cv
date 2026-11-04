'use client';

import { Language, generateId } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages, Plus, Trash2 } from 'lucide-react';
import SectionHeader from '@/components/editor/SectionHeader';
import { useUiText } from '@/lib/i18n/uiText';

interface Props {
  languages: Language[];
  onChange: (languages: Language[]) => void;
  advice?: string;
}

const levels = ['Básico', 'Intermedio', 'Avanzado', 'Nativo'] as const;

export default function LanguagesForm({ languages, onChange, advice }: Props) {
  const tr = useUiText();
  const addLanguage = () => {
    onChange([
      ...languages,
      { id: generateId(), name: '', level: 'Intermedio' },
    ]);
  };

  const updateLang = (id: string, partial: Partial<Language>) => {
    onChange(languages.map((language) => (language.id === id ? { ...language, ...partial } : language)));
  };

  const removeLang = (id: string) => {
    onChange(languages.filter((language) => language.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          icon={<Languages className="h-4 w-4" />}
          title={tr('Idiomas')}
          description={tr('Agrega idiomas con un nivel realista y consistente. Sirve para filtros ATS y para roles bilingües o internacionales.')}
        />
        <Button type="button" size="sm" variant="outline" onClick={addLanguage} className="ml-3 mt-0.5 rounded-xl">
          <Plus className="mr-1 w-4 h-4" />
          Agregar
        </Button>
      </div>

      {languages.length === 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={addLanguage}
          className="h-16 w-full justify-center rounded-2xl border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          {tr('+ Añadir primer idioma')}
        </Button>
      )}

      {languages.map((lang) => (
        <Card key={lang.id} className="border-slate-200 p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Idioma')}</Label>
              <Input
                placeholder={tr('Ej: Inglés')}
                value={lang.name}
                onChange={(e) => updateLang(lang.id, { name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="w-36">
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Nivel')}</Label>
              <Select
                value={lang.level}
                onValueChange={(value) => updateLang(lang.id, { level: value as Language['level'] })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {tr(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeLang(lang.id)}
              className="mt-5 h-7 w-7 p-0 text-red-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      ))}

      {advice ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          {advice}
        </div>
      ) : null}
    </div>
  );
}
