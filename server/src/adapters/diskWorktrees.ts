// The worktree count of a repository (f-008 increment two, R2's caption):
// the folders under `<chat root>/projects/<slug>/<repo>-worktrees` that hold
// a `.git` entry, at most 8 levels down, as a branch name with "/" nests its
// worktree; a deeper folder with no worktree yet makes the count a fault. A symlink is never followed, and the folder's real path must be
// in the chat root. A missing folder is 0; a fault is its errno code only.
import type { Dirent } from 'node:fs'
import { readdir, realpath } from 'node:fs/promises'
import { join, sep } from 'node:path'
import { err, ok } from '@bridge/shared'
import type { WorktreeCount } from '../services/projects.ts'

/** How deep a worktree may sit under the `-worktrees` folder; folders left past it make the count a fault. */
const maxDepth = 8
/** The most folders one count reads. */
const maxFolders = 5_000

const codeOf = (e: unknown) => (e instanceof Error && 'code' in e && typeof e.code === 'string' ? e.code : 'unknown')

export function createDiskWorktrees(chatRoot: string): WorktreeCount {
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
      if (!folder.startsWith(root + sep)) return err({ reason: 'failed', code: 'outside-root' })
      let count = 0
      let read = 0
      let level = [folder]
      try {
        for (let depth = 1; depth <= maxDepth && level.length > 0; depth++) {
          const next: string[] = []
          for (const parent of level) {
            if (++read > maxFolders) return err({ reason: 'failed', code: 'too-many' })
            const entries: Dirent[] = await readdir(parent, { withFileTypes: true })
            for (const entry of entries) {
              if (!entry.isDirectory()) continue
              const child = join(parent, entry.name)
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
