import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Web version config - uses WebApp.jsx with landing page
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To polyfill `global` and other globals.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // To polyfill specific modules.
      include: ['buffer', 'process', 'util', 'stream', 'events', 'path', 'querystring', 'url', 'string_decoder', 'http', 'https', 'os', 'assert', 'constants', 'zlib', 'tty', 'domain', 'punycode', 'console', 'vm'],
    })
  ],
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true
  }
})
