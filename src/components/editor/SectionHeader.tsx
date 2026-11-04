'use client';

import { ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUiText } from '@/lib/i18n/uiText';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  const tr = useUiText();
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-[11px] text-slate-400">{tr('Completa esta sección con información real y clara.')}</p>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-amber-300 hover:text-amber-500"
            aria-label={`Ayuda sobre ${title}`}
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs bg-slate-900 text-xs text-white">
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
