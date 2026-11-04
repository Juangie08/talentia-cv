'use client';

import { useState, useEffect, useCallback } from 'react';
import { CVData, TemplateName, defaultCVData, CVCustomization, defaultCustomization } from './types';

const LEGACY_CV_STORAGE_KEY = 'hdv-gratis-cv-data';
const LEGACY_TEMPLATE_STORAGE_KEY = 'hdv-gratis-template';
const CV_STORAGE_KEY = 'talentia-cv-data';
const TEMPLATE_STORAGE_KEY = 'talentia-template';
const STORAGE_WRITE_DEBOUNCE_MS = 220;

function mergeWithDefaultCVData(input: Partial<CVData> | null | undefined): CVData {
  if (!input) return defaultCVData;

  return {
    ...defaultCVData,
    ...input,
    personalInfo: {
      ...defaultCVData.personalInfo,
      ...(input.personalInfo || {}),
    },
    skills: Array.isArray(input.skills) ? input.skills : defaultCVData.skills,
    experience: Array.isArray(input.experience) ? input.experience : defaultCVData.experience,
    education: Array.isArray(input.education) ? input.education : defaultCVData.education,
    languages: Array.isArray(input.languages) ? input.languages : defaultCVData.languages,
    references: Array.isArray(input.references) ? input.references : defaultCVData.references,
  };
}

function parseJSONSafe<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Hook personalizado para persistir datos del CV en localStorage.
 * Guarda automáticamente cada vez que cambian los datos.
 */
export function useCVData() {
  const [data, setData] = useState<CVData>(defaultCVData);
  const [template, setTemplate] = useState<TemplateName>('moderno');
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar datos desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CV_STORAGE_KEY) ?? localStorage.getItem(LEGACY_CV_STORAGE_KEY);
      if (saved) {
        if (!localStorage.getItem(CV_STORAGE_KEY)) {
          localStorage.setItem(CV_STORAGE_KEY, saved);
        }
        const parsed = parseJSONSafe<Partial<CVData>>(saved);
        setData(mergeWithDefaultCVData(parsed));
      }
      const savedTemplate = localStorage.getItem(TEMPLATE_STORAGE_KEY) ?? localStorage.getItem(LEGACY_TEMPLATE_STORAGE_KEY);
      if (savedTemplate) {
        if (!localStorage.getItem(TEMPLATE_STORAGE_KEY)) {
          localStorage.setItem(TEMPLATE_STORAGE_KEY, savedTemplate);
        }
        setTemplate(savedTemplate as TemplateName);
      }
    } catch (e) {
      console.error('Error al cargar datos guardados:', e);
    }
    setIsLoaded(true);
  }, []);

  // Guardar datos en localStorage cada vez que cambian
  useEffect(() => {
    if (isLoaded) {
      const timeout = window.setTimeout(() => {
        const write = () => {
          try {
            localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(data));
          } catch (e) {
            console.error('Error al guardar datos:', e);
          }
        };

        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(write, { timeout: 500 });
        } else {
          write();
        }
      }, STORAGE_WRITE_DEBOUNCE_MS);

      return () => window.clearTimeout(timeout);
    }
  }, [data, isLoaded]);

  // Guardar template seleccionado
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, template);
    }
  }, [template, isLoaded]);

  /** Actualiza una sección parcial de los datos */
  const updateData = useCallback((partial: Partial<CVData>) => {
    setData(prev => ({ ...prev, ...partial }));
  }, []);

  /** Actualiza información personal parcialmente */
  const updatePersonalInfo = useCallback((partial: Partial<CVData['personalInfo']>) => {
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...partial },
    }));
  }, []);

  /** Limpia todos los datos */
  const clearAll = useCallback(() => {
    setData(defaultCVData);
    setTemplate('moderno');
    localStorage.removeItem(CV_STORAGE_KEY);
    localStorage.removeItem(TEMPLATE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CV_STORAGE_KEY);
    localStorage.removeItem(LEGACY_TEMPLATE_STORAGE_KEY);
  }, []);

  /** Carga datos importados (desde archivo) */
  const loadImportedData = useCallback((imported: CVData) => {
    setData(imported);
  }, []);

  return {
    data,
    setData,
    template,
    setTemplate,
    isLoaded,
    updateData,
    updatePersonalInfo,
    clearAll,
    loadImportedData,
  };
}

const CUSTOMIZATION_STORAGE_KEY = 'talentia-customization';

function mergeCustomization(input: Partial<CVCustomization> | null | undefined): CVCustomization {
  if (!input) return defaultCustomization;
  return {
    ...defaultCustomization,
    ...input,
    sectionsVisible: {
      ...defaultCustomization.sectionsVisible,
      ...(input.sectionsVisible || {}),
    },
    sectionsOrder: Array.isArray(input.sectionsOrder) && input.sectionsOrder.length > 0
      ? input.sectionsOrder
      : defaultCustomization.sectionsOrder,
  };
}

export function useCustomization() {
  const [customization, setCustomization] = useState<CVCustomization>(defaultCustomization);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CVCustomization>;
        setCustomization(mergeCustomization(parsed));
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const timeout = window.setTimeout(() => {
        try {
          localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(customization));
        } catch {
          // storage full
        }
      }, 200);
      return () => window.clearTimeout(timeout);
    }
  }, [customization, isLoaded]);

  const updateCustomization = useCallback((partial: Partial<CVCustomization>) => {
    setCustomization(prev => ({ ...prev, ...partial }));
  }, []);

  const updateSectionsVisible = useCallback((section: keyof CVCustomization['sectionsVisible'], value: boolean) => {
    setCustomization(prev => ({
      ...prev,
      sectionsVisible: { ...prev.sectionsVisible, [section]: value },
    }));
  }, []);

  const updateSectionsOrder = useCallback((newOrder: string[]) => {
    setCustomization(prev => ({ ...prev, sectionsOrder: newOrder }));
  }, []);

  const resetCustomization = useCallback(() => {
    setCustomization(defaultCustomization);
  }, []);

  return {
    customization,
    setCustomization,
    updateCustomization,
    updateSectionsVisible,
    updateSectionsOrder,
    resetCustomization,
    isLoaded,
  };
}
