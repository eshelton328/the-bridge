// The drift check of a repository (f-008 increment two, R7): the brain's
// `agents-md` skill's `scripts/check` on the repository's snapshot, run as
// `python3 -I` with an argument list, never a shell, a 60 s limit and only
// PATH, HOME and LANG of the server's environment, from the brain folder.
// Exit 0 is a clean repository and exit 1 its problem lines, each read as a
// kind, a path from the repository root and the rest of the line. A kind
// the contract does not know is the fault `unknown-kind` and any other line
// it cannot read `EBADDATA`, never a dropped line; any other end is a fault
// with its code only. Each line is masked as `relativeLines`
// does first, so no local path leaves this adapter.
import { execFile } from 'node:child_process'
import { realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { AgentsMdKind, maxDriftFindings, RepositoryDriftFinding } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { ProjectFault } from '../services/projects.ts'
import { relativeLines } from './projectDrift.ts'

/** How long one check may run. */
const checkTimeoutMs = 60_000

export type AgentsMdCheckOptions = {
  /** The `python3` program: a name on PATH or an absolute path. */
  readonly python: string
  /** The brain folder (BRIDGE_BRAIN_DIR), which holds the skill. */
  readonly brainDir: string
  /** The server's environment; the check gets only PATH, HOME and LANG of it. */
  readonly env: Readonly<Record<string, string | undefined>>
}

/** A check's first `maxDriftFindings` findings and the count of all of them. */
type Checked = { readonly findings: readonly RepositoryDriftFinding[]; readonly total: number }

export type AgentsMdCheck = {
  /** Checks the snapshot in `dir`. */
  run(dir: string): Promise<Result<Checked, ProjectFault>>
}

/** A kind, a path and the rest of a check line, as `scripts/check` prints them. */
const problemLine = /^(\S+)\s+(\S+)(?:\s+(.+))?$/

/** The findings of the check's lines: `unknown-kind` for a kind the contract does not know, `EBADDATA` for any other line it cannot read. */
export function findingsOf(lines: readonly string[]): Result<Checked, ProjectFault> {
  const found: RepositoryDriftFinding[] = []
  for (const line of lines) {
    const parts = problemLine.exec(line)
    if (parts !== null && !AgentsMdKind.safeParse(parts[1]).success)
      return err({ reason: 'failed', code: 'unknown-kind' })
    const finding = RepositoryDriftFinding.safeParse({
      kind: parts?.[1],
      path: parts?.[2],
      detail: parts?.[3]?.slice(0, 500) ?? null,
    })
    if (!finding.success) return err({ reason: 'failed', code: 'EBADDATA' })
    found.push(finding.data)
  }
  return ok({ findings: found.slice(0, maxDriftFindings), total: found.length })
}

export function createAgentsMdCheck({ python, brainDir, env }: AgentsMdCheckOptions): AgentsMdCheck {
  const kept: Record<string, string> = {}
  for (const key of ['PATH', 'HOME', 'LANG']) {
    const value = env[key]
    if (value !== undefined) kept[key] = value
  }
  const script = join(brainDir, 'toolkit', 'skills', 'agents-md', 'scripts', 'check')
  return {
    async run(dir) {
      const real = await realpath(dir).catch(() => dir)
      const roots = [...new Set([real, dir])].sort((a, b) => b.length - a.length)
      return new Promise((resolve) => {
        try {
          execFile(
            python,
            ['-I', script, dir],
            { cwd: brainDir, env: kept, timeout: checkTimeoutMs, maxBuffer: 4 * 1024 ** 2, encoding: 'utf8' },
            (error, stdout) => {
              if (error === null) {
                resolve(ok({ findings: [], total: 0 }))
                return
              }
              if (error.code === 1 && error.killed !== true) {
                const checked = findingsOf(relativeLines(stdout, roots, kept.HOME))
                // Exit 1 with no line is a check that broke, never a clean repository.
                resolve(
                  checked.ok && checked.value.total === 0 ? err({ reason: 'failed', code: 'no-output' }) : checked,
                )
                return
              }
              const code = typeof error.code === 'number' ? `exit-${String(error.code)}` : (error.code ?? 'unknown')
              resolve(err({ reason: 'failed', code: error.killed === true ? 'timeout' : code }))
            },
          )
        } catch {
          resolve(err({ reason: 'failed', code: 'spawn' }))
        }
      })
    },
  }
}
