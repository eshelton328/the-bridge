// The layout check of the Context drift panel (f-008, R9): `ncc check` on
// the chat tree, with an argument list, never a shell, a 60 s limit and
// only PATH, HOME, LANG and NCC_ROOT of the server's environment. Exit 0 is
// a clean layout and exit 1 its problem lines; any other end is a fault
// with its code only. Each path in a line is made relative to the root (or
// starts with "~" for one under the home folder), so no local path leaves
// this adapter.
import { execFile } from 'node:child_process'
import { realpath } from 'node:fs/promises'
import { err, ok, type Result } from '@bridge/shared'
import type { LayoutCheck, ProjectFault } from '../services/projects.ts'

/** How long a check may run. */
const checkTimeoutMs = 60_000

export type NccCheckOptions = {
  /** The `ncc` program: a name on PATH or an absolute path. */
  readonly command: string
  /** The root of the chat tree (`~/ncc-1701`), given to the check as NCC_ROOT. */
  readonly root: string
  /** The server's environment; the check gets only PATH, HOME and LANG of it. */
  readonly env: Readonly<Record<string, string | undefined>>
}

/** Each line with the root (and its real path) cut off its paths, and the home folder as "~". */
export function relativeLines(stdout: string, roots: readonly string[], home: string | undefined): string[] {
  const cut = (line: string) => {
    let out = line
    for (const root of roots) out = out.replaceAll(`${root}/`, '').replaceAll(root, '.')
    if (home !== undefined && home.length > 1) out = out.replaceAll(home, '~')
    return out.trim()
  }
  return stdout
    .split('\n')
    .map(cut)
    .filter((line) => line !== '')
}

export function createNccCheck({ command, root, env }: NccCheckOptions): LayoutCheck {
  const kept: Record<string, string> = { NCC_ROOT: root }
  for (const key of ['PATH', 'HOME', 'LANG']) {
    const value = env[key]
    if (value !== undefined) kept[key] = value
  }
  return {
    async run(): Promise<Result<readonly string[], ProjectFault>> {
      const real = await realpath(root).catch(() => root)
      const roots = [...new Set([real, root])].sort((a, b) => b.length - a.length)
      return new Promise((resolve) => {
        try {
          execFile(
            command,
            ['check'],
            { env: kept, timeout: checkTimeoutMs, maxBuffer: 4 * 1024 ** 2, encoding: 'utf8' },
            (error, stdout) => {
              if (error === null) {
                resolve(ok([]))
                return
              }
              if (error.code === 1 && error.killed !== true) {
                const lines = relativeLines(stdout, roots, kept.HOME)
                // Exit 1 with no problem line is a check that broke (an unreadable file), never a clean layout.
                resolve(lines.length > 0 ? ok(lines) : err({ reason: 'failed', code: 'no-output' }))
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
