'use client';

import { useEffect, useState } from 'react';
import { FileUp, ScanSearch, Download, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useUiText } from '@/lib/i18n/uiText';

const ONBOARDING_KEY = 'talentia.onboarded.v1';

/**
 * Bienvenida la primera vez que el usuario abre el editor. Explica el flujo en
 * 3 pasos con lenguaje simple y no vuelve a aparecer (se guarda en localStorage).
 */
export default function OnboardingDialog() {
  const tr = useUiText();
  const STEPS = [
    {
      icon: FileUp,
      color: 'text-blue-600 bg-blue-50',
      title: tr('Importa tu CV actual'),
      desc: tr('Sube tu hoja de vida en PDF o Word y la IA llena todo por ti. O empieza de cero.'),
    },
    {
      icon: Sparkles,
      color: 'text-violet-600 bg-violet-50',
      title: tr('Completa y mejora'),
      desc: tr('Escribe en los campos de la izquierda. Con "Validar CV" la IA la adapta a la oferta que te interesa.'),
    },
    {
      icon: Download,
      color: 'text-red-600 bg-red-50',
      title: tr('Descarga en PDF'),
      desc: tr('El botón rojo de arriba descarga un PDF profesional que los filtros automáticos sí pueden leer.'),
    },
  ];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) setOpen(true);
    } catch {
      // localStorage no disponible
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // ignore
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      <DialogContent
        aria-describedby="onboarding-desc"
        className="rounded-3xl sm:max-w-[520px]"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg shadow-blue-900/20">
            <Sparkles className="h-7 w-7" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900">{tr('Vamos a crear tu hoja de vida')}</DialogTitle>
          <DialogDescription id="onboarding-desc" className="mt-2 text-sm text-slate-500">
            {tr('Tres pasos simples. Puedes cerrar esta guía cuando quieras y todo se guarda solo.')}
          </DialogDescription>
        </div>

        <div className="mt-4 space-y-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${step.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">
                    <span className="mr-1.5 text-slate-300">{index + 1}.</span>
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-slate-500">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ScanSearch className="h-3.5 w-3.5" />
          {tr('Consejo: usa «Validar CV» para ver si tu hoja de vida cumple las buenas prácticas.')}
        </div>

        <Button onClick={dismiss} className="mt-4 w-full rounded-full bg-gradient-to-r from-violet-600 to-blue-600 py-6 text-base font-bold text-white hover:from-violet-500 hover:to-blue-500">
          {tr('Empezar')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
