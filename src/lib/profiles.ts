import { CVData, generateId } from './types';

export interface LocalProfile {
  id: string;
  name: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface SavedCV {
  id: string;
  name: string;
  updatedAt: string;
  data: CVData;
}

export interface SaveCVResult {
  success: boolean;
  message?: string;
  id?: string;
}

const LEGACY_PROFILES_KEY = 'hdv.profiles';
const LEGACY_ACTIVE_PROFILE_KEY = 'hdv.activeProfile';
const LEGACY_CVS_PREFIX = 'hdv.cvs.';
const PROFILES_KEY = 'talentia.profiles';
const ACTIVE_PROFILE_KEY = 'talentia.activeProfile';
const CVS_PREFIX = 'talentia.cvs.';
export const MAX_SAVED_CVS_PER_PROFILE = 3;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readStorageJSON<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorageJSON<T>(key: string, value: T): void {
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`No se pudo guardar ${key} en localStorage:`, error);
  }
}

function getCVStorageKey(profileId: string): string {
  return `${CVS_PREFIX}${profileId}`;
}

function getLegacyCVStorageKey(profileId: string): string {
  return `${LEGACY_CVS_PREFIX}${profileId}`;
}

export function getProfiles(): LocalProfile[] {
  const current = readStorageJSON<LocalProfile[]>(PROFILES_KEY, []);
  if (current.length > 0) return current;
  const legacy = readStorageJSON<LocalProfile[]>(LEGACY_PROFILES_KEY, []);
  if (legacy.length > 0) {
    writeStorageJSON(PROFILES_KEY, legacy);
  }
  return legacy;
}

export function createProfile(name: string): LocalProfile {
  const trimmedName = name.trim() || 'Perfil';
  const now = new Date().toISOString();
  const profiles = getProfiles();

  const newProfile: LocalProfile = {
    id: generateId(),
    name: trimmedName,
    createdAt: now,
    lastActiveAt: now,
  };

  writeStorageJSON(PROFILES_KEY, [...profiles, newProfile]);
  return newProfile;
}

export function getActiveProfile(): LocalProfile | null {
  if (!canUseStorage()) return null;

  const id = localStorage.getItem(ACTIVE_PROFILE_KEY) ?? localStorage.getItem(LEGACY_ACTIVE_PROFILE_KEY);
  if (!id) return null;

  if (!localStorage.getItem(ACTIVE_PROFILE_KEY)) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  }

  return getProfiles().find((profile) => profile.id === id) || null;
}

export function setActiveProfile(id: string): void {
  if (!canUseStorage()) return;

  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  const now = new Date().toISOString();

  const updatedProfiles = getProfiles().map((profile) =>
    profile.id === id ? { ...profile, lastActiveAt: now } : profile
  );

  writeStorageJSON(PROFILES_KEY, updatedProfiles);
}

export function getSavedCVs(profileId: string): SavedCV[] {
  const current = readStorageJSON<SavedCV[]>(getCVStorageKey(profileId), []);
  if (current.length > 0) return current;
  const legacy = readStorageJSON<SavedCV[]>(getLegacyCVStorageKey(profileId), []);
  if (legacy.length > 0) {
    writeStorageJSON(getCVStorageKey(profileId), legacy);
  }
  return legacy;
}

export function saveCV(profileId: string, name: string, data: CVData): SaveCVResult {
  const existingCVs = getSavedCVs(profileId);

  if (existingCVs.length >= MAX_SAVED_CVS_PER_PROFILE) {
    return {
      success: false,
      message:
        'Limite gratuito de 3 hojas de vida guardadas alcanzado. Elimina una para guardar otra.',
    };
  }

  const newCV: SavedCV = {
    id: generateId(),
    name: name.trim() || 'Mi Hoja de Vida',
    updatedAt: new Date().toISOString(),
    data,
  };

  writeStorageJSON(getCVStorageKey(profileId), [...existingCVs, newCV]);
  return { success: true, id: newCV.id };
}

export function deleteSavedCV(profileId: string, cvId: string): void {
  const filtered = getSavedCVs(profileId).filter((cv) => cv.id !== cvId);
  writeStorageJSON(getCVStorageKey(profileId), filtered);
}

export function updateSavedCV(profileId: string, cvId: string, data: CVData): void {
  const now = new Date().toISOString();

  const updated = getSavedCVs(profileId).map((cv) =>
    cv.id === cvId ? { ...cv, updatedAt: now, data } : cv
  );

  writeStorageJSON(getCVStorageKey(profileId), updated);
}
