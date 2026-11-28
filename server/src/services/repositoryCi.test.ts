import { describe, expect, it } from 'vitest'
import {
  ciOf,
  ciRunsOf,
  jobRunCount,
  jobRunsOf,
  maxWorkflowRuns,
  rank,
  type WorkflowRun,
  windowOf,
} from './repositoryCi.ts'

const at = (minute: number) => new Date(Date.parse('2026-11-01T00:00:00.000Z') + minute * 60_000).toISOString()
/** A run of workflow `workflow` (by default its own) for commit `sha` that starts at minute `start` and takes `length` minutes. */
const run = (
  sha: string,
  conclusion: string | null,
  start: number,
  length: number,
  event = 'pull_request',
  workflow = start,
): WorkflowRun => ({
  id: start,
  workflow,
  sha,
  event,
  branch: 'a-branch',
  conclusion,
  startedAt: at(start),
  updatedAt: at(start + length),
})

describe('rank', () => {
  it('is the nearest rank, rounded to a tenth, and null with no values', () => {
    expect(rank([], 0.5)).toBeNull()
    expect(rank([3, 1, 2], 0.5)).toBe(2)
    expect(rank([1, 2, 3, 4], 0.5)).toBe(2)
    expect(rank([...Array.from({ length: 10 }, (_, i) => i + 1)], 0.9)).toBe(9)
    expect(rank([1.26], 0.5)).toBe(1.3)
  })
})

describe('ciRunsOf', () => {
  it('joins the workflow runs of one commit and event, and leaves out schedules and skipped runs', () => {
    const runs = ciRunsOf([
      run('a', 'success', 0, 1),
      run('a', 'success', 1, 8),
      run('a', 'skipped', 2, 0),
      run('a', 'success', 3, 1, 'push'),
      run('b', 'failure', 20, 2),
      run('c', 'cancelled', 30, 1),
      run('d', null, 40, 1),
      run('e', 'success', 50, 1, 'schedule'),
    ])
    expect(runs.map((r) => [r.runs.map((w) => w.id), r.finished, r.green])).toEqual([
      [[40], false, false],
      [[30], false, false],
      [[20], true, false],
      [[0, 1], true, true],
      [[3], true, true],
    ])
    expect(runs[3]).toMatchObject({ end: at(9), minutes: 8 })
  })

  it('gives no CI run for a commit whose workflow runs were all skipped', () => {
    expect(
      ciRunsOf([run('a', 'skipped', 0, 1, 'pull_request', 1), run('a', 'skipped', 0, 1, 'pull_request', 2)]),
    ).toEqual([])
  })

  it('picks the newest run of a workflow before it leaves out a skipped one', () => {
    const runs = ciRunsOf([
      run('a', 'success', 0, 10, 'pull_request', 1),
      run('a', 'failure', 0, 1, 'pull_request', 2),
      run('a', 'skipped', 60, 0, 'pull_request', 2),
    ])
    expect(runs[0]).toMatchObject({ green: true, minutes: 10 })
    expect(runs[0]?.runs.map((r) => r.id)).toEqual([0])
  })

  it('keeps the newest run of each workflow, so a next-day title check neither adds a day nor keeps an old failure', () => {
    const day = 24 * 60
    const runs = ciRunsOf([
      run('a', 'success', 0, 10, 'pull_request', 1),
      run('a', 'failure', 0, 1, 'pull_request', 2),
      run('a', 'success', day, 1, 'pull_request', 2),
    ])
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({ green: true, finished: true, minutes: 10, end: at(day + 1) })
    expect(runs[0]?.runs.map((r) => r.id)).toEqual([0, day])
  })
})

describe('ciOf', () => {
  it('gives null, never 0, for each time of an empty window', () => {
    expect(ciOf(at(0), [], [], [])).toEqual({
      since: at(0),
      runs: { green: 0, finished: 0 },
      runMinutes: null,
      merge: { count: 0, medianHours: null, p90Hours: null },
      jobs: [],
      jobRuns: 0,
    })
    const failedOnly = ciRunsOf([run('a', 'failure', 0, 5)])
    expect(ciOf(at(0), failedOnly, [], []).runMinutes).toBeNull()
  })

  it('counts the finished and green CI runs, and times a green one by its longest workflow run', () => {
    const runs = ciRunsOf([run('a', 'success', 0, 1), run('a', 'success', 1, 8), run('b', 'failure', 20, 2)])
    const ci = ciOf(at(0), runs, [], [])
    expect(ci.runs).toEqual({ green: 1, finished: 2 })
    expect(ci.runMinutes).toBe(8)
    expect(ci.merge).toEqual({ count: 0, medianHours: null, p90Hours: null })
  })

  it('gives each job its median of the passed jobs that ended, the slowest first', () => {
    const jobs = [
      [
        { name: 'lint', conclusion: 'success', minutes: 2 },
        { name: 'test', conclusion: 'success', minutes: 6 },
      ],
      [
        { name: 'lint', conclusion: 'success', minutes: 4 },
        { name: 'test', conclusion: 'skipped', minutes: 0 },
        // A job that has not ended has no minutes, and the median leaves it out.
        { name: 'build', conclusion: 'success', minutes: null },
      ],
    ]
    const ci = ciOf(at(0), [], [], jobs)
    expect(ci.jobs).toEqual([
      { name: 'test', medianMinutes: 6 },
      { name: 'lint', medianMinutes: 2 },
    ])
    expect(ci.jobRuns).toBe(2)
  })

  it('gives the median and p90 hours from open to merge of the PRs merged in the window', () => {
    const merged = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => ({ createdAt: at(0), mergedAt: at(h * 60) }))
    expect(ciOf(at(0), [], merged, []).merge).toEqual({ count: 10, medianHours: 5, p90Hours: 9 })
    expect(ciOf(at(150), [], merged, []).merge).toMatchObject({ count: 8 })
  })
})

describe('jobRunsOf', () => {
  it('keeps the newest green CI runs, at most jobRunCount', () => {
    const runs = ciRunsOf([
      ...Array.from({ length: jobRunCount + 2 }, (_, i) => run(`s${String(i)}`, 'success', i * 10, 1)),
      run('f', 'failure', 500, 1),
    ])
    expect(jobRunsOf(runs).map((r) => r.runs[0]?.id)).toEqual(
      Array.from({ length: jobRunCount }, (_, i) => (jobRunCount + 1 - i) * 10),
    )
  })
})

describe('windowOf', () => {
  it('is the asked start, or the oldest run read when the read was full', () => {
    const some = [run('a', 'success', 100, 1)]
    expect(windowOf(at(0), some)).toBe(at(0))
    const full = Array.from({ length: maxWorkflowRuns }, (_, i) => run(`s${String(i)}`, 'success', 100 + i, 1))
    expect(windowOf(at(0), full)).toBe(at(100))
  })
})
