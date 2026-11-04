'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Palette, Settings2, Plus, Eye, Edit3, Save } from 'lucide-react';
import { toast } from 'sonner';
import { BaseTemplateId, UserTemplateConfig, CVData } from '@/lib/types';
import { BASE_TEMPLATES, saveUserTemplate } from '@/lib/templates';
import { getActiveProfile } from '@/lib/profiles';
import CVPreview from '@/components/preview/CVPreview';

import { useUiText } from '@/lib/i18n/uiText';
interface Props {
  previewData: CVData;
  onTemplateCreated?: (config: UserTemplateConfig) => void;
  editConfig?: UserTemplateConfig;
}

type UserTemplateInput = Omit<UserTemplateConfig, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

const FONTS = [
  { label: 'Sans-Serif (Moderna)', value: 'sans' },
  { label: 'Serif (Elegante)', value: 'serif' },
  { label: 'Monospace (Tech)', value: 'mono' }
] as const;

const DENSITIES = [
  { label: 'Compacta', value: 'compact' },
  { label: 'Normal', value: 'normal' },
  { label: 'Espaciosa', value: 'spacious' }
] as const;

const PRESET_COLORS = [
  { name: 'Azul', value: '#2563EB' },
  { name: 'Esmeralda', value: '#10B981' },
  { name: 'Purpura', value: '#7C3AED' },
  { name: 'Tierra', value: '#92400E' },
  { name: 'Slate', value: '#334155' },
  { name: 'Rose', value: '#E11D48' }
];

const PREVIEW_PAGE_WIDTH = 794;
const PREVIEW_PAGE_HEIGHT = 1123;

export default function UserTemplateBuilderDialog({ previewData, onTemplateCreated, editConfig }: Props) {
  const tr = useUiText();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(editConfig?.name || '');
  const [baseTemplate, setBaseTemplate] = useState<BaseTemplateId>(editConfig?.baseTemplate || 'moderno');
  const [accentColor, setAccentColor] = useState(editConfig?.accentColor || '#2563EB');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>(editConfig?.fontFamily || 'sans');
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>(editConfig?.density || 'normal');
  const [showPhoto, setShowPhoto] = useState(editConfig?.showPhoto ?? true);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);

  useEffect(() => {
    if (!open || !previewRef.current) return;
    const element = previewRef.current;

    const updateScale = () => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scale = Math.min(rect.width / PREVIEW_PAGE_WIDTH, rect.height / PREVIEW_PAGE_HEIGHT);
      const clamped = Math.max(0.2, Math.min(1, scale));
      setPreviewScale(clamped);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(tr('Dale un nombre a tu plantilla'));
      return;
    }

    const profile = getActiveProfile();
    if (!profile) {
      toast.error(tr('Necesitas un perfil para guardar plantillas personalizadas'));
      return;
    }

    const config: UserTemplateInput = {
      id: editConfig?.id,
      name,
      baseTemplate,
      accentColor,
      fontFamily,
      density,
      showPhoto,
    };

    try {
      const saved = saveUserTemplate(profile.id, config);
      toast.success(editConfig ? 'Plantilla actualizada' : 'Plantilla personalizada creada');
      setOpen(false);
      if (onTemplateCreated) onTemplateCreated(saved);
    } catch {
      toast.error(tr('Error al guardar la plantilla'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {editConfig ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
            <Edit3 className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-dashed">
            <Plus className="w-4 h-4 text-blue-500" />
            <span className="text-xs">{tr('Nueva plantilla propia')}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent aria-describedby={undefined} className="max-w-4xl p-0 overflow-hidden gap-0 bg-slate-50 flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Col: Config */}
        <div className="w-full md:w-[400px] bg-white p-8 border-r border-slate-100 flex flex-col overflow-y-auto">
          <DialogHeader className="mb-8">
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-blue-600" />
              {editConfig ? 'Editar Plantilla' : 'Disena tu Plantilla'}
            </DialogTitle>
            <DialogDescription>
              Tus plantillas se guardan en tu perfil.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <Label htmlFor="tpl-name" className="text-xs uppercase font-black text-slate-400">{tr('Nombre de la Plantilla')}</Label>
              <Input
                id="tpl-name"
                placeholder={tr('Ej: Mi CV Elegante')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-bold border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-black text-slate-400">{tr('Diseno Base')}</Label>
              <Select value={baseTemplate} onValueChange={(v) => setBaseTemplate(v as BaseTemplateId)}>
                <SelectTrigger className="font-bold border-slate-200">
                  <SelectValue placeholder={tr('Elegir diseno base')} />
                </SelectTrigger>
                <SelectContent>
                  {BASE_TEMPLATES.map(tpl => (
                    <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-xs uppercase font-black text-slate-400 flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" /> Color de Acento
              </Label>
              <div className="flex flex-wrap gap-2 justify-between">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setAccentColor(color.value)}
                    className={`w-10 h-10 rounded-xl transition-all ${accentColor === color.value ? 'ring-4 ring-offset-2 scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400">{tr('Letra')}</Label>
                <Select value={fontFamily} onValueChange={(v: 'sans' | 'serif' | 'mono') => setFontFamily(v)}>
                  <SelectTrigger className="text-xs font-bold bg-slate-50 border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map(f => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400">{tr('Densidad')}</Label>
                <Select value={density} onValueChange={(v: 'compact' | 'normal' | 'spacious') => setDensity(v)}>
                  <SelectTrigger className="text-xs font-bold bg-slate-50 border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DENSITIES.map(d => (<SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <Checkbox id="tpl-photo" checked={showPhoto} onCheckedChange={(v: boolean) => setShowPhoto(v)} />
              <Label htmlFor="tpl-photo" className="text-xs font-bold text-blue-900 cursor-pointer">
                Mostrar foto de perfil
              </Label>
            </div>
          </div>

          <DialogFooter className="mt-8 pt-4 border-t gap-2 sm:flex-col lg:flex-row">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-slate-500">{tr('Cancelar')}</Button>
            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 gap-2">
              <Save className="w-4 h-4" />
              {editConfig ? 'Guardar Cambios' : 'Crear Plantilla'}
            </Button>
          </DialogFooter>
        </div>

        {/* Right Col: Preview */}
        <div className="flex-1 bg-slate-200/50 flex flex-col items-center justify-center p-8 overflow-hidden">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4" /> Preview en tiempo real
          </div>
          <div ref={previewRef} className="relative w-full flex-1 flex items-start justify-center">
            <div
              className="pointer-events-none"
              style={{
                width: PREVIEW_PAGE_WIDTH * previewScale,
                height: PREVIEW_PAGE_HEIGHT * previewScale,
              }}
            >
              <div
                className="shadow-[0_0_50px_rgba(0,0,0,0.1)] rounded-sm"
                style={{
                  width: PREVIEW_PAGE_WIDTH,
                  height: PREVIEW_PAGE_HEIGHT,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <CVPreview
                  data={previewData}
                  template={baseTemplate}
                  customConfig={{
                    accentColor,
                    fontFamily: fontFamily === 'serif' ? '"Lora", serif' : fontFamily === 'mono' ? '"Space Mono", monospace' : '"Inter", sans-serif',
                    density,
                    showPhoto
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
