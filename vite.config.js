/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Baked into the bundle and published as /version.json so a running app can tell a
// newer deployment is live (see src/lib/version.js). The commit keeps a same-code
// Vercel redeploy from prompting a reload; local builds fall back to the build time.
const APP_VERSION = process.env.VERCEL_GIT_COMMIT_SHA || new Date().toISOString()

/** Emits `version.json` (never precached: workbox only globs js/css/html). */
const versionFile = () => ({
  name: 'version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: APP_VERSION }) })
  },
})

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    svelte(),
    versionFile(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Combat Tracker',
        short_name: 'Combat',
        description: 'Manage D&D combat encounters: initiative, HP and death saves.',
        theme_color: '#1a1410',
        background_color: '#1a1410',
        display: 'standalone',
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
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
    svelteTesting(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
