import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Lets us write imports like '@/components/ui/button' instead of '../../components/ui/button'
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Sends /api requests to the backend, so fetch("/api/jobs") works without CORS setup
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
