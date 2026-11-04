'use client';

import { Reference, generateId } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Plus, Trash2 } from 'lucide-react';
import SectionHeader from '@/components/editor/SectionHeader';
import { useUiText } from '@/lib/i18n/uiText';

interface Props {
  references: Reference[];
  onChange: (references: Reference[]) => void;
  advice?: string;
}

export default function ReferencesForm({ references, onChange, advice }: Props) {
  const tr = useUiText();
  const addReference = () => {
    onChange([
      ...references,
      {
        id: generateId(),
        name: '',
        position: '',
        company: '',
        phone: '',
        email: '',
      },
    ]);
  };

  const updateRef = (id: string, partial: Partial<Reference>) => {
    onChange(references.map((reference) => (reference.id === id ? { ...reference, ...partial } : reference)));
  };

  const removeRef = (id: string) => {
    onChange(references.filter((reference) => reference.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          icon={<Users className="h-4 w-4" />}
          title={tr('Referencias')}
          description={tr('Es una sección opcional. Úsala solo si tienes personas actualizadas y autorizadas para recomendarte.')}
        />
        <Button type="button" size="sm" variant="outline" onClick={addReference} className="ml-3 mt-0.5 rounded-xl">
          <Plus className="mr-1 w-4 h-4" />
          Agregar
        </Button>
      </div>

      {references.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-400">
          <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
          {tr('No hay referencias agregadas.')}
          <br />
          {tr('Esta sección es opcional.')}
        </div>
      )}

      {references.map((ref, index) => (
        <Card key={ref.id} className="space-y-3 border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600">
              Referencia {index + 1}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeRef(ref.id)}
              className="h-7 w-7 p-0 text-red-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Nombre')}</Label>
              <Input
                placeholder={tr('Ej: María García')}
                value={ref.name}
                onChange={(e) => updateRef(ref.id, { name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Cargo')}</Label>
              <Input
                placeholder={tr('Ej: Gerente de Proyectos')}
                value={ref.position}
                onChange={(e) => updateRef(ref.id, { position: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Empresa')}</Label>
            <Input
              placeholder={tr('Ej: Tech Corp')}
              value={ref.company}
              onChange={(e) => updateRef(ref.id, { company: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Teléfono')}</Label>
              <Input
                placeholder="+57 300 123 4567"
                value={ref.phone}
                onChange={(e) => updateRef(ref.id, { phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Email')}</Label>
              <Input
                placeholder="maria@ejemplo.com"
                value={ref.email}
                onChange={(e) => updateRef(ref.id, { email: e.target.value })}
                className="mt-1"
              />
            </div>
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
