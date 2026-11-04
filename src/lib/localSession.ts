'use client';

/**
 * Talentia funciona sin cuentas: todo se guarda en el navegador de la persona.
 * Este módulo reemplaza a `next-auth/react` para que los componentes que antes
 * dependían de una sesión sigan compilando y caigan siempre en su rama local.
 */

export interface LocalSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function useSession() {
  return {
    data: null as LocalSession | null,
    status: 'unauthenticated' as const,
    update: async () => null,
  };
}

export async function signIn(): Promise<void> {
  // Sin cuentas no hay inicio de sesión: se deja como no-op a propósito.
}

export async function signOut(): Promise<void> {
  // Sin cuentas no hay nada que cerrar.
}
