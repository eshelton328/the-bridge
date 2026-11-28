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
const never = { commit: null, generatedAt: null, stale: false, running: false, failed: null }

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
          failed: null,
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

  it('makes each C1 control and bidi character a space too', async () => {
    const dirty: ArchitectureModel = {
      ...model,
      parts: [
        {
          id: 'server',
          name: 'a\u{85}b\u{9f}c',
          shape: 'service',
          ours: true,
          typeLine: '\u{202a}x\u{202e}y\u{2066}z\u{2069}',
        },
      ],
      stack: [{ name: 'Run\u{80}time', badges: ['No\u{2067}de'] }],
    }
    const { architecture, files } = setup({ run: runs(ok({ model: dirty, commit })) })
    await architecture.regenerate(slug, '@system')
    await architecture.idle()
    const kept = files.get(`${slug} @system`)?.model
    expect(kept?.parts[0]).toMatchObject({ name: 'a b c', typeLine: ' x y z ' })
    expect(kept?.stack).toEqual([{ name: 'Run time', badges: ['No de'] }])
    // The characters just outside the ranges stay.
    const near: ArchitectureModel = {
      ...model,
      parts: [
        { id: 'server', name: '\u{a0}\u{2029}\u{202f}\u{2065}\u{206a}', shape: 'service', ours: true, typeLine: 't' },
      ],
    }
    const other = setup({ run: runs(ok({ model: near, commit })) })
    await other.architecture.regenerate(slug, '@system')
    await other.architecture.idle()
    expect(other.files.get(`${slug} @system`)?.model.parts[0]?.name).toBe('\u{a0}\u{2029}\u{202f}\u{2065}\u{206a}')
  })

  it('keeps the last failed run until a good run, through a new run start, and gives null after a restart', async () => {
    let answer: Awaited<ReturnType<ArchitectureRunner['run']>> = err({ reason: 'failed', code: 'no-github' })
    let finish: () => void = () => undefined
    let held = false
    const run = vi.fn(async () => {
      if (held) await new Promise<void>((resolve) => (finish = resolve))
      return answer
    })
    const { store, files } = memoryStore()
    const brain: BrainProjects = { list: () => Promise.resolve(ok([project])), ideas: () => Promise.resolve(ok([])) }
    let at = new Date('2026-11-28T08:00:00Z')
    const make = () => createArchitecture({ brain, store, runner: { run }, now: () => at })
    const architecture = make()
    const stateNow = async () => {
      const read = await architecture.scope(slug, 'system')
      return read.ok && read.value !== 'notFound' ? read.value.state : null
    }
    await architecture.regenerate(slug, 'system')
    await architecture.idle()
    expect((await stateNow())?.failed).toEqual({ at: '2026-11-28T08:00:00.000Z', code: 'no-github' })
    const system = await architecture.scope(slug, '@system')
    expect(system.ok && system.value !== 'notFound' && system.value.state.failed).toBe(null)
    expect((await stateNow())?.commit).toBe(null)

    at = new Date('2026-11-28T09:00:00Z')
    answer = ok({ model, commit })
    held = true
    await architecture.regenerate(slug, 'system')
    expect(await stateNow()).toMatchObject({
      running: true,
      failed: { at: '2026-11-28T08:00:00.000Z', code: 'no-github' },
    })
    finish()
    await architecture.idle()
    expect(await stateNow()).toMatchObject({ running: false, failed: null, commit })

    held = false
    answer = err({ reason: 'failed', code: 'too-large' })
    await architecture.regenerate(slug, 'system')
    await architecture.idle()
    expect(await stateNow()).toMatchObject({ commit, failed: { at: '2026-11-28T09:00:00.000Z', code: 'too-large' } })
    expect(files.size).toBe(1)
    const restarted = await make().scope(slug, 'system')
    expect(restarted.ok && restarted.value !== 'notFound' && restarted.value.state).toMatchObject({
      commit,
      failed: null,
    })
  })

  it('gives "unknown" for a fault code the contract does not take, and "threw" for a runner that throws', async () => {
    const odd = setup({ run: runs(err({ reason: 'failed', code: 'no such file /Users/x' })) })
    await odd.architecture.regenerate(slug, '@system')
    await odd.architecture.idle()
    const read = await odd.architecture.scope(slug, '@system')
    expect(read.ok && read.value !== 'notFound' && read.value.state.failed).toEqual({
      at: '2026-11-28T08:00:00.000Z',
      code: 'unknown',
    })
    expect(odd.log).toHaveBeenCalledWith({ code: 'unknown' })
    expect(odd.log).not.toHaveBeenCalledWith({ code: 'no such file /Users/x' })
    const thrown = setup({ run: vi.fn(() => Promise.reject(new Error('boom'))) })
    await thrown.architecture.regenerate(slug, '@system')
    await thrown.architecture.idle()
    const after = await thrown.architecture.scope(slug, '@system')
    expect(after.ok && after.value !== 'notFound' && after.value.state.failed).toMatchObject({ code: 'threw' })
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
