import { type ArtifactId, MachineId } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import {
  type ArtifactLibrary,
  type ArtifactStore,
  artifactIdOf,
  createArtifacts,
  type FoundArtifact,
} from './artifacts.ts'

const machine = MachineId.parse('test-mac')
const session = '0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69'
const link = (n: number) => `https://claude.ai/artifact/Example_Artifact-${String(n).padStart(4, '0')}`
const found = (n: number, extra: Partial<FoundArtifact> = {}): FoundArtifact => ({
  link: link(n),
  title: `Report ${String(n)}`,
  description: 'An example',
  publishedAt: `2026-11-20T10:00:0${String(n)}.000Z`,
  session,
  project: 'example-project',
  ...extra,
})

function setup() {
  let library: ArtifactLibrary = { lastSeenAt: null, artifacts: [] }
  let saves = 0
  let failing = false
  let saveFails = 0
  const store: ArtifactStore = {
    load: () => Promise.resolve(failing ? err({ reason: 'failed', code: 'EACCES' }) : ok(library)),
    save: (next) => {
      if (saveFails > 0) {
        saveFails -= 1
        return Promise.resolve(err({ reason: 'failed', code: 'ENOSPC' }))
      }
      saves += 1
      library = next
      return Promise.resolve(ok(undefined))
    },
  }
  let next: FoundArtifact[][] = []
  const finder = { scan: () => Promise.resolve({ found: next.shift() ?? [], partial: false }) }
  let time = Date.parse('2026-11-21T12:00:00.000Z')
  const artifacts = createArtifacts({ store, finder, machine, now: () => new Date((time += 1000)) })
  return {
    artifacts,
    finds: (...lists: FoundArtifact[][]) => {
      next = lists
    },
    saves: () => saves,
    fail: () => {
      failing = true
    },
    failSave: () => {
      saveFails = 1
    },
  }
}

const value = <T>(r: { ok: true; value: T } | { ok: false }) => (r.ok ? r.value : undefined)

describe('the artifacts library', () => {
  it('lists the found artifacts newest first, with the chat that published them', async () => {
    const t = setup()
    t.finds([found(1), found(2)])
    const list = value(await t.artifacts.list())
    expect(list?.artifacts.map((a) => [a.link, a.foundBy, a.chat, a.project])).toEqual([
      [link(2), 'session', `test-mac/${session}`, 'example-project'],
      [link(1), 'session', `test-mac/${session}`, 'example-project'],
    ])
    expect(list?.artifacts[0]?.id).toBe(artifactIdOf(link(2)))
    expect([list?.partial, list?.lastSeenAt, typeof list?.checkedAt]).toEqual([false, null, 'string'])
  })

  it('keeps one entry for a link found twice, with the newer title', async () => {
    const t = setup()
    const again = found(1, { title: 'Report 1 again', publishedAt: '2026-11-20T11:00:00.000Z' })
    t.finds([found(1)], [again], [again])
    await t.artifacts.list()
    const list = value(await t.artifacts.list())
    expect(list?.artifacts.map((a) => [a.title, a.publishedAt])).toEqual([
      ['Report 1 again', '2026-11-20T11:00:00.000Z'],
    ])
    const saves = t.saves()
    await t.artifacts.list()
    expect(t.saves()).toBe(saves)
  })

  it('adds an owner link, answers the same entry for it again, and files and removes it', async () => {
    const t = setup()
    const site = 'https://example.com/site'
    const first = value(await t.artifacts.add({ link: site, source: 'codex', title: 'Site' }))
    expect([first?.added, first?.artifact.foundBy, first?.artifact.chat]).toEqual([true, 'owner', null])
    const id: ArtifactId = artifactIdOf(site)
    expect(value(await t.artifacts.add({ link: site, source: 'codex', title: 'Other' }))?.added).toBe(false)
    expect(value(await t.artifacts.file(id, 'example-project'))).toBe('done')
    expect(value(await t.artifacts.get(id))).toMatchObject({ project: 'example-project', title: 'Site' })
    expect(value(await t.artifacts.remove(id))).toBe('done')
    expect(value(await t.artifacts.get(id))).toBe('notFound')
    expect(value(await t.artifacts.remove(id))).toBe('notFound')
    expect(value(await t.artifacts.add({ link: site, source: 'codex', title: 'Site' }))?.added).toBe(false)
    expect(value(await t.artifacts.list())?.artifacts).toHaveLength(1)
  })

  it('does not add again a found artifact that the owner removed', async () => {
    const t = setup()
    t.finds([found(1)], [found(1, { publishedAt: '2026-11-20T12:00:00.000Z' })])
    await t.artifacts.list()
    await t.artifacts.remove(artifactIdOf(link(1)))
    expect(value(await t.artifacts.list())?.artifacts).toEqual([])
  })

  it('marks the last look, and gives a store fault as its code', async () => {
    const t = setup()
    await t.artifacts.seen()
    expect(value(await t.artifacts.list())?.lastSeenAt).toMatch(/^2026-11-21T12:00:0\d/)
    t.fail()
    expect(await t.artifacts.list()).toEqual({ ok: false, error: { reason: 'failed', code: 'EACCES' } })
  })

  it('cuts a long title and description to the contract, and runs one change at a time', async () => {
    const t = setup()
    t.finds([found(1, { title: 'x'.repeat(300), description: 'y'.repeat(600) })])
    const [a, b] = await Promise.all([
      t.artifacts.list(),
      t.artifacts.add({ link: 'https://example.com/s', source: 'codex', title: 'S' }),
    ])
    const cut = value(a)?.artifacts.find((x) => x.link === link(1))
    expect([cut?.title.length, cut?.description.length]).toEqual([200, 500])
    expect(value(b)?.added).toBe(true)
    expect(value(await t.artifacts.list())?.artifacts).toHaveLength(2)
  })

  it('keeps what the finder gave until a save keeps it', async () => {
    const t = setup()
    t.finds([found(1)])
    t.failSave()
    expect(await t.artifacts.list()).toEqual({ ok: false, error: { reason: 'failed', code: 'ENOSPC' } })
    expect(value(await t.artifacts.list())?.artifacts.map((a) => a.link)).toEqual([link(1)])
  })

  it('compares times as dates, so a publish in the same second with ms is the newer one', async () => {
    const t = setup()
    t.finds(
      [found(1, { publishedAt: '2026-11-20T10:00:01Z' }), found(2, { publishedAt: '2026-11-20T10:00:01.050Z' })],
      [found(1, { title: 'Report 1 again', publishedAt: '2026-11-20T10:00:01.100Z' })],
    )
    await t.artifacts.list()
    const list = value(await t.artifacts.list())
    expect(list?.artifacts.map((a) => [a.link, a.title])).toEqual([
      [link(1), 'Report 1 again'],
      [link(2), 'Report 2'],
    ])
  })
})
