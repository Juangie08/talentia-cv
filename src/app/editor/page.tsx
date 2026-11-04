'use client';

import { useState, useEffect, useCallback, useDeferredValue, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from '@/lib/localSession';
import {
  Sparkles,
  Trash2,
  Loader2,
  Eye,
  Edit3,
  Save,
  ZoomIn,
  ZoomOut,
  User,
  FileText,
  Stars,
  Briefcase,
  GraduationCap,
  Languages,
  Users,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCVData, useCustomization } from '@/lib/hooks';
import { generateWord, generateTextPDF, generateStyledPDF, buildPlainTextCV } from '@/lib/export';
import { useI18n } from '@/lib/i18n/LocaleProvider';
import { createProfile, getActiveProfile, saveCV, SavedCV, LocalProfile, setActiveProfile as setActiveProfileInStorage, getSavedCVs, updateSavedCV } from '@/lib/profiles';
import { notifyAiUsed } from '@/components/editor/AiUsageBadge';
import { CVData, PaperSize } from '@/lib/types';
import { getBaseTemplateMeta } from '@/lib/templates';
import { EditorSectionKey, getCompletionSummary, getSectionAdvice } from '@/lib/editor-metrics';
import { estimatePages } from '@/lib/cv-quality';
import LiveScoreRing from '@/components/editor/LiveScoreRing';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SidebarProgress from '@/components/editor/SidebarProgress';
import NextStepCard from '@/components/editor/NextStepCard';
import ExportMenu from '@/components/editor/ExportMenu';
import { useUiText } from '@/lib/i18n/uiText';

const PersonalInfoForm = dynamic(() => import('@/components/forms/PersonalInfoForm'));
const SummaryForm = dynamic(() => import('@/components/forms/SummaryForm'));
const SkillsForm = dynamic(() => import('@/components/forms/SkillsForm'));
const ExperienceForm = dynamic(() => import('@/components/forms/ExperienceForm'));
const EducationForm = dynamic(() => import('@/components/forms/EducationForm'));
const LanguagesForm = dynamic(() => import('@/components/forms/LanguagesForm'));
const ReferencesForm = dynamic(() => import('@/components/forms/ReferencesForm'));
const CVPreview = dynamic(() => import('@/components/preview/CVPreview'), {
  loading: () => (
    <div className="flex min-h-[600px] items-center justify-center rounded-xl border border-slate-200 bg-white">
      <Loader2 className="h-6 w-6 animate-spin text-amber-500" aria-hidden="true" />
    </div>
  ),
});
const SavedCVsDialog = dynamic(() => import('@/components/SavedCVsDialog'));
const AiUsageBadge = dynamic(() => import('@/components/editor/AiUsageBadge'));
const ImageStudioDialog = dynamic(() => import('@/components/ImageStudioDialog'));
const QualityCoachDialog = dynamic(() => import('@/components/editor/QualityCoachDialog'));
const VacancyStudio = dynamic(() => import('@/components/editor/VacancyStudio'));
const TranslateCvDialog = dynamic(() => import('@/components/editor/TranslateCvDialog'));
const ImportCVDialog = dynamic(() => import('@/components/editor/ImportCVDialog'));
const OnboardingDialog = dynamic(() => import('@/components/editor/OnboardingDialog'));
const HelpDialog = dynamic(() => import('@/components/HelpDialog'));
const StylePanel = dynamic(() => import('@/components/style-panel/StylePanel'), {
  ssr: false,
  loading: () => (
    <div className="hidden w-[300px] flex-none space-y-3 border-l border-slate-200 bg-white p-4 xl:block" aria-hidden>
      {[64, 40, 88, 40, 72].map((height, index) => (
        <div key={index} className="animate-pulse rounded-xl bg-slate-100" style={{ height }} />
      ))}
    </div>
  ),
});

const nextPaint = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

type LoadableCV = SavedCV | { id?: string; name: string; data: CVData };
type ReplaceScope = 'local' | 'server';
type ReplaceCandidate = {
  id: string;
  name: string;
  updatedAt: string;
  scope: ReplaceScope;
};

export default function EditorPage() {
  const tr = useUiText();
  const { locale, t } = useI18n();
  const editorTabs = useMemo<Array<{ key: EditorSectionKey; label: string; title: string; description: string; icon: typeof User }>>(
    () => [
      { key: 'personal', label: t('editor.tab.personal.label'), title: t('editor.tab.personal.title'), description: t('editor.tab.personal.description'), icon: User },
      { key: 'summary', label: t('editor.tab.summary.label'), title: t('editor.tab.summary.title'), description: t('editor.tab.summary.description'), icon: FileText },
      { key: 'skills', label: t('editor.tab.skills.label'), title: t('editor.tab.skills.title'), description: t('editor.tab.skills.description'), icon: Stars },
      { key: 'experience', label: t('editor.tab.experience.label'), title: t('editor.tab.experience.title'), description: t('editor.tab.experience.description'), icon: Briefcase },
      { key: 'education', label: t('editor.tab.education.label'), title: t('editor.tab.education.title'), description: t('editor.tab.education.description'), icon: GraduationCap },
      { key: 'languages', label: t('editor.tab.languages.label'), title: t('editor.tab.languages.title'), description: t('editor.tab.languages.description'), icon: Languages },
      { key: 'references', label: t('editor.tab.references.label'), title: t('editor.tab.references.title'), description: t('editor.tab.references.description'), icon: Users },
    ],
    [t],
  );

  const { data, template, setTemplate, isLoaded, updateData, updatePersonalInfo, clearAll, loadImportedData } = useCVData();
  const { customization, updateCustomization, resetCustomization } = useCustomization();

  const [activeProfile, setActiveProfile] = useState<LocalProfile | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [serverId, setServerId] = useState<string | null>(null);
  const [localCVId, setLocalCVId] = useState<string | null>(null);
  const [activeDocumentName, setActiveDocumentName] = useState<string | null>(null);
  const [activeDocumentSource, setActiveDocumentSource] = useState<'local' | 'server' | null>(null);
  const [cloudSaveBlockedMessage, setCloudSaveBlockedMessage] = useState<string | null>(null);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [, setReplaceScope] = useState<ReplaceScope | null>(null);
  const [replaceCandidates, setReplaceCandidates] = useState<ReplaceCandidate[]>([]);
  const [isReplacingSave, setIsReplacingSave] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorSectionKey>('personal');
  const formScrollRef = useRef<HTMLDivElement>(null);
  const didMountTabsRef = useRef(false);
  const { data: session } = useSession();
  const [paperSize, setPaperSize] = useState<PaperSize>('letter');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [celebrateReady, setCelebrateReady] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(1600);
  const deferredCVData = useDeferredValue(data);
  const userDataLoaded = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousProgressRef = useRef(0);
  const lastToastSaveStateRef = useRef<'idle' | 'saved' | 'error'>('idle');
  const completion = useMemo(() => getCompletionSummary(data), [data]);
  const leftSidebarWidth = viewportWidth >= 1536 ? 420 : 380;
  const rightSidebarWidth = viewportWidth >= 1536 ? 340 : 300;

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);

  // Zoom con Ctrl+scroll sobre la vista previa (atajo estándar de diseño).
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey || !event.target || !(event.target instanceof Node)) return;
      const preview = document.querySelector('section.overflow-y-auto.bg-slate-200');
      if (!preview || !preview.contains(event.target)) return;
      event.preventDefault();
      setZoomLevel((prev) => {
        const next = prev + (event.deltaY < 0 ? 10 : -10);
        return Math.min(150, Math.max(50, next));
      });
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    if (isLoaded && session?.user && !userDataLoaded.current) {
      const userEmail = session.user.email || '';
      const userName = session.user.name || '';
      if (!data.personalInfo.email && !data.personalInfo.fullName) {
        updatePersonalInfo({ email: userEmail, fullName: userName });
        userDataLoaded.current = true;
      }
    }
  }, [session, isLoaded, updatePersonalInfo, data.personalInfo.email, data.personalInfo.fullName]);

  useEffect(() => {
    const handleSetPhotoUrl = (event: CustomEvent<string>) => {
      updatePersonalInfo({ photoUrl: event.detail });
      toast.success(tr('Foto añadida a tu hoja de vida'));
    };
    window.addEventListener('setPhotoUrl', handleSetPhotoUrl as EventListener);
    return () => window.removeEventListener('setPhotoUrl', handleSetPhotoUrl as EventListener);
  }, [updatePersonalInfo]);

  useEffect(() => {
    if (isLoaded) setActiveProfile(getActiveProfile());
  }, [isLoaded]);

  const refreshActiveProfile = useCallback(() => setActiveProfile(getActiveProfile()), []);

  const ensureLocalProfile = useCallback(() => {
    let profile = getActiveProfile();
    if (!profile) {
      profile = createProfile('Principal');
      setActiveProfileInStorage(profile.id);
      setActiveProfile(profile);
    }
    return profile;
  }, []);

  const openReplaceDialog = useCallback((scope: ReplaceScope, candidates: ReplaceCandidate[]) => {
    setReplaceScope(scope);
    setReplaceCandidates(candidates);
    setReplaceDialogOpen(true);
  }, []);

  const closeReplaceDialog = useCallback(() => {
    setReplaceDialogOpen(false);
    setReplaceScope(null);
    setReplaceCandidates([]);
    setIsReplacingSave(false);
  }, []);

  // Escritura local síncrona: se usa también al ocultar o cerrar la pestaña
  // para no perder cambios si el usuario sale antes del debounce.
  const flushLocalSave = useCallback(() => {
    try {
      localStorage.setItem('talentia-cv-data', JSON.stringify(data));
      localStorage.setItem('talentia-customization', JSON.stringify(customization));
    } catch (error) {
      console.warn(error);
    }
  }, [customization, data]);

  useEffect(() => {
    if (!isLoaded) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushLocalSave();
    };
    window.addEventListener('pagehide', flushLocalSave);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', flushLocalSave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [flushLocalSave, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    setSaveStatus('pending');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        localStorage.setItem('talentia-cv-data', JSON.stringify(data));
        localStorage.setItem('talentia-customization', JSON.stringify(customization));
        const profile = getActiveProfile();
        const existingLocalCV = profile && localCVId ? getSavedCVs(profile.id).find((cv) => cv.id === localCVId) : null;

        if (profile && existingLocalCV) {
          updateSavedCV(profile.id, existingLocalCV.id, data);
          refreshActiveProfile();
        } else if (session && !cloudSaveBlockedMessage) {
          const response = await fetch('/api/cvs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: serverId, name: data.personalInfo.fullName || tr('Mi Hoja de Vida'), data, template, customization }),
          });
          const saved = await response.json().catch(() => ({ message: tr('No se pudo guardar en la nube.') }));
          if (!response.ok) {
            throw new Error(saved.message || tr('No se pudo guardar en la nube.'));
          }
          if (!serverId) setServerId(saved.id);
        } else if (session && cloudSaveBlockedMessage) {
          const localProfile = ensureLocalProfile();
          if (!localCVId) {
            const fallbackName = data.personalInfo.fullName || 'Mi HDV';
            const localResult = saveCV(localProfile.id, fallbackName, data);
            if (localResult.success && localResult.id) {
              setLocalCVId(localResult.id);
              setActiveDocumentName(fallbackName);
              setActiveDocumentSource('local');
              refreshActiveProfile();
            }
          }
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Limite de 3 hojas de vida alcanzado.')) {
          setCloudSaveBlockedMessage(error.message);
        }
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 5000);
      }
    }, 5000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [cloudSaveBlockedMessage, customization, data, ensureLocalProfile, isLoaded, localCVId, refreshActiveProfile, serverId, session, template]);

  useEffect(() => {
    if (saveStatus === 'saved' && lastToastSaveStateRef.current !== 'saved') {
      toast.success(tr('✓ Guardado'), { duration: 2000 });
      lastToastSaveStateRef.current = 'saved';
    }
    if (saveStatus === 'error' && lastToastSaveStateRef.current !== 'error') {
      toast.error(tr('No se pudo guardar automáticamente'), { duration: 2500 });
      lastToastSaveStateRef.current = 'error';
    }
    if (saveStatus === 'idle' || saveStatus === 'pending' || saveStatus === 'saving') {
      lastToastSaveStateRef.current = 'idle';
    }
  }, [saveStatus]);

  useEffect(() => {
    const previous = previousProgressRef.current;
    if (previous < 100 && completion.percent === 100) {
      setCelebrateReady(true);
      window.setTimeout(() => setCelebrateReady(false), 2200);
    }
    previousProgressRef.current = completion.percent;
  }, [completion.percent]);

  const handleExportStyledPDF = useCallback(async () => {
    setIsExportingPDF(true);
    toast.loading('Generando PDF moderno...', { id: 'pdf-loading' });
    try {
      await nextPaint();
      // La etiqueta de rol (nombre de la plantilla) viaja al PDF como chip
      // identificador bajo el cargo.
      const roleLabel = getBaseTemplateMeta(template)?.name;
      await generateStyledPDF(data, paperSize, { accentColor: customization.colorAccent, roleLabel, locale });
      toast.success(tr('✓ PDF moderno descargado'), { id: 'pdf-loading' });
    } catch (error) {
      console.error(error);
      toast.error(tr('Error al generar PDF'), { id: 'pdf-loading' });
    } finally {
      setIsExportingPDF(false);
    }
  }, [data, paperSize, template, customization.colorAccent, locale]);

  const handleExportATSPDF = useCallback(async () => {
    setIsExportingPDF(true);
    toast.loading('Generando PDF con texto seleccionable...', { id: 'pdf-loading' });
    try {
      await nextPaint();
      await generateTextPDF(data, paperSize, { accentColor: customization.colorAccent, locale });
      toast.success(tr('✓ PDF con texto real descargado'), { id: 'pdf-loading' });
    } catch (error) {
      console.error(error);
      toast.error(tr('Error al generar PDF'), { id: 'pdf-loading' });
    } finally {
      setIsExportingPDF(false);
    }
  }, [data, paperSize, customization.colorAccent, locale]);

  // Descarga principal: imprime la vista previa TAL CUAL se ve en pantalla
  // (plantilla, colores, foto, espaciado y tamaño elegidos). El navegador
  // genera el PDF con texto nativo seleccionable, así sirve para ATS e IAs
  // y para el ojo humano a la vez. En continuo se inyecta una hoja @page a
  // medida para que salga en una sola hoja larga.
  const ensurePrintPageSize = useCallback(() => {
    const id = 'cv-print-page-size';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      el.setAttribute('media', 'print');
      document.head.appendChild(el);
    }
    if (paperSize === 'continuous') {
      const node = document.getElementById('cv-preview');
      const px = node ? node.scrollHeight : 0;
      // 96px = 25.4mm. Con tope de seguridad para el motor de impresión.
      const mm = Math.min(Math.max((px * 25.4) / 96, 297), 4000);
      el.textContent = `@page { size: 210mm ${mm.toFixed(1)}mm; margin: 0; }`;
    } else {
      // Carta/oficio/A4 los resuelve el CSS (@page con nombre).
      el.textContent = '';
    }
  }, [paperSize]);

  const handlePrintPDF = useCallback(() => {
    ensurePrintPageSize();
    const prevTitle = document.title;
    const name = data.personalInfo.fullName?.trim();
    document.title = name ? `${name} - Hoja de vida` : tr('Mi hoja de vida');
    document.body.classList.add('print-cv');
    toast.info(tr('En el diálogo elige "Guardar como PDF"'), { duration: 5000 });
    const cleanup = () => {
      document.body.classList.remove('print-cv');
      document.title = prevTitle;
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(() => {
      window.print();
    }, 60);
    window.setTimeout(cleanup, 15000);
  }, [data.personalInfo.fullName, ensurePrintPageSize]);

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildPlainTextCV(data, locale));
      toast.success(tr('Hoja de vida copiada como texto'));
    } catch (error) {
      console.error(error);
      toast.error(tr('No se pudo copiar el texto'));
    }
  }, [data, locale]);

  const handleExportWord = useCallback(async () => {
    setIsExportingWord(true);
    toast.loading('Generando Word...', { id: 'word-loading' });
    try {
      await nextPaint();
      await generateWord(data, paperSize, { accentColor: customization.colorAccent, fontFamily: customization.fontBody, locale });
      toast.success(tr('✓ Word descargado'), { id: 'word-loading' });
    } catch (error) {
      console.error(error);
      toast.error(tr('Error al generar Word'), { id: 'word-loading' });
    } finally {
      setIsExportingWord(false);
    }
  }, [data, paperSize, customization.colorAccent, customization.fontBody, locale]);

  const handleImproveWithAI = useCallback(async () => {
    toast.loading('Mejorando con IA...', { id: 'ai-loading' });
    setIsImproving(true);
    try {
      const response = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: data.summary, experience: data.experience }),
      });
      const improved = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(improved?.error || tr('No se pudo mejorar el contenido'));
      }
      updateData({ summary: improved.summary || data.summary, experience: improved.experience || data.experience });
      if (improved?.ai === true) {
        notifyAiUsed();
        toast.dismiss('ai-loading');
        toast.success(tr('Contenido mejorado con IA. Revisa los cambios.'));
      } else {
        toast.dismiss('ai-loading');
        if (improved?.usage) {
          toast.info(tr('Créditos de IA agotados por hoy: aplicamos una mejora básica sin IA. Se renuevan a medianoche.'), { duration: 7000 });
        } else {
          toast.success(tr('Contenido mejorado. Revisa los cambios.'));
        }
      }
    } catch (error: unknown) {
      toast.dismiss('ai-loading');
      const message = error instanceof Error ? error.message : tr('Verifica tu conexión');
      toast.error(`Error de IA: ${message}`);
    } finally {
      setIsImproving(false);
    }
  }, [data.summary, data.experience, updateData]);

  const handleSaveCV = useCallback(async () => {
    try {
      localStorage.setItem('talentia-cv-data', JSON.stringify(data));
    } catch (error) {
      console.warn(error);
    }
    let profile = getActiveProfile();
    if (!profile) {
      profile = createProfile('Principal');
      setActiveProfileInStorage(profile.id);
      setActiveProfile(profile);
    }

    const existingLocalCV = localCVId ? getSavedCVs(profile.id).find((cv) => cv.id === localCVId) : null;

    if (existingLocalCV) {
      setCloudSaveBlockedMessage(null);
      updateSavedCV(profile.id, existingLocalCV.id, data);
      setActiveDocumentName(existingLocalCV.name);
      setActiveDocumentSource('local');
      toast.success(tr('✓ HDV actualizada'), { duration: 2000 });
      refreshActiveProfile();
      return;
    }

    if (session && !localCVId) {
      toast.loading('Guardando en la nube...', { id: 'save-loading' });
      try {
        const response = await fetch('/api/cvs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: serverId, name: data.personalInfo.fullName || tr('Mi Hoja de Vida'), data, template, customization }),
        });
        const saved = await response.json().catch(() => ({ message: tr('No se pudo guardar en la nube.') }));
        if (response.ok) {
          setServerId(saved.id);
          setCloudSaveBlockedMessage(null);
          setActiveDocumentName(saved.name || data.personalInfo.fullName || tr('Mi Hoja de Vida'));
          setActiveDocumentSource('server');
          toast.success(tr('✓ Guardado'), { id: 'save-loading' });
        } else if (response.status === 403) {
          setCloudSaveBlockedMessage(saved.message || 'Limite de nube alcanzado.');
          const listResponse = await fetch('/api/cvs', { method: 'GET' });
          const listPayload = await listResponse.json().catch(() => []);
          if (!listResponse.ok || !Array.isArray(listPayload)) {
            throw new Error(saved.message || tr('No se pudo cargar la lista para reemplazar.'));
          }
          openReplaceDialog(
            'server',
            listPayload.map((item: { id: string; name: string; updatedAt: string }) => ({
              id: item.id,
              name: item.name,
              updatedAt: item.updatedAt,
              scope: 'server' as const,
            })),
          );
          toast.dismiss('save-loading');
          return;
        } else {
          throw new Error(saved.message);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error';
        toast.error(`Error: ${message}`, { id: 'save-loading' });
      }
      return;
    }

    const existingCVs = getSavedCVs(profile.id);
    let cvName = data.personalInfo.fullName || 'Mi HDV';
    let counter = 1;
    while (existingCVs.some((cv) => cv.name === cvName) && counter <= 3) {
      cvName = `${data.personalInfo.fullName || 'Mi HDV'} (${counter})`;
      counter += 1;
    }

    const result = saveCV(profile.id, cvName, data);
    if (result.success) {
      if (result.id) setLocalCVId(result.id);
      setServerId(null);
      setCloudSaveBlockedMessage(null);
      setActiveDocumentName(cvName);
      setActiveDocumentSource('local');
      toast.success(tr('✓ Guardado'), { duration: 2000 });
      refreshActiveProfile();
      return;
    }
    if ((result.message || '').includes('Limite gratuito de 3 hojas de vida')) {
      openReplaceDialog(
        'local',
        getSavedCVs(profile.id).map((cv) => ({
          id: cv.id,
          name: cv.name,
          updatedAt: cv.updatedAt,
          scope: 'local' as const,
        })),
      );
      return;
    }
    toast.error(result.message || tr('No se pudo guardar'));
  }, [customization, data, localCVId, openReplaceDialog, refreshActiveProfile, serverId, session, template]);

  const handleLoadSavedCV = useCallback((saved: LoadableCV, source: 'local' | 'server') => {
    updateData(saved.data);
    if (saved.id && source === 'server') {
      setServerId(saved.id);
      setLocalCVId(null);
    } else if (saved.id) {
      setLocalCVId(saved.id);
      setServerId(null);
    }
    setActiveDocumentName(saved.name);
    setActiveDocumentSource(source);
    toast.success(`Cargado: ${saved.name}`);
  }, [updateData]);

  const handleReplaceSave = useCallback(async (candidate: ReplaceCandidate) => {
    setIsReplacingSave(true);
    try {
      if (candidate.scope === 'server') {
        const response = await fetch('/api/cvs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: candidate.id,
            name: data.personalInfo.fullName || candidate.name || tr('Mi Hoja de Vida'),
            data,
            template,
            customization,
          }),
        });
        const payload = await response.json().catch(() => ({ message: 'No se pudo reemplazar en la nube.' }));
        if (!response.ok) {
          throw new Error(payload.message || 'No se pudo reemplazar en la nube.');
        }
        setServerId(candidate.id);
        setLocalCVId(null);
        setCloudSaveBlockedMessage(null);
        setActiveDocumentName(payload.name || data.personalInfo.fullName || candidate.name);
        setActiveDocumentSource('server');
        toast.success(tr('HDV en nube reemplazada'));
      } else {
        const profile = ensureLocalProfile();
        updateSavedCV(profile.id, candidate.id, data);
        setLocalCVId(candidate.id);
        setServerId(null);
        setCloudSaveBlockedMessage(null);
        setActiveDocumentName(candidate.name);
        setActiveDocumentSource('local');
        refreshActiveProfile();
        toast.success(tr('HDV local reemplazada'));
      }
      closeReplaceDialog();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo reemplazar.';
      toast.error(message);
      setIsReplacingSave(false);
    }
  }, [closeReplaceDialog, customization, data, ensureLocalProfile, refreshActiveProfile, template]);

  const handleClear = useCallback(() => {
    clearAll();
    setServerId(null);
    setLocalCVId(null);
    setActiveDocumentName(null);
    setActiveDocumentSource(null);
    setCloudSaveBlockedMessage(null);
    setShowClearDialog(false);
    toast.info(tr('Datos borrados'));
  }, [clearAll]);

  const handleImportedData = useCallback((imported: CVData) => {
    loadImportedData(imported);
    toast.success(tr('Datos importados. Revisa cada sección antes de exportar.'));
  }, [loadImportedData]);

  const handleToggleMobilePreview = useCallback(() => setShowPreviewMobile((prev) => !prev), []);

  // Navegación paso a paso: cambia de sección, sube el formulario y pone el
  // foco en el primer campo para escribir de inmediato (sin buscar con el mouse).
  const handleSectionChange = useCallback((key: EditorSectionKey) => {
    setActiveTab(key);
  }, []);

  const currentStepIndex = editorTabs.findIndex((tab) => tab.key === activeTab);
  const isFirstStep = currentStepIndex <= 0;
  const isLastStep = currentStepIndex === editorTabs.length - 1;

  const goPrevStep = useCallback(() => {
    if (currentStepIndex > 0) handleSectionChange(editorTabs[currentStepIndex - 1].key);
  }, [currentStepIndex, handleSectionChange]);

  const goNextStep = useCallback(() => {
    if (currentStepIndex < editorTabs.length - 1) handleSectionChange(editorTabs[currentStepIndex + 1].key);
  }, [currentStepIndex, handleSectionChange]);

  const showPreviewOnly = useCallback(() => {
    if (viewportWidth >= 1280) {
      setLeftSidebarOpen(false);
    } else {
      setShowPreviewMobile(true);
    }
  }, [viewportWidth]);

  useEffect(() => {
    // Solo al CAMBIAR de sección: subir el formulario y enfocar el primer
    // campo. En el montaje inicial no se roba el foco (evita teclados
    // inesperados en móvil y conflictos con el onboarding).
    if (!didMountTabsRef.current) {
      didMountTabsRef.current = true;
      return;
    }
    const container = formScrollRef.current;
    container?.scrollTo({ top: 0 });
    // Los formularios se cargan con dynamic(): sondeamos hasta que el primer
    // campo exista (máx ~2s) para poner el foco y poder escribir de una.
    let attempts = 0;
    let cancelled = false;
    const tryFocus = () => {
      if (cancelled) return;
      // Mientras haya un diálogo abierto (onboarding) este atrapa el foco:
      // esperamos sin gastar intentos y retomamos al cerrarse.
      if (document.querySelector('[role="dialog"]')) {
        setTimeout(tryFocus, 300);
        return;
      }
      const firstField = container?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([type="file"]):not([disabled]), textarea:not([disabled])',
      );
      if (firstField) {
        firstField.focus({ preventScroll: true });
        firstField.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      if (attempts++ < 24) setTimeout(tryFocus, 170);
    };
    const timer = setTimeout(tryFocus, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeTab]);

  const renderActiveForm = () => {
    const advice = getSectionAdvice(activeTab, data);
    switch (activeTab) {
      case 'personal':
        return <PersonalInfoForm data={data.personalInfo} onChange={updatePersonalInfo} advice={advice} />;
      case 'summary':
        return <SummaryForm summary={data.summary} onChange={(summary) => updateData({ summary })} advice={advice} personalInfo={data.personalInfo} skills={data.skills} achievements={data.experience.flatMap((exp) => exp.achievements).filter(Boolean).slice(0, 8)} />;
      case 'skills':
        return <SkillsForm skills={data.skills} onChange={(skills) => updateData({ skills })} advice={advice} />;
      case 'experience':
        return <ExperienceForm experience={data.experience} onChange={(experience) => updateData({ experience })} advice={advice} />;
      case 'education':
        return <EducationForm education={data.education} onChange={(education) => updateData({ education })} advice={advice} />;
      case 'languages':
        return <LanguagesForm languages={data.languages} onChange={(languages) => updateData({ languages })} advice={advice} />;
      case 'references':
        return <ReferencesForm references={data.references} onChange={(references) => updateData({ references })} advice={advice} />;
      default:
        return null;
    }
  };

  const currentProfileName = session?.user?.name || session?.user?.email || activeProfile?.name || tr('Invitado');
  const activeDocumentLabel = activeDocumentName || data.personalInfo.fullName || null;

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
        <OnboardingDialog />
        <header data-print-hide className="sticky top-0 z-50 h-16 border-b border-white/10 bg-gray-950 px-4">
          <div className="mx-auto flex h-full max-w-[1800px] items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3" aria-label={tr('Inicio')}>
                <div className="relative flex h-9 w-9 items-center justify-center">
                  <span className="logo-orb" aria-hidden="true" />
                  <Image src="/img/LogoSF.png" alt="Talentia" width={36} height={36} className="relative z-10 h-9 w-9 object-contain drop-shadow" priority />
                </div>
                <span className="text-lg font-black uppercase italic tracking-tight text-gold-shine">
                  Talentia
                </span>
              </Link>
              <div className="hidden border-l border-white/15 pl-4 md:flex md:flex-col">
                <span className="text-sm font-bold leading-tight text-white/95">{currentProfileName}</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80">{tr('Miembro')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={handleImproveWithAI}
                    disabled={isImproving}
                    className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-4 text-white shadow-lg shadow-violet-900/20 hover:from-violet-500 hover:to-blue-500"
                  >
                    {isImproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span className="ml-2 hidden lg:inline">{tr('Mejorar con IA')}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-xs text-white">
                  <p>{tr('Mejora el resumen y la experiencia con IA')}</p>
                </TooltipContent>
              </Tooltip>

              <SavedCVsDialog onLoadCV={handleLoadSavedCV} onSaveCurrent={handleSaveCV} onProfileChange={refreshActiveProfile} canSaveCurrent={Boolean(localCVId || serverId)} />
              <ImportCVDialog onImport={handleImportedData} hasExistingData={completion.percent > 0} />
              <AiUsageBadge />
              {/* En pantallas muy pequeñas se ocultan para no saturar la barra;
                 siguen disponibles en sm+ y todo lo que hacen vive en el navegador. */}
              <div className="hidden min-[480px]:contents">
                <ImageStudioDialog cvData={data} />
                <VacancyStudio cvData={data} onApply={updateData} />
                <QualityCoachDialog cvData={data} onApply={updateData} />
                <TranslateCvDialog cvData={data} onApply={updateData} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <HelpDialog />

              <div className="hidden items-center gap-2 md:flex">
                {activeDocumentLabel ? (
                  <div className="mr-2 flex max-w-[240px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/80">
                    <span className={`h-2 w-2 rounded-full ${activeDocumentSource === 'server' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-white/90">{activeDocumentLabel}</p>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-white/45">
                        {activeDocumentSource === 'server' ? 'Editando en nube' : activeDocumentSource === 'local' ? 'Editando local' : 'Borrador actual'}
                      </p>
                    </div>
                  </div>
                ) : null}

                {data.target?.offerText ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mr-2 flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1.5 text-violet-200">
                        <Target className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{tr('Adaptada a una oferta')}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 text-xs text-white">
                      <p>{tr('Tu hoja de vida está adaptada a una oferta. Ábrela en «Validar CV» para ver o quitar la adaptación.')}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : null}

                <div className="mr-1 flex items-center gap-1">
                  {saveStatus === 'pending' && <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" title={tr('Pendiente')} />}
                  {saveStatus === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
                  {saveStatus === 'saved' && <span className="h-2 w-2 rounded-full bg-emerald-400" title={tr('Guardado')} />}
                  {saveStatus === 'error' && <span className="h-2 w-2 rounded-full bg-red-400" title={tr('Error')} />}
                </div>

                <Button variant="ghost" size="sm" onClick={handleSaveCV} title={tr('Guardar')} className="h-9 w-9 rounded-full border border-white/10 bg-transparent p-0 text-white/80 hover:bg-white/10 hover:text-white">
                  <Save className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-white/70">
                  <Button variant="ghost" size="sm" onClick={() => setZoomLevel((prev) => Math.max(50, prev - 10))} className="h-7 w-7 rounded-full p-0 text-white/70 hover:bg-white/10 hover:text-white" title={tr('Zoom -')}>
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-10 text-center text-xs">{zoomLevel}%</span>
                  <Button variant="ghost" size="sm" onClick={() => setZoomLevel((prev) => Math.min(150, prev + 10))} className="h-7 w-7 rounded-full p-0 text-white/70 hover:bg-white/10 hover:text-white" title={tr('Zoom +')}>
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <ExportMenu
                  onPrintPDF={handlePrintPDF}
                  onExportStyledPDF={handleExportStyledPDF}
                  onExportATSPDF={handleExportATSPDF}
                  onExportWord={handleExportWord}
                  onCopyText={handleCopyText}
                  isExportingPDF={isExportingPDF}
                  isExportingWord={isExportingWord}
                />

                <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full border border-white/10 bg-transparent p-0 text-white/40 hover:bg-white/10 hover:text-red-400" title={tr('Limpiar')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{tr('¿Limpiar todo?')}</DialogTitle>
                      <DialogDescription>{tr('Borraremos el progreso actual del formulario.')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowClearDialog(false)}>{tr('No, seguir')}</Button>
                      <Button variant="destructive" onClick={handleClear}>{tr('Sí, borrar')}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={replaceDialogOpen} onOpenChange={(open) => { if (!open) closeReplaceDialog(); }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{tr('Ya tienes 3 hojas de vida guardadas')}</DialogTitle>
                      <DialogDescription>
                        {tr('Elige cuál deseas reemplazar o cancela para mantener las actuales.')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      {replaceCandidates.map((candidate) => (
                        <button
                          key={`${candidate.scope}-${candidate.id}`}
                          type="button"
                          onClick={() => handleReplaceSave(candidate)}
                          disabled={isReplacingSave}
                          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{candidate.name}</p>
                            <p className="text-[11px] text-slate-400">
                              {candidate.scope === 'server' ? 'En nube' : 'Local'} · {new Date(candidate.updatedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                            Reemplazar
                          </span>
                        </button>
                      ))}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={closeReplaceDialog} disabled={isReplacingSave}>
                        {tr('Cancelar')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center gap-1 md:hidden">
                <ExportMenu
                  onPrintPDF={handlePrintPDF}
                  onExportStyledPDF={handleExportStyledPDF}
                  onExportATSPDF={handleExportATSPDF}
                  onExportWord={handleExportWord}
                  onCopyText={handleCopyText}
                  isExportingPDF={isExportingPDF}
                  isExportingWord={isExportingWord}
                />
                <Button variant="outline" size="sm" onClick={handleToggleMobilePreview} className="h-9 w-9 rounded-full border-white/20 bg-transparent p-0 text-white" aria-label={showPreviewMobile ? 'Volver al formulario' : tr('Ver vista previa')}>
                  {showPreviewMobile ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="relative mx-auto flex w-full min-h-0 max-w-[1800px] flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-visible">

          {leftSidebarOpen && (
            <section
              data-print-hide
              className={`relative flex w-full flex-shrink-0 flex-col xl:min-h-0 ${showPreviewMobile ? 'hidden xl:flex' : 'flex'}`}
              style={{ width: viewportWidth >= 1280 ? `min(100%, ${leftSidebarWidth}px)` : '100%' }}
            >
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="absolute -right-4 top-1/2 z-20 hidden h-14 w-7 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-lg transition-all hover:bg-slate-50 xl:flex"
                aria-label={tr('Ocultar panel izquierdo')}
              >
                <ChevronLeft className="h-4 w-4 text-slate-500" />
              </button>
              <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-1 flex-col xl:max-w-none xl:min-h-0">
                <div className="relative">
                  <SidebarProgress summary={completion} celebrate={celebrateReady} />
                </div>

              <div className="flex-none border-b border-slate-200 bg-white px-3 py-2.5">
                <div className="grid grid-cols-2 gap-1.5">
                  {editorTabs.map((tab, index) => {
                    const matchingState = completion.states.find((state) => state.key === tab.key);
                    const isActive = activeTab === tab.key;
                    const Icon = tab.icon;
                    const stateIcon = matchingState?.status === 'complete'
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      : matchingState?.status === 'optional'
                        ? <Circle className="h-3.5 w-3.5 text-slate-300" />
                        : <Circle className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />;

                    const qualityLabel = matchingState?.qualityLabel === 'muy-fuerte'
                      ? 'Muy fuerte'
                      : matchingState?.qualityLabel === 'fuerte'
                        ? 'Fuerte'
                        : matchingState?.qualityLabel === 'basico'
                          ? tr('Básico')
                          : tr('Vacío');

                    return (
                      <Tooltip key={tab.key}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => handleSectionChange(tab.key)}
                            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
                              isActive
                                ? 'border-amber-400 bg-amber-50 text-slate-900 shadow-sm'
                                : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${isActive ? 'bg-white text-amber-500' : 'bg-white text-slate-400'}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{tab.label}</span>
                            <span className="flex-none">{stateIcon}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-slate-900 text-xs text-white">
                          <p className="font-semibold">{t('editor.step', { current: index + 1, total: editorTabs.length })} · {tab.title}</p>
                          <p className="mt-1">{tab.description}</p>
                          <p className="mt-1 text-white/70">{t('editor.currentQuality', { label: qualityLabel.toLowerCase() })}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              <NextStepCard
                summary={completion}
                steps={editorTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
                activeKey={activeTab}
                data={data}
                onGoTo={handleSectionChange}
                onShowPreview={showPreviewOnly}
                onExport={handlePrintPDF}
              />

              <div ref={formScrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
                {renderActiveForm()}
              </div>

              <div className="sticky bottom-0 z-10 flex-none border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goPrevStep}
                    disabled={isFirstStep}
                    className="rounded-full"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    {t('editor.prev')}
                  </Button>
                  <span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {t('editor.step', { current: currentStepIndex + 1, total: editorTabs.length })} · {editorTabs[currentStepIndex].label}
                  </span>
                  {isLastStep ? (
                    <Button
                      size="sm"
                      onClick={showPreviewOnly}
                      className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500"
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      {t('editor.viewCv')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={goNextStep}
                      className="rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-xs text-white shadow-lg shadow-violet-900/20 hover:from-violet-500 hover:to-blue-500 sm:text-sm"
                    >
                      {t('editor.next', { label: editorTabs[currentStepIndex + 1].label })}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              </div>
            </section>
          )}

          {!leftSidebarOpen ? (
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="absolute left-0 top-1/2 z-20 hidden h-14 w-7 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-slate-200 bg-white shadow-lg transition-all hover:bg-slate-50 xl:flex"
              aria-label={tr('Mostrar panel izquierdo')}
            >
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          ) : null}

          <section data-print-area className={`relative min-h-0 flex-1 overflow-y-auto bg-slate-200 px-3 py-4 xl:px-6 xl:py-6 2xl:px-10 2xl:py-8 ${!showPreviewMobile ? 'hidden xl:block' : 'block'}`}>
            <div data-print-hide>
              <LiveScoreRing summary={completion} onGoToSection={handleSectionChange} />
            </div>
            <div data-print-scale-reset className="mx-auto flex max-w-[920px] justify-center transition-transform duration-200 origin-top 2xl:max-w-[980px]" style={{ transform: `scale(${zoomLevel / 100})` }}>
              <div className="relative w-full min-w-0">
                {/* Pila de hojas sutil: efecto "documento real" detrás de la página */}
                <div data-print-hide aria-hidden className="absolute inset-x-3 -bottom-2 top-3 -z-10 rounded-lg bg-slate-300/50 shadow-md" />
                <div data-print-hide aria-hidden className="absolute inset-x-1.5 -bottom-1 top-1.5 -z-10 rounded-lg bg-slate-100 shadow" />
                <CVPreview data={deferredCVData} template={template} paperSize={paperSize} customization={customization} />
                <div data-print-hide className="mt-3 flex justify-center">
                  <span className="rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold text-slate-500 shadow-sm backdrop-blur">
                    {estimatePages(deferredCVData)} {estimatePages(deferredCVData) === 1 ? tr('página') : tr('páginas')} · recomendado máx. 2
                  </span>
                </div>
              </div>
            </div>
          </section>

          <StylePanel
            customization={customization}
            onUpdate={updateCustomization}
            onReset={resetCustomization}
            paperSize={paperSize}
            onPaperSizeChange={setPaperSize}
            template={template}
            setTemplate={setTemplate}
            cvData={deferredCVData}
            panelWidth={rightSidebarWidth}
          />
        </main>
      </div>
    </TooltipProvider>
  );
}
