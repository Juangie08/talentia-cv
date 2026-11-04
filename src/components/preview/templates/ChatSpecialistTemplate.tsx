'use client';

import { MessageSquare } from 'lucide-react';
import { CustomTemplateProps } from './shared';
import { RoleStyle, RoleTemplateLayout } from './RoleTemplate';

const CHAT_SPECIALIST_STYLE: RoleStyle = {
  accent: '#0EA5E9',
  accentDark: '#0369A1',
  accentLight: '#E0F2FE',
  baseBackground: '#f3f9ff',
  fontFamily: "'Manrope', sans-serif",
};

export default function ChatSpecialistTemplate(props: CustomTemplateProps) {
  return (
    <RoleTemplateLayout
      {...props}
      roleName="Soporte Chat"
      tagline="Conversaciones efectivas"
      style={CHAT_SPECIALIST_STYLE}
      icon={MessageSquare}
    />
  );
}
