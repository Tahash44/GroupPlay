import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // معادل 0.0.0.0 — برای دسترسی از بیرون کانتینر
    port: 5173,
    watch: {
      usePolling: true, // برای hot-reload داخل داکر (مخصوصاً روی ویندوز/WSL/مک)
    },
  },
})
