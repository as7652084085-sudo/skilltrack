import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const stampServiceWorker = () => ({
  name: 'skilltrack-stamp-sw',
  apply: 'build',
  closeBundle() {
    const swPath = resolve(process.cwd(), 'dist', 'sw.js')
    const version = (process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(36)).slice(0, 12)
    const source = readFileSync(swPath, 'utf8')
    writeFileSync(swPath, source.replaceAll('__SKILLTRACK_BUILD_VERSION__', version))
  },
})

export default defineConfig({
  plugins: [react(), stampServiceWorker()],
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
