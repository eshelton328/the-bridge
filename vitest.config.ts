import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { configDefaults, defineConfig } from 'vitest/config'
import { TimedSequencer } from './scripts/testSequencer.ts'

// The web tests that run in the `web-motion` project, not in `web`.
const motionTests = 'src/**/*.motion.test.{ts,tsx}'

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
          exclude: [...configDefaults.exclude, motionTests],
          setupFiles: [fileURLToPath(new URL('./web/src/lib/testSetup.ts', import.meta.url))],
          browser: browser('web'),
        },
      },
      // The motion cases, which read one sample per rendering step, run alone with one worker (`pnpm test:motion`):
      // beside other test files a CI runner draws too few frames for them to judge a glide (NCC-174).
      {
        extends: './web/vite.config.ts',
        test: {
          name: 'web-motion',
          root: './web',
          include: [motionTests],
          setupFiles: [fileURLToPath(new URL('./web/src/lib/testSetup.ts', import.meta.url))],
          browser: browser('web-motion'),
        },
      },
      {
        extends: './web/vite.config.ts',
        plugins: [storybookTest({ configDir: './web/.storybook' })],
        // The code fence loads its highlighter with a lazy import. Vite
        // transforms that file on its first request and only then sees its
        // grammar imports, so on a busy machine the colours came after the
        // story's 10 s wait (NCC-55). Warmup transforms it at server start.
        server: { warmup: { clientFiles: ['./src/blocks/highlightCode.ts'] } },
        test: { name: 'storybook', root: './web', browser: browser('storybook') },
      },
    ],
  },
})
