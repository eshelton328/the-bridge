import { err, ok, type Result } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import {
  aboutKeptMs,
  keptFacts,
  keptPulls,
  type OpenPull,
  type ProjectFault,
  type PullSource,
  pullsKeptMs,
  type RepositoryAbout,
  type RepositoryFacts,
} from './projects.ts'

const repo = { owner: 'example', name: 'example-repo' }
const pull = (n: number): OpenPull => ({
  number: n,
  title: `Sample PR ${String(n)}`,
  url: `https://github.com/example/example-repo/pull/${String(n)}`,
  branch: `sample-${String(n)}`,
  status: 'inReview',
  updatedAt: '2026-11-27T10:00:00.000Z',
})
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

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
  it('shares one run between two requests that cross, and runs no other for 30 s', async () => {
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
  })

  it('gives the kept answer at once at any age; a stale read starts one run, and a read during it none', async () => {
    let time = 0
    const { source, waiting } = countingSource()
    const pulls = keptPulls(source, () => new Date(time))
    const first = pulls.open(repo)
    waiting[0]?.(ok([pull(1)]))
    await first
    time = 10 * 60 * 60_000
    expect(await pulls.open(repo)).toEqual(ok([pull(1)]))
    expect(await pulls.open(repo)).toEqual(ok([pull(1)]))
    expect(waiting).toHaveLength(2)
    waiting[1]?.(ok([pull(2)]))
    await settle()
    expect(await pulls.open(repo)).toEqual(ok([pull(2)]))
    expect(waiting).toHaveLength(2)
  })

  it('calls changed only when a run in the background finds other PRs; a failed one keeps the answer', async () => {
    let time = 0
    let changes = 0
    const { source, waiting } = countingSource()
    const pulls = keptPulls(
      source,
      () => new Date(time),
      () => (changes += 1),
    )
    const first = pulls.open(repo)
    waiting[0]?.(ok([pull(1)]))
    await first
    const answers: Result<readonly OpenPull[], ProjectFault>[] = [
      ok([pull(1)]),
      err({ reason: 'failed', code: 'exit-1' }),
      ok([pull(2)]),
    ]
    for (const [i, answer] of answers.entries()) {
      time += pullsKeptMs
      void pulls.open(repo)
      waiting[i + 1]?.(answer)
      await settle()
    }
    expect(changes).toBe(1)
    expect(await pulls.open(repo)).toEqual(ok([pull(2)]))
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

  it('takes a thrown run as a failed one: no unhandled rejection, a first one not kept, a later one keeps the answer', async () => {
    let time = 0
    let calls = 0
    const source: PullSource = {
      open: () => {
        calls += 1
        return calls === 2 ? Promise.resolve(ok([pull(1)])) : Promise.reject(new Error('the adapter broke'))
      },
    }
    const pulls = keptPulls(source, () => new Date(time))
    expect(await pulls.open(repo)).toEqual(err({ reason: 'failed', code: 'threw' }))
    expect(await pulls.open(repo)).toEqual(ok([pull(1)]))
    time = pullsKeptMs
    expect(await pulls.open(repo)).toEqual(ok([pull(1)]))
    await settle()
    expect(calls).toBe(3)
    expect(await pulls.open(repo)).toEqual(ok([pull(1)]))
  })
})

describe('keptFacts', () => {
  it('shares one gh run between requests that cross, keeps it 5 minutes, and runs again after a fault', async () => {
    let time = 0
    const waiting: ((result: Result<RepositoryAbout, ProjectFault>) => void)[] = []
    const source: RepositoryFacts = { about: () => new Promise((resolve) => waiting.push(resolve)) }
    const facts = keptFacts(source, () => new Date(time))
    const first = facts.about(repo)
    void facts.about(repo)
    expect(waiting).toHaveLength(1)
    waiting[0]?.(ok({ visibility: 'public', release: null }))
    expect(await first).toEqual(ok({ visibility: 'public', release: null }))
    time = aboutKeptMs - 1
    await facts.about(repo)
    expect(waiting).toHaveLength(1)
    time = aboutKeptMs
    const failed = facts.about(repo)
    waiting[1]?.(err({ reason: 'failed', code: 'exit-1' }))
    await failed
    void facts.about(repo)
    expect(waiting).toHaveLength(3)
  })
})
