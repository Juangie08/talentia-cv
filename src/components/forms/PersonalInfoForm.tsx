'use client';
/* eslint-disable @next/next/no-img-element */

import { PersonalInfo } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, MapPin, Linkedin, Globe, Camera, Upload, Loader2, Trash2, Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SectionHeader from '@/components/editor/SectionHeader';
import SuggestButton from '@/components/editor/SuggestButton';
import { useUiText } from '@/lib/i18n/uiText';

const LEGACY_PHOTO_STORAGE_KEY = 'hdv.localPhoto';
const PHOTO_STORAGE_KEY = 'talentia.photo';

function savePhotoLocally(base64Data: string): void {
  try {
    localStorage.setItem(PHOTO_STORAGE_KEY, base64Data);
  } catch {
    // Storage full or unavailable
  }
}

function loadPhotoLocally(): string | null {
  try {
    const stored = localStorage.getItem(PHOTO_STORAGE_KEY) ?? localStorage.getItem(LEGACY_PHOTO_STORAGE_KEY);
    if (stored && !localStorage.getItem(PHOTO_STORAGE_KEY)) {
      localStorage.setItem(PHOTO_STORAGE_KEY, stored);
    }
    return stored;
  } catch {
    return null;
  }
}

function clearPhotoLocally(): void {
  try {
    localStorage.removeItem(PHOTO_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PHOTO_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

interface Props {
  data: PersonalInfo;
  onChange: (partial: Partial<PersonalInfo>) => void;
  advice?: string;
}

export default function PersonalInfoForm({ data, onChange, advice }: Props) {
  const tr = useUiText();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload - works with or without session
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(tr('Por favor selecciona una imagen valida'));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(tr('La imagen es muy pesada (maximo 2MB)'));
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        // Sin cuentas, la foto vive solo en este navegador.
        savePhotoLocally(base64);
        onChange({ photoUrl: base64 });
        toast.success(tr('Foto guardada'));
        setIsUploading(false);
      };

      reader.onerror = () => {
        toast.error(tr('Error al procesar la imagen'));
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo procesar la foto';
      toast.error(message);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<User className="h-4 w-4" />}
        title={tr('Datos Personales')}
        description={tr('Aquí van tu nombre, cargo actual, medios de contacto, ubicación y foto. Debe permitir que un reclutador te identifique y te contacte rápido.')}
      />

      <div className="space-y-3">
        <div>
          <Label htmlFor="fullName" className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Nombre completo')}</Label>
          <Input
            id="fullName"
            placeholder={tr('Ej: Ana García Rodríguez')}
            value={data.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <div className="flex items-end justify-between gap-3">
            <Label htmlFor="title" className="text-xs uppercase tracking-[0.18em] text-slate-500">{tr('Título profesional')}</Label>
            <SuggestButton
              field="title"
              suggestKey="title"
              context={{ currentText: data.title, skills: [] }}
              onPick={(value) => onChange({ title: value })}
              label={tr('Sugerir')}
              compact
              popoverTitle={tr('Títulos sugeridos')}
            />
          </div>
          <Input
            id="title"
            placeholder={tr('Ej: Diseñadora UX / Ingeniera de Software')}
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />{tr('Email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-xs uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Telefono
            </Label>
            <Input
              id="phone"
              placeholder="+57 300 123 4567"
              value={data.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location" className="text-xs uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Ubicacion
          </Label>
          <Input
            id="location"
            placeholder={tr('Ej: Bogotá, Colombia')}
            value={data.location}
            onChange={(e) => onChange({ location: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="linkedin" className="text-xs uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
            <Linkedin className="w-3 h-3" /> LinkedIn
          </Label>
          <Input
            id="linkedin"
            placeholder="https://linkedin.com/in/tu-perfil"
            value={data.linkedin}
            onChange={(e) => onChange({ linkedin: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="website" className="text-xs uppercase tracking-[0.18em] text-slate-500 flex items-center gap-1">
            <Globe className="w-3 h-3" /> {tr('Sitio web (opcional)')}
          </Label>
          <Input
            id="website"
            placeholder="https://tu-portfolio.com"
            value={data.website}
            onChange={(e) => onChange({ website: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="photoUrl" className="text-xs uppercase tracking-[0.18em] text-slate-500 flex items-center justify-between gap-1">
            <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{tr('Foto')}</span>
            <span className="text-[10px] text-blue-600 font-bold">
              {tr('Básico')}
            </span>
          </Label>

          <div className="flex gap-2 mt-1">
            <Input
              id="photoUrl"
              placeholder={tr('O pega una URL de imagen')}
              value={data.photoUrl?.startsWith('data:') ? '' : data.photoUrl || ''}
              onChange={(e) => onChange({ photoUrl: e.target.value })}
              className="flex-1"
            />
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
                ref={fileInputRef}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isUploading}
                title={tr('Subir foto desde mi equipo')}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {data.photoUrl && (
            <div className="mt-3 flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-fade-in-up">
              <div className="relative group">
                <img
                  src={data.photoUrl}
                  alt={tr('Foto de perfil')}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm transition-transform group-hover:scale-105"
                  onError={(e) => {
                    const localPhoto = loadPhotoLocally();
                    if (localPhoto) {
                      (e.target as HTMLImageElement).src = localPhoto;
                      onChange({ photoUrl: localPhoto });
                    } else {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    onChange({ photoUrl: '' });
                    clearPhotoLocally();
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  {data.photoUrl.startsWith('data:') ? 'GUARDADA' : 'URL'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate italic">
                  {data.photoUrl.startsWith('data:') ? tr('Guardada en esta hoja de vida') : data.photoUrl}
                </p>
              </div>
            </div>
          )}

          {!data.photoUrl && (
            <div className="mt-3 p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center">
              <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-[10px] text-slate-400 font-medium">
                {tr('Sube tu foto para usarla en tu hoja de vida')}
              </p>
              <p className="text-[9px] text-slate-300 mt-1">
                Ajusta el tamano a maximo 2MB
              </p>
            </div>
          )}

          <p className="mt-2 rounded-xl bg-blue-50/60 px-3 py-2 text-[10px] leading-snug text-slate-500">
            <span className="font-bold text-blue-600">{tr('Foto opcional:')}</span> {tr('hoy muchas empresas prefieren CV sin foto. Si la incluyes, que sea reciente, tipo estudio y con fondo neutro; evita recortes de eventos sociales. Nunca pongas direccion exacta, documento ni edad: genera sesgos.')}
          </p>
        </div>
      </div>

      {advice ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
          {tr(advice)}
        </div>
      ) : null}
    </div>
  );
}
