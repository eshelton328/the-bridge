// API tests of /api/projects/:slug/architecture (f-008 increment two), in
// process with a fake brain, a store in memory and a runner the test holds.
import {
  type ArchitectureModel,
  ArchitectureResponse,
  ErrorBody,
  MachineId,
  RegenerateResponse,
} from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'
import { type ArchitectureStore, createArchitecture, type KeptDiagram } from '../services/architecture.ts'
import type { ProjectFault } from '../services/projects.ts'

const local = { Host: '127.0.0.1:5181' }
const json = { ...local, 'Content-Type': 'application/json' }
const model: ArchitectureModel = {
  view: 'container',
  parts: [{ id: 'server', name: 'server', shape: 'service', ours: true, typeLine: 'Server · Hono' }],
  boundaries: [],
  arrows: [],
  stack: [],
}
type RunAnswer = Result<{ readonly model: ArchitectureModel; readonly commit: string }, ProjectFault>

function setup() {
  const files = new Map<string, KeptDiagram>()
  const store: ArchitectureStore = {
    load: (key) => Promise.resolve(files.get(`${key.slug} ${key.scope}`) ?? null),
    save: (key, kept) => {
      files.set(`${key.slug} ${key.scope}`, kept)
      return Promise.resolve(ok(undefined))
    },
    prune: () => Promise.resolve(ok(undefined)),
  }
  const pending: ((answer: RunAnswer) => void)[] = []
  const architecture = createArchitecture({
    brain: {
      list: () =>
        Promise.resolve(
          ok([
            {
              slug: 'example-project',
              name: 'Example',
              purpose: 'An example.',
              icon: null,
              repositories: [{ id: 'example-repo', role: 'the app', github: null }],
            },
          ]),
        ),
      ideas: () => Promise.resolve(ok([])),
    },
    store,
    runner: { run: () => new Promise<RunAnswer>((resolve) => pending.push(resolve)) },
  })
  const app = createApp({
    agents: createFakeAgents(MachineId.parse('test-mac')),
    owner: 'owner@example.com',
    log: memoryLogger().log,
    architecture,
  })
  const regenerate = (scope: string, body = '{}') =>
    app.request(`/api/projects/example-project/architecture/${scope}/regenerate`, {
      method: 'POST',
      headers: json,
      body,
    })
  return { app, architecture, pending, regenerate }
}

describe('/api/projects/:slug/architecture', () => {
  it('lists @system and each repository, and 404s a project or scope it does not have', async () => {
    const { app } = setup()
    const res = await app.request('/api/projects/example-project/architecture', { headers: local })
    expect(res.status).toBe(200)
    expect(ArchitectureResponse.parse(await res.json()).scopes.map((s) => s.scope)).toEqual(['@system', 'example-repo'])
    for (const path of [
      '/api/projects/other-project/architecture',
      '/api/projects/example-project/architecture/other-repo',
      '/api/projects/example-project/architecture/..%2Fx',
    ])
      expect((await app.request(path, { headers: local })).status).toBe(404)
  })

  it('starts a run with 202, answers 409 architecture-busy for another scope, and gives the diagram after it', async () => {
    const { app, architecture, pending, regenerate } = setup()
    const started = await regenerate('%40system')
    expect(started.status).toBe(202)
    expect(RegenerateResponse.parse(await started.json()).state.running).toBe(true)
    expect((await regenerate('%40system')).status).toBe(202)
    const busy = await regenerate('example-repo')
    expect(busy.status).toBe(409)
    expect(ErrorBody.parse(await busy.json()).error.kind).toBe('architecture-busy')
    expect(pending).toHaveLength(1)
    pending[0]?.(ok({ model, commit: 'c'.repeat(40) }))
    await architecture.idle()
    const read = await app.request('/api/projects/example-project/architecture/%40system', { headers: local })
    expect(await read.json()).toMatchObject({ state: { commit: 'c'.repeat(40), running: false }, model })
  })

  it('takes an empty JSON body only', async () => {
    const { regenerate } = setup()
    expect((await regenerate('%40system', '{"scope":"x"}')).status).toBe(400)
  })
})
