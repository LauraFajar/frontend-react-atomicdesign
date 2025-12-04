import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    open: true,
    proxy: {
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
      '/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/usuarios': { target: 'http://localhost:3000', changeOrigin: true },
      '/sensores': { target: 'http://localhost:3000', changeOrigin: true },
      '/cultivos': { target: 'http://localhost:3000', changeOrigin: true },
      '/lotes': { target: 'http://localhost:3000', changeOrigin: true },
      '/lecturas': { target: 'http://localhost:3000', changeOrigin: true },
      '/recomendaciones': { target: 'http://localhost:3000', changeOrigin: true },
      // Proxy para Socket.IO/WebSocket cuando el cliente usa origen del frontend
      '/socket.io': { target: 'http://localhost:3000', ws: true, changeOrigin: true }
    }
  }
})
