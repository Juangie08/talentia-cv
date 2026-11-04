'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  CaseUpper,
  RotateCcw,
  Eye,
  EyeOff,
  FileText,
  Check,
} from 'lucide-react';
import { BASE_TEMPLATES, getBaseTemplateMeta, getTemplatesForRole, CATEGORY_LABELS, ROLE_OPTIONS, type RoleKey, type TemplateCategory } from '@/lib/templates';
import { CVCustomization, PaperSize, TemplateName, CVData, defaultCustomization } from '@/lib/types';
import { cn } from '@/lib/utils';
import TemplateMiniature from '@/components/TemplateMiniature';
import { FONT_PRESETS, HEADER_BG_PRESETS } from '@/lib/fontPresets';
import { useUiText } from '@/lib/i18n/uiText';

type TemplateFilterKey = 'all' | 'corporativo' | 'moderno' | 'creativo' | 'sencillo' | 'ats';

const FONTS = [
  { label: 'Manrope', value: 'Manrope' },
  { label: 'Inter', value: 'Inter' },
  { label: 'Outfit', value: 'Outfit' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Space Grotesk', value: 'Space Grotesk' },
  { label: 'IBM Plex Sans', value: 'IBM Plex Sans' },
  { label: 'Source Sans 3', value: 'Source Sans 3' },
  { label: 'DM Sans', value: 'DM Sans' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Merriweather', value: 'Merriweather' },
  { label: 'Lora', value: 'Lora' },
  { label: 'Playfair Display', value: 'Playfair Display' },
  { label: 'Cormorant Garamond', value: 'Cormorant Garamond' },
  { label: 'Bitter', value: 'Bitter' },
  { label: 'Source Code Pro', value: 'Source Code Pro' },
];

/** Swatches rápidos para el color de acento. */
const PRESET_COLORS = [
  { name: 'Azul', value: '#2563EB' },
  { name: 'Teal', value: '#0D9488' },
  { name: 'Verde', value: '#16A34A' },
  { name: 'Esmeralda', value: '#059669' },
  { name: 'Violeta', value: '#7C3AED' },
  { name: 'Magenta', value: '#DB2777' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Rojo', value: '#DC2626' },
  { name: 'Naranja', value: '#EA580C' },
  { name: 'Ámbar', value: '#D97706' },
  { name: 'Grafito', value: '#111827' },
  { name: 'Oro', value: '#B45309' },
];

/**
 * Paletas completas: aplican acento + encabezado + texto de encabezado +
 * texto de cuerpo de una sola vez, con contraste ya resuelto.
 */
const COLOR_PALETTES: Array<{ name: string; colors: [string, string, string, string] }> = [
  { name: 'Azul Corporativo', colors: ['#2563EB', '#1E293B', '#FFFFFF', '#1F2937'] },
  { name: 'Grafito Elegante', colors: ['#111827', '#111827', '#FFFFFF', '#374151'] },
  { name: 'Verde Esmeralda', colors: ['#059669', '#064E3B', '#FFFFFF', '#1F2937'] },
  { name: 'Borgoña Premium', colors: ['#9F1239', '#4C0519', '#FFFFFF', '#1F2937'] },
  { name: 'Naranja Energía', colors: ['#EA580C', '#7C2D12', '#FFFFFF', '#292524'] },
  { name: 'Violeta Creativo', colors: ['#7C3AED', '#2E1065', '#FFFFFF', '#1F2937'] },
  { name: 'Océano Teal', colors: ['#0D9488', '#134E4A', '#FFFFFF', '#1F2937'] },
  { name: 'Rosa Moderno', colors: ['#DB2777', '#831843', '#FFFFFF', '#3F3F46'] },
  { name: 'Dorado Ejecutivo', colors: ['#B45309', '#1C1917', '#FFFFFF', '#292524'] },
  { name: 'Rojo Confianza', colors: ['#DC2626', '#7F1D1D', '#FFFFFF', '#1F2937'] },
  { name: 'Pizarra Suave', colors: ['#475569', '#F1F5F9', '#0F172A', '#334155'] },
  { name: 'Cielo Sereno', colors: ['#0284C7', '#E0F2FE', '#0C4A6E', '#334155'] },
];

/** Luminancia aproximada para decidir el color de texto legible. */
function isColorDark(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return false;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}

const SECTION_LABELS: Record<string, string> = {
  photo: 'Foto',
  summary: 'Perfil',
  skills: 'Habilidades',
  experience: 'Experiencia',
  education: 'Educación',
  languages: 'Idiomas',
  references: 'Referencias',
};

const TONE_COPY = {
  ats: 'Ideal para portales',
  light: 'Compacta y ligera',
  creative: 'Mas expresiva',
  balanced: 'Uso versatil',
} as const;

interface StylePanelProps {
  customization: CVCustomization;
  onUpdate: (partial: Partial<CVCustomization>) => void;
  onReset: () => void;
  paperSize: PaperSize;
  onPaperSizeChange: (size: PaperSize) => void;
  template: TemplateName;
  setTemplate: (t: TemplateName) => void;
  cvData: CVData;
  panelWidth?: number;
}

function matchesTemplateFilter(meta: { category?: TemplateCategory; tone?: string }, activeFilter: TemplateFilterKey): boolean {
  if (activeFilter === 'all') return true;
  if (activeFilter === 'ats') return meta.tone === 'ats';
  return meta.category === activeFilter;
}

export default function StylePanel({
  customization,
  onUpdate,
  onReset,
  paperSize,
  onPaperSizeChange,
  template,
  setTemplate,
  cvData,
  panelWidth = 340,
}: StylePanelProps) {
  const tr = useUiText();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('style-panel-collapsed') === 'true';
    }
    return false;
  });
  const [confirmResetColors, setConfirmResetColors] = useState(false);
  const [openSection, setOpenSection] = useState<string>('templates');
  const [activeTemplateFilter, setActiveTemplateFilter] = useState<TemplateFilterKey>('all');
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('style-panel-collapsed', String(next));
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!confirmResetColors) return;
    const timer = window.setTimeout(() => setConfirmResetColors(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmResetColors]);

  const setSectionRef = useCallback(
    (sectionKey: string) => (node: HTMLDivElement | null) => {
      sectionRefs.current[sectionKey] = node;
    },
    [],
  );

  const handleSectionChange = useCallback((value: string) => {
    setOpenSection(value);
    if (!value) return;

    window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const target = sectionRefs.current[value];
      if (!container || !target) return;

      const nextTop = target.offsetTop - 12;
      container.scrollTo({
        top: Math.max(0, nextTop),
        behavior: 'smooth',
      });
    });
  }, []);

  const visibleTemplates = useMemo(() => {
    // Si hay un cargo elegido, ordenamos por recomendación para ese cargo.
    const source = selectedRole ? getTemplatesForRole(selectedRole) : BASE_TEMPLATES.map((t) => getBaseTemplateMeta(t.id)!);
    return source.filter((meta) => matchesTemplateFilter(meta, activeTemplateFilter));
  }, [activeTemplateFilter, selectedRole]);

  const applyTemplate = (templateId: TemplateName) => {
    setTemplate(templateId);
    const meta = getBaseTemplateMeta(String(templateId));
    if (meta?.defaults) {
      onUpdate(meta.defaults);
    }
  };

  const handleSliderChange = (key: keyof CVCustomization, value: number) => {
    onUpdate({ [key]: value });
  };

  const resetColors = () => {
    onUpdate({
      colorAccent: defaultCustomization.colorAccent,
      colorHeaderBg: defaultCustomization.colorHeaderBg,
      colorHeaderText: defaultCustomization.colorHeaderText,
      colorBodyText: defaultCustomization.colorBodyText,
    });
    setConfirmResetColors(false);
  };

  const renderColorInput = (label: string, key: keyof CVCustomization, tooltip: string, showSwatches = false) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{label}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help text-[10px] text-slate-300">?</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs bg-slate-900 text-xs text-white">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={customization[key] as string}
          onChange={(e) => onUpdate({ [key]: e.target.value })}
          className="h-10 w-10 cursor-pointer rounded-md border border-slate-200 p-1 shadow-sm"
        />
        <Input
          value={customization[key] as string}
          onChange={(e) => onUpdate({ [key]: e.target.value })}
          className="h-10 flex-1 font-mono text-xs"
          maxLength={7}
        />
      </div>

      {showSwatches ? (
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => onUpdate({ [key]: color.value })}
              className={cn(
                'h-9 w-9 rounded-lg border border-slate-200 shadow-sm transition',
                customization[key] === color.value ? 'ring-2 ring-amber-400 ring-offset-2' : 'hover:scale-105'
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      ) : key === 'colorHeaderBg' ? (
        <div className="flex flex-wrap gap-2">
          {HEADER_BG_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() =>
                onUpdate({
                  colorHeaderBg: preset.value,
                  colorHeaderText: isColorDark(preset.value) ? '#FFFFFF' : '#0F172A',
                })
              }
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[10px] font-bold shadow-sm transition',
                customization.colorHeaderBg === preset.value ? 'ring-2 ring-amber-400 ring-offset-2' : 'hover:scale-105'
              )}
              style={{ backgroundColor: preset.value, color: isColorDark(preset.value) ? '#FFFFFF' : '#0F172A' }}
              title={preset.name}
            >
              Aa
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      data-print-hide
      className={cn(
        'relative flex-shrink-0 border-l border-slate-200 bg-[#fafafa] transition-all duration-300',
        // Al colapsar se conserva overflow visible: el botón de reapertura
        // vive dentro de esta caja y con overflow-hidden quedaba recortado
        // e invisible, dejando el panel cerrado sin forma de volver.
        collapsed ? 'w-0 overflow-visible' : ''
      )}
      style={collapsed ? undefined : { width: `${panelWidth}px` }}
    >
      <button
        onClick={toggleCollapsed}
        className={cn(
          'absolute z-20 flex h-14 w-7 -translate-y-1/2 items-center justify-center border border-slate-200 bg-white shadow-lg transition-all hover:bg-slate-50',
          collapsed ? '-left-7 top-1/2 rounded-r-lg border-l-0' : '-left-4 top-1/2 rounded-lg'
        )}
        aria-label={collapsed ? tr('Abrir panel de diseño') : tr('Cerrar panel de diseño')}
      >
        {collapsed ? <ChevronLeft className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </button>

      {collapsed ? null : (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">{tr('Panel de diseño')}</p>
              <h2 className="mt-1 text-sm font-semibold text-slate-800">{tr('Personaliza tu hoja de vida')}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset} className="text-slate-400 hover:text-slate-700">
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              {tr('Restablecer')}
            </Button>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-2">
            <Accordion
              type="single"
              collapsible
              value={openSection}
              onValueChange={handleSectionChange}
              className="space-y-1"
            >
              <AccordionItem ref={setSectionRef('templates')} value="templates" className="border-b border-slate-200">
                <AccordionTrigger className="py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 hover:no-underline">
                  {tr('Plantillas')}
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <div className="mb-3 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-600">{tr('Marketplace gratuito')}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {tr('Explora plantillas listas para aplicar a tu hoja de vida y cambia de diseño al instante.')}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {tr('¿A qué cargo aplicas?')}
                    </label>
                    <select
                      value={selectedRole ?? ''}
                      onChange={(event) => setSelectedRole((event.target.value || null) as RoleKey | null)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-300"
                    >
                      <option value="">{tr('Elige un área (opcional)')}</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.key} value={role.key}>
                          {role.emoji} {tr(role.label)}
                        </option>
                      ))}
                    </select>
                    {selectedRole ? (
                      <p className="mt-1.5 text-[11px] text-amber-600">
                        {tr('Mostrando primero las plantillas recomendadas para {role}.', { role: tr(ROLE_OPTIONS.find((r) => r.key === selectedRole)?.label ?? '') })}
                      </p>
                    ) : null}
                  </div>

                  <div className="mb-3 flex flex-wrap gap-2">
                    {([
                      { key: 'all' as TemplateFilterKey, label: 'Todas' },
                      { key: 'ats' as TemplateFilterKey, label: 'Filtro automático' },
                      { key: 'corporativo' as TemplateFilterKey, label: CATEGORY_LABELS.corporativo },
                      { key: 'moderno' as TemplateFilterKey, label: CATEGORY_LABELS.moderno },
                      { key: 'creativo' as TemplateFilterKey, label: CATEGORY_LABELS.creativo },
                      { key: 'sencillo' as TemplateFilterKey, label: CATEGORY_LABELS.sencillo },
                    ]).map((filterOption) => (
                      <button
                        key={filterOption.key}
                        type="button"
                        onClick={() => setActiveTemplateFilter(filterOption.key)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] transition',
                          activeTemplateFilter === filterOption.key
                            ? 'border-amber-300 bg-amber-50 text-amber-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        )}
                      >
                        {tr(filterOption.label)}
                      </button>
                    ))}
                  </div>

                  <div className="grid max-h-[720px] grid-cols-2 gap-3 overflow-y-auto pr-1">
                    {visibleTemplates.map((templateMeta) => {
                      const isActive = template === templateMeta.id;
                      return (
                        <button
                          key={templateMeta.id}
                          type="button"
                          onClick={() => applyTemplate(templateMeta.id)}
                          className={cn(
                            'relative rounded-2xl border bg-white p-2.5 text-left transition',
                            isActive ? 'border-2 border-amber-400 shadow-md shadow-amber-100' : 'border-slate-200 hover:border-slate-300'
                          )}
                        >
                          {templateMeta.badges?.length ? (
                            <div className="mb-2 flex flex-wrap gap-1">
                              {templateMeta.badges.slice(0, 3).map((badge) => (
                                <span
                                  key={`${templateMeta.id}-${badge}`}
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]',
                                    badge === 'Cute' && 'bg-pink-50 text-pink-600',
                                    badge === 'Editorial' && 'bg-orange-50 text-orange-600',
                                    badge === 'ATS' && 'bg-emerald-50 text-emerald-600',
                                    badge === 'Ligera' && 'bg-sky-50 text-sky-600',
                                    badge === tr('Clásica') && 'bg-slate-100 text-slate-600'
                                  )}
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <div className="overflow-hidden rounded-xl">
                            <TemplateMiniature templateId={templateMeta.id} data={cvData} />
                          </div>
                          <div className="mt-2.5">
                            <p className="text-xs font-semibold text-slate-800">{tr(templateMeta.name)}</p>
                            <p className="mt-1 text-[11px] leading-4 text-slate-400">{tr(templateMeta.description)}</p>
                            <div className="mt-2">
                              <span
                                className={cn(
                                  'inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em]',
                                  templateMeta.tone === 'ats' && 'bg-emerald-50 text-emerald-700',
                                  templateMeta.tone === 'light' && 'bg-sky-50 text-sky-700',
                                  templateMeta.tone === 'creative' && 'bg-rose-50 text-rose-700',
                                  templateMeta.tone === 'balanced' && 'bg-slate-100 text-slate-700',
                                  !templateMeta.tone && 'bg-slate-100 text-slate-700'
                                )}
                              >
                                {tr(templateMeta.tone ? TONE_COPY[templateMeta.tone] : 'Uso versatil')}
                              </span>
                            </div>
                            {templateMeta.useCase ? (
                              <p className="mt-2 text-[11px] leading-4 text-slate-600">{tr(templateMeta.useCase)}</p>
                            ) : null}
                          </div>
                          {isActive ? (
                            <>
                              <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-white shadow">
                                <Check className="h-3.5 w-3.5" />
                              </span>
                              <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
                                Aplicada
                              </span>
                            </>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem ref={setSectionRef('typography')} value="typography" className="border-b border-slate-200">
                <AccordionTrigger className="py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 hover:no-underline">
                  {tr('Tipografía')}
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{tr('Fuente')}</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help text-[10px] text-slate-300">?</span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-xs text-white">
                          <p>{tr('Cambia la tipografía de todo el CV')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {(() => {
                      const suggested = FONT_PRESETS[String(template) as keyof typeof FONT_PRESETS]?.[0];
                      return suggested && customization.fontBody !== suggested ? (
                        <button
                          type="button"
                          onClick={() => onUpdate({ fontBody: suggested })}
                          className="w-full rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-left transition hover:border-amber-300"
                        >
                          <span className="text-[11px] text-amber-700">
                            ✨ Sugerida para esta plantilla: <strong style={{ fontFamily: `'${suggested}', sans-serif` }}>{suggested}</strong>
                          </span>
                        </button>
                      ) : null;
                    })()}
                    <select
                      value={customization.fontBody}
                      onChange={(e) => onUpdate({ fontBody: e.target.value })}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    >
                      {FONTS.map((font) => (
                        <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {[
                    { key: 'fontSizeBase' as const, label: 'Texto base', min: 8, max: 14 },
                    { key: 'fontSizeHeading' as const, label: tr('Títulos'), min: 10, max: 18 },
                    { key: 'fontSizeName' as const, label: tr('Nombre'), min: 18, max: 36 },
                  ].map(({ key, label, min, max }) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{label}</Label>
                        <span className="text-[10px] font-mono text-slate-400">{customization[key]}px</span>
                      </div>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={1}
                        value={customization[key]}
                        onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                        className="h-1.5 w-full accent-amber-500"
                      />
                    </div>
                  ))}

                  <div className="flex gap-2">
                    {[
                      { key: 'fontWeightBody', value: 'bold', icon: Bold, resetValue: 'normal', label: 'Negrita' },
                      { key: 'fontStyleBody', value: 'italic', icon: Italic, resetValue: 'normal', label: 'Cursiva' },
                      { key: 'decorationHeading', value: 'underline', icon: Underline, resetValue: 'none', label: 'Subrayado' },
                      { key: 'transformHeading', value: 'uppercase', icon: CaseUpper, resetValue: 'none', label: tr('Mayúsculas') },
                    ].map(({ key, value, icon: Icon, resetValue, label }) => {
                      const isActive = customization[key as keyof CVCustomization] === value;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onUpdate({ [key]: isActive ? resetValue : value })}
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl border transition',
                            isActive ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                          )}
                          title={label}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem ref={setSectionRef('colors')} value="colors" className="border-b border-slate-200">
                <AccordionTrigger className="py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 hover:no-underline">
                  Colores
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-5">
                  {renderColorInput('Color de acento', 'colorAccent', tr('Afecta líneas, íconos y detalles decorativos'), true)}
                  {renderColorInput('Encabezado', 'colorHeaderBg', 'Cambia el fondo del bloque principal del encabezado')}
                  {renderColorInput('Texto encabezado', 'colorHeaderText', 'Define el contraste del texto sobre el encabezado')}
                  {renderColorInput('Texto cuerpo', 'colorBodyText', 'Controla la legibilidad del contenido principal')}

                  <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-600">{tr('Paletas listas')}</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500">
                      Un clic aplica los 4 colores con contraste garantizado.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {COLOR_PALETTES.map((palette) => {
                        const active =
                          customization.colorAccent === palette.colors[0] &&
                          customization.colorHeaderBg === palette.colors[1];
                        return (
                          <button
                            key={palette.name}
                            type="button"
                            onClick={() =>
                              onUpdate({
                                colorAccent: palette.colors[0],
                                colorHeaderBg: palette.colors[1],
                                colorHeaderText: palette.colors[2],
                                colorBodyText: palette.colors[3],
                              })
                            }
                            className={cn(
                              'rounded-xl border bg-white p-2 text-left transition',
                              active ? 'border-2 border-amber-400 shadow-md shadow-amber-100' : 'border-slate-200 hover:border-slate-300'
                            )}
                            title={palette.name}
                          >
                            <div className="mb-2 flex h-6 gap-1">
                              {palette.colors.map((color) => (
                                <span
                                  key={color}
                                  className="flex-1 rounded-md border border-white/60 shadow-sm"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                              {palette.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => (confirmResetColors ? resetColors() : setConfirmResetColors(true))}
                    className="px-0 text-xs text-slate-500 hover:text-slate-800"
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    {confirmResetColors ? tr('¿Seguro? Confirmar') : 'Restablecer colores'}
                  </Button>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem ref={setSectionRef('spacing')} value="spacing" className="border-b border-slate-200">
                <AccordionTrigger className="py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 hover:no-underline">
                  Espaciado
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{tr('Densidad')}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['compact', 'normal', 'spacious'] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => onUpdate({ spacing: value })}
                          className={cn(
                            'rounded-xl border px-2 py-2 text-[11px] font-semibold transition',
                            customization.spacing === value ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-500'
                          )}
                        >
                          {value === 'compact' ? 'Compacto' : value === 'normal' ? 'Normal' : 'Amplio'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{tr('Márgenes')}</Label>
                      <span className="text-[10px] font-mono text-slate-400">{customization.pagePadding}px</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={48}
                      step={2}
                      value={customization.pagePadding}
                      onChange={(e) => handleSliderChange('pagePadding', Number(e.target.value))}
                      className="h-1.5 w-full accent-amber-500"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem ref={setSectionRef('pagesize')} value="pagesize" className="border-b border-slate-200">
                <AccordionTrigger className="py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 hover:no-underline">
                  {tr('Tamaño de página')}
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-5">
                  {[
                    { value: 'letter' as PaperSize, label: tr('Carta') },
                    { value: 'legal' as PaperSize, label: 'Oficio' },
                    { value: 'a4' as PaperSize, label: 'A4' },
                    { value: 'continuous' as PaperSize, label: 'Continuo PDF' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onPaperSizeChange(option.value)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl border px-3 py-3 text-sm transition',
                        paperSize === option.value ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600'
                      )}
                    >
                      <span>{option.label}</span>
                      <FileText className="h-4 w-4" />
                    </button>
                  ))}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem ref={setSectionRef('sections')} value="sections" className="border-b border-slate-200">
                <AccordionTrigger className="py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 hover:no-underline">
                  Secciones
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-5">
                  {customization.sectionsOrder.map((sectionKey) => {
                    const visible = customization.sectionsVisible[sectionKey as keyof typeof customization.sectionsVisible];
                    return (
                      <div key={sectionKey} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700">{tr(SECTION_LABELS[sectionKey] || sectionKey)}</p>
                            <p className="text-[11px] text-slate-400">{tr('Muestra u oculta esta sección en tu hoja de vida.')}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...customization.sectionsVisible };
                              next[sectionKey as keyof typeof next] = !visible;
                              onUpdate({ sectionsVisible: next });
                            }}
                            className={cn(
                              'rounded-lg border p-2 transition',
                              visible ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-slate-200 bg-slate-50 text-slate-400'
                            )}
                          >
                            {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem ref={setSectionRef('watermark')} value="watermark" className="border-b-0">
                <AccordionTrigger className="py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 hover:no-underline">
                  Marca de agua
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{tr('Mostrar marca Talentia')}</p>
                      <p className="text-[11px] text-slate-400">{tr('Se ubica al final del documento.')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdate({ showWatermark: !customization.showWatermark })}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        customization.showWatermark ? 'bg-amber-400' : 'bg-slate-300'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                          customization.showWatermark ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
}
