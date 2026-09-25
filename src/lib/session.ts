import type { User } from '@/types';

/**
 * Referencia al usuario actual (solo lectura para servicios).
 * La fuente de verdad reactiva es el store de auth; aquí solo
 * se expone una lectura síncrona para auditoría.
 */
export const session: { user: User | null } = { user: null };

export function setSessionUser(user: User | null) {
  session.user = user;
}
