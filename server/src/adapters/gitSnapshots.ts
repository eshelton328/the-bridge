// The server's own shallow clones of the repositories (f-008 increment two):
// `<root>/<repository ID>`, where root is `snapshots/` beside BRIDGE_DB_FILE,
// never under the chat root or in a main clone. A sync clones the default
// branch at depth 1, or fetches it again and resets to it, and gives the
// folder and its commit. git runs with an argument list, a time limit, no
// hooks, no submodules, no symlinks, no file protocol, no global or system
// config and only PATH, HOME (for gh's own config), LANG and
// GIT_TERMINAL_PROMPT=0; gh is its only credential helper and reads its own
// token, so no token is stored or passed. A fault is its code only; git's stderr
// never goes into an error or a log.
import { execFile } from 'node:child_process'
import { mkdir, realpath, stat } from 'node:fs/promises'
import { join, relative, isAbsolute } from 'node:path'
import { RepositoryId } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { ProjectFault } from '../services/projects.ts'

/** How long one git call may run: a first clone of a large repository included. */
const gitTimeoutMs = 120_000

/** The git config of every call, before its command. */
const safety = [
  'core.hooksPath=/dev/null',
  'protocol.file.allow=never',
  'protocol.ext.allow=never',
  'submodule.recurse=false',
  // A symlink in the repository is a plain file in the snapshot, so no reader can follow one out of it.
  'core.symlinks=false',
  'credential.helper=!gh auth git-credential',
].flatMap((setting) => ['-c', setting])

export type GitSnapshotsOptions = {
  /** The `git` program: a name on PATH or an absolute path. */
  readonly command: string
  /** The folder that holds one snapshot for each repository ID. */
  readonly root: string
  /** The server's environment; git gets only PATH, HOME and LANG of it. */
  readonly env: Readonly<Record<string, string | undefined>>
  /** The host of the clone URLs; https://github.com unless a test names another. */
  readonly base?: string
}

/** One synced snapshot: its folder (for the adapters only) and the commit it holds. */
type Snapshot = { readonly dir: string; readonly commit: string }

export type GitSnapshots = {
  sync(id: string, github: { readonly owner: string; readonly name: string }): Promise<Result<Snapshot, ProjectFault>>
}

const githubPart = /^[A-Za-z0-9._-]{1,100}$/
const commitHash = /^[0-9a-f]{40}$/

export function createGitSnapshots({
  command,
  root,
  env,
  base = 'https://github.com',
}: GitSnapshotsOptions): GitSnapshots {
  // No global or system git config: ~/.gitconfig can hold filters, insteadOf rules or other credential helpers.
  const kept: Record<string, string> = {
    GIT_TERMINAL_PROMPT: '0',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
  }
  for (const key of ['PATH', 'HOME', 'LANG']) {
    const value = env[key]
    if (value !== undefined) kept[key] = value
  }
  const git = (args: readonly string[]) =>
    new Promise<Result<string, ProjectFault>>((resolve) => {
      try {
        execFile(
          command,
          [...safety, ...args],
          { env: kept, timeout: gitTimeoutMs, maxBuffer: 1024 ** 2, encoding: 'utf8' },
          (error, stdout) => {
            if (error === null) {
              resolve(ok(stdout))
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
  const syncOnce = async (
    id: string,
    github: { readonly owner: string; readonly name: string },
  ): Promise<Result<Snapshot, ProjectFault>> => {
    if (!RepositoryId.safeParse(id).success) return err({ reason: 'failed', code: 'bad-id' })
    if (!githubPart.test(github.owner) || !githubPart.test(github.name) || github.name.startsWith('.'))
      return err({ reason: 'failed', code: 'bad-name' })
    try {
      await mkdir(root, { recursive: true, mode: 0o700 })
    } catch {
      return err({ reason: 'failed', code: 'no-root' })
    }
    const top = await realpath(root)
    const dir = join(top, id)
    const rel = relative(top, dir)
    if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return err({ reason: 'failed', code: 'outside-root' })
    const cloned = await stat(join(dir, '.git')).then(
      () => true,
      () => false,
    )
    const url = `${base}/${github.owner}/${github.name}.git`
    const synced = cloned
      ? await git(['-C', dir, 'fetch', '--quiet', '--depth', '1', '--no-recurse-submodules', 'origin', 'HEAD'])
      : await git(['clone', '--quiet', '--depth', '1', '--no-recurse-submodules', '--', url, dir])
    if (!synced.ok) return synced
    if (cloned) {
      const reset = await git(['-C', dir, 'reset', '--quiet', '--hard', 'FETCH_HEAD'])
      if (!reset.ok) return reset
    }
    const head = await git(['-C', dir, 'rev-parse', 'HEAD'])
    if (!head.ok) return head
    const commit = head.value.trim()
    return commitHash.test(commit) ? ok({ dir, commit }) : err({ reason: 'failed', code: 'EBADDATA' })
  }
  // One sync of a snapshot at a time: a second sync of the ID while one runs gets its answer, so two clones never
  // write one folder.
  const running = new Map<string, Promise<Result<Snapshot, ProjectFault>>>()
  return {
    sync(id, github) {
      const run = running.get(id)
      if (run !== undefined) return run
      const next = syncOnce(id, github).finally(() => running.delete(id))
      running.set(id, next)
      return next
    },
  }
}
