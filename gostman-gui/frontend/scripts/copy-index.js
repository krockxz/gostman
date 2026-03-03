#!/usr/bin/env node
/**
 * Cross-platform script to copy index-web.html to index.html
 * Works on Windows, Linux, and macOS
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourcePath = path.resolve(__dirname, '../index-web.html')
const targetPath = path.resolve(__dirname, '../index.html')

try {
  fs.copyFileSync(sourcePath, targetPath)
  console.log('Copied index-web.html to index.html')
} catch (error) {
  console.error('Failed to copy index.html:', error.message)
  process.exit(1)
}
