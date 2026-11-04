'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Github, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/LocaleProvider';
import { SITE } from '@/lib/site';
import LanguageSwitcher from './LanguageSwitcher';
import { defaultCVData } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavbarProps {
  dark?: boolean;
}

export default function Navbar({ dark = false }: NavbarProps) {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    router.prefetch('/editor');
  }, [router]);

  const handleStartFromScratch = () => {
    localStorage.setItem('talentia-cv-data', JSON.stringify(defaultCVData));
    router.push('/editor');
  };

  const iconButtonClass = `flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
    dark
      ? 'text-slate-300 hover:bg-white/10 hover:text-white'
      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
  }`;

  return (
    <nav
      className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
        dark
          ? 'border-white/10 bg-slate-950/40 text-white'
          : 'border-slate-200 bg-white/80 text-slate-900'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="flex items-center gap-3" aria-label={t('nav.home')}>
          <div className="relative flex h-9 w-9 items-center justify-center">
            <span className="logo-orb" aria-hidden="true" />
            <Image
              src="/img/LogoSF.png"
              alt={SITE.name}
              width={36}
              height={36}
              className="relative z-10 h-9 w-9 object-contain drop-shadow"
              priority={dark}
            />
          </div>
          <span className="text-lg font-black uppercase italic tracking-tight text-gold-shine">
            {SITE.name}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher dark={dark} className="hidden sm:inline-flex" />

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={SITE.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('nav.star')}
                  className={iconButtonClass}
                >
                  <Github className="h-5 w-5" aria-hidden="true" />
                </a>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 text-white">
                <p>{t('nav.star')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <a
            href={SITE.contributingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`hidden items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors lg:inline-flex ${
              dark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            {t('nav.contribute')}
          </a>

          <LanguageSwitcher dark={dark} className="sm:hidden" />

          <Button
            onClick={handleStartFromScratch}
            className={`rounded-xl text-xs font-black uppercase tracking-tight h-9 ${
              dark
                ? 'bg-white text-slate-950 hover:bg-slate-200'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {t('nav.start')}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
