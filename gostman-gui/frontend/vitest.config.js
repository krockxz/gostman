import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // Use node environment for JS-only tests
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules'],
  },
})
