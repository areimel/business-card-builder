import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API = `http://localhost:${process.env.API_PORT || 4178}`

export default defineConfig({
  plugins: [react()],
  // Keep editor dependencies on the same React instance as the app.
  resolve: { dedupe: ['react', 'react-dom'] },
  server: {
    port: 5173,
    proxy: {
      '/api': API,
      '/render': API,
      '/themes': API,
      '/exports': API,
    },
  },
})
