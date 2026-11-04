'use client';

import { useEffect, useRef, useState } from 'react';
import { FileUp, Loader2, Sparkles, Wand2, AlertTriangle, ClipboardPaste, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CVData } from '@/lib/types';
import { importCVFromFile, importCVFromText, ImportResult } from '@/lib/importCV';
import { notifyAiUsed } from '@/components/editor/AiUsageBadge';
import { isQuotaError, quotaMessageFromResponse } from '@/lib/quotaClient';
import { useI18n } from '@/lib/i18n/LocaleProvider';
import { useUiText } from '@/lib/i18n/uiText';

interface Props {
  onImport: (data: CVData) => void;
  /** true si el CV actual ya tiene datos (para advertir del reemplazo). */
  hasExistingData: boolean;
}

/**
 * Importa una hoja de vida dentro del editor: subiendo un archivo (PDF, Word,
 * imagen o escaneo) o escribiendo tu historia de corrido. La IA extrae los
 * datos y muestra una vista previa antes de reemplazar el contenido actual.
 */
export default function ImportCVDialog({ onImport, hasExistingData }: Props) {
  const tr = useUiText();
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [freeText, setFreeText] = useState('');
  const [justPasted, setJustPasted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Permite abrir el diálogo desde cualquier parte de la app (p. ej. el
  // estado vacío de la vista previa) mediante el evento 'open-import-dialog'.
  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener('open-import-dialog', openHandler);
    return () => window.removeEventListener('open-import-dialog', openHandler);
  }, []);

  const reset = () => {
    setIsProcessing(false);
    setError('');
    setResult(null);
    setFreeText('');
    setJustPasted(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setError('');
    setResult(null);
    try {
      const imported = await importCVFromFile(file);
      setResult(imported);
      if (imported.source !== 'regex') notifyAiUsed();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo leer el archivo.';
      setError(isQuotaError(err)
        ? quotaMessageFromResponse((err as { body?: unknown }).body, locale)
        : message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFreeText = async () => {
    setIsProcessing(true);
    setError('');
    setResult(null);
    try {
      const imported = await importCVFromText(freeText);
      setResult(imported);
      if (imported.source !== 'regex') notifyAiUsed();
    } catch (err) {
      const message = err instanceof Error ? err.message : tr('No se pudo procesar tu texto.');
      setError(isQuotaError(err)
        ? quotaMessageFromResponse((err as { body?: unknown }).body, locale)
        : message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    onImport(result.data);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>        <DialogTrigger asChild>
          <Button
            size="sm"
            className="rounded-full border border-white/10 bg-white/5 px-4 text-white/90 shadow-none hover:bg-white/10 hover:text-white"
          >
            <FileUp className="h-4 w-4 text-blue-400" />
            <span className="ml-2 hidden lg:inline">{tr('Importar / Pegar')}</span>
          </Button>
        </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <Wand2 className="h-5 w-5 text-blue-500" />
            {tr('Importar mi hoja de vida')}
          </DialogTitle>
          <DialogDescription className="text-left">
            Sube tu CV en PDF, Word o imagen — aunque sea un escaneo o una foto — o cuéntanos quién eres con tus
            propias palabras. La IA ordena tus datos por ti y podrás revisarlos antes de continuar.
          </DialogDescription>
        </DialogHeader>

        {hasExistingData && !result && !isProcessing ? (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-snug text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            {tr('Ya tienes una hoja de vida en edición. Al importar, la reemplazaremos (puedes guardarla antes desde «Mis hojas de vida»).')}
          </div>
        ) : null}

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 px-6 py-14 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-sm font-semibold text-slate-700">{tr('La IA está leyendo tu hoja de vida...')}</p>
            <p className="mt-1 text-xs text-slate-400">{tr('Si es un escaneo o imagen puede tardar un poco más.')}</p>
          </div>
        ) : (
          <Tabs defaultValue="file">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="gap-1.5">
                <ScanText className="h-4 w-4" />
                Subir archivo
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-1.5">
                <ClipboardPaste className="h-4 w-4" />
                Pegar o escribir
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4">
              {!result ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg shadow-blue-900/20">
                    <FileUp className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{tr('Haz clic para elegir tu archivo')}</p>
                  <p className="mt-1 text-xs text-slate-400">{tr('PDF, DOCX, TXT o imagen (JPG/PNG) · hasta 5 MB')}</p>
                  <p className="mt-3 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                    {tr('¿Tu PDF es un escaneo o una foto? También lo leemos con IA de visión.')}
                  </p>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              {!result ? (
                <div className="space-y-3">
                  <p className="text-xs leading-snug text-slate-500">
                    Pega aquí tu hoja de vida completa (Ctrl+V), o escribe con tus palabras quién eres, tu experiencia y
                    qué buscas. La IA lo organiza en el formulario por ti.
                  </p>
                  <Textarea
                    value={freeText}
                    onChange={(event) => setFreeText(event.target.value)}
                    onPaste={() => setJustPasted(true)}
                    placeholder={'Pega tu CV aquí, o escribe de corrido. Ejemplo: Soy Andrea Gómez, técnica en contabilidad con 3 años de experiencia en el Banco de Bogotá. Estudié contaduría... Manejo Excel... Hablo inglés intermedio. Busco trabajo en área financiera.'}
                    rows={9}
                    className="resize-none rounded-2xl border-slate-200 text-sm"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">{freeText.trim().length} caracteres · mínimo 40</p>
                    <Button
                      onClick={handleFreeText}
                      disabled={freeText.trim().length < 40}
                      className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      {freeText.trim().length > 600 && justPasted ? tr('Importar texto pegado') : 'Generar con IA'}
                    </Button>
                  </div>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        )}

        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-medium text-emerald-900">
                {result.source === 'vision'
                  ? tr('La IA leyó tu imagen o escaneo y extrajo estos datos. Revísalos antes de continuar.')
                  : result.source === 'ai'
                    ? tr('La IA extrajo estos datos. Revísalos antes de continuar.')
                    : tr('Reconocimos lo básico automáticamente (sin IA). Revísalos y completa lo que falte antes de continuar.')}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{tr('Se llenó')}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {result.found.length > 0 ? result.found.join(' · ') : 'Casi nada — quizá el archivo es una imagen'}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {result.data.personalInfo.fullName || tr('Sin nombre')}
                {result.data.personalInfo.title ? ` — ${result.data.personalInfo.title}` : ''}
              </p>
            </div>
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFile}
        />

        <DialogFooter className="gap-2 sm:gap-2">
          {result ? (
            <>
              <Button variant="outline" onClick={reset} className="rounded-full">
                {tr('Empezar de nuevo')}
              </Button>
              <Button onClick={handleConfirm} className="rounded-full bg-blue-600 text-white hover:bg-blue-700">
                {tr('Usar estos datos')}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
              {tr('Cancelar')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
