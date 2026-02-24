import { defineConfig } from 'vite'

// Vite dev server proxy: forward /api/* to backend at http://localhost:3000
export default defineConfig({
  server: {
    proxy: {
      '^/api/.*': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
