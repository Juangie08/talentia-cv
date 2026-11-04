'use client';

import { Feather } from 'lucide-react';
import { RoleTemplateLayout } from './RoleTemplate';
import { CustomTemplateProps } from './shared';

/** Ink Elegant — elegancia monocromática con serif editorial. */
export default function InkElegantTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Ink Elegant"
      tagline="Monocromo · Serif"
      icon={Feather}
      style={{
        accent: '#111827',
        accentDark: '#030712',
        accentLight: 'rgba(17, 24, 39, 0.08)',
        baseBackground: '#FFFFFF',
        fontFamily: '"Playfair Display", serif',
      }}
    />
  );
}
