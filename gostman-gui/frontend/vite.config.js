import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022', // Support top-level await (required by curlconverter)
  },
  esbuild: {
    target: 'es2022' // Also apply to dev mode
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022'
    }
  }
})
