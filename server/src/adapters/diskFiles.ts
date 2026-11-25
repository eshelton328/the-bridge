// The FileStore on disk: git's index of the brain, its one root for now. `list` runs `git
// ls-files -z` in the root, with fixed arguments, no shell and a 5 s
// timeout, on each request (d-112: no timer). `read` asks git whether it
// tracks the one path (with literal pathspecs, so `*` or `:` in a path is
// no pattern), then reads it only when its real path stays in the root's
// real path and lstat finds a regular file, so a FIFO or a device is never
// opened. The size comes from lstat, and the read stops at the cap, as the
// file can grow. The brain's `_local/` is never listed or read. A fault
// keeps only its errno code or git's exit code.
import { execFile } from 'node:child_process'
import { lstat, open, realpath } from 'node:fs/promises'
import { join, sep } from 'node:path'
import { err, ok, type Result } from '@bridge/shared'
import type { FileStore, FileStoreError } from '../services/fileStore.ts'

export type DiskFilesOptions = {
  /** The brain folder, a git repository. */
  readonly brainDir: string
}

const codeOf = (thrown: unknown): string | undefined =>
  thrown instanceof Error && 'code' in thrown && (typeof thrown.code === 'string' || typeof thrown.code === 'number')
    ? String(thrown.code)
    : undefined

/** Paths that are never listed or read in the brain. */
const hidden = (path: string) => path === '_local' || path.startsWith('_local/')

/** The NUL-separated paths that `git ls-files -z -- <pathspec>` prints in `dir`. */
function gitFiles(dir: string, pathspec: readonly string[]): Promise<Result<string[], FileStoreError>> {
  return new Promise((resolve) => {
    execFile(
      'git',
      ['--literal-pathspecs', 'ls-files', '-z', '--', ...pathspec],
      { cwd: dir, timeout: 5_000, maxBuffer: 64 * 1024 ** 2, encoding: 'utf8' },
      (error, stdout) => {
        if (error !== null) {
          resolve(err({ reason: 'failed', code: codeOf(error) }))
          return
        }
        resolve(ok(stdout.split('\0').filter((p) => p !== '')))
      },
    )
  })
}

export function createDiskFiles({ brainDir }: DiskFilesOptions): FileStore {
  return {
    async list() {
      const listed = await gitFiles(brainDir, [])
      return listed.ok ? ok(listed.value.filter((p) => !hidden(p))) : listed
    },
    async read(_root, path, max) {
      if (hidden(path) || path.split('/').some((part) => part === '' || part === '.' || part === '..'))
        return ok('notFound')
      const dir = brainDir
      const tracked = await gitFiles(dir, [path])
      if (!tracked.ok) return tracked
      if (!tracked.value.includes(path)) return ok('notFound')
      try {
        const [base, real] = await Promise.all([realpath(dir), realpath(join(dir, path))])
        if (!real.startsWith(base + sep) || hidden(real.slice(base.length + 1))) return ok('notFound')
        const stat = await lstat(real)
        if (!stat.isFile()) return ok('notFound')
        if (stat.size > max) return ok('tooLarge')
        const file = await open(real, 'r')
        try {
          // One byte past the cap tells a file that grew past it since the lstat.
          const bytes = new Uint8Array(max + 1)
          const { bytesRead } = await file.read(bytes, 0, max + 1, 0)
          return bytesRead > max ? ok('tooLarge') : ok(bytes.slice(0, bytesRead))
        } finally {
          await file.close()
        }
      } catch (thrown) {
        const code = codeOf(thrown)
        return code === 'ENOENT' || code === 'ENOTDIR' ? ok('notFound') : err({ reason: 'failed', code })
      }
    },
  }
}
