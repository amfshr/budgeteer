/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Same-origin in dev: the session cookies the backend sets are HttpOnly and
    // SameSite-scoped, so the client always talks to its own origin and Vite
    // forwards /api to Spring — no CORS or cookie configuration anywhere.
    // Browsers attach Origin: http://localhost:5173 to every POST (even
    // same-origin ones) and the proxy forwards it verbatim; Spring compares
    // Origin against the Host header and 403s the mismatch. Removing Origin
    // makes it a non-CORS request (Spring's processor only engages when the
    // header is present), which is exactly the prod same-origin behaviour.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
          })
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
