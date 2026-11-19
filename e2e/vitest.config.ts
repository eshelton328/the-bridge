import { defineConfig } from 'vitest/config'

// The local E2E suite (d-113), `pnpm test:e2e`: real herdr in a separate
// session, the fake agent, the server and the web dev server, in Node with
// Playwright. It needs herdr, so it runs on a Mac and not in CI or verify.
export default defineConfig({
  test: {
    name: 'e2e',
    root: import.meta.dirname,
    include: ['*.e2e.test.ts'],
    environment: 'node',
    globalSetup: ['./herdrSession.ts'],
    testTimeout: 60_000,
    hookTimeout: 90_000,
    fileParallelism: false,
  },
})
