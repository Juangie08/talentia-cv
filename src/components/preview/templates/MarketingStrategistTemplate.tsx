'use client';

import { Megaphone } from 'lucide-react';
import { CustomTemplateProps } from './shared';
import { RoleStyle, RoleTemplateLayout } from './RoleTemplate';

const MARKETING_STYLE: RoleStyle = {
  accent: '#F43F5E',
  accentDark: '#B91C1C',
  accentLight: '#FFF1F2',
  baseBackground: '#fff6f8',
  fontFamily: "'Poppins', sans-serif",
};

export default function MarketingStrategistTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Marketing"
      tagline="Estrategia magnética"
      style={MARKETING_STYLE}
      icon={Megaphone}
    />
  );
}
