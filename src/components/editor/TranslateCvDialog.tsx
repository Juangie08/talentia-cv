'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Languages, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CVData } from '@/lib/types';
import { useI18n } from '@/lib/i18n/LocaleProvider';
import { notifyAiUsed } from '@/components/editor/AiUsageBadge';
import { fetchWithQuotaHandling, isQuotaError, quotaMessageFromResponse } from '@/lib/quotaClient';
import { useUiText } from '@/lib/i18n/uiText';
import { sectionLabels } from '@/lib/sectionLabels';

interface TranslationPayload {
  summary: string;
  skills: string[];
  experience: Array<{ id: string; position: string; achievements: string[] }>;
  education: Array<{ id: string; degree: string; field: string }>;
  warnings?: string[];
}

interface Props {
  cvData: CVData;
  onApply: (partial: Partial<CVData>) => void;
}

/**
 * Traduce el contenido de la hoja de vida al otro idioma del producto.
 *
 * Cambia solo la redacción: cifras, fechas, empresas e instituciones se
 * conservan, y el resultado se previsualiza antes de aplicarlo, así nadie
 * exporta un CV traducido sin haberlo leído.
 */
export default function TranslateCvDialog({ cvData, onApply }: Props) {
  const tr = useUiText();
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationPayload | null>(null);

  const target: 'es' | 'en' = locale === 'es' ? 'en' : 'es';
  const hasContent = Boolean(cvData.summary?.trim()) || cvData.experience.length > 0;

  // El idioma destino se nombra en el idioma activo: en español "inglés",
  // en inglés "English". Así ninguna frase mezcla los dos idiomas.
  const langName = (code: 'es' | 'en', capitalize = false) => {
    const names =
      locale === 'es'
        ? { es: 'español', en: 'inglés' }
        : { es: 'Spanish', en: 'English' };
    const name = names[code];
    return capitalize ? name.charAt(0).toUpperCase() + name.slice(1) : name;
  };

  const targetLang = langName(target);
  const copy = {
    trigger: tr('Traducir'),
    title: tr('Traducir la hoja de vida'),
    desc: tr(
      'Pasa el contenido a {lang} sin tocar el diseño. Los datos duros (cifras, fechas, empresas e instituciones) se conservan tal cual.',
      { lang: targetLang },
    ),
    action: tr('Traducir a {lang}', { lang: targetLang }),
    working: tr('La IA está traduciendo…'),
    apply: tr('Aplicar traducción'),
    preview: tr('Así quedaría'),
    empty: tr('Escribe tu perfil o añade experiencia antes de traducir.'),
    review: tr('Revisa el resultado antes de aplicarlo: se reemplaza el texto original de estas secciones.'),
    done: tr('Traducción aplicada. Revisa la vista previa.'),
  };
  const sectionSummaryLabel = sectionLabels(locale).summaryShort;

  const handleTranslate = async () => {
    setIsTranslating(true);
    setResult(null);
    try {
      const response = await fetchWithQuotaHandling('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv: cvData, target }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || tr('No se pudo traducir la hoja de vida.'));
      }
      setResult(payload.result as TranslationPayload);
      notifyAiUsed();
    } catch (error) {
      if (isQuotaError(error)) {
        toast.error(quotaMessageFromResponse((error as { body?: unknown }).body, locale), { duration: 8000 });
      } else {
        toast.error(error instanceof Error ? error.message : tr('Error al traducir'));
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    const partial: Partial<CVData> = {};

    if (result.summary.trim()) partial.summary = result.summary;

    if (result.skills.length > 0) {
      const existing = new Set(result.skills.map((skill) => skill.toLowerCase()));
      const untouched = cvData.skills.filter((skill) => !existing.has(skill.toLowerCase()));
      partial.skills = [...result.skills, ...untouched];
    }

    if (result.experience.length > 0) {
      partial.experience = cvData.experience.map((exp) => {
        const translated = result.experience.find((item) => item.id === exp.id);
        if (!translated) return exp;
        return {
          ...exp,
          position: translated.position || exp.position,
          achievements: translated.achievements.length > 0 ? translated.achievements : exp.achievements,
        };
      });
    }

    if (result.education.length > 0) {
      partial.education = cvData.education.map((edu) => {
        const translated = result.education.find((item) => item.id === edu.id);
        if (!translated) return edu;
        return {
          ...edu,
          degree: translated.degree || edu.degree,
          field: translated.field || edu.field,
        };
      });
    }

    onApply(partial);
    setResult(null);
    toast.success(copy.done);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-full border border-white/10 bg-white/5 px-4 text-white/90 shadow-none hover:bg-white/10 hover:text-white"
        >
          <Languages className="h-4 w-4 text-sky-300" />
          <span className="ml-2 hidden lg:inline">{copy.trigger}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <Languages className="h-5 w-5 text-sky-500" />
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-left">{copy.desc}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
            {langName(locale, true)}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-700">
            {langName(target, true)}
          </span>
        </div>

        <Button
          onClick={handleTranslate}
          disabled={!hasContent || isTranslating}
          className="w-full rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-500 hover:to-blue-500"
        >
          {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
          <span className="ml-2">{isTranslating ? copy.working : copy.action}</span>
        </Button>

        {!hasContent ? (
          <p className="text-center text-[11px] leading-snug text-slate-500">{copy.empty}</p>
        ) : null}

        {result ? (
          <div className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">{copy.preview}</p>

            {result.summary ? (
              <div className="rounded-xl bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {sectionSummaryLabel}
                </p>
                <p className="mt-1 text-xs leading-snug text-slate-800">{result.summary}</p>
              </div>
            ) : null}

            {result.experience.map((exp) => {
              const original = cvData.experience.find((item) => item.id === exp.id);
              if (!original) return null;
              return (
                <div key={exp.id} className="rounded-xl bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {original.position} → {exp.position}
                  </p>
                  {exp.achievements.map((achievement) => (
                    <p key={achievement} className="mt-1 text-xs leading-snug text-slate-800">
                      • {achievement}
                    </p>
                  ))}
                </div>
              );
            })}

            {Array.isArray(result.warnings) && result.warnings.length > 0 ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <div className="space-y-1">
                  {result.warnings.map((warning) => (
                    <p key={warning} className="text-[11px] leading-snug text-amber-900">
                      {warning}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="text-[11px] leading-snug text-slate-500">{copy.review}</p>

            <Button onClick={handleApply} className="w-full rounded-full bg-sky-600 text-white hover:bg-sky-700">
              <CheckCircle2 className="h-4 w-4" />
              <span className="ml-2">{copy.apply}</span>
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
