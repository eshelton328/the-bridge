import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { TimedSequencer } from './scripts/testSequencer.ts'

// Each project names its Chromium instance, so the names stay unique.
const browser = (name: string) => ({
  enabled: true,
  headless: true,
  provider: playwright(),
  instances: [{ browser: 'chromium' as const, name }],
})

// One config for the repository (d-080). `shared`, `contract` and `server`
// run in Node; `web` runs web/src tests in Chromium; `storybook` runs every
// story's play test in Chromium. Run one with `pnpm test --project=web`.
export default defineConfig({
  test: {
    // With --shard (CI's test-unit shards), files split by measured time.
    sequence: { sequencer: TimedSequencer },
    projects: [
      {
        test: { name: 'shared', root: './shared', include: ['src/**/*.test.ts'], environment: 'node' },
      },
      {
        test: { name: 'contract', root: './contract', include: ['src/**/*.test.ts'], environment: 'node' },
      },
      {
        test: { name: 'server', root: './server', include: ['src/**/*.test.ts'], environment: 'node' },
      },
      {
        extends: './web/vite.config.ts',
        test: {
          name: 'web',
          root: './web',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: [fileURLToPath(new URL('./web/src/lib/testSetup.ts', import.meta.url))],
          browser: browser('web'),
        },
      },
      {
        extends: './web/vite.config.ts',
        plugins: [storybookTest({ configDir: './web/.storybook' })],
        test: { name: 'storybook', root: './web', browser: browser('storybook') },
      },
    ],
  },
})
