'use client';

import { Zap } from 'lucide-react';
import { RoleTemplateLayout } from './RoleTemplate';
import { CustomTemplateProps } from './shared';

/** Neón Moderno — alto impacto con acento lima eléctrico para perfiles tech y creativos. */
export default function NeonModernTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Neón Moderno"
      tagline="Oscuro · Alto impacto"
      icon={Zap}
      style={{
        accent: '#65A30D',
        accentDark: '#3F6212',
        accentLight: 'rgba(101, 163, 13, 0.14)',
        baseBackground: '#FFFFFF',
        fontFamily: '"Outfit", sans-serif',
      }}
    />
  );
}
