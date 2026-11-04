'use client';

import { Leaf } from 'lucide-react';
import { RoleTemplateLayout } from './RoleTemplate';
import { CustomTemplateProps } from './shared';

/** Green Fresh — fresco y natural con acentos jade, claro y ATS friendly. */
export default function GreenFreshTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Green Fresh"
      tagline="Natural · Ligera"
      icon={Leaf}
      style={{
        accent: '#059669',
        accentDark: '#065F46',
        accentLight: 'rgba(5, 150, 105, 0.12)',
        baseBackground: '#FFFFFF',
        fontFamily: '"Outfit", sans-serif',
      }}
    />
  );
}
