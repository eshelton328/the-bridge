import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { keyboardTracePlugin } from '../scripts/keyboardTracePlugin.ts'

// The app. The router plugin reads tsr.config.json in this folder and
// keeps src/app/routeTree.gen.ts current while Vite runs; it must come
// before the React plugin. keyboardTracePlugin is the dev server's
// `/__keyboard-trace` endpoint for `?keyboard-trace` (serve only). The dev
// server sends `/api` to the-bridge server (server/AGENTS.md) at
// BRIDGE_SERVER_URL, for `?source=live`; it keeps the Host header, so the
// server sees a local browser as local and a tailnet viewer by its login.
export default defineConfig({
  root: import.meta.dirname,
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), keyboardTracePlugin()],
  server: { proxy: { '/api': process.env.BRIDGE_SERVER_URL ?? 'http://127.0.0.1:5181' } },
})
