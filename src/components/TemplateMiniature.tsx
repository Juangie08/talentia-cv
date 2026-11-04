'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n/LocaleProvider';

import { CVData, BaseTemplateId, UserTemplateConfig } from '@/lib/types';
import { BASE_TEMPLATES } from '@/lib/templates';
import ModernoTemplate from './preview/templates/ModernoTemplate';
import MinimalistaTemplate from './preview/templates/MinimalistaTemplate';
import CreativoTemplate from './preview/templates/CreativoTemplate';
import CustomerServiceTemplate from './preview/templates/CustomerServiceTemplate';
import StudentTemplate from './preview/templates/StudentTemplate';
import DeveloperTemplate from './preview/templates/DeveloperTemplate';
import CreativeTemplate from './preview/templates/CreativeTemplate';
import EjecutivoTemplate from './preview/templates/EjecutivoTemplate';
import MedicoTemplate from './preview/templates/MedicoTemplate';
import LegalTemplate from './preview/templates/LegalTemplate';
import FinanceTemplate from './preview/templates/FinanceTemplate';
import MarketingTemplate from './preview/templates/MarketingTemplate';
import EducacionTemplate from './preview/templates/EducacionTemplate';
import PinkTemplate from './preview/templates/PinkTemplate';
import DesignerTemplate from './preview/templates/DesignerTemplate';
import TechTemplate from './preview/templates/TechTemplate';
import CorporateTemplate from './preview/templates/CorporateTemplate';
import SeniorTemplate from './preview/templates/SeniorTemplate';
import PsychologistTemplate from './preview/templates/PsychologistTemplate';
import ProgrammerTemplate from './preview/templates/ProgrammerTemplate';
import VisualDesignerTemplate from './preview/templates/VisualDesignerTemplate';
import CustomerCareTemplate from './preview/templates/CustomerCareTemplate';
import ChatSpecialistTemplate from './preview/templates/ChatSpecialistTemplate';
import MarketingStrategistTemplate from './preview/templates/MarketingStrategistTemplate';
import SakuraBloomTemplate from './preview/templates/SakuraBloomTemplate';
import CherryRibbonTemplate from './preview/templates/CherryRibbonTemplate';
import CandyEditorialTemplate from './preview/templates/CandyEditorialTemplate';
import PeachMagazineTemplate from './preview/templates/PeachMagazineTemplate';
import BubbleMinimalTemplate from './preview/templates/BubbleMinimalTemplate';
import EditorialBoldTemplate from './preview/templates/EditorialBoldTemplate';
import PastelProTemplate from './preview/templates/PastelProTemplate';
import MonoStatementTemplate from './preview/templates/MonoStatementTemplate';
import NeonModernTemplate from './preview/templates/NeonModernTemplate';
import InkElegantTemplate from './preview/templates/InkElegantTemplate';
import GreenFreshTemplate from './preview/templates/GreenFreshTemplate';

interface Props {
  templateId: string;
  data: CVData;
  userConfig?: UserTemplateConfig;
}

const MINI_PAGE_WIDTH = 794;
const MINI_PAGE_HEIGHT = 1123;

const SAMPLE_DATA: CVData = {
  personalInfo: {
    fullName: 'JUAN PÉREZ',
    title: 'INGENIERO DE SOFTWARE',
    email: 'juan@ejemplo.com',
    phone: '+57 300 000 0000',
    location: 'Bogotá, COL',
    linkedin: 'linkedin.com/in/juan',
    website: 'juan.dev',
    photoUrl: 'https://i.pravatar.cc/150?u=juan',
  },
  summary: 'Profesional con más de 5 años de experiencia en desarrollo web. Apasionado por la tecnología y el aprendizaje continuo.',
  skills: ['React', 'Next.js', 'Node.js', 'Typescript', 'PostgreSQL', 'AWS'],
  experience: [
    {
      id: '1',
      company: 'Tech Solutions',
      position: 'Senior Developer',
      startDate: '2020',
      endDate: 'Presente',
      current: true,
      achievements: ['Liderazgo de equipo', 'Optimización de procesos'],
    }
  ],
  education: [
    {
      id: '1',
      institution: 'Univ. Nacional',
      degree: 'Ingeniería',
      field: 'Sistemas',
      startDate: '2015',
      endDate: '2020',
      current: false,
    }
  ],
  languages: [
    { id: '1', name: 'Español', level: 'Nativo' },
    { id: '2', name: 'Inglés', level: 'Avanzado' },
  ],
  references: [],
};

export default function TemplateMiniature({ templateId, data, userConfig }: Props) {
  const { locale } = useI18n();
  type TemplateOverrides = {
    accentColor?: string;
    fontFamily?: string;
    density?: 'compact' | 'normal' | 'spacious';
    showPhoto?: boolean;
  };

  // Combinar datos reales con muestra si están vacíos
  const displayData = data.personalInfo.fullName ? data : SAMPLE_DATA;

  let baseId: BaseTemplateId = 'moderno';
  let overrides: TemplateOverrides = {};

  if (userConfig) {
    baseId = userConfig.baseTemplate;
    overrides = {
      accentColor: userConfig.accentColor,
      fontFamily: userConfig.fontFamily === 'serif' ? 'Lora, serif' : userConfig.fontFamily === 'mono' ? 'Space Mono, monospace' : 'Inter, sans-serif',
      density: userConfig.density,
      showPhoto: userConfig.showPhoto
    };
  } else {
    baseId = templateId as BaseTemplateId;
    overrides = {
      accentColor: BASE_TEMPLATES.find((template) => template.id === baseId)?.colors[0],
      fontFamily: 'Manrope, sans-serif',
      density: 'normal',
      showPhoto: true,
    };
  }

  const renderTemplate = () => {
    switch (baseId) {
      case 'moderno': return <ModernoTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'minimalista': return <MinimalistaTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'creativo': return <CreativoTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'customer-service': return <CustomerServiceTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'student': return <StudentTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'developer': return <DeveloperTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'creative-pro': return <CreativeTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'ejecutivo': return <EjecutivoTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'medico': return <MedicoTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'legal': return <LegalTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'finance': return <FinanceTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'marketing': return <MarketingTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'educacion': return <EducacionTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'pink': return <PinkTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'designer': return <DesignerTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'tech': return <TechTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'corporate': return <CorporateTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'senior': return <SeniorTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'psychologist': return <PsychologistTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'software-engineer': return <ProgrammerTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'visual-designer': return <VisualDesignerTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'customer-care': return <CustomerCareTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'chat-specialist': return <ChatSpecialistTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'marketing-strategist': return <MarketingStrategistTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'sakura-bloom': return <SakuraBloomTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'cherry-ribbon': return <CherryRibbonTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'candy-editorial': return <CandyEditorialTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'peach-magazine': return <PeachMagazineTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'bubble-minimal': return <BubbleMinimalTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'editorial-bold': return <EditorialBoldTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'pastel-pro': return <PastelProTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'mono-statement': return <MonoStatementTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'neon-modern': return <NeonModernTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'ink-elegant': return <InkElegantTemplate cv={displayData} {...overrides} locale={locale} />;
      case 'green-fresh': return <GreenFreshTemplate cv={displayData} {...overrides} locale={locale} />;
      default: return <ModernoTemplate cv={displayData} {...overrides} locale={locale} />;
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;

    const updateScale = () => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nextScale = Math.min(rect.width / MINI_PAGE_WIDTH, rect.height / MINI_PAGE_HEIGHT);
      setScale(Math.max(0.1, Math.min(1, nextScale)));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full aspect-[794/1123] bg-white overflow-hidden border border-slate-200 shadow-sm relative rounded-lg group-hover:shadow-md transition-shadow"
    >
      <div
        className="origin-top-left pointer-events-none select-none"
        style={{
          width: `${MINI_PAGE_WIDTH}px`,
          height: `${MINI_PAGE_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {renderTemplate()}
      </div>
      <div className="absolute inset-0 bg-transparent z-10" />
    </div>
  );
}
