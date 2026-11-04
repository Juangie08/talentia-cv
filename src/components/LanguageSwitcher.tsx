'use client';

import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n/LocaleProvider';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config';

interface LanguageSwitcherProps {
  /** Ajusta los colores a fondos oscuros (navbar de la landing). */
  dark?: boolean;
  className?: string;
}

/**
 * Selector manual de idioma. La primera visita se resuelve sola con el idioma
 * del navegador; este control sirve para cambiarlo cuando el visitante quiera.
 */
export default function LanguageSwitcher({ dark = false, className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={`inline-flex items-center gap-0.5 rounded-full border p-0.5 ${
        dark ? 'border-white/15 bg-white/5' : 'border-slate-200 bg-slate-100/80'
      } ${className}`}
    >
      <Languages
        className={`ml-1.5 mr-0.5 h-3.5 w-3.5 ${dark ? 'text-slate-400' : 'text-slate-400'}`}
        aria-hidden="true"
      />
      {LOCALES.map((code) => {
        const isActive = locale === code;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            onClick={() => setLocale(code)}
            aria-pressed={isActive}
            title={LOCALE_LABELS[code]}
            className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              isActive
                ? dark
                  ? 'bg-white text-slate-950'
                  : 'bg-slate-900 text-white'
                : dark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
