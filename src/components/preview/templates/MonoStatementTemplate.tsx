'use client';

import { Boxes } from 'lucide-react';
import { RoleTemplateLayout } from './RoleTemplate';
import { CustomTemplateProps } from './shared';

/** Mono Statement — tipografía geométrica en grises con acento cian vivo. */
export default function MonoStatementTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Mono Statement"
      tagline="Geométrico · Contraste"
      icon={Boxes}
      style={{
        accent: '#0891B2',
        accentDark: '#155E75',
        accentLight: 'rgba(8, 145, 178, 0.10)',
        baseBackground: '#FFFFFF',
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    />
  );
}
