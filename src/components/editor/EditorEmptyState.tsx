'use client';

import { FileText, MoveLeft, Upload, ClipboardPaste } from 'lucide-react';
import { useUiText } from '@/lib/i18n/uiText';

/**
 * Estado vacío de la vista previa. Además de señalar el panel de edición,
 * ofrece accesos directos: importar un CV existente o escribir libremente.
 * Ambos botones abren el diálogo de importar vía el evento global
 * 'open-import-dialog' (que ImportCVDialog escucha).
 */
export default function EditorEmptyState() {
  const tr = useUiText();
  const openImport = () => {
    window.dispatchEvent(new CustomEvent('open-import-dialog'));
  };

  return (
    <div className="relative flex min-h-[760px] items-center justify-center">
      <div className="absolute inset-8 rounded-[32px] border-2 border-dashed border-slate-300 bg-slate-100/70" />
      <div className="relative z-10 flex max-w-lg flex-col items-center px-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-lg shadow-slate-300/40">
          <FileText className="h-12 w-12 text-amber-500" />
        </div>
        <h3 className="text-2xl font-semibold text-slate-800">{tr('Crea tu hoja de vida en minutos')}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {tr('Sube tu CV actual (aunque sea una foto o un PDF escaneado) y la IA lo llena por ti. ¿No tienes CV aún? Escríbenos quién eres y lo armamos contigo. También puedes llenar el panel izquierdo paso a paso.')}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={openImport}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            {tr('Subir mi CV o una foto')}
          </button>
          <button
            type="button"
            onClick={openImport}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <ClipboardPaste className="h-4 w-4" />
            {tr('Pegar o escribir mi texto')}
          </button>
        </div>

        <div className="mt-10 flex items-center gap-3 text-amber-500">
          <MoveLeft className="h-8 w-8 animate-[arrowNudge_1.6s_ease-in-out_infinite]" />
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            {tr('Panel de edición')}
          </span>
        </div>
      </div>
    </div>
  );
}
