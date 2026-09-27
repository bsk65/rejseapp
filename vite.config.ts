import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registreres selv i src/shared/pwa/registerServiceWorker.ts (som også
      // genindlæser ved ny version) — intet automatisk indsat registerSW.js.
      injectRegister: false,
      // Ingen fetch-handler ud over precache af app-shell — Firestores egen
      // offline-persistens (IndexedDB) håndterer data. Ingen stale-data-cache.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      manifest: {
        name: 'Rejseappen',
        short_name: 'Rejseappen',
        description: 'Planlæg og dokumentér dine rejser',
        lang: 'da',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  // MapLibre opretter sin egen web worker via en relativ import.meta.url — det
  // brydes af Vites dependency-prebundling, så den udelukkes herfra.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  // MapLibres worker bundles via "?worker&url" (se shared/map/configureMapLibre.ts)
  // og startes som module-worker, så den bygges som ES-modul.
  worker: {
    format: 'es',
  },
})
