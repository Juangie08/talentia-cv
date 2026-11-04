'use client';

import { memo, useMemo, useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CVData, TemplateName, BaseTemplateId, PaperSize, CVCustomization, defaultCustomization } from '@/lib/types';
import { getActiveProfile } from '@/lib/profiles';
import { getUserTemplates } from '@/lib/templates';
import { isEditorEmpty } from '@/lib/editor-metrics';
import EditorEmptyState from '@/components/editor/EditorEmptyState';
import type { CustomTemplateProps } from './templates/shared';
import { useI18n } from '@/lib/i18n/LocaleProvider';
import { uiText } from '@/lib/i18n/uiText';

// Registro único id de plantilla → componente. Fuente de verdad para el
// renderizado; baseIds se deriva de aquí para no duplicar la lista.
const TEMPLATE_COMPONENTS: Record<BaseTemplateId, React.ComponentType<CustomTemplateProps>> = {
  'moderno': dynamic(() => import('./templates/ModernoTemplate')),
  'minimalista': dynamic(() => import('./templates/MinimalistaTemplate')),
  'creativo': dynamic(() => import('./templates/CreativoTemplate')),
  'customer-service': dynamic(() => import('./templates/CustomerServiceTemplate')),
  'student': dynamic(() => import('./templates/StudentTemplate')),
  'developer': dynamic(() => import('./templates/DeveloperTemplate')),
  'creative-pro': dynamic(() => import('./templates/CreativeTemplate')),
  'ejecutivo': dynamic(() => import('./templates/EjecutivoTemplate')),
  'medico': dynamic(() => import('./templates/MedicoTemplate')),
  'legal': dynamic(() => import('./templates/LegalTemplate')),
  'finance': dynamic(() => import('./templates/FinanceTemplate')),
  'marketing': dynamic(() => import('./templates/MarketingTemplate')),
  'educacion': dynamic(() => import('./templates/EducacionTemplate')),
  'pink': dynamic(() => import('./templates/PinkTemplate')),
  'designer': dynamic(() => import('./templates/DesignerTemplate')),
  'tech': dynamic(() => import('./templates/TechTemplate')),
  'corporate': dynamic(() => import('./templates/CorporateTemplate')),
  'senior': dynamic(() => import('./templates/SeniorTemplate')),
  'psychologist': dynamic(() => import('./templates/PsychologistTemplate')),
  'software-engineer': dynamic(() => import('./templates/ProgrammerTemplate')),
  'visual-designer': dynamic(() => import('./templates/VisualDesignerTemplate')),
  'customer-care': dynamic(() => import('./templates/CustomerCareTemplate')),
  'chat-specialist': dynamic(() => import('./templates/ChatSpecialistTemplate')),
  'marketing-strategist': dynamic(() => import('./templates/MarketingStrategistTemplate')),
  'sakura-bloom': dynamic(() => import('./templates/SakuraBloomTemplate')),
  'cherry-ribbon': dynamic(() => import('./templates/CherryRibbonTemplate')),
  'candy-editorial': dynamic(() => import('./templates/CandyEditorialTemplate')),
  'peach-magazine': dynamic(() => import('./templates/PeachMagazineTemplate')),
  'bubble-minimal': dynamic(() => import('./templates/BubbleMinimalTemplate')),
  'editorial-bold': dynamic(() => import('./templates/EditorialBoldTemplate')),
  'pastel-pro': dynamic(() => import('./templates/PastelProTemplate')),
  'mono-statement': dynamic(() => import('./templates/MonoStatementTemplate')),
  'neon-modern': dynamic(() => import('./templates/NeonModernTemplate')),
  'ink-elegant': dynamic(() => import('./templates/InkElegantTemplate')),
  'green-fresh': dynamic(() => import('./templates/GreenFreshTemplate')),
};

const SYSTEM_FONTS = ['Georgia', 'Arial', 'Verdana', 'Times New Roman', 'Garamond', 'Calibri', 'Segoe UI', 'JetBrains Mono', 'Manrope', 'Montserrat'];

interface Props {
  data: CVData;
  template: TemplateName;
  paperSize?: PaperSize;
  customization?: CVCustomization;
  customConfig?: {
    accentColor?: string;
    fontFamily?: string;
    density?: 'compact' | 'normal' | 'spacious';
    showPhoto?: boolean;
  };
}

const baseIds = Object.keys(TEMPLATE_COMPONENTS) as BaseTemplateId[];

/** Ancho en px (96dpi) de cada tamaño de hoja, para el ajuste fit-to-width. */
const PAGE_WIDTH_PX: Record<string, number> = {
  letter: 816.4,
  legal: 816.9,
  a4: 793.7,
  continuous: 793.7,
};

const PAGE_SIZES: Record<string, { width: number; height: number; label: string }> = {
  letter: { width: 612, height: 792, label: 'Carta (21.6 × 27.9 cm)' },
  legal: { width: 612, height: 1008, label: 'Oficio (21.6 × 33.0 cm)' },
  a4: { width: 595, height: 842, label: 'A4 (21.0 × 29.7 cm)' },
  continuous: { width: 612, height: 0, label: 'Continuo' },
};

function loadGoogleFont(fontFamily: string) {
  if (typeof document === 'undefined') return;
  if (SYSTEM_FONTS.some((systemFont) => fontFamily.includes(systemFont))) return;
  const fontId = `gf-${fontFamily.replace(/\s+/g, '-')}`;
  if (document.getElementById(fontId)) return;
  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

function applyCSSVariables(root: HTMLElement, customization: CVCustomization) {
  root.style.setProperty('--cv-font-body', `'${customization.fontBody}', sans-serif`);
  root.style.setProperty('--cv-font-size-base', `${customization.fontSizeBase}px`);
  root.style.setProperty('--cv-font-size-heading', `${customization.fontSizeHeading}px`);
  root.style.setProperty('--cv-font-size-name', `${customization.fontSizeName}px`);
  root.style.setProperty('--cv-font-weight-body', customization.fontWeightBody);
  root.style.setProperty('--cv-font-style-body', customization.fontStyleBody);
  root.style.setProperty('--cv-decoration-heading', customization.decorationHeading);
  root.style.setProperty('--cv-transform-heading', customization.transformHeading);
  root.style.setProperty('--cv-color-accent', customization.colorAccent);
  root.style.setProperty('--cv-color-header-bg', customization.colorHeaderBg);
  root.style.setProperty('--cv-color-header-text', customization.colorHeaderText);
  root.style.setProperty('--cv-color-body-text', customization.colorBodyText);
  root.style.setProperty('--cv-spacing-section', `${({ compact: 8, normal: 16, spacious: 24 })[customization.spacing] || 16}px`);
  root.style.setProperty('--cv-page-padding', `${customization.pagePadding}px`);
}

function getVisibleData(data: CVData, customization: CVCustomization): CVData {
  return {
    ...data,
    personalInfo: {
      ...data.personalInfo,
      photoUrl: customization.sectionsVisible.photo ? data.personalInfo.photoUrl : '',
    },
    summary: customization.sectionsVisible.summary ? data.summary : '',
    skills: customization.sectionsVisible.skills ? data.skills : [],
    experience: customization.sectionsVisible.experience ? data.experience : [],
    education: customization.sectionsVisible.education ? data.education : [],
    languages: customization.sectionsVisible.languages ? data.languages : [],
    references: customization.sectionsVisible.references ? data.references : [],
  };
}

function CVPreview({ data, template, customConfig, paperSize = 'letter', customization }: Props) {
  const { locale } = useI18n();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [pageHeight, setPageHeight] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pagePxHeight, setPagePxHeight] = useState(0);
  const [fitScale, setFitScale] = useState(1);
  const [templateTransitioning, setTemplateTransitioning] = useState(false);

  const activeCustomization = customization || defaultCustomization;
  const pageConfig = PAGE_SIZES[paperSize] || PAGE_SIZES.letter;

  useEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    loadGoogleFont(activeCustomization.fontBody);
    applyCSSVariables(root, activeCustomization);
  }, [activeCustomization]);

  // Fit-to-width: escala la hoja (ancho fijo en mm) al ancho real del panel
  // para que NUNCA se recorte el contenido lateralmente.
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (!w) return;
      const pageW = PAGE_WIDTH_PX[paperSize] ?? PAGE_WIDTH_PX.letter;
      setFitScale(Math.min(1, w / pageW));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [paperSize]);

  useEffect(() => {
    if (paperSize === 'continuous') {
      setPageHeight(0);
      setTotalPages(1);
      return;
    }

    const updateSize = () => {
      if (!previewRef.current) return;
      const width = previewRef.current.clientWidth;
      const ratio = pageConfig.height / pageConfig.width;
      const nextPageHeight = width * ratio;
      setPageHeight(nextPageHeight);
      const contentHeight = previewRef.current.scrollHeight;
      setTotalPages(Math.max(1, Math.ceil(contentHeight / nextPageHeight)));
      setPagePxHeight(previewRef.current.offsetHeight);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (previewRef.current) observer.observe(previewRef.current);
    const interval = setInterval(updateSize, 1000);
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [paperSize, data, pageConfig.height, pageConfig.width]);

  const resolvedConfig = useMemo(() => {
    const defaultOverrides = {
      accentColor: activeCustomization.colorAccent,
      fontFamily: `${activeCustomization.fontBody}, sans-serif`,
      density: activeCustomization.spacing,
      showPhoto: activeCustomization.sectionsVisible.photo,
      ...customConfig,
    };

    if (baseIds.includes(template as BaseTemplateId)) {
      return {
        baseTemplateId: template as BaseTemplateId,
        overrides: defaultOverrides,
      };
    }

    const profile = getActiveProfile();
    if (!profile) {
      return { baseTemplateId: 'moderno' as BaseTemplateId, overrides: defaultOverrides };
    }

    const config = getUserTemplates(profile.id).find((item) => item.id === template);
    if (!config) {
      return { baseTemplateId: 'moderno' as BaseTemplateId, overrides: defaultOverrides };
    }

    return {
      baseTemplateId: config.baseTemplate,
      overrides: {
        ...defaultOverrides,
        accentColor: activeCustomization.colorAccent || config.accentColor,
        fontFamily: `${activeCustomization.fontBody}, sans-serif`,
        density: activeCustomization.spacing || config.density,
        showPhoto: activeCustomization.sectionsVisible.photo && config.showPhoto,
      },
    };
  }, [activeCustomization, customConfig, template]);

  const visibleData = useMemo(() => getVisibleData(data, activeCustomization), [data, activeCustomization]);
  const emptyState = isEditorEmpty(visibleData);

  useEffect(() => {
    setTemplateTransitioning(true);
    const timer = window.setTimeout(() => setTemplateTransitioning(false), 220);
    return () => window.clearTimeout(timer);
  }, [template]);

  const renderTemplate = () => {
    const templateProps = { ...resolvedConfig.overrides, showWatermark: activeCustomization.showWatermark };
    const TemplateComponent = TEMPLATE_COMPONENTS[resolvedConfig.baseTemplateId] || TEMPLATE_COMPONENTS['moderno'];
    return <TemplateComponent cv={visibleData} {...templateProps} locale={locale} />;
  };

  const pageClass = paperSize === 'legal'
    ? 'page-oficio'
    : paperSize === 'a4'
      ? 'page-a4'
      : paperSize === 'continuous'
        ? 'page-continuous'
        : 'page-letter';

  return (
    <div className="relative w-full">
      <div data-print-hide className="mb-2 flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
          {uiText(locale, pageConfig.label)}
        </span>
        <span className="text-[10px] text-slate-400">
          {paperSize === 'continuous' ? uiText(locale, 'flujo continuo') : totalPages > 1 ? uiText(locale, '{n} páginas', { n: totalPages }) : uiText(locale, '1 página')}
        </span>
      </div>

      <div
        ref={outerRef}
        data-print-scale-reset
        className="relative w-full"
        style={pagePxHeight > 0 ? { height: pagePxHeight * fitScale } : undefined}
      >
        <div
          id="cv-preview"
          ref={previewRef}
          className={`page ${pageClass} cv-customization-root overflow-hidden rounded-sm bg-white shadow-xl shadow-slate-400/20 transition-all duration-200`}
          style={{ transform: `scale(${fitScale})`, transformOrigin: 'top left' }}
        >
        <div className={`h-full w-full transition-all duration-200 ${templateTransitioning ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100'}`}>
          {emptyState ? <EditorEmptyState /> : renderTemplate()}
        </div>
        {!emptyState && activeCustomization.showWatermark ? (
          <div
            className="pointer-events-none absolute bottom-3 right-3 z-50 select-none text-[8px] font-bold tracking-wide"
            style={{ opacity: 0.35, color: 'var(--cv-color-body-text, #888)' }}
          >
            Creado con Talentia · talentia.app
          </div>
        ) : null}
      </div>
      </div>

      {pageHeight > 0 && Array.from({ length: Math.max(0, totalPages - 1) }).map((_, index) => (
        <div
          key={`pb-${index}`}
          data-print-hide
          className="pointer-events-none absolute z-50 flex flex-col items-center justify-center"
          style={{
            top: 32 + pageHeight * (index + 1) * fitScale,
            transform: 'translateY(-50%)',
            width: (PAGE_WIDTH_PX[paperSize] ?? PAGE_WIDTH_PX.letter) * fitScale,
          }}
        >
          <div className="w-full border-t-2 border-dashed border-[#CE1126] shadow-sm" />
          <span className="mt-[-10px] rounded-full border border-[#CE1126] bg-white px-3 py-1 text-[10px] font-bold uppercase text-[#CE1126] shadow-sm">
            Corte de hoja {index + 2}
          </span>
        </div>
      ))}
    </div>
  );
}

export default memo(CVPreview);
