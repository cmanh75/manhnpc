import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    modulePreload: {
      resolveDependencies: (_filename, dependencies) =>
        dependencies.filter(
          (dependency) => !dependency.includes('/api-') && !dependency.includes('/GlobeScene-'),
        ),
    },
  },
})
