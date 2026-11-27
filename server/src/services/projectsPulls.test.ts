import { err, ok, type Result } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { keptPulls, type OpenPull, type ProjectFault, type PullSource, pullsKeptMs } from './projects.ts'

const repo = { owner: 'example', name: 'example-repo' }

/** A pull source that counts its runs and answers each when the test says. */
function countingSource() {
  const waiting: ((result: Result<readonly OpenPull[], ProjectFault>) => void)[] = []
  const source: PullSource = {
    open: () =>
      new Promise((resolve) => {
        waiting.push(resolve)
      }),
  }
  return { source, waiting }
}

describe('keptPulls', () => {
  it('shares one run between two requests that cross, and keeps its answer for 30 s', async () => {
    let time = 0
    const { source, waiting } = countingSource()
    const pulls = keptPulls(source, () => new Date(time))
    const first = pulls.open(repo)
    const second = pulls.open(repo)
    expect(waiting).toHaveLength(1)
    waiting[0]?.(ok([]))
    expect(await first).toEqual(ok([]))
    expect(await second).toEqual(ok([]))
    time = pullsKeptMs - 1
    await pulls.open(repo)
    expect(waiting).toHaveLength(1)
    time = pullsKeptMs
    void pulls.open(repo)
    expect(waiting).toHaveLength(2)
  })

  it('keeps each repository apart and runs again after a failed run', async () => {
    const { source, waiting } = countingSource()
    const pulls = keptPulls(source, () => new Date(0))
    void pulls.open({ owner: 'example', name: 'other-repo' })
    const failed = pulls.open(repo)
    expect(waiting).toHaveLength(2)
    waiting[1]?.(err({ reason: 'failed', code: 'exit-1' }))
    expect((await failed).ok).toBe(false)
    void pulls.open(repo)
    expect(waiting).toHaveLength(3)
  })
})
