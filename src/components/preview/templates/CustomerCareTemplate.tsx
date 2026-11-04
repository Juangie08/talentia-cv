'use client';

import { PhoneCall } from 'lucide-react';
import { CustomTemplateProps } from './shared';
import { RoleStyle, RoleTemplateLayout } from './RoleTemplate';

const CUSTOMER_CARE_STYLE: RoleStyle = {
  accent: '#F97316',
  accentDark: '#C2410C',
  accentLight: '#FFF7ED',
  baseBackground: '#fffdf6',
  fontFamily: "'Manrope', sans-serif",
};

export default function CustomerCareTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Atención al Cliente"
      tagline="Resolución ágil"
      style={CUSTOMER_CARE_STYLE}
      icon={PhoneCall}
    />
  );
}
