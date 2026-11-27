// The worktree count of a repository (f-008 increment two): the folders under
// `<chat root>/projects/<slug>/<repo>-worktrees` with a `.git` entry, 8 levels
// down at most (a branch with "/" nests). No symlink is followed and the real
// path stays in the chat root; a missing folder is 0, a fault its code only.
import type { Dirent } from 'node:fs'
import { readdir, realpath } from 'node:fs/promises'
import { isAbsolute, join, relative } from 'node:path'
import { err, ok } from '@bridge/shared'
import type { WorktreeCount } from '../services/projects.ts'

/** How deep a worktree may sit under the `-worktrees` folder; folders left past it make the count a fault. */
const maxDepth = 8
/** The most folder reads of one count, each child's look for its .git included. */
const maxFolders = 5_000

const codeOf = (e: unknown) => (e instanceof Error && 'code' in e && typeof e.code === 'string' ? e.code : 'unknown')

/** Whether `folder` is inside `root` (both real paths), also when the root is the file system's root. */
export function insideRoot(root: string, folder: string): boolean {
  const rel = relative(root, folder)
  return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
}

export function createDiskWorktrees(chatRoot: string, limits: { readonly maxFolders?: number } = {}): WorktreeCount {
  const folderLimit = limits.maxFolders ?? maxFolders
  return {
    async count(slug, repository) {
      let root: string
      let folder: string
      try {
        root = await realpath(chatRoot)
        folder = await realpath(join(chatRoot, 'projects', slug, `${repository}-worktrees`))
      } catch (e) {
        return codeOf(e) === 'ENOENT' ? ok(0) : err({ reason: 'failed', code: codeOf(e) })
      }
      if (!insideRoot(root, folder)) return err({ reason: 'failed', code: 'outside-root' })
      let count = 0
      let read = 0
      let level = [folder]
      try {
        for (let depth = 1; depth <= maxDepth && level.length > 0; depth++) {
          const next: string[] = []
          for (const parent of level) {
            if (++read > folderLimit) return err({ reason: 'failed', code: 'too-many' })
            const entries: Dirent[] = await readdir(parent, { withFileTypes: true })
            for (const entry of entries) {
              if (!entry.isDirectory()) continue
              const child = join(parent, entry.name)
              // Each read counts, the look into a child for its .git too.
              if (++read > folderLimit) return err({ reason: 'failed', code: 'too-many' })
              const inner = await readdir(child, { withFileTypes: true })
              if (inner.some((e) => e.name === '.git')) count++
              else next.push(child)
            }
          }
          level = next
        }
      } catch (e) {
        return err({ reason: 'failed', code: codeOf(e) })
      }
      // A folder still unread past the deepest level may hold a worktree: no count beats a wrong one.
      if (level.length > 0) return err({ reason: 'failed', code: 'too-deep' })
      return ok(count)
    },
  }
}
