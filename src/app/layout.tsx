import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { Toaster } from 'sonner';
import { Providers } from '@/components/Providers';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  translate,
  type Locale,
  type TranslationKey,
} from '@/lib/i18n';
import { SITE } from '@/lib/site';

/**
 * Idioma activo. Lo resuelve el middleware a partir de `Accept-Language` y lo
 * deja en cookie, de modo que aquí ya sabemos en qué idioma renderizar.
 */
function resolveLocale(): Locale {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
}

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export function generateMetadata(): Metadata {
  const locale = resolveLocale();
  const t = (key: TranslationKey) => translate(locale, key);

  return {
    metadataBase: new URL(SITE.url),
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: t('meta.keywords'),
    applicationName: SITE.name,
    manifest: '/img/favicon_io/site.webmanifest',
    icons: {
      icon: '/img/favicon_io/favicon.ico',
      apple: '/img/favicon_io/apple-touch-icon.png',
      shortcut: '/img/favicon_io/favicon-32x32.png',
    },
    openGraph: {
      type: 'website',
      url: SITE.url,
      siteName: SITE.name,
      title: t('meta.ogTitle'),
      description: t('meta.ogDescription'),
      images: [{ url: '/landing/hero-bg.png', width: 1200, height: 630, alt: SITE.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('meta.ogTitle'),
      description: t('meta.ogDescription'),
      images: ['/landing/hero-bg.png'],
    },
    category: 'productivity',
    creator: SITE.name,
    publisher: SITE.name,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = resolveLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <LocaleProvider initialLocale={locale}>
          <Providers>{children}</Providers>
        </LocaleProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
