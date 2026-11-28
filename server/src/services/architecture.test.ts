import type { ArchitectureModel, ProjectSlug } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { describe, expect, it, vi } from 'vitest'
import {
  type ArchitectureRunner,
  type ArchitectureStore,
  createArchitecture,
  type KeptDiagram,
} from './architecture.ts'
import type { BrainProjects, ProjectRecord } from './projects.ts'

const slug: ProjectSlug = 'example-project'
const project: ProjectRecord = {
  slug,
  name: 'Example',
  purpose: 'An example.',
  icon: null,
  repositories: [{ id: 'system', role: 'a repository named system', github: null }],
}
const model: ArchitectureModel = {
  view: 'component',
  parts: [{ id: 'server', name: 'server', shape: 'service', ours: true, typeLine: 'Server · Hono' }],
  boundaries: [],
  arrows: [],
  stack: [],
}
const commit = 'b'.repeat(40)
/** A scope's state before its first run. */
const never = { commit: null, generatedAt: null, stale: false, running: false }

function memoryStore() {
  const files = new Map<string, KeptDiagram>()
  const prune = vi.fn<ArchitectureStore['prune']>(() => Promise.resolve(ok(undefined)))
  const store: ArchitectureStore = {
    load: (key) => Promise.resolve(files.get(`${key.slug} ${key.scope}`) ?? null),
    save: (key, kept) => {
      files.set(`${key.slug} ${key.scope}`, kept)
      return Promise.resolve(ok(undefined))
    },
    prune: (keep) => prune(keep),
  }
  return { store, files, prune }
}

function setup(
  runner: ArchitectureRunner,
  listed: () => ReturnType<BrainProjects['list']> = () => Promise.resolve(ok([project])),
) {
  const { store, files, prune } = memoryStore()
  const log = vi.fn()
  const brain: BrainProjects = { list: vi.fn(listed), ideas: () => Promise.resolve(ok([])) }
  const architecture = createArchitecture({ brain, store, runner, log, now: () => new Date('2026-11-28T08:00:00Z') })
  return { architecture, prune, files, log, brain }
}

const runs = (answer: Awaited<ReturnType<ArchitectureRunner['run']>>) => vi.fn(() => Promise.resolve(answer))

describe('the Architecture service', () => {
  it('lists @system, then each repository, with no diagram and nothing running', async () => {
    const { architecture } = setup({ run: runs(ok({ model, commit })) })
    const listed = await architecture.scopes(slug)
    expect(listed).toEqual(
      ok({
        scopes: [
          { ...never, scope: '@system', title: 'How the system works' },
          { ...never, scope: 'system', title: 'How system works' },
        ],
      }),
    )
    expect(await architecture.scopes('other-project')).toEqual(ok('notFound'))
    expect(await architecture.scope(slug, 'other-repo')).toEqual(ok('notFound'))
  })

  it('runs a regenerate in the background, keeps the diagram and tells the watchers', async () => {
    const run = runs(ok({ model, commit }))
    const { architecture, prune } = setup({ run })
    const changed = vi.fn()
    architecture.watch(changed)
    const started = await architecture.regenerate(slug, '@system')
    expect(started.ok && started.value !== 'notFound' && started.value !== 'busy' && started.value.state.running).toBe(
      true,
    )
    await architecture.idle()
    expect(run).toHaveBeenCalledWith({ slug, scope: '@system', repositories: project.repositories })
    expect(changed).toHaveBeenCalledWith({ slug, scope: '@system' })
    expect(await architecture.scope(slug, '@system')).toEqual(
      ok({
        state: {
          scope: '@system',
          title: 'How the system works',
          commit,
          generatedAt: '2026-11-28T08:00:00.000Z',
          stale: false,
          running: false,
        },
        model,
      }),
    )
    expect(prune).toHaveBeenCalledWith([
      { slug, scope: '@system' },
      { slug, scope: 'system' },
    ])
  })

  it('logs a watcher that throws, and still tells the other watchers', async () => {
    const { architecture, log } = setup({ run: runs(ok({ model, commit })) })
    const after = vi.fn()
    architecture.watch(() => {
      throw new Error('watcher fault')
    })
    architecture.watch(after)
    await architecture.regenerate(slug, '@system')
    await architecture.idle()
    expect(log).toHaveBeenCalledWith({ code: 'watcher' })
    expect(after).toHaveBeenCalledWith({ slug, scope: '@system' })
  })

  it('joins a regenerate of the running scope, and answers busy for another scope', async () => {
    let finish: (value: Awaited<ReturnType<ArchitectureRunner['run']>>) => void = () => undefined
    const run = vi.fn(
      () => new Promise<Awaited<ReturnType<ArchitectureRunner['run']>>>((resolve) => (finish = resolve)),
    )
    const { architecture } = setup({ run })
    await architecture.regenerate(slug, '@system')
    await architecture.regenerate(slug, '@system')
    expect(await architecture.regenerate(slug, 'system')).toEqual(ok('busy'))
    expect(run).toHaveBeenCalledTimes(1)
    finish(ok({ model, commit }))
    await architecture.idle()
    expect((await architecture.regenerate(slug, 'system')).ok).toBe(true)
  })

  it('cleans control characters from each text before the contract checks the model', async () => {
    const dirty: ArchitectureModel = {
      ...model,
      parts: [{ id: 'server', name: 'ser\u{7}ver', shape: 'service', ours: true, typeLine: 'a\nb' }],
    }
    const { architecture, files } = setup({ run: runs(ok({ model: dirty, commit })) })
    await architecture.regenerate(slug, '@system')
    await architecture.idle()
    expect(files.get(`${slug} @system`)?.model.parts[0]).toMatchObject({ name: 'ser ver', typeLine: 'a b' })
  })

  it('keeps no diagram from a failed run, a bad model or a bad commit, and logs the code only', async () => {
    const bad = { ...model, arrows: [{ from: 'server', to: 'gone', label: 'calls' }] }
    for (const [answer, code] of [
      [err({ reason: 'failed' as const, code: 'not-built' }), 'not-built'],
      [ok({ model: bad, commit }), 'bad-model'],
      [ok({ model, commit: 'abc' }), 'bad-commit'],
    ] as const) {
      const { architecture, files, log } = setup({ run: runs(answer) })
      await architecture.regenerate(slug, '@system')
      await architecture.idle()
      expect(files.size).toBe(0)
      expect(log).toHaveBeenCalledWith({ code })
    }
  })

  it('logs a runner that throws, and prunes nothing after a list read that failed', async () => {
    const thrown = setup({ run: vi.fn(() => Promise.reject(new Error('boom /Users/x'))) })
    await thrown.architecture.regenerate(slug, '@system')
    await thrown.architecture.idle()
    expect(thrown.log).toHaveBeenCalledWith({ code: 'threw' })
    expect((await thrown.architecture.scope(slug, '@system')).ok).toBe(true)

    let reads = 0
    const later = setup({ run: runs(ok({ model, commit })) }, () =>
      Promise.resolve(reads++ === 0 ? ok([project]) : err({ reason: 'failed' as const, code: 'EIO' })),
    )
    await later.architecture.regenerate(slug, '@system')
    await later.architecture.idle()
    expect(later.prune).not.toHaveBeenCalled()
    expect(later.log).toHaveBeenCalledWith({ code: 'EIO' })
  })
})
