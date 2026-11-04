'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Info, Save, Cpu } from 'lucide-react';
import { AIConfig, getAIConfig, saveAIConfig, Provider } from '@/lib/aiClient';
import { toast } from 'sonner';
import { useUiText } from '@/lib/i18n/uiText';

function hasRequiredKey(config: AIConfig): boolean {
  if (config.provider === 'local') return true;
  if (config.provider === 'gemini') return Boolean(config.geminiApiKey?.trim());
  if (config.provider === 'openai') return Boolean(config.openaiApiKey?.trim());
  if (config.provider === 'zai') return Boolean(config.zaiApiKey?.trim());
  return false;
}

export default function ApiConfigDialog() {
  const tr = useUiText();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AIConfig>({ provider: 'local' });

  useEffect(() => {
    if (isOpen) {
      setConfig(getAIConfig());
    }
  }, [isOpen]);

  const mergeConfig = useCallback((partial: Partial<AIConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSave = useCallback(() => {
    if (!hasRequiredKey(config)) {
      toast.error(tr('Este proveedor requiere API key para funcionar.'));
      return;
    }

    saveAIConfig(config);
    toast.success(`Proveedor actualizado a ${config.provider}`);
    setIsOpen(false);
  }, [config]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-500 hover:text-blue-600 gap-1.5 font-medium"
          aria-label={tr('Configurar proveedor de IA')}
          title={tr('Configurar IA')}
        >
          <Cpu className="w-4 h-4" aria-hidden="true" />
          IA
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-blue-600" aria-hidden="true" />
            Configurar asistente de IA
          </DialogTitle>
          <DialogDescription className="text-xs bg-blue-50 text-blue-900/80 p-3 rounded-xl mt-3 border border-blue-100">
            {tr('Configura tu proveedor de IA cuando lo necesites.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-6">
          <div className="space-y-2.5">
            <Label id="provider-label" className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Proveedor de IA
            </Label>
            <Select value={config.provider} onValueChange={(value: Provider) => mergeConfig({ provider: value })}>
              <SelectTrigger className="h-11 rounded-xl shadow-none focus:ring-blue-500" aria-labelledby="provider-label">
                <SelectValue placeholder={tr('Selecciona un motor')} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="local">{tr('Mejorador basico (gratis)')}</SelectItem>
                <SelectItem value="gemini">{tr('Google Gemini (recomendado)')}</SelectItem>
                <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                <SelectItem value="zai">Z.ai</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
              <Info className="w-3 h-3" aria-hidden="true" />
              {tr('Si usas un proveedor externo, necesitas tu propia API key.')}
            </p>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
            {config.provider === 'gemini' && (
              <div className="space-y-2">
                <Label htmlFor="gemini-key" className="text-xs font-bold">Gemini API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder={tr('Obtenla en Google AI Studio...')}
                  value={config.geminiApiKey || ''}
                  onChange={(event) => mergeConfig({ geminiApiKey: event.target.value })}
                  className="rounded-xl h-11"
                  aria-describedby="gemini-help"
                />
                <p id="gemini-help" className="text-[10px] text-slate-400">
                  {tr('Excelente para resumenes y logros profesionales.')}
                </p>
              </div>
            )}

            {config.provider === 'openai' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="openai-key" className="text-xs font-bold">OpenAI API Key (sk-...)</Label>
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={config.openaiApiKey || ''}
                    onChange={(event) => mergeConfig({ openaiApiKey: event.target.value })}
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openai-model" className="text-xs font-bold">{tr('Modelo')}</Label>
                  <Input
                    id="openai-model"
                    placeholder="gpt-4o-mini o gpt-4.1-mini"
                    value={config.model || 'gpt-4o-mini'}
                    onChange={(event) => mergeConfig({ model: event.target.value })}
                    className="rounded-xl h-11"
                  />
                </div>
              </>
            )}

            {config.provider === 'zai' && (
              <div className="space-y-2">
                <Label htmlFor="zai-key" className="text-xs font-bold">Z.ai API Key</Label>
                <Input
                  id="zai-key"
                  type="password"
                  placeholder={tr('Pega tu llave de Z.ai...')}
                  value={config.zaiApiKey || ''}
                  onChange={(event) => mergeConfig({ zaiApiKey: event.target.value })}
                  className="rounded-xl h-11"
                />
              </div>
            )}

            {config.provider === 'local' && (
              <div className="py-8 text-center bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200" role="status" aria-live="polite">
                <Cpu className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs text-slate-500 font-medium px-6 leading-relaxed">
                  Mejorador basico activado. Puedes cambiar a un proveedor externo cuando quieras.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 w-full rounded-xl h-11 font-bold"
          >
            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
            Aplicar configuracion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
