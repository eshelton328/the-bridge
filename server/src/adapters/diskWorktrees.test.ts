import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ProjectSlug, RepositoryId } from '@bridge/contract'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createDiskWorktrees, insideRoot } from './diskWorktrees.ts'

let dir: string
let root: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-worktrees-'))
  root = join(dir, 'root')
  await mkdir(join(root, 'projects', 'example'), { recursive: true })
})
afterEach(() => rm(dir, { recursive: true, force: true }))

const slug = ProjectSlug.parse('example')
const repo = RepositoryId.parse('example-repo')
const worktrees = () => join(root, 'projects', 'example', 'example-repo-worktrees')

async function worktree(path: string) {
  await mkdir(path, { recursive: true })
  await writeFile(join(path, '.git'), 'gitdir: elsewhere\n')
}

describe('createDiskWorktrees', () => {
  it('counts each folder with a .git entry, nested branch folders too, and follows no symlink', async () => {
    await worktree(join(worktrees(), 'feature-a'))
    await worktree(join(worktrees(), 'fix', 'ncc-1-nested'))
    await mkdir(join(worktrees(), 'empty-folder'), { recursive: true })
    await worktree(join(dir, 'outside', 'linked'))
    await symlink(join(dir, 'outside'), join(worktrees(), 'a-link'))
    expect(await createDiskWorktrees(root).count(slug, repo)).toEqual({ ok: true, value: 2 })
  })

  it('counts a worktree of a branch with four parts, and is a fault for a folder deeper than 8 levels', async () => {
    await worktree(join(worktrees(), 'feature', 'team', 'topic', 'issue'))
    expect(await createDiskWorktrees(root).count(slug, repo)).toEqual({ ok: true, value: 1 })
    await mkdir(join(worktrees(), 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'), { recursive: true })
    expect(await createDiskWorktrees(root).count(slug, repo)).toEqual({
      ok: false,
      error: { reason: 'failed', code: 'too-deep' },
    })
  })

  it('is 0 when the repository has no worktrees folder', async () => {
    expect(await createDiskWorktrees(root).count(slug, repo)).toEqual({ ok: true, value: 0 })
  })

  it('is a fault when the folder is a link out of the chat root', async () => {
    await worktree(join(dir, 'outside', 'feature-a'))
    await symlink(join(dir, 'outside'), worktrees())
    expect(await createDiskWorktrees(root).count(slug, repo)).toEqual({
      ok: false,
      error: { reason: 'failed', code: 'outside-root' },
    })
  })
})

describe('insideRoot', () => {
  it('takes a folder under the root, the file system root too, and refuses the root itself or a neighbour', () => {
    expect(insideRoot('/', '/srv/chats/projects/p/r-worktrees')).toBe(true)
    expect(insideRoot('/srv/chats', '/srv/chats/projects/p/r-worktrees')).toBe(true)
    expect(insideRoot('/srv/chats', '/srv/chats')).toBe(false)
    expect(insideRoot('/srv/chats', '/srv/chats-old/projects')).toBe(false)
    expect(insideRoot('/srv/chats', '/etc')).toBe(false)
  })
})
