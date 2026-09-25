import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'logo.svg', '*.png'],
      manifest: {
        id: '/',
        name: 'FútbolProZacatepec',
        short_name: 'FútbolProZ',
        description:
          'Administración integral para escuelas de fútbol: jugadores, asistencias, mensualidades, entrenamientos, evaluaciones y finanzas. 100% local y disponible sin conexión.',
        lang: 'es',
        dir: 'ltr',
        theme_color: '#0c3b23',
        background_color: '#062417',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        categories: ['sports', 'productivity'],
        icons: [
          { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png', purpose: 'any' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Jugadores', url: '/app/jugadores', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Asistencias', url: '/app/asistencias', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Pagos', url: '/app/pagos', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          pdf: ['jspdf', 'jspdf-autotable'],
          spreadsheet: ['xlsx'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
