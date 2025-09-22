import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 2120,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3200',
        changeOrigin: true,
      },
      // Proxy any requests that don't match API to the backend
      '/employees': {
        target: 'http://localhost:3200',
        changeOrigin: true,
      },
      '/filter-options': {
        target: 'http://localhost:3200',
        changeOrigin: true,
      },
      '/export': {
        target: 'http://localhost:3200',
        changeOrigin: true,
      },
      '/import': {
        target: 'http://localhost:3200',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  define: {
    // For compatibility with some libraries that expect process.env
    global: 'globalThis',
  }
})
