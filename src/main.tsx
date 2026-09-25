import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { applyTheme, useUiStore } from './stores/ui';
import './index.css';

// Service Worker PWA (autoUpdate: se actualiza solo al detectar nueva versión)
registerSW({ immediate: true });

// Captura del evento de instalación para el botón "Instalar app"
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  useUiStore.getState().setInstallPrompt(e);
});

// Tema persistido (localStorage — solo preferencias visuales)
try {
  const raw = localStorage.getItem('fpz.ui');
  const theme = raw ? (JSON.parse(raw).state?.theme as 'light' | 'dark' | undefined) : undefined;
  applyTheme(theme ?? 'light');
} catch {
  applyTheme('light');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
