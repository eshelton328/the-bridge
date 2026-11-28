import {
  type ArchitectureModel,
  ArchitectureScope,
  type ProjectRepository,
  ProjectSlug,
  RepositoryId,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { describe, expect, it, vi } from 'vitest'
import { createSnapshotRunner, type SnapshotReader } from './architectureRunner.ts'
import type { ProjectFault, SnapshotSource } from './projects.ts'
import { createSnapshotLock } from './snapshotLock.ts'

const model: ArchitectureModel = {
  view: 'container',
  parts: [{ id: 'web', name: 'web', shape: 'package', ours: true, typeLine: 'web' }],
  boundaries: [],
  arrows: [],
  stack: [],
}
const repo = RepositoryId.parse('the-repo')
const onGithub = [{ id: repo, role: 'the app', github: { owner: 'owner', name: 'the-repo' } }]
const slug = ProjectSlug.parse('example-project')
const key = { slug, scope: repo }
const commit = 'a'.repeat(40)

function setup(reader: SnapshotReader = { read: () => Promise.resolve(ok(model)) }) {
  const sync = vi.fn<SnapshotSource['sync']>(() => Promise.resolve(ok({ dir: '/snapshots/owner/the-repo', commit })))
  const lock = createSnapshotLock()
  return { sync, lock, runner: createSnapshotRunner({ snapshots: { sync }, lock, reader }) }
}

describe('createSnapshotRunner', () => {
  it("reads a repository's diagram from its synced snapshot, with the snapshot's commit", async () => {
    const read = vi.fn<SnapshotReader['read']>(() => Promise.resolve(ok(model)))
    const { runner, sync } = setup({ read })
    expect(await runner.run({ ...key, repositories: onGithub })).toEqual(ok({ model, commit }))
    expect(sync).toHaveBeenCalledWith({ owner: 'owner', name: 'the-repo' })
    expect(read).toHaveBeenCalledWith('/snapshots/owner/the-repo')
  })

  it('holds the snapshot lock, so a drift run of that snapshot waits for the read', async () => {
    type Read = Result<ArchitectureModel, ProjectFault>
    let finish: (read: Read) => void = () => undefined
    const reading = new Promise<Read>((resolve) => {
      finish = resolve
    })
    const { runner, lock } = setup({ read: () => reading })
    const order: string[] = []
    const run = runner.run({ ...key, repositories: onGithub }).then(() => order.push('diagram'))
    await Promise.resolve()
    const drift = lock.hold('owner/the-repo', () => {
      order.push('drift')
      return Promise.resolve()
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(order).toEqual([])
    finish(ok(model))
    await Promise.all([run, drift])
    expect(order).toEqual(['diagram', 'drift'])
  })

  it('fails @system (A2), a repository off GitHub and one not listed, and passes a sync or read fault on', async () => {
    const { runner, sync } = setup({ read: () => Promise.resolve(err({ reason: 'failed', code: 'too-large' })) })
    const code = async (scope: string, repositories: readonly ProjectRepository[] = onGithub) => {
      const ran = await runner.run({ slug, scope: ArchitectureScope.parse(scope), repositories })
      return ran.ok ? 'ok' : ran.error.code
    }
    expect(await code('@system')).toBe('not-built')
    expect(await code('the-repo', [{ id: repo, role: 'the app', github: null }])).toBe('no-github')
    expect(await code('the-repo', [])).toBe('no-repository')
    expect(await code('the-repo')).toBe('too-large')
    sync.mockResolvedValueOnce(err({ reason: 'failed', code: 'EGIT' }))
    expect(await code('the-repo')).toBe('EGIT')
  })
})
