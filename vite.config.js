import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The preview tool may assign a port through PORT; otherwise Vite's default
    port: Number(process.env.VITE_PORT ?? process.env.PORT) || 5173,
    // During development the API server runs on :3001 (npm run dev starts both)
    proxy: {
      // changeOrigin: false keeps the browser's Host header, which the server's cross-site check compares
      '/api': { target: 'http://localhost:3001', changeOrigin: false },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: false },
    },
  },
})
