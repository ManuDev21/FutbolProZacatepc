import { create } from 'zustand';
import type { Role, User } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,

  async login(username, password) {
    const user = await authService.login(username, password);
    set({ user });
    return Boolean(user);
  },

  async logout() {
    await authService.logout();
    set({ user: null });
  },

  async restore() {
    const user = await authService.restore();
    set({ user, ready: true });
  },
}));

export function can(role: Role | undefined, area: string): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  if (role === 'coach') {
    return [
      'dashboard',
      'jugadores',
      'asistencias',
      'entrenamientos',
      'ejercicios',
      'evaluaciones',
      'reportes',
      'calendario',
      'pizarra',
      'notificaciones',
      'caor',
    ].includes(area);
  }
  // padre / tutor: solo consulta
  return ['dashboard', 'jugadores', 'calendario'].includes(area);
}
