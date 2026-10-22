import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'web' ? '/coop-tracker/' : '/',
  server: {
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': { target: process.env.API_TARGET || 'http://localhost:3000', xfwd: true },
    },
  },
}))
