import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UiState {
  sidebarOpen: boolean;
  theme: Theme;
  installPrompt: Event | null;
  setSidebarOpen: (v: boolean) => void;
  toggleTheme: () => void;
  setInstallPrompt: (e: Event | null) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      theme: 'light',
      installPrompt: null,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      toggleTheme() {
        const theme = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(theme);
        set({ theme });
      },
      setInstallPrompt: (e) => set({ installPrompt: e }),
    }),
    {
      name: 'fpz.ui',
      partialize: (s) => ({ theme: s.theme }),
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.theme ?? 'light');
      },
    },
  ),
);

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
