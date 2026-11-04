'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Briefcase, Zap } from 'lucide-react';
import { useUiText } from '@/lib/i18n/uiText';

export default function HelpDialog() {
  const tr = useUiText();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="hidden sm:flex text-slate-500 hover:text-blue-600 gap-1.5">
          <HelpCircle className="w-4 h-4" />
          {tr('Ayuda')}
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="w-6 h-6 text-blue-500" />
            Guia de Uso - Talentia
          </DialogTitle>
          <DialogDescription>
            {tr('Crea y mejora tu hoja de vida profesional para imprimir o enviar por correo.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <section className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Como uso esta herramienta?
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-3 p-3 rounded-lg border bg-slate-50/50">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">1</div>
                <div>
                  <p className="text-sm font-semibold">{tr('Carga tus datos')}</p>
                  <p className="text-xs text-slate-500">{tr('Puedes subir un PDF o Word desde el inicio para autocompletar el formulario, o empezar de cero editando cada seccion.')}</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-lg border bg-slate-50/50">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">2</div>
                <div>
                  <p className="text-sm font-semibold">{tr('Mejora el contenido')}</p>
                  <p className="text-xs text-slate-500">{tr('Usa el botón "IA" para profesionalizar tus frases. Incluso sin configurar una API, la herramienta usará sugerencias básicas inteligentes.')}</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-lg border bg-slate-50/50">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600 font-bold text-sm">3</div>
                <div>
                  <p className="text-sm font-semibold">{tr('Elige un diseno y exporta')}</p>
                  <p className="text-xs text-slate-500">{tr('Prueba los diferentes estilos y descarga tu documento final en Word o PDF.')}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Recomendado para Profesionales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 border rounded-lg text-center space-y-1">
                <p className="font-bold text-xs">{tr('Seniority')}</p>
                <p className="text-[10px] text-slate-500">{tr('Enfocate en resultados, metricas y logros clave en cada rol.')}</p>
              </div>
              <div className="p-3 border rounded-lg text-center space-y-1">
                <p className="font-bold text-xs">{tr('Primer Empleo')}</p>
                <p className="text-[10px] text-slate-500">{tr('Resalta tu formacion, proyectos personales y habilidades.')}</p>
              </div>
              <div className="p-3 border rounded-lg text-center space-y-1">
                <p className="font-bold text-xs">{tr('Cambio de Rol')}</p>
                <p className="text-[10px] text-slate-500">{tr('Muestra tus habilidades transferibles y adaptabilidad.')}</p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-amber-500" />
              No tienes API Keys?
            </h3>
            <p className="text-xs text-slate-500">
              {tr('No pasa nada. La herramienta puede mejorar tu texto de forma basica sin usar IA externa.')}
            </p>
          </section>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">{tr('Entendido')}</Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
}
