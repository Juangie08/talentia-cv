'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  FileSearch,
  Loader2,
  Plus,
  ScanSearch,
  Sparkles,
  Target,
  Wand2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CVData } from '@/lib/types';
import { analyzeJobMatch, getQualityReport, JobMatchResult, QualityCheck } from '@/lib/cv-quality';
import { notifyAiUsed } from '@/components/editor/AiUsageBadge';
import { fetchWithQuotaHandling, isQuotaError, quotaMessageFromResponse } from '@/lib/quotaClient';
import { useI18n } from '@/lib/i18n/LocaleProvider';
import { useUiText } from '@/lib/i18n/uiText';

interface AdaptSuggestion {
  summary: string;
  skillsAdd: string[];
  experienceRewrites: Array<{ id: string; achievements: string[] }>;
  /** Cifras que la IA añadió sin respaldo en el CV o en la oferta. */
  warnings?: string[];
}

const STATUS_ICON: Record<QualityCheck['status'], typeof CheckCircle2> = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
};

const STATUS_STYLE: Record<QualityCheck['status'], string> = {
  ok: 'text-emerald-600',
  warn: 'text-amber-500',
  fail: 'text-red-500',
};

interface Props {
  cvData: CVData;
  onApply: (partial: Partial<CVData>) => void;
}

/**
 * Verificador de hoja de vida: checklist de buenas prácticas (contacto sin
 * sesgos, perfil de 3-5 líneas, logros medibles, orden cronológico, etc.) y
 * comparación contra una oferta laboral para palabras clave ATS.
 */
export default function QualityCoachDialog({ cvData, onApply }: Props) {
  const tr = useUiText();
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [offer, setOffer] = useState(cvData.target?.offerText || '');
  const [analysis, setAnalysis] = useState<JobMatchResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [suggestion, setSuggestion] = useState<AdaptSuggestion | null>(null);
  const [applySummary, setApplySummary] = useState(true);
  const [applySkills, setApplySkills] = useState(true);
  const [applyExp, setApplyExp] = useState<Record<string, boolean>>({});

  const report = useMemo(() => getQualityReport(cvData), [cvData]);
  const okCount = report.checks.filter((check) => check.status === 'ok').length;

  const handleAnalyze = () => {
    if (!offer.trim()) return;
    setIsAnalyzing(true);
    // Pequeño aplazamiento para que el botón muestre estado sin bloquear el render
    setTimeout(() => {
      setAnalysis(analyzeJobMatch(cvData, offer));
      setIsAnalyzing(false);
    }, 60);
  };

  const handleAdapt = async () => {
    if (!offer.trim()) return;
    setIsAdapting(true);
    setSuggestion(null);
    try {
      const response = await fetchWithQuotaHandling('/api/ai/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv: cvData, offer }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || tr('La IA no pudo adaptar tu hoja de vida.'));
      }
      const result: AdaptSuggestion = payload.result;
      setSuggestion(result);
      setApplySummary(Boolean(result.summary));
      setApplySkills(result.skillsAdd.length > 0);
      setApplyExp(Object.fromEntries(result.experienceRewrites.map((r) => [r.id, true])));
      notifyAiUsed();
    } catch (error) {
      if (isQuotaError(error)) {
        toast.error(quotaMessageFromResponse((error as { body?: unknown }).body, locale), { duration: 8000 });
      } else {
        toast.error(error instanceof Error ? error.message : 'Error al adaptar con IA');
      }
    } finally {
      setIsAdapting(false);
    }
  };

  /** Añade una palabra clave faltante a habilidades (acción explícita del usuario). */
  const addSkill = (word: string) => {
    const exists = cvData.skills.some((skill) => skill.toLowerCase() === word.toLowerCase());
    if (exists) return;
    onApply({ skills: [...cvData.skills, word] });
    toast.success(`"${word}" añadida a tus habilidades`);
  };

  const handleApplyAdaptation = () => {
    if (!suggestion) return;
    const partial: Partial<CVData> = { target: { ...(cvData.target || {}), offerText: offer } };
    if (applySummary && suggestion.summary) partial.summary = suggestion.summary;
    if (applySkills && suggestion.skillsAdd.length > 0) {
      const existing = new Set(cvData.skills.map((s) => s.toLowerCase()));
      partial.skills = [...cvData.skills, ...suggestion.skillsAdd.filter((s) => !existing.has(s.toLowerCase()))];
    }
    if (suggestion.experienceRewrites.some((r) => applyExp[r.id])) {
      partial.experience = cvData.experience.map((exp) => {
        const rewrite = suggestion.experienceRewrites.find((r) => r.id === exp.id);
        return rewrite && applyExp[exp.id] ? { ...exp, achievements: rewrite.achievements } : exp;
      });
    }
    onApply(partial);
    setSuggestion(null);
    toast.success(tr('Cambios aplicados. Revisa antes de exportar.'));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="rounded-full border border-white/10 bg-white/5 px-4 text-white/90 shadow-none hover:bg-white/10 hover:text-white"
        >
          <ScanSearch className="h-4 w-4 text-emerald-400" />
          <span className="ml-2 hidden lg:inline">{tr('Validar CV')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <BadgeCheck className="h-5 w-5 text-emerald-500" />
            {tr('Verificación de calidad y ATS')}
          </DialogTitle>
          <DialogDescription className="text-left">
            {tr('Revisamos tu hoja de vida contra las mejores prácticas de empleabilidad y la comparamos con la oferta que te interesa.')}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="checklist">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checklist" className="gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5" /> Calidad
            </TabsTrigger>
            <TabsTrigger value="offer" className="gap-1.5">
              <Target className="h-3.5 w-3.5" /> Comparar con oferta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="mt-4 space-y-3">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke={report.score >= 80 ? '#10b981' : report.score >= 55 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(report.score / 100) * 97.4} 97.4`}
                  />
                </svg>
                <span className="absolute text-xs font-black text-slate-700">{report.score}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {okCount} de {report.checks.length} criterios optimos
                </p>
                <p className="text-[11px] leading-snug text-slate-500">
                  {report.ready
                    ? tr('Tu hoja de vida cumple los esenciales. Ajusta los avisos amarillos para destacar aun mas.')
                    : 'Corrige los puntos en rojo antes de postularte: son los que mas pesan en filtros y reclutadores.'}
                </p>
              </div>
            </div>

            <ul className="space-y-2">
              {report.checks.map((check) => {
                const Icon = STATUS_ICON[check.status];
                return (
                  <li key={check.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white px-3.5 py-3">
                    <Icon className={`mt-0.5 h-4.5 w-4.5 h-[18px] w-[18px] flex-shrink-0 ${STATUS_STYLE[check.status]}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{check.label}</p>
                      <p className="text-xs leading-snug text-slate-500">{check.detail}</p>
                      {check.tip ? (
                        <p className="mt-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] leading-snug text-amber-900">
                          <Sparkles className="mr-1 inline h-3 w-3 -translate-y-px" />
                          {check.tip}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </TabsContent>

          <TabsContent value="offer" className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs leading-snug text-slate-600">
              Pega la oferta de empleo que te interesa. Comparamos sus palabras clave con tu hoja de vida: mientras mas coincidan, mas alto pasas los filtros ATS. Si una palabra clave no aplica a tu experiencia real, no la inventes: aprendela o demuestrala en entrevista.
            </div>
            <Textarea
              value={offer}
              onChange={(event) => setOffer(event.target.value)}
              placeholder={tr('Ej: Se busca desarrollador frontend con 3 años de experiencia en React, TypeScript, trabajo con APIs REST, metodologías ágiles Scrum, Git y pruebas unitarias...')}
              rows={6}
              className="resize-none rounded-2xl text-sm"
            />
            <Button
              onClick={handleAnalyze}
              disabled={!offer.trim() || isAnalyzing}
              className="w-full rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              <span className="ml-2">{tr('Analizar coincidencia')}</span>
            </Button>

            {analysis ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  <span className={`text-2xl font-black ${analysis.score >= 70 ? 'text-emerald-600' : analysis.score >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                    {analysis.score}%
                  </span>
                  <p className="text-xs leading-snug text-slate-600">
                    {analysis.score >= 70
                      ? tr('Excelente alineación: tu CV habla el idioma de esta oferta.')
                      : analysis.score >= 40
                        ? tr('Alineación parcial: añade las palabras clave que apliquen para subir el puntaje ATS.')
                        : tr('Baja coincidencia: tu hoja de vida apenas menciona lo que pide la oferta.')}
                  </p>
                </div>

                {analysis.matched.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">Coinciden ({analysis.matched.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.matched.map((word) => (
                        <span key={word} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {analysis.missing.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-500">No aparecen en tu CV ({analysis.missing.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missing.map((word) => {
                        const alreadySkill = cvData.skills.some((skill) => skill.toLowerCase() === word.toLowerCase());
                        return (
                          <button
                            key={word}
                            type="button"
                            onClick={() => addSkill(word)}
                            disabled={alreadySkill}
                            title={alreadySkill ? tr('Ya está en tus habilidades') : `Añadir "${word}" a tus habilidades`}
                            className="group inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-default disabled:opacity-60"
                          >
                            {word}
                            <Plus className={`h-3 w-3 ${alreadySkill ? 'opacity-0' : 'opacity-40 group-hover:opacity-100'}`} />
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] leading-snug text-slate-500">
                      Un clic en una palabra clave la añade a tus habilidades. Incluye solo las que puedas defender en entrevista: la coincidencia exacta ayuda a pasar el filtro automático.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <Button
              onClick={handleAdapt}
              disabled={!offer.trim() || isAdapting}
              variant="outline"
              className="w-full rounded-full border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
            >
              {isAdapting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              <span className="ml-2">{isAdapting ? tr('La IA está reescribiendo...') : 'Adaptar mi HDV con IA'}</span>
            </Button>

            {suggestion ? (
              <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                <p className="text-xs font-semibold text-violet-900">
                  Revisa los cambios sugeridos y marca solo los que quieras aplicar:
                </p>

                {Array.isArray(suggestion.warnings) && suggestion.warnings.length > 0 ? (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">
                        Cifras sin respaldo
                      </p>
                      {suggestion.warnings.map((warning) => (
                        <p key={warning} className="text-[11px] leading-snug text-amber-900">
                          {warning}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {suggestion.summary ? (
                  <label className="flex items-start gap-3 rounded-xl bg-white p-3">
                    <Checkbox checked={applySummary} onCheckedChange={(v) => setApplySummary(v === true)} className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">{tr('Perfil profesional')}</span>
                      <span className="mt-1 block text-xs text-slate-400 line-through decoration-slate-300">{cvData.summary || tr('(vacío)')}</span>
                      <span className="mt-1 block text-xs font-medium text-slate-800">{suggestion.summary}</span>
                    </span>
                  </label>
                ) : null}

                {suggestion.skillsAdd.length > 0 ? (
                  <label className="flex items-start gap-3 rounded-xl bg-white p-3">
                    <Checkbox checked={applySkills} onCheckedChange={(v) => setApplySkills(v === true)} className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">{tr('Añadir habilidades')}</span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {suggestion.skillsAdd.map((skill) => (
                          <span key={skill} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">+ {skill}</span>
                        ))}
                      </span>
                    </span>
                  </label>
                ) : null}

                {suggestion.experienceRewrites.map((rewrite) => {
                  const exp = cvData.experience.find((e) => e.id === rewrite.id);
                  if (!exp) return null;
                  return (
                    <label key={rewrite.id} className="flex items-start gap-3 rounded-xl bg-white p-3">
                      <Checkbox
                        checked={applyExp[rewrite.id] ?? false}
                        onCheckedChange={(v) => setApplyExp((prev) => ({ ...prev, [rewrite.id]: v === true }))}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">{exp.position} · {exp.company}</span>
                        <span className="mt-1 block text-xs text-slate-800">{rewrite.achievements.map((a) => `• ${a}`).join('\n')}</span>
                      </span>
                    </label>
                  );
                })}

                <Button onClick={handleApplyAdaptation} className="w-full rounded-full bg-violet-600 text-white hover:bg-violet-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="ml-2">{tr('Aplicar cambios seleccionados')}</span>
                </Button>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
