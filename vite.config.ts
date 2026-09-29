import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Byggetidspunktet vises som versionsnummer nederst på forsiden (AppVersion),
  // så man kan se, om telefonen har hentet den nyeste version.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
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
        // En ny version skal tage over med det samme. Uden disse venter den nye
        // service worker, til ALLE faner med appen er lukket (et almindeligt
        // genindlæs er ikke nok), og autoUpdate-genindlæsningen i
        // registerServiceWorker.ts sker aldrig.
        skipWaiting: true,
        clientsClaim: true,
        // Privatlivspolitikken er en selvstændig side — må ikke erstattes af
        // appen (index.html) ved navigation.
        navigateFallbackDenylist: [/^\/privatliv\.html/],
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
          // Samme fil: motivet ligger inden for Androids "safe zone" (se
          // icons/icon.svg), så det tåler at blive beskåret til cirkel o.l.
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'functions/src/**/*.test.ts'],
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
