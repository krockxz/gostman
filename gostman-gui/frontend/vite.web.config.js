import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { viteStaticCopy } from 'vite-plugin-static-copy'

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
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/web-tree-sitter/tree-sitter.wasm',
          dest: '.'
        },
        {
          src: 'node_modules/curlconverter/dist/tree-sitter-bash.wasm',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
    target: 'es2022',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2022',
    },
  },
  server: {
    port: 3000,
    open: true
  }
})
