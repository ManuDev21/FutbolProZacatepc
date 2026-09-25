import { create } from 'zustand';
import { uuid } from '@/lib/utils';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push(kind, title, message) {
    const id = uuid();
    set((s) => ({ toasts: [...s.toasts, { id, kind, title, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().push('success', title, message),
  error: (title: string, message?: string) => useToastStore.getState().push('error', title, message),
  info: (title: string, message?: string) => useToastStore.getState().push('info', title, message),
  warning: (title: string, message?: string) => useToastStore.getState().push('warning', title, message),
};
