'use client';

import { useCallback, useEffect, useState } from 'react';
import { Gauge, Info, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useUiText } from '@/lib/i18n/uiText';

interface UsageSummary {
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
  model: string;
  registered: boolean;
  unlimited?: boolean;
  perMinuteLimit?: number;
}

/**
 * Indicador del asistente: sin cuentas ni cuotas diarias. Solo explica el
 * límite por minuto que protege el servicio de abusos.
 */
export default function AiUsageBadge() {
  const tr = useUiText();
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/usage', { cache: 'no-store' });
      if (res.ok) setUsage(await res.json());
    } catch {
      // silencio: el badge es informativo, no crítico
    }
  }, []);

  useEffect(() => {
    refresh();
    const onAiUsed = () => refresh();
    window.addEventListener('ai-usage-changed', onAiUsed);
    return () => window.removeEventListener('ai-usage-changed', onAiUsed);
  }, [refresh]);

  const perMinute = usage?.perMinuteLimit ?? 15;

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) refresh(); }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="rounded-full border border-white/10 bg-white/5 px-4 text-white/90 shadow-none hover:bg-white/10 hover:text-white"
        >
          <Gauge className="h-4 w-4 text-emerald-400" />
          <span className="ml-2 hidden lg:inline">{tr('IA libre')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <Sparkles className="h-5 w-5 text-violet-500" />
            {tr('La IA está incluida, sin cuentas ni cuotas')}
          </DialogTitle>
          <DialogDescription className="text-left">
            {tr('No necesitas registrarte: tu hoja de vida vive en tu navegador y la IA funciona igual.')}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">{tr('Protección antiabuso')}</p>
            <p className="text-sm font-black text-emerald-600">{tr('sin cuota diaria')}</p>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-slate-500">
            {tr('Para que alcance para todos hay un límite de {n} peticiones por minuto desde la misma conexión. Si lo alcanzas, espera unos segundos y continúa.', { n: String(perMinute) })}
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
          <p className="text-[11px] leading-snug text-slate-500">
            {tr('La IA es un apoyo: siempre puedes editar todo a mano y exportar en PDF o Word sin restricciones.')}
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={refresh} className="rounded-full">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {tr('Actualizar')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Dispara la actualización del indicador tras usar IA (helper para otros componentes). */
export function notifyAiUsed(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ai-usage-changed'));
  }
}
