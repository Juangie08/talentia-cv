'use client';

import { Flower2 } from 'lucide-react';
import { RoleTemplateLayout } from './RoleTemplate';
import { CustomTemplateProps } from './shared';

export default function SakuraBloomTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Kawaii Profesional"
      tagline="Ligera · ATS friendly"
      icon={Flower2}
      style={{
        accent: '#E88AAE',
        accentDark: '#B85C7C',
        accentLight: 'rgba(232, 138, 174, 0.16)',
        baseBackground: '#fffafc',
        fontFamily: '"Manrope", sans-serif',
      }}
    />
  );
}
