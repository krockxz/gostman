import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Web version config - uses WebApp.jsx with landing page
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true
  }
})
