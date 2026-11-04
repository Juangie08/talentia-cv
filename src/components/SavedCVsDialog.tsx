'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileBox,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import {
  getProfiles,
  getActiveProfile,
  setActiveProfile,
  createProfile,
  getSavedCVs,
  deleteSavedCV,
  SavedCV,
  LocalProfile,
  MAX_SAVED_CVS_PER_PROFILE,
} from '@/lib/profiles';
import { toast } from 'sonner';
import { useSession } from '@/lib/localSession';
import { useUiText } from '@/lib/i18n/uiText';

interface Props {
  onLoadCV: (cv: SavedCV, source: 'local' | 'server') => void;
  onSaveCurrent: () => void;
  onProfileChange?: () => void;
  canSaveCurrent?: boolean;
}

interface ServerCVResponse {
  id: string;
  name: string;
  updatedAt: string;
  data: string;
}

export default function SavedCVsDialog({ onLoadCV, onSaveCurrent, onProfileChange, canSaveCurrent = false }: Props) {
  const tr = useUiText();
  const [isOpen, setIsOpen] = useState(false);
  const [activeProfile, setActiveProfileLocal] = useState<LocalProfile | null>(null);
  const [profiles, setProfiles] = useState<LocalProfile[]>([]);
  const [savedCVs, setSavedCVs] = useState<SavedCV[]>([]);
  const [serverCVs, setServerCVs] = useState<SavedCV[]>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: session } = useSession();

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const allProfiles = getProfiles();
      const currentProfile = getActiveProfile();
      setProfiles(allProfiles);
      setActiveProfileLocal(currentProfile);
      setSavedCVs(currentProfile ? getSavedCVs(currentProfile.id) : []);

      if (session) {
        try {
          const res = await fetch('/api/cvs');
          if (res.ok) {
            const data = (await res.json()) as ServerCVResponse[];
            const safeServerCVs: SavedCV[] = [];

            for (const cv of data) {
              try {
                safeServerCVs.push({
                  ...cv,
                  data: JSON.parse(cv.data),
                });
              } catch {
                console.warn(tr('CV omitido por datos invalidos:'), cv.id);
              }
            }

            setServerCVs(safeServerCVs);
          }
        } catch (error) {
          console.error('Error cargando CVs del servidor', error);
          setServerCVs([]);
        }
      } else {
        setServerCVs([]);
      }

      onProfileChange?.();
    } finally {
      setIsRefreshing(false);
    }
  }, [onProfileChange, session]);

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, refreshData]);

  const handleCreateProfile = useCallback(() => {
    if (!newProfileName.trim()) {
      toast.error(tr('Escribe un nombre para el perfil.'));
      return;
    }

    const profile = createProfile(newProfileName.trim());
    setActiveProfile(profile.id);
    setNewProfileName('');
    setShowCreateProfile(false);
    toast.success(`Perfil ${profile.name} creado`);
    refreshData();
  }, [newProfileName, refreshData]);

  const handleChangeProfile = useCallback(
    (id: string) => {
      setActiveProfile(id);
      toast.info(tr('Perfil cambiado'));
      refreshData();
    },
    [refreshData]
  );

  const handleDeleteCV = useCallback(
    async (id: string, isServer: boolean = false) => {
      if (isServer) {
        try {
          const res = await fetch(`/api/cvs?id=${id}`, { method: 'DELETE' });
          if (res.ok) {
            toast.info(tr('Hoja de vida eliminada de tu cuenta'));
            refreshData();
          }
        } catch (error) {
          console.error("No se pudo eliminar del servidor", error);
          toast.error("No se pudo eliminar del servidor");
        }
        return;
      }

      if (!activeProfile) return;
      deleteSavedCV(activeProfile.id, id);
      toast.info(tr('Hoja de vida eliminada'));
      refreshData();
    },
    [activeProfile, refreshData]
  );

  const handleLoad = useCallback(
    (cv: SavedCV, source: 'local' | 'server') => {
      onLoadCV(cv, source);
      setIsOpen(false);
    },
    [onLoadCV]
  );

  const handleSaveCurrent = useCallback(() => {
    onSaveCurrent();
    refreshData();
  }, [onSaveCurrent, refreshData]);

  const formatDate = (value: string): string => {
    return new Date(value).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5 shadow-sm">
          <FileBox className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">{tr('Mis HDV')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBox className="w-5 h-5 text-blue-600" aria-hidden="true" />
            Repositorio de HDV
          </DialogTitle>
          <DialogDescription>
            {session ? tr('Gestiona tus versiones guardadas en tu cuenta.') : tr('Borra o carga tus versiones guardadas.')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 border-b">
          <Label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2 block px-1">
            {tr('Cambiar perfil')}
          </Label>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
            {profiles.length > 0 ? (
              profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleChangeProfile(profile.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    activeProfile?.id === profile.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  aria-pressed={activeProfile?.id === profile.id}
                >
                  {activeProfile?.id === profile.id && <CheckCircle2 className="w-3 h-3" aria-hidden="true" />}
                  {profile.name}
                </button>
              ))
            ) : (
              <span className="text-[10px] text-slate-400 italic px-2">{tr('Sin perfiles')}</span>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2 h-7 gap-1 text-[10px] text-blue-600 font-bold"
              onClick={() => setShowCreateProfile((prev) => !prev)}
              aria-expanded={showCreateProfile}
              aria-label={tr('Crear nuevo perfil')}
            >
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              {tr('Nuevo perfil')}
            </Button>
          </div>

          {showCreateProfile && (
            <div className="mt-2 flex gap-2 animate-fade-in-up px-1">
              <Input
                placeholder={tr('Nombre (ej: Mi HDV Principal)')}
                value={newProfileName}
                onChange={(event) => setNewProfileName(event.target.value)}
                className="h-8 text-xs"
                onKeyDown={(event) => event.key === 'Enter' && handleCreateProfile()}
                aria-label={tr('Nombre del nuevo perfil')}
              />
              <Button type="button" size="sm" className="h-8 px-3 text-xs bg-blue-600" onClick={handleCreateProfile}>
                Crear
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3 px-1">
          {!activeProfile ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200" role="status" aria-live="polite">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" aria-hidden="true" />
              <p className="text-xs text-slate-500 font-medium">{tr('Crea un perfil arriba para empezar a guardar versiones.')}</p>
            </div>
          ) : savedCVs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <FileText className="w-6 h-6 text-slate-300" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold text-slate-700">{tr('Aun no tienes HDV guardadas')}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">
                Usa &quot;Guardar actual&quot; para almacenar hasta {MAX_SAVED_CVS_PER_PROFILE} versiones por perfil.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-6 border-blue-200 text-blue-600 font-bold bg-white hover:bg-blue-50"
                onClick={handleSaveCurrent}
              >
                {tr('Guardar esta version ahora')}
              </Button>
            </div>
          ) : (
            <>
              {session && serverCVs.length > 0 && (
                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      {tr('Guardado en tu cuenta (Nube)')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {serverCVs.map((cv) => (
                      <div
                        key={cv.id}
                        className="group border border-blue-100 rounded-xl p-3 bg-blue-50/30 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                            <FileText className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{cv.name}</h4>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              Sincronizado {formatDate(cv.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 bg-blue-600 text-white hover:bg-blue-700 text-xs px-3"
                            onClick={() => handleLoad(cv, 'server')}
                          >
                            {tr('Cargar')}
                            <ChevronRight className="w-3 h-3 ml-1" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteCV(cv.id, true)}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {session ? 'Versiones guardadas' : `Versiones guardadas (${savedCVs.length}/${MAX_SAVED_CVS_PER_PROFILE})`}
                </span>
                {(savedCVs.length < MAX_SAVED_CVS_PER_PROFILE || canSaveCurrent) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] text-blue-600 hover:text-blue-700 font-bold"
                    onClick={handleSaveCurrent}
                  >
                    {tr('Guardar actual')}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {savedCVs.map((cv) => (
                  <div
                    key={cv.id}
                    className="group border rounded-xl p-3 bg-white hover:border-slate-300 hover:shadow-sm transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileText className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{cv.name}</h4>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          Guardado {formatDate(cv.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-blue-600 hover:bg-blue-50 text-xs px-3"
                        onClick={() => handleLoad(cv, 'local')}
                      >
                        {tr('Cargar')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleDeleteCV(cv.id, false)}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {isRefreshing && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500" role="status" aria-live="polite">
              Actualizando versiones guardadas...
            </div>
          )}

          {activeProfile && savedCVs.length >= MAX_SAVED_CVS_PER_PROFILE && !canSaveCurrent && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 mt-4 text-red-700" role="status">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="text-[10px] font-medium leading-relaxed">
                Limite de {MAX_SAVED_CVS_PER_PROFILE} hojas de vida por perfil. Elimina una para guardar otra version en{' '}
                <strong>{activeProfile.name}</strong>.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
