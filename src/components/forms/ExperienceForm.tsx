'use client';

import { Experience, generateId } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Briefcase, Plus, Trash2, X, GripVertical, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import SectionHeader from '@/components/editor/SectionHeader';
import SuggestButton from '@/components/editor/SuggestButton';
import { useUiText } from '@/lib/i18n/uiText';

interface Props {
  experience: Experience[];
  onChange: (experience: Experience[]) => void;
  advice?: string;
}

export default function ExperienceForm({ experience, onChange, advice }: Props) {
  const tr = useUiText();
  const [newAchievement, setNewAchievement] = useState<Record<string, string>>({});
  const [improvingKey, setImprovingKey] = useState<string | null>(null);

  const addExperience = () => {
    onChange([
      ...experience,
      {
        id: generateId(),
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        achievements: [],
      },
    ]);
  };

  const updateExp = (id: string, partial: Partial<Experience>) => {
    onChange(experience.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  };

  const removeExp = (id: string) => {
    onChange(experience.filter((item) => item.id !== id));
  };

  const moveExperience = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= experience.length) return;
    const updated = [...experience];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    onChange(updated);
  };

  const moveAchievement = (expId: string, achievementIndex: number, direction: -1 | 1) => {
    const exp = experience.find((item) => item.id === expId);
    if (!exp) return;
    const target = achievementIndex + direction;
    if (target < 0 || target >= exp.achievements.length) return;
    const updated = [...exp.achievements];
    const [moved] = updated.splice(achievementIndex, 1);
    updated.splice(target, 0, moved);
    updateExp(expId, { achievements: updated });
  };

  const isWithoutDate = (value: string) => value.trim().toLowerCase() === 'sin fecha';

  const toggleWithoutDate = (id: string, field: 'startDate' | 'endDate', currentValue: string) => {
    updateExp(id, { [field]: isWithoutDate(currentValue) ? '' : 'Sin fecha' });
  };

  const addAchievement = (expId: string) => {
    const text = (newAchievement[expId] || '').trim();
    if (!text) return;
    const exp = experience.find((item) => item.id === expId);
    if (!exp) return;
    updateExp(expId, { achievements: [...exp.achievements, text] });
    setNewAchievement((prev) => ({ ...prev, [expId]: '' }));
  };

  const removeAchievement = (expId: string, index: number) => {
    const exp = experience.find((item) => item.id === expId);
    if (!exp) return;
    updateExp(expId, { achievements: exp.achievements.filter((_, currentIndex) => currentIndex !== index) });
  };

  const updateAchievement = (expId: string, index: number, value: string) => {
    const exp = experience.find((item) => item.id === expId);
    if (!exp) return;
    const achievements = [...exp.achievements];
    achievements[index] = value;
    updateExp(expId, { achievements });
  };

  // Mejora un solo logro con IA (reusa /api/improve pasándolo como única experiencia)
  const improveAchievement = async (exp: Experience, index: number) => {
    const key = `${exp.id}:${index}`;
    const original = exp.achievements[index];
    if (!original?.trim()) return;
    setImprovingKey(key);
    try {
      const response = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: '',
          experience: [{ ...exp, achievements: [original] }],
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || tr('No se pudo mejorar el logro'));
      const improved = payload?.experience?.[0]?.achievements?.[0];
      if (typeof improved === 'string' && improved.trim()) {
        updateAchievement(exp.id, index, improved.trim());
        toast.success(tr('Logro mejorado'));
      } else {
        toast.info(tr('La IA no sugirió cambios para este logro'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tr('Error al mejorar'));
    } finally {
      setImprovingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          icon={<Briefcase className="h-4 w-4" />}
          title={tr('Experiencia Laboral')}
          description={tr('Incluye cargo, empresa, fechas y logros. Empieza por lo más reciente y escribe impacto real, no solo funciones.')}
        />
        <Button type="button" size="sm" variant="outline" onClick={addExperience} className="ml-3 mt-0.5 rounded-xl">
          <Plus className="mr-1 w-4 h-4" />
          Agregar
        </Button>
      </div>

      {experience.length === 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={addExperience}
          className="h-16 w-full justify-center rounded-2xl border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
        >
          {tr('+ Añadir primera experiencia laboral')}
        </Button>
      )}

      {experience.map((exp, index) => (
        <Card key={exp.id} className="space-y-3 border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
              <GripVertical className="w-3 h-3" />
              Experiencia {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveExperience(index, -1)}
                disabled={index === 0}
                className="h-7 w-7 rounded-full border border-slate-200 text-slate-500 disabled:opacity-30"
                aria-label={tr('Subir experiencia')}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveExperience(index, 1)}
                disabled={index === experience.length - 1}
                className="h-7 w-7 rounded-full border border-slate-200 text-slate-500 disabled:opacity-30"
                aria-label={tr('Bajar experiencia')}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeExp(exp.id)}
                className="h-7 w-7 p-0 text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Cargo')}</Label>
              <Input
                placeholder={tr('Ej: Desarrollador Senior')}
                value={exp.position}
                onChange={(e) => updateExp(exp.id, { position: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Empresa')}</Label>
              <Input
                placeholder={tr('Ej: Google Colombia')}
                value={exp.company}
                onChange={(e) => updateExp(exp.id, { company: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Fecha inicio')}</Label>
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-widest text-slate-500"
                  onClick={() => toggleWithoutDate(exp.id, 'startDate', exp.startDate)}
                >
                  {isWithoutDate(exp.startDate) ? 'Quitar' : 'Sin fecha'}
                </button>
              </div>
              <Input
                placeholder={tr('Ej: Ene 2022')}
                value={exp.startDate}
                onChange={(e) => updateExp(exp.id, { startDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Fecha fin')}</Label>
                <button
                  type="button"
                  className="text-[10px] uppercase tracking-widest text-slate-500"
                  onClick={() => toggleWithoutDate(exp.id, 'endDate', exp.endDate)}
                >
                  {isWithoutDate(exp.endDate) ? 'Quitar' : 'Sin fecha'}
                </button>
              </div>
              <Input
                placeholder={tr('Ej: Dic 2023')}
                value={exp.endDate}
                onChange={(e) => updateExp(exp.id, { endDate: e.target.value })}
                disabled={exp.current}
                className="mt-1"
              />
              <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => updateExp(exp.id, { current: e.target.checked, endDate: '' })}
                  className="rounded"
                />
                Actual
              </label>
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Logros / Responsabilidades')}</Label>
            {exp.achievements.map((achievement, achievementIndex) => {
              const key = `${exp.id}:${achievementIndex}`;
              const isImproving = improvingKey === key;
              return (
                <div
                  key={achievementIndex}
                  className="group mt-1 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2"
                >
                  <span className="mt-2 text-amber-500">•</span>
                  <textarea
                    value={achievement}
                    onChange={(e) => updateAchievement(exp.id, achievementIndex, e.target.value)}
                    rows={2}
                    aria-label={tr('Editar logro')}
                    className="flex-1 resize-none bg-transparent text-sm leading-5 text-slate-700 outline-none placeholder:text-slate-400"
                    placeholder={tr('Describe un logro con verbo de acción y un resultado medible')}
                  />
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => improveAchievement(exp, achievementIndex)}
                      disabled={isImproving || !achievement.trim()}
                      className="rounded-full p-0.5 text-violet-400 hover:text-violet-600 disabled:opacity-30"
                      aria-label={tr('Mejorar este logro con IA')}
                      title={tr('Mejorar con IA')}
                    >
                      {isImproving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAchievement(exp.id, achievementIndex, -1)}
                      disabled={achievementIndex === 0}
                      className="rounded-full p-0.5 text-slate-400 hover:text-amber-600 disabled:opacity-30"
                      aria-label={tr('Mover logro arriba')}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAchievement(exp.id, achievementIndex, 1)}
                      disabled={achievementIndex === exp.achievements.length - 1}
                      className="rounded-full p-0.5 text-slate-400 hover:text-amber-600 disabled:opacity-30"
                      aria-label={tr('Mover logro abajo')}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAchievement(exp.id, achievementIndex)}
                    className="mt-1 opacity-0 text-slate-300 transition group-hover:opacity-100 hover:text-red-500"
                    aria-label={tr('Eliminar logro')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            <div className="mt-2 flex gap-2">
              <Input
                placeholder={tr('Ej: Lideré un equipo de 5 personas y reduje tiempos 30%.')}
                value={newAchievement[exp.id] || ''}
                onChange={(e) => setNewAchievement((prev) => ({ ...prev, [exp.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addAchievement(exp.id);
                  }
                }}
                className="text-sm"
              />
              <Button type="button" size="sm" variant="outline" onClick={() => addAchievement(exp.id)} className="h-11 rounded-xl">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-2 flex justify-end">
              <SuggestButton
                field="achievement"
                suggestKey={`${exp.id}:new`}
                context={{
                  role: exp.position,
                  company: exp.company,
                  currentText: newAchievement[exp.id] || '',
                  achievements: exp.achievements,
                }}
                disabled={!exp.position.trim() || !exp.company.trim()}
                onPick={(value) => {
                  updateExp(exp.id, { achievements: [...exp.achievements, value] });
                }}
                label={tr('Sugerir logro')}
                compact
                popoverTitle={tr('Logros sugeridos')}
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
