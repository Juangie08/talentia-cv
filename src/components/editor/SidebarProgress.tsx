'use client';

import { CheckCircle2 } from 'lucide-react';
import { CompletionSummary } from '@/lib/editor-metrics';
import { useUiText } from '@/lib/i18n/uiText';

interface SidebarProgressProps {
  summary: CompletionSummary;
  celebrate: boolean;
}

function getProgressTone(percent: number) {
  if (percent >= 100) {
    return {
      bar: 'from-emerald-400 via-emerald-500 to-lime-500',
      badge: 'text-emerald-700',
    };
  }
  if (percent >= 71) {
    return {
      bar: 'from-emerald-300 via-emerald-400 to-green-500',
      badge: 'text-emerald-700',
    };
  }
  if (percent >= 41) {
    return {
      bar: 'from-amber-300 via-amber-400 to-amber-500',
      badge: 'text-amber-700',
    };
  }
  return {
    bar: 'from-orange-300 via-orange-400 to-rose-400',
    badge: 'text-orange-700',
  };
}

export default function SidebarProgress({ summary, celebrate }: SidebarProgressProps) {
  const tr = useUiText();
  const tone = getProgressTone(summary.percent);
  const progressWidth = `${summary.percent}%`;

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{tr('Progreso del CV')}</p>
        <span className={`text-sm font-semibold ${tone.badge}`}>
          {summary.percent}% {tr('completado')}
        </span>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-[width] duration-700 ease-out`}
          style={{ width: progressWidth }}
        />
      </div>

      <div className="mt-2 min-h-[20px] text-xs text-slate-500">
        {summary.isReadyToExport ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {tr('¡Tu CV está listo para exportar!')}
          </span>
        ) : (
          <span>
            {tr('Faltan:')} {summary.missing.slice(0, 3).map((item) => tr(item)).join(', ')}
            {summary.missing.length > 3 ? '...' : ''}
          </span>
        )}
      </div>

      {celebrate && summary.isReadyToExport ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="relative mt-1 h-8 w-20">
            {Array.from({ length: 12 }).map((_, index) => (
              <span
                key={index}
                className="absolute top-1/2 h-2 w-1 rounded-full opacity-80 animate-[confettiBurst_1.8s_ease-out_forwards]"
                style={{
                  left: '50%',
                  backgroundColor: ['#f59e0b', '#22c55e', '#10b981', '#fde047'][index % 4],
                  transform: `rotate(${index * 30}deg) translateY(-12px)`,
                  animationDelay: `${index * 40}ms`,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
