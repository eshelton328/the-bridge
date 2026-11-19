import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { keyboardTracePlugin } from '../scripts/keyboardTracePlugin.ts'

// The app. The router plugin reads tsr.config.json in this folder and
// keeps src/app/routeTree.gen.ts current while Vite runs; it must come
// before the React plugin. keyboardTracePlugin is the dev server's
// `/__keyboard-trace` endpoint for `?keyboard-trace` (serve only).
export default defineConfig({
  root: import.meta.dirname,
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), keyboardTracePlugin()],
})
