import { create } from 'zustand';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve?: (v: boolean) => void;
  ask: (opts: ConfirmOptions) => Promise<boolean>;
  answer: (v: boolean) => void;
}

/** Diálogo de confirmación global: `await confirm({...})` → boolean */
export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  title: '',
  ask(opts) {
    return new Promise<boolean>((resolve) => {
      set({ ...opts, open: true, resolve });
    });
  },
  answer(v) {
    get().resolve?.(v);
    set({ open: false, resolve: undefined });
  },
}));

export const confirmDialog = (opts: ConfirmOptions) => useConfirmStore.getState().ask(opts);
