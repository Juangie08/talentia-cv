'use client';

import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // PWA: registra el service worker solo en producción. Si falla (navegador
  // sin soporte, HTTP local), la app sigue funcionando igual sin offline.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return <>{children}</>;
}
