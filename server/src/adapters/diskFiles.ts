// The FileStore on disk: git's index of the brain. Git runs with fixed
// arguments and literal pathspecs, no shell and a 5 s timeout, on each
// request. A read needs the path and its symlink target tracked, a real
// path in the root and a regular file (the open file's stat), and stops
// at the cap. `_local/` and a path with a NUL are never read; a fault is its code.
import { execFile } from 'node:child_process'
import { constants } from 'node:fs'
import { open, realpath } from 'node:fs/promises'
import { join, sep } from 'node:path'
import { err, ok, type Result } from '@bridge/shared'
import type { FileStore, FileStoreError } from '../services/fileStore.ts'

export type DiskFilesOptions = {
  /** The brain folder, a git repository. */
  readonly brainDir: string
  /** The server's environment; git gets only `gitEnv` of it. */
  readonly env: Readonly<Record<string, string | undefined>>
}

const codeOf = (thrown: unknown): string | undefined =>
  thrown instanceof Error && 'code' in thrown && (typeof thrown.code === 'string' || typeof thrown.code === 'number')
    ? String(thrown.code)
    : undefined

/** Paths that are never listed or read in the brain. */
const hidden = (path: string) => path === '_local' || path.startsWith('_local/')

/** PATH, HOME and LANG only, so no GIT_DIR, GIT_INDEX_FILE or GIT_CONFIG_* sends git to another repository. */
export function gitEnv(env: Readonly<Record<string, string | undefined>>): Record<string, string> {
  const kept: Record<string, string> = {}
  for (const key of ['PATH', 'HOME', 'LANG']) {
    const value = env[key]
    if (value !== undefined) kept[key] = value
  }
  return kept
}

/** The NUL-separated paths that `git ls-files -z -- <pathspec>` prints in `dir`. */
function gitFiles(
  dir: string,
  env: Record<string, string>,
  pathspec: readonly string[],
): Promise<Result<string[], FileStoreError>> {
  return new Promise((resolve) => {
    // execFile throws, not calls back, for an argument it cannot pass, such as one with a NUL.
    try {
      const args = ['--literal-pathspecs', 'ls-files', '-z', '--', ...pathspec]
      execFile(
        'git',
        args,
        { cwd: dir, env, timeout: 5_000, maxBuffer: 64 * 1024 ** 2, encoding: 'utf8' },
        (error, stdout) => {
          resolve(
            error === null
              ? ok(stdout.split('\0').filter((p) => p !== ''))
              : err({ reason: 'failed', code: codeOf(error) }),
          )
        },
      )
    } catch (thrown) {
      resolve(err({ reason: 'failed', code: codeOf(thrown) }))
    }
  })
}

/** A path that is no tracked path of a root: hidden, with a NUL, or with an empty, `.` or `..` part. */
const badPath = (path: string) =>
  hidden(path) || path.includes('\0') || path.split('/').some((part) => part === '' || part === '.' || part === '..')

export function createDiskFiles({ brainDir, env: serverEnv }: DiskFilesOptions): FileStore {
  const env = gitEnv(serverEnv)
  return {
    // Only the brain for now: a chat root gets its git repository in a later PR.
    async list(root) {
      if (root !== 'brain') return ok([])
      const listed = await gitFiles(brainDir, env, [])
      return listed.ok ? ok(listed.value.filter((p) => !hidden(p))) : listed
    },
    async read(root, path, max) {
      if (root !== 'brain' || badPath(path)) return ok('notFound')
      const dir = brainDir
      const tracked = await gitFiles(dir, env, [path])
      if (!tracked.ok) return tracked
      if (!tracked.value.includes(path)) return ok('notFound')
      try {
        const [base, real] = await Promise.all([realpath(dir), realpath(join(dir, path))])
        const target = real.slice(base.length + 1)
        if (!real.startsWith(base + sep) || hidden(target)) return ok('notFound')
        // A tracked symlink can point at an untracked file in the root, such as `.env`: the target must be tracked too.
        if (target !== path) {
          const targetTracked = await gitFiles(dir, env, [target])
          if (!targetTracked.ok) return targetTracked
          if (!targetTracked.value.includes(target)) return ok('notFound')
        }
        // No follow and no block: a swap after the realpath gives no link out of the root and no FIFO that waits.
        const file = await open(real, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
        try {
          const stat = await file.stat()
          if (!stat.isFile()) return ok('notFound')
          if (stat.size > max) return ok('tooLarge')
          // One byte past the cap tells a file that grew past it since the stat.
          const bytes = new Uint8Array(max + 1)
          const { bytesRead } = await file.read(bytes, 0, bytes.length, 0)
          return bytesRead > max ? ok('tooLarge') : ok(bytes.slice(0, bytesRead))
        } finally {
          await file.close()
        }
      } catch (thrown) {
        const code = codeOf(thrown)
        return ['ENOENT', 'ENOTDIR', 'ELOOP', 'EACCES', 'EPERM'].includes(String(code))
          ? ok('notFound')
          : err({ reason: 'failed', code })
      }
    },
  }
}
