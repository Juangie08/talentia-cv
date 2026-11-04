'use client';

import { Palette } from 'lucide-react';
import { RoleTemplateLayout } from './RoleTemplate';
import { CustomTemplateProps } from './shared';

/** Pastel Pro — moderno y suave en tonos lavanda, apto para filtros ATS. */
export default function PastelProTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Pastel Pro"
      tagline="Moderno · ATS friendly"
      icon={Palette}
      style={{
        accent: '#8B5CF6',
        accentDark: '#6D28D9',
        accentLight: 'rgba(139, 92, 246, 0.12)',
        baseBackground: '#FDFCFF',
        fontFamily: '"Outfit", sans-serif',
      }}
    />
  );
}
