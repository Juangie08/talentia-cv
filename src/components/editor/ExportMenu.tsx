'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ClipboardCopy,
  Download,
  FileDown,
  FileText,
  LayoutPanelLeft,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUiText } from '@/lib/i18n/uiText';

interface ExportMenuProps {
  onPrintPDF: () => void;
  onExportStyledPDF: () => void;
  onExportATSPDF: () => void;
  onExportWord: () => void;
  onCopyText: () => void;
  isExportingPDF: boolean;
  isExportingWord: boolean;
}

/**
 * Botón dividido de exportación: la acción principal descarga el PDF IGUAL
 * a la vista previa (plantilla y ajustes tal cual se ven); el chevron abre
 * el menú con las demás opciones (diseños fijos vectoriales, Word, texto).
 */
export default function ExportMenu({
  onPrintPDF,
  onExportStyledPDF,
  onExportATSPDF,
  onExportWord,
  onCopyText,
  isExportingPDF,
  isExportingWord,
}: ExportMenuProps) {
  const tr = useUiText();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const select = (action: () => void) => {
    setOpen(false);
    action();
  };

  const busy = isExportingPDF || isExportingWord;

  const items: Array<{
    key: string;
    label: string;
    description: string;
    icon: typeof FileText;
    action: () => void;
    disabled: boolean;
    recommended?: boolean;
    badge?: string;
    badgeTone?: 'ok' | 'warn';
  }> = [
    {
      key: 'styled',
      label: 'PDF moderno',
      description: tr('Diseño fijo de Talentia con barra de color Y texto seleccionable. No replica la plantilla elegida.'),
      icon: LayoutPanelLeft,
      action: onExportStyledPDF,
      disabled: busy,
      recommended: true,
    },
    {
      key: 'ats',
      label: tr('PDF clásico (texto puro)'),
      description: tr('Una columna, máxima compatibilidad con filtros ATS antiguos.'),
      icon: FileText,
      action: onExportATSPDF,
      disabled: busy,
      badge: 'ATS',
      badgeTone: 'ok',
    },
    {
      key: 'word',
      label: 'Word (.docx)',
      description: tr('Documento editable con tu color y fuente, texto real y enlaces.'),
      icon: FileDown,
      action: onExportWord,
      disabled: busy,
    },
    {
      key: 'copy',
      label: tr('Copiar como texto'),
      description: 'Ideal para pegar en formularios de empleo o chats de IA.',
      icon: ClipboardCopy,
      action: onCopyText,
      disabled: busy,
    },
  ];

  return (
    <div ref={containerRef} className="relative flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            onClick={() => select(onPrintPDF)}
            disabled={isExportingPDF}
            className="h-9 rounded-l-full rounded-r-none bg-[#dc2626] pl-3 pr-2 text-white hover:bg-[#b91c1c]"
            title={tr('Descargar PDF igual a la vista previa (texto seleccionable)')}
          >
            {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="ml-2 hidden text-sm font-semibold md:inline">{tr('Descargar PDF')}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 text-xs text-white">
          <p>{tr('PDF igual a tu diseño, con texto seleccionable (recomendado)')}</p>
        </TooltipContent>
      </Tooltip>

      <Button
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-9 rounded-l-none rounded-r-full border-l border-white/20 bg-[#dc2626] px-2 text-white hover:bg-[#b91c1c]"
        title={tr('Más opciones de exportación')}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-11 z-[60] w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-black/20"
        >
          <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {tr('Exportar hoja de vida')}
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => select(item.action)}
                disabled={item.disabled}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                    {item.recommended ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                        Recomendado
                      </span>
                    ) : null}
                    {item.badge && !item.recommended ? (
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        item.badgeTone === 'warn'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{item.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
