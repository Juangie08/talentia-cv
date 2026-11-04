'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  Download,
  FileText,
  Gauge,
  Loader2,
  MessageSquareQuote,
  PenLine,
  Plus,
  ShieldAlert,
  Sparkles,
  Target,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CVData } from '@/lib/types';
import { analyzeVacancy, JobAnalysis } from '@/lib/jobMatch';
import { useI18n } from '@/lib/i18n/LocaleProvider';
import { notifyAiUsed } from '@/components/editor/AiUsageBadge';
import { fetchWithQuotaHandling, isQuotaError, quotaMessageFromResponse } from '@/lib/quotaClient';

type Tone = 'conservador' | 'equilibrado' | 'agresivo';

interface SkillSuggestion {
  name: string;
  priority: 'must' | 'nice';
  why: string;
}

interface TailorResult {
  headlines: string[];
  headline: string;
  summaries: string[];
  summary: string;
  skillsAdd: SkillSuggestion[];
  achievementRewrites: Array<{ id: string; achievements: string[] }>;
  gapAdvice: Array<{ term: string; advice: string }>;
  companyAngle: string;
  risks: string[];
}

interface CoverLetterResult {
  subject: string;
  body: string;
  linkedinHeadline: string;
  linkedinSummary: string;
  followUp: string;
}

interface InterviewQuestion {
  question: string;
  why: string;
  starHint: string;
  keywords: string[];
}

interface InterviewResult {
  questions: InterviewQuestion[];
  questionsToAsk: string[];
  closingTip: string;
}

interface Props {
  cvData: CVData;
  onApply: (partial: Partial<CVData>) => void;
}

const MIN_OFFER = 40;

const COPY = {
  es: {
    trigger: 'Modo vacante',
    title: 'Modo vacante',
    desc: 'Personaliza tu hoja de vida para un cargo y una empresa concretos: diagnóstico ATS, reescritura honesta, carta y entrevista.',
    tabs: { brief: 'Vacante', match: 'Diagnóstico', tailor: 'Personalizar', letter: 'Carta', interview: 'Entrevista' },
    role: 'Cargo al que aplicas',
    company: 'Empresa',
    offer: 'Texto del anuncio',
    offerPlaceholder: 'Pega aquí la oferta completa: cargo, requisitos, funciones y lo que ofrece la empresa.',
    tone: 'Tono de la reescritura',
    tones: { conservador: 'Conservador', equilibrado: 'Equilibrado', agresivo: 'Directo' },
    toneHint: 'Conservador reformula sin exagerar; directo pone el logro más fuerte primero. Ninguno inventa datos.',
    analyze: 'Ver mi diagnóstico',
    diagnosisLive: 'El diagnóstico se calcula al instante, sin gastar créditos.',
    emptyMatch: 'Pega el anuncio para ver tu coincidencia, tus huecos y cómo lo lee un ATS.',
    score: 'Coincidencia',
    summaryLabel: 'Lectura rápida',
    breakdown: 'Cómo se compone el puntaje',
    evidence: 'Con evidencia en tu experiencia',
    listed: 'Solo en tu lista de habilidades',
    missing: 'No aparece en tu CV',
    addSkill: 'Añadir a habilidades',
    gaps: 'Huecos que el anuncio exige',
    ats: 'Cómo lo lee un ATS',
    over: 'Estás por encima del rango recomendado (75–90). Un CV sobre-optimizado se siente falso: deja solo lo que puedas defender en entrevista.',
    years: 'Experiencia pedida',
    yearsMine: 'Tu CV muestra',
    titleMatch: 'Título del anuncio',
    tailorCta: 'Personalizar a fondo con IA',
    tailorWorking: 'La IA está reescribiendo tu hoja de vida…',
    tailorEmpty: 'Completa la vacante y genera el diagnóstico: después la IA reescribe con ese contexto.',
    headline: 'Titular profesional',
    summary: 'Perfil profesional',
    skills: 'Habilidades a añadir',
    rewrites: 'Logros reescritos',
    angle: 'Cómo posicionarte para esta empresa',
    risks: 'Objeciones que puedes esperar',
    gapsAdvice: 'Qué hacer con cada hueco',
    warnings: 'Cifras sin respaldo',
    placeholders: 'Los marcadores [X] son cifras que debes completar con tu dato real: la IA no inventa números.',
    apply: 'Aplicar lo seleccionado',
    applied: 'Cambios aplicados. Revisa la vista previa antes de exportar.',
    letterCta: 'Escribir carta y textos de LinkedIn',
    letterWorking: 'La IA está escribiendo…',
    letterEmpty: 'Genera una carta alineada al anuncio, sin clichés y sin inventar logros.',
    subject: 'Asunto',
    body: 'Carta',
    linkedinHeadline: 'Titular de LinkedIn',
    linkedinSummary: 'Acerca de (LinkedIn)',
    followUp: 'Nota de seguimiento',
    copy: 'Copiar',
    copied: 'Copiado',
    download: 'Descargar .txt',
    interviewCta: 'Preparar mi entrevista',
    interviewWorking: 'La IA está preparando las preguntas…',
    interviewEmpty: 'Ocho preguntas probables, qué evalúa cada una y cómo responderla con tus hechos.',
    askThem: 'Preguntas que puedes hacer tú',
    closing: 'Cierre que deja huella',
    keywords: 'Palabras clave a decir',
    star: 'Cómo responderla',
    why: 'Qué evalúa',
    tooShort: 'Pega al menos un par de líneas del anuncio.',
    saved: 'Vacante guardada en tu hoja de vida.',
    errors: 'No se pudo completar la acción.',
  },
  en: {
    trigger: 'Job mode',
    title: 'Job mode',
    desc: 'Tailor your resume to one specific role and company: ATS diagnosis, honest rewriting, cover letter and interview prep.',
    tabs: { brief: 'Vacancy', match: 'Diagnosis', tailor: 'Tailor', letter: 'Letter', interview: 'Interview' },
    role: 'Role you are applying to',
    company: 'Company',
    offer: 'Job post text',
    offerPlaceholder: 'Paste the full post here: title, requirements, responsibilities and what the company offers.',
    tone: 'Rewriting tone',
    tones: { conservador: 'Conservative', equilibrado: 'Balanced', agresivo: 'Direct' },
    toneHint: 'Conservative rephrases without exaggerating; direct leads with the strongest result. Neither invents data.',
    analyze: 'Show my diagnosis',
    diagnosisLive: 'The diagnosis runs instantly and costs no credits.',
    emptyMatch: 'Paste the post to see your match, your gaps and how an ATS reads you.',
    score: 'Match',
    summaryLabel: 'Quick read',
    breakdown: 'How the score is built',
    evidence: 'Backed by evidence in your experience',
    listed: 'Only in your skills list',
    missing: 'Not in your resume',
    addSkill: 'Add to skills',
    gaps: 'Requirements you are missing',
    ats: 'How an ATS reads it',
    over: 'You are above the recommended range (75–90). An over-optimized resume feels fake: keep only what you can defend in an interview.',
    years: 'Experience asked',
    yearsMine: 'Your resume shows',
    titleMatch: 'Post title',
    tailorCta: 'Deep-tailor with AI',
    tailorWorking: 'The AI is rewriting your resume…',
    tailorEmpty: 'Fill in the vacancy and run the diagnosis first: the AI rewrites using that context.',
    headline: 'Professional headline',
    summary: 'Professional summary',
    skills: 'Skills to add',
    rewrites: 'Rewritten achievements',
    angle: 'How to position for this company',
    risks: 'Objections to expect',
    gapsAdvice: 'What to do about each gap',
    warnings: 'Unbacked figures',
    placeholders: 'Markers like [X] are figures you must fill with your real data: the AI does not invent numbers.',
    apply: 'Apply selected',
    applied: 'Changes applied. Review the preview before exporting.',
    letterCta: 'Write cover letter and LinkedIn copy',
    letterWorking: 'The AI is writing…',
    letterEmpty: 'Generate a letter aligned with the post, without clichés or invented achievements.',
    subject: 'Subject',
    body: 'Letter',
    linkedinHeadline: 'LinkedIn headline',
    linkedinSummary: 'About (LinkedIn)',
    followUp: 'Follow-up note',
    copy: 'Copy',
    copied: 'Copied',
    download: 'Download .txt',
    interviewCta: 'Prepare my interview',
    interviewWorking: 'The AI is preparing the questions…',
    interviewEmpty: 'Eight likely questions, what each one evaluates and how to answer with your own facts.',
    askThem: 'Questions you can ask',
    closing: 'A closing that lands',
    keywords: 'Keywords to say',
    star: 'How to answer it',
    why: 'What it evaluates',
    tooShort: 'Paste at least a couple of lines of the post.',
    saved: 'Vacancy saved to your resume.',
    errors: 'The action could not be completed.',
  },
};

const BAND_STYLE: Record<JobAnalysis['band'], { color: string; ring: string }> = {
  low: { color: 'text-red-500', ring: '#ef4444' },
  partial: { color: 'text-amber-500', ring: '#f59e0b' },
  good: { color: 'text-sky-600', ring: '#0284c7' },
  ideal: { color: 'text-emerald-600', ring: '#10b981' },
  over: { color: 'text-violet-600', ring: '#7c3aed' },
};

function ScoreRing({ score, band }: { score: number; band: JobAnalysis['band'] }) {
  const circumference = 2 * Math.PI * 34;
  return (
    <div className="relative flex h-24 w-24 flex-none items-center justify-center">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke={BAND_STYLE[band].ring}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-black leading-none ${BAND_STYLE[band].color}`}>{score}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">/100</span>
      </div>
    </div>
  );
}

export default function VacancyStudio({ cvData, onApply }: Props) {
  const { locale } = useI18n();
  const copy = COPY[locale];

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('brief');
  const [role, setRole] = useState(cvData.target?.role || '');
  const [company, setCompany] = useState(cvData.target?.company || '');
  const [offer, setOffer] = useState(cvData.target?.offerText || '');
  const [tone, setTone] = useState<Tone>(cvData.target?.tone || 'equilibrado');

  const [isTailoring, setIsTailoring] = useState(false);
  const [isWritingLetter, setIsWritingLetter] = useState(false);
  const [isPreparingInterview, setIsPreparingInterview] = useState(false);

  const [tailor, setTailor] = useState<TailorResult | null>(null);
  const [letter, setLetter] = useState<CoverLetterResult | null>(null);
  const [letterDraft, setLetterDraft] = useState('');
  const [interview, setInterview] = useState<InterviewResult | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);

  const [applyHeadline, setApplyHeadline] = useState(true);
  const [applySummary, setApplySummary] = useState(true);
  const [applySkills, setApplySkills] = useState<Record<string, boolean>>({});
  const [applyRewrites, setApplyRewrites] = useState<Record<string, boolean>>({});

  const analysis = useMemo(
    () => (offer.trim().length >= MIN_OFFER ? analyzeVacancy(cvData, offer) : null),
    [cvData, offer],
  );

  const atsTips = locale === 'es' ? analysis?.atsTipsEs : analysis?.atsTipsEn;

  const canRun = offer.trim().length >= MIN_OFFER;

  const persistTarget = () => {
    onApply({
      target: {
        role: role.trim(),
        company: company.trim(),
        offerText: offer,
        tone,
        seniority: analysis?.seniority,
        matchScore: analysis?.score,
      },
    });
  };

  const handleApiError = (error: unknown) => {
    if (isQuotaError(error)) {
      toast.error(quotaMessageFromResponse((error as { body?: unknown }).body, locale), { duration: 8000 });
    } else {
      toast.error(error instanceof Error ? error.message : copy.errors);
    }
  };

  const runTailor = async () => {
    if (!canRun) {
      toast.info(copy.tooShort);
      return;
    }
    setIsTailoring(true);
    setWarnings([]);
    try {
      const response = await fetchWithQuotaHandling('/api/ai/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv: cvData, offer, company, role, tone }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || copy.errors);
      const result = payload.result as TailorResult;
      setTailor(result);
      setWarnings(Array.isArray(payload.warnings) ? payload.warnings : []);
      setApplyHeadline(Boolean(result.headline));
      setApplySummary(Boolean(result.summary));
      setApplySkills(Object.fromEntries(result.skillsAdd.map((skill) => [skill.name, true])));
      setApplyRewrites(Object.fromEntries(result.achievementRewrites.map((item) => [item.id, true])));
      persistTarget();
      notifyAiUsed();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsTailoring(false);
    }
  };

  const runLetter = async () => {
    if (!canRun) {
      toast.info(copy.tooShort);
      return;
    }
    setIsWritingLetter(true);
    setWarnings([]);
    try {
      const response = await fetchWithQuotaHandling('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv: cvData, offer, company, role, tone }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || copy.errors);
      const result = payload.result as CoverLetterResult;
      setLetter(result);
      setLetterDraft(result.body);
      setWarnings(Array.isArray(payload.warnings) ? payload.warnings : []);
      persistTarget();
      notifyAiUsed();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsWritingLetter(false);
    }
  };

  const runInterview = async () => {
    if (!canRun) {
      toast.info(copy.tooShort);
      return;
    }
    setIsPreparingInterview(true);
    try {
      const response = await fetchWithQuotaHandling('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv: cvData, offer, company, role }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || copy.errors);
      setInterview(payload.result as InterviewResult);
      setOpenQuestion(0);
      persistTarget();
      notifyAiUsed();
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsPreparingInterview(false);
    }
  };

  const addSkill = (word: string) => {
    const exists = cvData.skills.some((skill) => skill.toLowerCase() === word.toLowerCase());
    if (exists) {
      toast.info(`«${word}» ${locale === 'es' ? 'ya está en tus habilidades' : 'is already in your skills'}`);
      return;
    }
    onApply({ skills: [...cvData.skills, word] });
    toast.success(`«${word}» ${locale === 'es' ? 'añadida a tus habilidades' : 'added to your skills'}`);
  };

  const applyTailoring = () => {
    if (!tailor) return;
    const partial: Partial<CVData> = {};

    if (applyHeadline && tailor.headline) {
      partial.personalInfo = { ...cvData.personalInfo, title: tailor.headline };
    }
    if (applySummary && tailor.summary) {
      partial.summary = tailor.summary;
    }

    const selectedSkills = tailor.skillsAdd.filter((skill) => applySkills[skill.name]).map((skill) => skill.name);
    if (selectedSkills.length > 0) {
      const existing = new Set(cvData.skills.map((skill) => skill.toLowerCase()));
      partial.skills = [...cvData.skills, ...selectedSkills.filter((skill) => !existing.has(skill.toLowerCase()))];
    }

    const selectedRewrites = tailor.achievementRewrites.filter((item) => applyRewrites[item.id]);
    if (selectedRewrites.length > 0) {
      partial.experience = cvData.experience.map((exp) => {
        const rewrite = selectedRewrites.find((item) => item.id === exp.id);
        return rewrite ? { ...exp, achievements: rewrite.achievements } : exp;
      });
    }

    partial.target = {
      role: role.trim(),
      company: company.trim(),
      offerText: offer,
      tone,
      seniority: analysis?.seniority,
      matchScore: analysis?.score,
    };

    onApply(partial);
    toast.success(copy.applied);
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(copy.copied);
    } catch {
      toast.error(copy.errors);
    }
  };

  const downloadText = (value: string, filename: string) => {
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const keywordGroups = analysis
    ? [
        { key: 'evidence', label: copy.evidence, words: analysis.evidence, style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { key: 'listed', label: copy.listed, words: analysis.listed, style: 'bg-amber-50 text-amber-700 border-amber-200' },
        { key: 'missing', label: copy.missing, words: analysis.missing, style: 'bg-red-50 text-red-600 border-red-200' },
      ]
    : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && offer.trim()) persistTarget();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="rounded-full border border-white/10 bg-white/5 px-4 text-white/90 shadow-none hover:bg-white/10 hover:text-white"
        >
          <Target className="h-4 w-4 text-fuchsia-300" />
          <span className="ml-2 hidden lg:inline">{copy.trigger}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl p-0 sm:max-w-[900px]">
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 px-6 py-5 text-white">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" aria-hidden />
          <DialogHeader className="relative">
            <DialogTitle className="flex items-center gap-2 text-left text-white">
              <Target className="h-5 w-5 text-fuchsia-300" />
              {copy.title}
              {analysis ? (
                <span className="ml-auto rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">
                  {analysis.score}/100
                </span>
              ) : null}
            </DialogTitle>
            <DialogDescription className="text-left text-white/70">{copy.desc}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 pb-6 pt-4 sm:px-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="brief" className="gap-1 px-1 text-[11px] sm:text-xs">
                <Briefcase className="hidden h-3.5 w-3.5 sm:block" /> {copy.tabs.brief}
              </TabsTrigger>
              <TabsTrigger value="match" className="gap-1 px-1 text-[11px] sm:text-xs">
                <Gauge className="hidden h-3.5 w-3.5 sm:block" /> {copy.tabs.match}
              </TabsTrigger>
              <TabsTrigger value="tailor" className="gap-1 px-1 text-[11px] sm:text-xs">
                <Wand2 className="hidden h-3.5 w-3.5 sm:block" /> {copy.tabs.tailor}
              </TabsTrigger>
              <TabsTrigger value="letter" className="gap-1 px-1 text-[11px] sm:text-xs">
                <PenLine className="hidden h-3.5 w-3.5 sm:block" /> {copy.tabs.letter}
              </TabsTrigger>
              <TabsTrigger value="interview" className="gap-1 px-1 text-[11px] sm:text-xs">
                <MessageSquareQuote className="hidden h-3.5 w-3.5 sm:block" /> {copy.tabs.interview}
              </TabsTrigger>
            </TabsList>

            {/* ---------------- Vacante ---------------- */}
            <TabsContent value="brief" className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{copy.role}</span>
                  <input
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder={analysis?.titleTarget || 'Analista de datos'}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{copy.company}</span>
                  <input
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="ACME"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{copy.offer}</span>
                <Textarea
                  value={offer}
                  onChange={(event) => setOffer(event.target.value)}
                  placeholder={copy.offerPlaceholder}
                  rows={9}
                  className="resize-none rounded-2xl text-sm"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{copy.tone}</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['conservador', 'equilibrado', 'agresivo'] as Tone[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTone(option)}
                      className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                        tone === option
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {copy.tones[option]}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-slate-500">{copy.toneHint}</p>
              </div>

              <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-[11px] leading-snug text-slate-600">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  {copy.diagnosisLive}
                </p>
                <Button
                  onClick={() => setTab('match')}
                  disabled={!canRun}
                  size="sm"
                  className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
                >
                  {copy.analyze}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            </TabsContent>

            {/* ---------------- Diagnóstico ---------------- */}
            <TabsContent value="match" className="mt-4 space-y-4">
              {!analysis ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
                  {copy.emptyMatch}
                </p>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-100 bg-white px-5 py-4 shadow-sm sm:flex-row">
                    <ScoreRing score={analysis.score} band={analysis.band} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{copy.summaryLabel}</p>
                      <p className="mt-1 text-sm font-semibold leading-snug text-slate-800">
                        {locale === 'es' ? analysis.summaryEs : analysis.summaryEn}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                          {copy.titleMatch}: {analysis.titleTarget || '—'}
                        </span>
                        {analysis.yearsRequired !== null ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                            {copy.years}: {analysis.yearsRequired} · {copy.yearsMine}: {analysis.candidateYears}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {analysis.overOptimized ? (
                    <div className="flex items-start gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3.5 py-2.5">
                      <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600" />
                      <p className="text-[11px] leading-snug text-violet-900">{copy.over}</p>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{copy.breakdown}</p>
                    <ul className="space-y-2.5">
                      {analysis.categories.map((category) => (
                        <li key={category.key}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-700">
                              {locale === 'es' ? category.labelEs : category.labelEn}
                              <span className="ml-1.5 text-[10px] font-bold text-slate-400">{category.weight}%</span>
                            </span>
                            <span className="text-xs font-black text-slate-800">{category.score}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                category.score >= 75 ? 'bg-emerald-500' : category.score >= 45 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${category.score}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10.5px] leading-snug text-slate-500">
                            {locale === 'es' ? category.detailEs : category.detailEn}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {analysis.criticalGaps.length > 0 ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3">
                      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-red-600">
                        <AlertTriangle className="h-3.5 w-3.5" /> {copy.gaps}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.criticalGaps.map((word) => (
                          <span key={word} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-red-600">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2.5">
                    {keywordGroups.map((group) =>
                      group.words.length > 0 ? (
                        <div key={group.key}>
                          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                            {group.label} ({group.words.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {group.words.map((word) => (
                              <button
                                key={`${group.key}-${word}`}
                                type="button"
                                onClick={() => group.key === 'missing' && addSkill(word)}
                                title={group.key === 'missing' ? copy.addSkill : word}
                                className={`group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${group.style} ${
                                  group.key === 'missing' ? 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700' : 'cursor-default'
                                }`}
                              >
                                {word}
                                {group.key === 'missing' ? <Plus className="h-3 w-3 opacity-40 group-hover:opacity-100" /> : null}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>

                  {atsTips && atsTips.length > 0 ? (
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">{copy.ats}</p>
                      <ul className="space-y-1">
                        {atsTips.map((tip) => (
                          <li key={tip} className="flex items-start gap-1.5 text-[11px] leading-snug text-sky-900">
                            <Check className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <Button
                    onClick={() => {
                      setTab('tailor');
                      if (!tailor) void runTailor();
                    }}
                    disabled={isTailoring}
                    className="w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
                  >
                    {isTailoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span className="ml-2">{isTailoring ? copy.tailorWorking : copy.tailorCta}</span>
                  </Button>
                </>
              )}
            </TabsContent>

            {/* ---------------- Personalizar ---------------- */}
            <TabsContent value="tailor" className="mt-4 space-y-4">
              {!canRun ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
                  {copy.tailorEmpty}
                </p>
              ) : !tailor ? (
                <div className="space-y-3 rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 px-4 py-8 text-center">
                  <p className="mx-auto max-w-sm text-xs leading-snug text-slate-600">{copy.tailorEmpty}</p>
                  <Button
                    onClick={runTailor}
                    disabled={isTailoring}
                    className="rounded-full bg-violet-600 text-white hover:bg-violet-700"
                  >
                    {isTailoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span className="ml-2">{isTailoring ? copy.tailorWorking : copy.tailorCta}</span>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-500" />
                    <p className="text-[11px] leading-snug text-slate-600">{copy.placeholders}</p>
                  </div>

                  {warnings.length > 0 ? (
                    <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">{copy.warnings}</p>
                        {warnings.map((warning) => (
                          <p key={warning} className="text-[11px] leading-snug text-amber-900">{warning}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {tailor.headlines.length > 0 ? (
                    <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                      <Checkbox checked={applyHeadline} onCheckedChange={(value) => setApplyHeadline(value === true)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{copy.headline}</span>
                        <span className="mt-1 block text-xs text-slate-400 line-through decoration-slate-300">
                          {cvData.personalInfo.title || '—'}
                        </span>
                        <span className="mt-1 block text-sm font-bold text-slate-800">{tailor.headline}</span>
                        {tailor.headlines.length > 1 ? (
                          <span className="mt-1.5 block text-[11px] leading-snug text-slate-500">
                            {tailor.headlines.slice(1).join(' · ')}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ) : null}

                  {tailor.summary ? (
                    <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                      <Checkbox checked={applySummary} onCheckedChange={(value) => setApplySummary(value === true)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{copy.summary}</span>
                        <span className="mt-1 block text-xs text-slate-400 line-through decoration-slate-300">
                          {cvData.summary || '—'}
                        </span>
                        <span className="mt-1 block text-xs font-medium leading-snug text-slate-800">{tailor.summary}</span>
                      </span>
                    </label>
                  ) : null}

                  {tailor.skillsAdd.length > 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-white p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{copy.skills}</p>
                      <ul className="mt-2 space-y-2">
                        {tailor.skillsAdd.map((skill) => (
                          <li key={skill.name} className="flex items-start gap-2.5">
                            <Checkbox
                              checked={applySkills[skill.name] ?? false}
                              onCheckedChange={(value) =>
                                setApplySkills((prev) => ({ ...prev, [skill.name]: value === true }))
                              }
                              className="mt-0.5"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800">
                                {skill.name}
                                <span
                                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                    skill.priority === 'must'
                                      ? 'bg-red-50 text-red-600'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {skill.priority === 'must'
                                    ? (locale === 'es' ? 'exigida' : 'required')
                                    : (locale === 'es' ? 'deseable' : 'nice')}
                                </span>
                              </p>
                              {skill.why ? <p className="text-[11px] leading-snug text-slate-500">{skill.why}</p> : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {tailor.achievementRewrites.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{copy.rewrites}</p>
                      {tailor.achievementRewrites.map((rewrite) => {
                        const experience = cvData.experience.find((exp) => exp.id === rewrite.id);
                        if (!experience) return null;
                        return (
                          <label key={rewrite.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5">
                            <Checkbox
                              checked={applyRewrites[rewrite.id] ?? false}
                              onCheckedChange={(value) =>
                                setApplyRewrites((prev) => ({ ...prev, [rewrite.id]: value === true }))
                              }
                              className="mt-0.5"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[11px] font-bold text-slate-500">
                                {experience.position} · {experience.company}
                              </span>
                              {experience.achievements.slice(0, 3).map((achievement) => (
                                <span key={achievement} className="mt-1 block text-[11px] leading-snug text-slate-400 line-through decoration-slate-300">
                                  {achievement}
                                </span>
                              ))}
                              {rewrite.achievements.map((achievement) => (
                                <span key={achievement} className="mt-1 block text-xs font-medium leading-snug text-slate-800">
                                  • {achievement}
                                </span>
                              ))}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : null}

                  {tailor.companyAngle ? (
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700">{copy.angle}</p>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-violet-950">{tailor.companyAngle}</p>
                    </div>
                  ) : null}

                  {tailor.gapAdvice.length > 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{copy.gapsAdvice}</p>
                      <ul className="mt-1.5 space-y-1.5">
                        {tailor.gapAdvice.map((item) => (
                          <li key={item.term} className="text-[11.5px] leading-snug text-slate-700">
                            <span className="font-bold text-slate-900">{item.term}:</span> {item.advice}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {tailor.risks.length > 0 ? (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">{copy.risks}</p>
                      <ul className="mt-1.5 space-y-1">
                        {tailor.risks.map((risk) => (
                          <li key={risk} className="text-[11.5px] leading-snug text-amber-900">• {risk}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <Button onClick={applyTailoring} className="w-full rounded-full bg-violet-600 text-white hover:bg-violet-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="ml-2">{copy.apply}</span>
                  </Button>
                </>
              )}
            </TabsContent>

            {/* ---------------- Carta ---------------- */}
            <TabsContent value="letter" className="mt-4 space-y-4">
              {!letter ? (
                <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="mx-auto max-w-sm text-xs leading-snug text-slate-600">{copy.letterEmpty}</p>
                  <Button
                    onClick={runLetter}
                    disabled={!canRun || isWritingLetter}
                    className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {isWritingLetter ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
                    <span className="ml-2">{isWritingLetter ? copy.letterWorking : copy.letterCta}</span>
                  </Button>
                </div>
              ) : (
                <>
                  {warnings.length > 0 ? (
                    <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                      <div className="space-y-1">
                        {warnings.map((warning) => (
                          <p key={warning} className="text-[11px] leading-snug text-amber-900">{warning}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {letter.subject ? (
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{copy.subject}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-800">{letter.subject}</p>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-slate-100 bg-white p-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{copy.body}</p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => copyText(letterDraft)}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200"
                        >
                          <Copy className="h-3 w-3" /> {copy.copy}
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadText(letterDraft, 'carta-presentacion.txt')}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200"
                        >
                          <Download className="h-3 w-3" /> .txt
                        </button>
                      </div>
                    </div>
                    <Textarea
                      value={letterDraft}
                      onChange={(event) => setLetterDraft(event.target.value)}
                      rows={12}
                      className="resize-none rounded-xl border-0 bg-transparent px-0 text-xs leading-relaxed text-slate-800 focus-visible:ring-0"
                    />
                  </div>

                  {letter.linkedinHeadline || letter.linkedinSummary ? (
                    <div className="space-y-2 rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">LinkedIn</p>
                      {letter.linkedinHeadline ? (
                        <div className="rounded-xl bg-white px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{copy.linkedinHeadline}</p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-800">{letter.linkedinHeadline}</p>
                        </div>
                      ) : null}
                      {letter.linkedinSummary ? (
                        <div className="rounded-xl bg-white px-3 py-2">
                          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{copy.linkedinSummary}</p>
                          <p className="mt-0.5 text-[11.5px] leading-snug text-slate-700">{letter.linkedinSummary}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {letter.followUp ? (
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{copy.followUp}</p>
                      <p className="mt-1 text-[11.5px] leading-snug text-slate-700">{letter.followUp}</p>
                    </div>
                  ) : null}

                  <Button
                    onClick={runLetter}
                    disabled={isWritingLetter}
                    variant="outline"
                    className="w-full rounded-full border-slate-200"
                  >
                    {isWritingLetter ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clipboard className="h-4 w-4" />}
                    <span className="ml-2">{isWritingLetter ? copy.letterWorking : copy.letterCta}</span>
                  </Button>
                </>
              )}
            </TabsContent>

            {/* ---------------- Entrevista ---------------- */}
            <TabsContent value="interview" className="mt-4 space-y-3">
              {!interview ? (
                <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="mx-auto max-w-sm text-xs leading-snug text-slate-600">{copy.interviewEmpty}</p>
                  <Button
                    onClick={runInterview}
                    disabled={!canRun || isPreparingInterview}
                    className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {isPreparingInterview ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquareQuote className="h-4 w-4" />}
                    <span className="ml-2">{isPreparingInterview ? copy.interviewWorking : copy.interviewCta}</span>
                  </Button>
                </div>
              ) : (
                <>
                  <ul className="space-y-2">
                    {interview.questions.map((item, index) => (
                      <li key={item.question} className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                        <button
                          type="button"
                          onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
                          className="flex w-full items-start gap-2.5 px-3.5 py-3 text-left"
                        >
                          <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-violet-100 text-[10px] font-black text-violet-700">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 text-xs font-semibold text-slate-800">{item.question}</span>
                          <ArrowRight
                            className={`mt-0.5 h-3.5 w-3.5 flex-none text-slate-400 transition ${openQuestion === index ? 'rotate-90' : ''}`}
                          />
                        </button>
                        {openQuestion === index ? (
                          <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-3.5 py-3">
                            {item.why ? (
                              <p className="text-[11px] leading-snug text-slate-600">
                                <span className="font-bold uppercase tracking-wide text-slate-400">{copy.why}: </span>
                                {item.why}
                              </p>
                            ) : null}
                            {item.starHint ? (
                              <p className="rounded-xl bg-white px-2.5 py-2 text-[11px] leading-snug text-slate-700">
                                <span className="font-bold uppercase tracking-wide text-violet-500">{copy.star}: </span>
                                {item.starHint}
                              </p>
                            ) : null}
                            {item.keywords.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{copy.keywords}:</span>
                                {item.keywords.map((keyword) => (
                                  <span key={keyword} className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  {interview.questionsToAsk.length > 0 ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">{copy.askThem}</p>
                      <ul className="mt-1.5 space-y-1">
                        {interview.questionsToAsk.map((question) => (
                          <li key={question} className="text-[11.5px] leading-snug text-emerald-950">• {question}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {interview.closingTip ? (
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/60 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700">{copy.closing}</p>
                      <p className="mt-1 text-[11.5px] leading-snug text-violet-950">{interview.closingTip}</p>
                    </div>
                  ) : null}

                  <Button
                    onClick={runInterview}
                    disabled={isPreparingInterview}
                    variant="outline"
                    className="w-full rounded-full border-slate-200"
                  >
                    {isPreparingInterview ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    <span className="ml-2">{isPreparingInterview ? copy.interviewWorking : copy.interviewCta}</span>
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
