// The port of a repository's CI numbers (f-008 increment two, R4, R6): GitHub's
// workflow runs, merged PRs and jobs.
import type { Result } from '@bridge/shared'
import type { ProjectFault } from './projects.ts'

/** One GitHub Actions workflow run of the window. */
type WorkflowRun = {
  readonly id: number
  readonly sha: string
  readonly event: string
  readonly branch: string
  /** GitHub's conclusion once the run ended, else null. */
  readonly conclusion: string | null
  readonly startedAt: string
  readonly updatedAt: string
}
type MergedPull = { readonly createdAt: string; readonly mergedAt: string }
type JobRun = { readonly name: string; readonly conclusion: string | null; readonly minutes: number }

type Repository = { readonly owner: string; readonly name: string }

/** What GitHub gives for a repository's CI numbers; each call is read-only. */
export type CiSource = {
  runs(repository: Repository, since: string): Promise<Result<readonly WorkflowRun[], ProjectFault>>
  merged(repository: Repository, since: string): Promise<Result<readonly MergedPull[], ProjectFault>>
  jobs(repository: Repository, run: number): Promise<Result<readonly JobRun[], ProjectFault>>
}

/** The most workflow runs one read gives: 10 pages of 100. */
export const maxWorkflowRuns = 1_000
