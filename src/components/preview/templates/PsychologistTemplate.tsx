'use client';

import { Brain } from 'lucide-react';
import { CustomTemplateProps } from './shared';
import { RoleStyle, RoleTemplateLayout } from './RoleTemplate';

const PSYCHOLOGIST_STYLE: RoleStyle = {
  accent: '#F472B6',
  accentDark: '#BE185D',
  accentLight: '#FEF2F2',
  baseBackground: '#ffffff',
  fontFamily: "'Manrope', sans-serif",
};

export default function PsychologistTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Psicólogo"
      tagline="Empatía profesional"
      style={PSYCHOLOGIST_STYLE}
      icon={Brain}
    />
  );
}
