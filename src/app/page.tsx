'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Zap,
  Globe,
  PenLine,
  Github,
  Scale,
  Server,
  GitPullRequest,
  Heart,
  ShieldCheck,
  BadgeCheck,
  UserPlus,
  FileCheck2,
} from 'lucide-react';
import { importCVFromFile, importCVFromText } from '@/lib/importCV';
import { defaultCVData } from '@/lib/types';
import {
  getBaseTemplateMeta,
  localizeTemplateMeta,
  type BaseTemplateMeta,
} from '@/lib/templates';
import { OSS_STACK, SITE } from '@/lib/site';
import { useI18n } from '@/lib/i18n/LocaleProvider';
import type { TranslationKey } from '@/lib/i18n';
import Navbar from '@/components/Navbar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
// Secciones bajo el pliegue: se cargan diferido para aligerar el primer pintado.
const DemoFlow = dynamic(() => import('@/components/landing/DemoFlow'));
const FaqSection = dynamic(() => import('@/components/landing/FaqSection'));

// Plantillas destacadas en la galería de la landing (por id).
const FEATURED_TEMPLATE_IDS = ['moderno', 'minimalista', 'software-engineer', 'sakura-bloom', 'ejecutivo', 'creative-pro'];
const FEATURED_TEMPLATES: BaseTemplateMeta[] = FEATURED_TEMPLATE_IDS
  .map((id) => getBaseTemplateMeta(id))
  .filter((meta): meta is BaseTemplateMeta => Boolean(meta));

const FEATURES: Array<{ icon: typeof Zap; title: TranslationKey; desc: TranslationKey }> = [
  { icon: Zap, title: 'landing.features.free.title', desc: 'landing.features.free.desc' },
  { icon: Sparkles, title: 'landing.features.ai.title', desc: 'landing.features.ai.desc' },
  { icon: Globe, title: 'landing.features.adapt.title', desc: 'landing.features.adapt.desc' },
  { icon: Download, title: 'landing.features.export.title', desc: 'landing.features.export.desc' },
  { icon: Server, title: 'landing.features.selfhost.title', desc: 'landing.features.selfhost.desc' },
  { icon: CheckCircle2, title: 'landing.features.nosignup.title', desc: 'landing.features.nosignup.desc' },
];

const STEPS: Array<{ step: string; title: TranslationKey; desc: TranslationKey }> = [
  { step: '01', title: 'landing.steps.one.title', desc: 'landing.steps.one.desc' },
  { step: '02', title: 'landing.steps.two.title', desc: 'landing.steps.two.desc' },
  { step: '03', title: 'landing.steps.three.title', desc: 'landing.steps.three.desc' },
];

const TRUST_ITEMS: Array<{ icon: typeof ShieldCheck; title: TranslationKey; desc: TranslationKey }> = [
  { icon: ShieldCheck, title: 'landing.trust.privacy.title', desc: 'landing.trust.privacy.desc' },
  { icon: BadgeCheck, title: 'landing.trust.free.title', desc: 'landing.trust.free.desc' },
  { icon: UserPlus, title: 'landing.trust.accounts.title', desc: 'landing.trust.accounts.desc' },
  { icon: FileCheck2, title: 'landing.trust.ats.title', desc: 'landing.trust.ats.desc' },
];

const OSS_CARDS: Array<{ icon: typeof Scale; title: TranslationKey; desc: TranslationKey }> = [
  { icon: Scale, title: 'landing.oss.license.title', desc: 'landing.oss.license.desc' },
  { icon: Server, title: 'landing.oss.selfhost.title', desc: 'landing.oss.selfhost.desc' },
  { icon: GitPullRequest, title: 'landing.oss.contribute.title', desc: 'landing.oss.contribute.desc' },
];

export default function LandingPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [narrativeText, setNarrativeText] = useState('');
  const [isNarrativeProcessing, setIsNarrativeProcessing] = useState(false);
  const [narrativeError, setNarrativeError] = useState('');

  useEffect(() => {
    router.prefetch('/editor');
  }, [router]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsProcessing(true);
      setError('');

      try {
        const result = await importCVFromFile(file);
        localStorage.setItem('talentia-cv-data', JSON.stringify(result.data));
        if (result.source !== 'regex') {
          sessionStorage.setItem('talentia-import-note', 'auto');
        }
        router.push('/editor');
      } catch (requestError) {
        console.error(requestError);
        setError(
          requestError instanceof Error && requestError.message
            ? requestError.message
            : t('landing.upload.error'),
        );
        setIsProcessing(false);
      }
    },
    [router, t],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const handleStartFromScratch = () => {
    localStorage.setItem('talentia-cv-data', JSON.stringify(defaultCVData));
    router.push('/editor');
  };

  const handleNarrativeImport = async () => {
    setIsNarrativeProcessing(true);
    setNarrativeError('');
    try {
      const result = await importCVFromText(narrativeText);
      localStorage.setItem('talentia-cv-data', JSON.stringify(result.data));
      sessionStorage.setItem('talentia-import-note', 'auto');
      router.push('/editor');
    } catch (requestError) {
      setNarrativeError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : t('landing.narrative.error'),
      );
      setIsNarrativeProcessing(false);
    }
  };

  const featuredTemplates = FEATURED_TEMPLATES.map((template) =>
    localizeTemplateMeta(template, locale),
  );

  const primaryButtonClass =
    'h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 text-white shadow-lg shadow-blue-900/30 hover:from-blue-600 hover:to-indigo-600 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image src="/landing/hero-bg.png" alt="" fill priority sizes="100vw" className="object-cover opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/60 to-slate-950" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.30),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(79,70,229,0.25),transparent_35%),radial-gradient(circle_at_40%_70%,rgba(30,64,175,0.20),transparent_40%)]" />

      <Navbar dark />

      <section className="relative z-10 px-4 pb-20 pt-16 md:pt-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="animate-fade-in-up lg:row-span-2">
              <a
                href={SITE.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-100 transition-colors hover:border-emerald-200/60 hover:bg-emerald-500/25"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                {t('landing.badge')}
              </a>

              <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-white md:text-6xl">
                {t('landing.hero.titleTop')}
                <span className="block bg-gradient-to-r from-blue-300 via-blue-200 to-indigo-200 bg-clip-text text-transparent">
                  {t('landing.hero.titleAccent')}
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                {t('landing.hero.subtitle')}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button onClick={handleStartFromScratch} size="lg" className={primaryButtonClass}>
                  {t('landing.hero.cta')}
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
                <a
                  href={SITE.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  {t('landing.hero.repo')}
                </a>
              </div>

              <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 flex-none text-emerald-300" aria-hidden="true" />
                {t('landing.hero.microcopy')}
              </p>
            </div>

            <Card
              {...getRootProps()}
              className={`relative border-2 p-8 transition-all duration-300 motion-safe:hover:-translate-y-0.5 ${
                isDragActive
                  ? 'border-blue-300 bg-blue-500/20 shadow-xl shadow-blue-900/30'
                  : 'border-white/15 bg-slate-900/70 hover:border-indigo-300/50 hover:shadow-xl hover:shadow-indigo-900/30'
              } ${isProcessing ? 'pointer-events-none opacity-75' : 'cursor-pointer'}`}
            >
              <input {...getInputProps()} />
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-900/50">
                {isProcessing ? (
                  <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden="true" />
                ) : (
                  <Upload className="h-8 w-8 text-white" aria-hidden="true" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white">
                {isProcessing ? t('landing.upload.titleLoading') : t('landing.upload.title')}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {isDragActive ? t('landing.upload.descActive') : t('landing.upload.desc')}
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">PDF</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">DOCX</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">TXT</span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">JPG / PNG</span>
                <span className="rounded-full border border-blue-300/30 bg-blue-500/20 px-3 py-1 text-blue-100">
                  {t('landing.upload.badgeAi')}
                </span>
              </div>
            </Card>

            <Card className="relative border-2 border-white/15 bg-slate-900/70 p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-fuchsia-900/50">
                <PenLine className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-white">{t('landing.narrative.title')}</h2>
              <p className="mt-2 text-sm text-slate-300">{t('landing.narrative.desc')}</p>
              <Textarea
                value={narrativeText}
                onChange={(event) => setNarrativeText(event.target.value)}
                placeholder={t('landing.narrative.placeholder')}
                rows={4}
                disabled={isNarrativeProcessing}
                className="mt-4 resize-none rounded-2xl border-white/15 bg-white/5 text-sm text-white placeholder:text-slate-500"
              />
              <Button
                onClick={handleNarrativeImport}
                disabled={isNarrativeProcessing || narrativeText.trim().length < 40}
                className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-900/30 hover:from-violet-400 hover:to-fuchsia-400"
              >
                {isNarrativeProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    {t('landing.narrative.ctaLoading')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t('landing.narrative.cta')}
                  </>
                )}
              </Button>
              {narrativeError ? (
                <div className="mt-3 rounded-xl border border-red-300/40 bg-red-500/15 px-3 py-2 text-xs text-red-100" role="alert">
                  {narrativeError}
                </div>
              ) : null}
            </Card>
          </div>

          {error && (
            <div className="mt-6 max-w-xl rounded-xl border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm text-red-100" role="alert">
              {error}
            </div>
          )}

          {/* Confianza: las dudas reales antes de empezar, resueltas de entrada. */}
          <div className="mt-14 grid gap-6 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-200">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{t(item.title)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{t(item.desc)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-slate-900/40 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              {t('landing.features.eyebrow')}
            </p>
            <h2 className="text-3xl font-black text-white md:text-4xl">{t('landing.features.title')}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden border-white/10 bg-slate-900/60 p-5 transition-all duration-500 motion-safe:hover:-translate-y-1.5 hover:border-blue-300/40 hover:shadow-2xl hover:shadow-blue-950/40"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-blue-100">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-white">{t(feature.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{t(feature.desc)}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <DemoFlow onStart={handleStartFromScratch} />

      {/* Sección open source: el corazón de la propuesta del proyecto. */}
      <section id="open-source" className="relative z-10 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                <Github className="h-4 w-4" aria-hidden="true" />
                {t('landing.oss.eyebrow')}
              </p>
              <h2 className="text-3xl font-black text-white md:text-4xl">{t('landing.oss.title')}</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
                {t('landing.oss.desc')}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={SITE.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-200"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  {t('landing.oss.cta.repo')}
                </a>
                <a
                  href={SITE.contributingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/40 hover:text-white"
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  {t('landing.oss.cta.contribute')}
                </a>
                <a
                  href={SITE.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  <Scale className="h-4 w-4" aria-hidden="true" />
                  {t('landing.oss.cta.license')}
                </a>
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <p className="text-sm font-bold text-white">{t('landing.oss.stack.title')}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{t('landing.oss.stack.desc')}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {OSS_STACK.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {OSS_CARDS.map((card) => {
                const Icon = card.icon;
                const isWide = card.title === 'landing.oss.contribute.title';
                return (
                  <Card
                    key={card.title}
                    className={`border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/50 p-6 ${
                      isWide ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-blue-500/25 text-emerald-100">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-white">{t(card.title)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{t(card.desc)}</p>

                    {isWide ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        <a
                          href={SITE.newIssueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-white/35 hover:text-white"
                        >
                          <GitPullRequest className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('landing.footer.issues')}
                        </a>
                        <a
                          href={SITE.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-white/35 hover:text-white"
                        >
                          <Github className="h-3.5 w-3.5" aria-hidden="true" />
                          {t('nav.star')}
                        </a>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-slate-900/40 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              {t('landing.steps.eyebrow')}
            </p>
            <h2 className="text-3xl font-black text-white md:text-4xl">{t('landing.steps.title')}</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((item) => (
              <Card
                key={item.step}
                className="group overflow-hidden border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/50 p-6 transition-all duration-500 motion-safe:hover:-translate-y-2 hover:border-blue-300/40"
              >
                <div className="mb-5 h-1.5 w-14 rounded-full bg-gradient-to-r from-blue-400/80 to-indigo-400/80" />
                <div>
                  <p className="text-4xl font-black leading-none text-blue-300/70">{item.step}</p>
                  <h3 className="mt-4 text-lg font-bold text-white">{t(item.title)}</h3>
                  <p className="mt-2 text-sm text-slate-300">{t(item.desc)}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Button onClick={handleStartFromScratch} size="lg" className={`${primaryButtonClass} px-8`}>
              <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
              {t('landing.steps.cta')}
            </Button>
          </div>
        </div>
      </section>

      <section id="templates" className="relative z-10 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              {t('landing.templates.eyebrow')}
            </p>
            <h2 className="text-3xl font-black text-white md:text-4xl">{t('landing.templates.title')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">{t('landing.templates.desc')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {featuredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={handleStartFromScratch}
                className="group flex flex-col items-stretch overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 text-left transition-all duration-300 hover:-translate-y-1 hover:border-blue-300/40 hover:shadow-xl hover:shadow-blue-950/40"
              >
                <div
                  className="flex h-28 items-end p-3"
                  style={{ background: `linear-gradient(135deg, ${template.colors[0]}, ${template.colors[1]})` }}
                >
                  <div className="w-full space-y-1.5 rounded-lg bg-white/95 p-2.5 shadow-sm">
                    <div className="h-2 w-2/3 rounded-full" style={{ background: template.colors[0] }} />
                    <div className="h-1.5 w-full rounded-full bg-slate-200" />
                    <div className="h-1.5 w-5/6 rounded-full bg-slate-200" />
                    <div className="h-1.5 w-1/2 rounded-full bg-slate-200" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-white">{template.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-400">
                    {template.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <FaqSection />

      <footer className="relative z-10 border-t border-white/10 bg-slate-950/80 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <Link href="/" className="flex items-center gap-2" aria-label={SITE.name}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                  <FileText className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <span className="text-base font-semibold text-gold-shine">{SITE.name}</span>
              </Link>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
                {t('landing.footer.tagline')}
              </p>
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t('common.language')}
                </p>
                <LanguageSwitcher dark />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                {t('landing.footer.product')}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={handleStartFromScratch}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {t('landing.footer.start')}
                  </button>
                </li>
                <li>
                  <a href="#templates" className="text-slate-400 transition-colors hover:text-white">
                    {t('landing.footer.templates')}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-slate-400 transition-colors hover:text-white">
                    {t('landing.footer.faq')}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                {t('landing.footer.project')}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href={SITE.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {t('landing.footer.repo')}
                  </a>
                </li>
                <li>
                  <a
                    href={SITE.contributingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {t('landing.footer.contribute')}
                  </a>
                </li>
                <li>
                  <a
                    href={SITE.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {t('landing.footer.license')}
                  </a>
                </li>
                <li>
                  <a
                    href={SITE.newIssueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {t('landing.footer.issues')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 md:flex-row">
            <p>
              © {new Date().getFullYear()} {SITE.name} · {t('landing.footer.rights')}
            </p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              {t('landing.hero.note')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
