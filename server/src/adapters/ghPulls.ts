// The open PRs of a GitHub repository (f-008, R6), from `gh pr list` with
// an argument list, never a shell, and a 20 s limit. gh gets only the
// variables of the server's environment that it needs to sign in. A reply
// that the schema does not take, a failed run or a timeout is a fault with
// its code only; gh's stderr never goes into an error or a log.
import { execFile } from 'node:child_process'
import { maxProjectTitle, maxRepositoryPulls, type PullStatus } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type { OpenPull, ProjectFault, PullSource } from '../services/projects.ts'

const ghTimeoutMs = 20_000

/** The variables gh reads to find its config and token; nothing else of the server's environment. */
const ghKeys = ['PATH', 'HOME', 'LANG', 'GH_CONFIG_DIR', 'XDG_CONFIG_HOME', 'GH_TOKEN', 'GITHUB_TOKEN', 'GH_HOST']

export type GhPullsOptions = {
  /** The `gh` program: a name on PATH or an absolute path. */
  readonly command: string
  readonly env: Readonly<Record<string, string | undefined>>
}

const Check = z.union([
  // A check run (GitHub Actions): its status, and its conclusion once complete.
  z.object({ __typename: z.literal('CheckRun'), status: z.string(), conclusion: z.string().nullable().optional() }),
  // A commit status of another service.
  z.object({ __typename: z.literal('StatusContext'), state: z.string() }),
])

const GhPull = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  url: z.string(),
  headRefName: z.string(),
  isDraft: z.boolean(),
  updatedAt: z.iso.datetime({ offset: true }),
  statusCheckRollup: z.array(Check).nullable(),
})

const failedConclusions = new Set(['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE'])

/** A PR's status pill: a draft, then a failed check, then a check that runs, else in review. */
export function statusOf(pull: z.infer<typeof GhPull>): PullStatus {
  if (pull.isDraft) return 'draft'
  const checks = pull.statusCheckRollup ?? []
  const failed = checks.some((c) =>
    c.__typename === 'CheckRun'
      ? failedConclusions.has(c.conclusion ?? '')
      : c.state === 'FAILURE' || c.state === 'ERROR',
  )
  if (failed) return 'ciFailed'
  const running = checks.some((c) =>
    c.__typename === 'CheckRun' ? c.status !== 'COMPLETED' : c.state === 'PENDING' || c.state === 'EXPECTED',
  )
  return running ? 'ciRunning' : 'inReview'
}

const pullUrl = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/

export function createGhPulls({ command, env }: GhPullsOptions): PullSource {
  const kept: Record<string, string> = {}
  for (const key of ghKeys) {
    const value = env[key]
    if (value !== undefined) kept[key] = value
  }
  return {
    open(repository): Promise<Result<readonly OpenPull[], ProjectFault>> {
      const args = [
        'pr',
        'list',
        '--repo',
        `${repository.owner}/${repository.name}`,
        '--state',
        'open',
        '--limit',
        String(maxRepositoryPulls),
        '--json',
        'number,title,url,headRefName,isDraft,updatedAt,statusCheckRollup',
      ]
      return new Promise((resolve) => {
        try {
          execFile(
            command,
            args,
            { env: kept, timeout: ghTimeoutMs, maxBuffer: 16 * 1024 ** 2, encoding: 'utf8' },
            (error, stdout) => {
              if (error !== null) {
                const code = typeof error.code === 'number' ? `exit-${String(error.code)}` : (error.code ?? 'unknown')
                resolve(err({ reason: 'failed', code: error.killed === true ? 'timeout' : code }))
                return
              }
              let raw: unknown
              try {
                raw = JSON.parse(stdout)
              } catch {
                resolve(err({ reason: 'failed', code: 'EBADDATA' }))
                return
              }
              const parsed = z.array(GhPull).safeParse(raw)
              if (!parsed.success) {
                resolve(err({ reason: 'failed', code: 'EBADDATA' }))
                return
              }
              resolve(
                ok(
                  parsed.data
                    .filter((p) => pullUrl.test(p.url))
                    .map((p) => ({
                      number: p.number,
                      title: p.title.slice(0, maxProjectTitle),
                      url: p.url,
                      branch: p.headRefName.slice(0, 255),
                      status: statusOf(p),
                      updatedAt: new Date(p.updatedAt).toISOString(),
                    })),
                ),
              )
            },
          )
        } catch {
          resolve(err({ reason: 'failed', code: 'spawn' }))
        }
      })
    },
  }
}
