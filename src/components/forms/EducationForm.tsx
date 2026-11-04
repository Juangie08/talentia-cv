'use client';

import { Education, generateId } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowDown, ArrowUp, GraduationCap, Plus, Trash2, GripVertical } from 'lucide-react';
import SectionHeader from '@/components/editor/SectionHeader';
import { useUiText } from '@/lib/i18n/uiText';

interface Props {
  education: Education[];
  onChange: (education: Education[]) => void;
  advice?: string;
}

export default function EducationForm({ education, onChange, advice }: Props) {
  const tr = useUiText();
  const addEducation = () => {
    onChange([
      ...education,
      {
        id: generateId(),
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        current: false,
      },
    ]);
  };

  const updateEdu = (id: string, partial: Partial<Education>) => {
    onChange(education.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  };

  const removeEdu = (id: string) => {
    onChange(education.filter((item) => item.id !== id));
  };

  const moveEducation = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= education.length) return;
    const updated = [...education];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    onChange(updated);
  };

  const isWithoutDate = (value: string) => value.trim().toLowerCase() === 'sin fecha';

  const toggleWithoutDate = (id: string, field: 'startDate' | 'endDate', currentValue: string) => {
    updateEdu(id, { [field]: isWithoutDate(currentValue) ? '' : 'Sin fecha' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          icon={<GraduationCap className="h-4 w-4" />}
          title={tr('Educación')}
          description={tr('Incluye tu formación más relevante con título, institución y fechas. Si estás estudiando, indícalo como en curso.')}
        />
        <Button type="button" size="sm" variant="outline" onClick={addEducation} className="ml-3 mt-0.5 rounded-xl">
          <Plus className="mr-1 w-4 h-4" />
          Agregar
        </Button>
      </div>

      {education.length === 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={addEducation}
          className="h-16 w-full justify-center rounded-2xl border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          {tr('+ Añadir primer estudio o formación')}
        </Button>
      )}

      {education.map((edu, index) => (
        <Card key={edu.id} className="space-y-3 border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <GripVertical className="w-3 h-3" />
              Educación {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveEducation(index, -1)}
                disabled={index === 0}
                className="h-7 w-7 rounded-full border border-slate-200 text-slate-500 disabled:opacity-30"
                aria-label={tr('Subir educación')}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveEducation(index, 1)}
                disabled={index === education.length - 1}
                className="h-7 w-7 rounded-full border border-slate-200 text-slate-500 disabled:opacity-30"
                aria-label={tr('Bajar educación')}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeEdu(edu.id)}
                className="h-7 w-7 p-0 text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Título / Grado')}</Label>
            <Input
              placeholder={tr('Ej: Ingeniería de Sistemas')}
              value={edu.degree}
              onChange={(e) => updateEdu(edu.id, { degree: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Campo / Especialización (opcional)')}</Label>
            <Input
              placeholder={tr('Ej: Desarrollo de Software')}
              value={edu.field}
              onChange={(e) => updateEdu(edu.id, { field: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Institución')}</Label>
            <Input
              placeholder={tr('Ej: Universidad Nacional')}
              value={edu.institution}
              onChange={(e) => updateEdu(edu.id, { institution: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Fecha inicio')}</Label>
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-widest text-slate-500"
                  onClick={() => toggleWithoutDate(edu.id, 'startDate', edu.startDate)}
                >
                  {isWithoutDate(edu.startDate) ? 'Quitar' : 'Sin fecha'}
                </button>
              </div>
              <Input
                placeholder={tr('Ej: 2018')}
                value={edu.startDate}
                onChange={(e) => updateEdu(edu.id, { startDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Fecha fin')}</Label>
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-widest text-slate-500"
                  onClick={() => toggleWithoutDate(edu.id, 'endDate', edu.endDate)}
                >
                  {isWithoutDate(edu.endDate) ? 'Quitar' : 'Sin fecha'}
                </button>
              </div>
              <Input
                placeholder={tr('Ej: 2023')}
                value={edu.endDate}
                onChange={(e) => updateEdu(edu.id, { endDate: e.target.value })}
                disabled={edu.current}
                className="mt-1"
              />
              <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={edu.current}
                  onChange={(e) => updateEdu(edu.id, { current: e.target.checked, endDate: '' })}
                  className="rounded"
                />
                En curso
              </label>
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
