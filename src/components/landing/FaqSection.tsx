'use client';

import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useI18n } from '@/lib/i18n/LocaleProvider';
import type { TranslationKey } from '@/lib/i18n';

const FAQ_ITEMS: Array<{ q: TranslationKey; a: TranslationKey }> = [
  { q: 'landing.faq.free.q', a: 'landing.faq.free.a' },
  { q: 'landing.faq.data.q', a: 'landing.faq.data.a' },
  { q: 'landing.faq.ats.q', a: 'landing.faq.ats.a' },
  { q: 'landing.faq.ai.q', a: 'landing.faq.ai.a' },
  { q: 'landing.faq.selfhost.q', a: 'landing.faq.selfhost.a' },
  { q: 'landing.faq.account.q', a: 'landing.faq.account.a' },
];

/**
 * Preguntas frecuentes. Además de quitar fricción antes de empezar, se publica
 * como datos estructurados (`FAQPage`) para que los buscadores puedan mostrar
 * las respuestas directamente en los resultados.
 */
export default function FaqSection() {
  const { t, locale } = useI18n();

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: locale,
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: t(item.q),
      acceptedAnswer: { '@type': 'Answer', text: t(item.a) },
    })),
  };

  return (
    <section id="faq" className="relative z-10 px-4 py-20">
      <script
        type="application/ld+json"
        // El contenido se genera desde los diccionarios; no hay entrada de usuario.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            {t('landing.faq.eyebrow')}
          </p>
          <h2 className="text-3xl font-black text-white md:text-4xl">{t('landing.faq.title')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">{t('landing.faq.desc')}</p>
        </div>

        <Accordion type="single" collapsible className="rounded-2xl border border-white/10 bg-slate-900/60 px-5">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={item.q}
              value={`faq-${index}`}
              className="border-white/10 last:border-b-0"
            >
              <AccordionTrigger className="text-left text-sm font-bold text-white hover:no-underline md:text-base">
                {t(item.q)}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-slate-300">
                {t(item.a)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
