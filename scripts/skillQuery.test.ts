// Tests for web/src/lib/skillQuery.ts in Node. Run with `pnpm test:scripts`.
// The words it finds are tested in the browser (web/src/lib/skillQuery.test.ts); its speed is tested here, because
// Chromium's regex engine falls back to a linear one after many backtracks and hides what a `/\S*$/` search costs in
// Safari, the phone's browser, and in Node: about 4 s after a paste of 80,000 characters with no space.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { skillQuery } from '../web/src/lib/skillQuery.ts'

void test('skillQuery finds the word before the caret in one pass after a long paste with no space', () => {
  const pasted = `/${'a'.repeat(80_000)}`
  const start = performance.now()
  assert.equal(skillQuery(`${pasted} `, pasted.length + 1), null)
  assert.equal(skillQuery(`${pasted} /wri`, pasted.length + 5), '/wri')
  assert.equal(skillQuery(pasted, pasted.length), pasted)
  const took = performance.now() - start
  assert.ok(took < 50, `took ${took.toFixed(0)} ms`)
})
