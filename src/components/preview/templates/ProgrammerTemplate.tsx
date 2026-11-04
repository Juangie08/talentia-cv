'use client';

import { Code } from 'lucide-react';
import { CustomTemplateProps } from './shared';
import { RoleStyle, RoleTemplateLayout } from './RoleTemplate';

const PROGRAMMER_STYLE: RoleStyle = {
  accent: '#14B8A6',
  accentDark: '#0F766E',
  accentLight: '#ECFEFF',
  baseBackground: '#F7FEFF',
  fontFamily: "'Space Grotesk', sans-serif",
};

export default function ProgrammerTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Programador"
      tagline="Código con propósito"
      style={PROGRAMMER_STYLE}
      icon={Code}
    />
  );
}
