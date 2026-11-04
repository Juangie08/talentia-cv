'use client';

import { Palette } from 'lucide-react';
import { CustomTemplateProps } from './shared';
import { RoleStyle, RoleTemplateLayout } from './RoleTemplate';

const DESIGNER_STYLE: RoleStyle = {
  accent: '#C026D3',
  accentDark: '#7C2DAD',
  accentLight: '#F5E8FF',
  baseBackground: '#fff9fe',
  fontFamily: "'Space Grotesk', sans-serif",
};

export default function VisualDesignerTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Diseñador"
      tagline="Impacto visual"
      style={DESIGNER_STYLE}
      icon={Palette}
    />
  );
}
