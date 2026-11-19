// Tests for testShards.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assignShard, parseFileTimes } from './testShards.ts'

const paths = ['a.test.ts', 'b.test.ts', 'c.test.ts', 'd.test.ts', 'e.test.ts', 'new.test.ts']
const times = { 'a.test.ts': 90, 'b.test.ts': 30, 'c.test.ts': 30, 'd.test.ts': 20, 'e.test.ts': 10 }

void test('every path goes to exactly one shard, for 1 to 4 shards', () => {
  for (let count = 1; count <= 4; count++) {
    const all = Array.from({ length: count }, (_, i) => assignShard(paths, times, 15, i + 1, count)).flat()
    assert.deepEqual([...all].sort(), [...paths].sort())
  }
})

void test('the longest file first, each to the shard with the least time', () => {
  // a (90) to 1; b (30), c (30), d (20) to 2 (80); new (15 by default) and e (10) to 2 then 1.
  assert.deepEqual(assignShard(paths, times, 15, 1, 2), ['a.test.ts', 'e.test.ts'])
  assert.deepEqual(assignShard(paths, times, 15, 2, 2), ['b.test.ts', 'c.test.ts', 'd.test.ts', 'new.test.ts'])
})

void test('the split does not depend on the order of the paths', () => {
  const reversed = [...paths].reverse()
  for (const i of [1, 2, 3])
    assert.deepEqual(assignShard(reversed, times, 15, i, 3), assignShard(paths, times, 15, i, 3))
})

void test('an index outside 1 to the count is an error', () => {
  for (const [i, n] of [
    [0, 2],
    [3, 2],
    [1, 0],
    [1.5, 2],
  ] as const)
    assert.throws(() => assignShard(paths, times, 15, i, n), /the index must be a whole number from 1 to the count/)
})

void test('parseFileTimes reads the file lines of a CI log, in ms or s', () => {
  const e = String.fromCharCode(27)
  const log = [
    `2026-11-19T01:21:56.6291225Z  ${e}[32m✓${e}[39m ${e}[30m${e}[42m shared ${e}[49m${e}[39m src/result.test.ts ${e}[2m(${e}[22m${e}[2m3 tests${e}[22m${e}[2m)${e}[22m${e}[32m 11${e}[2mms${e}[22m${e}[39m`,
    ' ✓ web src/app/InboxRoute.test.tsx (88 tests | 1 skipped) 94.5s',
    'stderr | src/app/InboxRoute.test.tsx > the Inbox route > a test',
    ' Test Files  61 passed (61)',
  ].join('\n')
  assert.deepEqual(parseFileTimes(log), { 'shared/src/result.test.ts': 11, 'web/src/app/InboxRoute.test.tsx': 94500 })
})
