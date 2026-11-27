// A repository's CI numbers (f-008 increment two, R4, R6) from GitHub's
// workflow runs, merged PRs and jobs, as the CI port gives them. One CI run is
// the push or pull_request workflow runs of one commit, so a scheduled
// workflow and a PR's short title check do not count as runs of their own.
import { maxCiJobs, type RepositoryCi } from '@bridge/contract'
import type { Result } from '@bridge/shared'
import type { ProjectFault } from './projects.ts'

/** One GitHub Actions workflow run of the window. */
export type WorkflowRun = {
  readonly id: number
  readonly sha: string
  readonly event: string
  readonly branch: string
  /** GitHub's conclusion once the run ended, else null. */
  readonly conclusion: string | null
  readonly startedAt: string
  readonly updatedAt: string
}
export type MergedPull = { readonly createdAt: string; readonly mergedAt: string }
/** A job's minutes are null while it has not ended, never 0. */
export type JobRun = { readonly name: string; readonly conclusion: string | null; readonly minutes: number | null }

type Repository = { readonly owner: string; readonly name: string }

/** What GitHub gives for a repository's CI numbers; each call is read-only. */
export type CiSource = {
  runs(repository: Repository, since: string): Promise<Result<readonly WorkflowRun[], ProjectFault>>
  merged(repository: Repository, since: string): Promise<Result<readonly MergedPull[], ProjectFault>>
  jobs(repository: Repository, run: number): Promise<Result<readonly JobRun[], ProjectFault>>
}

/** How many of the newest green CI runs the job medians read. */
export const jobRunCount = 10
/** The most workflow runs one read gives: 10 pages of 100. */
export const maxWorkflowRuns = 1_000

/** One CI run: the workflow runs of one commit and event, with its first start and last end. */
export type CiRun = {
  readonly runs: readonly WorkflowRun[]
  readonly start: string
  readonly end: string
  /** Every workflow run ended and none was cancelled; a skipped one is left out. */
  readonly finished: boolean
  readonly green: boolean
}

const ciEvents = new Set(['push', 'pull_request'])
const minutes = (from: string, to: string) => Math.max(0, Date.parse(to) - Date.parse(from)) / 60_000
const round1 = (n: number) => Math.round(n * 10) / 10

/** The value at rank `p` (0 to 1) of the values, by the nearest rank, to a tenth; null with none. */
export function rank(values: readonly number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return round1(sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))] ?? 0)
}

/** The CI runs of the workflow runs, newest end first. */
export function ciRunsOf(runs: readonly WorkflowRun[]): CiRun[] {
  const groups = new Map<string, WorkflowRun[]>()
  for (const run of runs) {
    if (!ciEvents.has(run.event) || run.conclusion === 'skipped') continue
    const key = `${run.event} ${run.sha}`
    groups.set(key, [...(groups.get(key) ?? []), run])
  }
  return [...groups.values()]
    .map((all) => {
      const finished = all.every((r) => r.conclusion !== null && r.conclusion !== 'cancelled')
      return {
        runs: all,
        start: all.map((r) => r.startedAt).sort()[0] ?? '',
        end:
          all
            .map((r) => r.updatedAt)
            .sort()
            .at(-1) ?? '',
        finished,
        green: finished && all.every((r) => r.conclusion === 'success'),
      }
    })
    .sort((a, b) => b.end.localeCompare(a.end))
}

/**
 * The CI runs whose jobs the medians read: the newest `jobRunCount` green ones of any branch, as a push to `main`
 * runs only the plan job of the-bridge's CI.
 */
export function jobRunsOf(runs: readonly CiRun[]): CiRun[] {
  return runs.filter((r) => r.green).slice(0, jobRunCount)
}

/**
 * The start of the window the numbers cover: `since`, or the oldest run's start when the read gave
 * `maxWorkflowRuns` runs, as older runs of the window were not read.
 */
export function windowOf(since: string, runs: readonly WorkflowRun[]): string {
  if (runs.length < maxWorkflowRuns) return since
  const oldest = runs.map((r) => r.startedAt).sort()[0]
  return oldest === undefined || oldest < since ? since : oldest
}

export function ciOf(
  since: string,
  runs: readonly CiRun[],
  merged: readonly MergedPull[],
  jobs: readonly (readonly JobRun[])[],
): RepositoryCi {
  const green = runs.filter((r) => r.green)
  const hours = merged.filter((p) => p.mergedAt >= since).map((p) => minutes(p.createdAt, p.mergedAt) / 60)
  const byName = new Map<string, number[]>()
  for (const job of jobs.flat())
    if (job.conclusion === 'success' && job.minutes !== null)
      byName.set(job.name, [...(byName.get(job.name) ?? []), job.minutes])
  return {
    since,
    runs: { green: green.length, finished: runs.filter((r) => r.finished).length },
    runMinutes: rank(
      green.map((r) => minutes(r.start, r.end)),
      0.5,
    ),
    merge: { count: hours.length, medianHours: rank(hours, 0.5), p90Hours: rank(hours, 0.9) },
    jobs: [...byName.entries()]
      .map(([name, all]) => ({ name: name.slice(0, 200), medianMinutes: rank(all, 0.5) ?? 0 }))
      .sort((a, b) => b.medianMinutes - a.medianMinutes || a.name.localeCompare(b.name))
      .slice(0, maxCiJobs),
    jobRuns: jobs.length,
  }
}
