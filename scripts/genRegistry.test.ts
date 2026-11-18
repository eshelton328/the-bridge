// Tests for scripts/genRegistry.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { findBoards, renderRegistry } from './genRegistry.ts'

void test('finds each page with states, sorted, and skips index.ts, screens.ts and tests', () => {
  const dir = mkdtempSync(join(tmpdir(), 'registry-'))
  try {
    for (const [page, files] of [
      ['inbox', ['index.ts', 'screens.ts', 'screens.test.ts', 'nextStep.ts', 'approval.ts', 'nextStep.test.ts']],
      ['home', ['index.ts']],
    ] as const) {
      mkdirSync(join(dir, page, 'states'), { recursive: true })
      for (const f of files) writeFileSync(join(dir, page, 'states', f), '')
    }
    mkdirSync(join(dir, 'toolkit'))
    assert.deepEqual(findBoards(dir), [{ page: 'inbox', states: ['approval', 'nextStep'] }])
  } finally {
    rmSync(dir, { recursive: true })
  }
})

void test('renders one board and one id per state', () => {
  const text = renderRegistry([{ page: 'inbox', states: ['approval', 'nextStep'] }])
  assert.match(text, /export type BoardId = 'inbox\/approval' \| 'inbox\/nextStep'/)
  assert.match(text, /board\(inboxPage, 'nextStep'\),/)
  assert.match(text, /import \{ inboxPage \} from '\.\.\/pages\/inbox\/index\.ts'/)
})

void test('has no board id when no page has a state', () => {
  assert.match(renderRegistry([]), /export type BoardId = never/)
})
