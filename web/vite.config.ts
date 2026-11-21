import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { keyboardTracePlugin } from '../scripts/keyboardTracePlugin.ts'

type Env = Record<string, string | undefined>

/**
 * The dev server's proxy: `/api` to the-bridge server (server/AGENTS.md) at BRIDGE_SERVER_URL, for `?source=live`;
 * it keeps the Host header, so the server sees a local browser as local and a tailnet viewer by its login. It has
 * no default target: http://127.0.0.1:5181 is the served server with the owner's real herdr session, and a probe's
 * taps on it start real chats there. With the variable unset or empty, there is no proxy.
 */
export function apiProxy(env: Env = process.env): Record<string, string> {
  const target = env.BRIDGE_SERVER_URL?.trim() ?? ''
  return target === '' ? {} : { '/api': target }
}

/**
 * Stops `vite` and `vite preview` (whose proxy is the dev server's) when BRIDGE_SERVER_URL is unset or empty. The
 * check is the plugin's `config` hook, which Vite runs for command `serve` (dev and preview) and `build`, so tools
 * that only read the config (knip) run without the variable, and so does `vite build`. Vitest's browser server and
 * Storybook (process.env.VITEST, process.env.STORYBOOK) start without it too, with no proxy. It has no
 * configurePreviewServer hook: one would turn off `vite preview`'s error for a missing build.
 */
export function requireServerUrl(env: Env = process.env) {
  return {
    name: 'bridge-require-server-url',
    config(_config: unknown, { command }: { command: string }) {
      if (command !== 'serve' || Object.keys(apiProxy(env)).length > 0) return
      if (env.VITEST !== undefined || env.STORYBOOK !== undefined) return
      throw new Error(
        'Set BRIDGE_SERVER_URL to the bridge server for /api, for example http://127.0.0.1:<test port>; the served app uses http://127.0.0.1:5181',
      )
    },
  }
}

// The app. The router plugin reads tsr.config.json in this folder and
// keeps src/app/routeTree.gen.ts current while Vite runs; it must come
// before the React plugin. keyboardTracePlugin is the dev server's
// `/__keyboard-trace` endpoint for `?keyboard-trace` (serve only).
export default defineConfig({
  root: import.meta.dirname,
  plugins: [
    requireServerUrl(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    keyboardTracePlugin(),
  ],
  server: { proxy: apiProxy() },
})
