// API tests of /api/projects (f-008), in process with the disk adapters on a
// fixture brain, a stub `gh` and a stub `ncc` (no real GitHub or layout).
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ChatId,
  DriftResponse,
  ErrorBody,
  IdeaDetailResponse,
  IdeasResponse,
  MachineId,
  PinProjectResponse,
  ProjectChatsResponse,
  ProjectDetailResponse,
  ProjectsResponse,
  RepositoriesResponse,
  RepositoryCiResponse,
  RepositoryDriftResponse,
} from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createBrainProjects,
  createDiskDriftStore,
  createDiskPins,
  createDiskRepositoryDriftStore,
} from '../adapters/diskProjects.ts'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createDiskWorktrees } from '../adapters/diskWorktrees.ts'
import { createGhPulls } from '../adapters/ghPulls.ts'
import { createGhRepositoryFacts } from '../adapters/ghRepos.ts'
import { createNccCheck } from '../adapters/projectDrift.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'
import { createProjects, type RepositoryCheck, type SnapshotSource } from '../services/projects.ts'
import type { CiSource, CiStore, KeptCi } from '../services/repositoryCi.ts'

const local = { Host: '127.0.0.1:5181' }
const json = { ...local, 'Content-Type': 'application/json' }
const ideaId = '0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69'

const projectYaml = (slug: string, name: string, extra = '') =>
  [
    'schema_version: 1',
    `slug: "${slug}"`,
    `name: "${name}"`,
    `purpose: "The ${name} project, marker-5150."`,
    extra,
    'repositories:',
    '  - id: example-repo',
    '    role: the app',
    '    url: https://github.com/example-owner/example-repo',
    '  - id: local-repo',
    '    role: a local folder',
    '    url: file:///home/dev/local-repo',
    'linear: []',
  ].join('\n')

const ghReply = JSON.stringify([
  {
    number: 7,
    title: 'feat: an older example',
    url: 'https://github.com/example-owner/example-repo/pull/7',
    headRefName: 'dev/ncc-7-older',
    isDraft: true,
    updatedAt: '2026-11-20T10:00:00Z',
    statusCheckRollup: [],
  },
  {
    number: 9,
    title: 'fix: a newer example',
    url: 'https://github.com/example-owner/example-repo/pull/9',
    headRefName: 'dev/ncc-9-newer',
    isDraft: false,
    updatedAt: '2026-11-21T10:00:00Z',
    statusCheckRollup: [{ __typename: 'CheckRun', status: 'COMPLETED', conclusion: 'FAILURE' }],
  },
])

const aboutReply = JSON.stringify({
  data: {
    repository: {
      visibility: 'PUBLIC',
      releases: {
        nodes: [
          {
            tagName: 'v1.0.0-beta.2',
            url: 'https://github.com/example-owner/example-repo/releases/tag/v1.0.0-beta.2',
            publishedAt: '2026-11-21T10:00:00Z',
          },
        ],
      },
    },
  },
})

let dir: string
let brain: string
let data: string
let bin: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-projects-'))
  brain = join(dir, 'root', 'engine')
  data = join(dir, 'data', 'projects')
  bin = join(dir, 'bin')
  const files: Record<string, string> = {
    'projects/example-project/project.yaml': projectYaml('example-project', 'Example', 'icon: rocket'),
    'projects/another-project/project.yaml': projectYaml('another-project', 'Another'),
    'projects/no-yaml/README.md': '# no project.yaml here\n',
    'projects/example-project/ideas/an-idea.md': [
      '---',
      `id: ${ideaId}`,
      'type: idea',
      'title: An example idea',
      "updated: '2026-11-21T10:00:00Z'",
      '---',
      '# An example idea',
      '',
      'The first paragraph, marker-5150.',
      '',
      '## Open questions',
      '',
      '- One?',
    ].join('\n'),
  }
  for (const [path, text] of Object.entries(files)) {
    await mkdir(join(brain, path, '..'), { recursive: true })
    await writeFile(join(brain, path), text)
  }
  await mkdir(bin, { recursive: true })
  await writeFile(
    join(bin, 'gh'),
    `#!/bin/sh\nif [ "$1" = api ]; then\ncat <<'EOF'\n${aboutReply}\nEOF\nelse\ncat <<'EOF'\n${ghReply}\nEOF\nfi\n`,
  )
  await writeFile(
    join(bin, 'ncc'),
    '#!/bin/sh\necho "not a git clone: $NCC_ROOT/projects/example-project/stray.log (only <repo>/ go here)"\necho "loose file in projects/: $NCC_ROOT/projects/other.txt"\nexit 1\n',
  )
  await chmod(join(bin, 'gh'), 0o755)
  await chmod(join(bin, 'ncc'), 0o755)
})
afterEach(() => rm(dir, { recursive: true, force: true }))

/** An app on the fixture brain; a second call is a new server process on the same data folder. */
function server(
  ci?: CiSource,
  ciStore?: CiStore,
  brainSource = createBrainProjects(brain),
  repositoryDrift?: { snapshots: SnapshotSource; check: RepositoryCheck },
) {
  const logger = memoryLogger()
  const agents = createFakeAgents(MachineId.parse('test-mac'))
  const projects = createProjects({
    agents,
    brain: brainSource,
    pins: createDiskPins(data),
    pulls: createGhPulls({ command: join(bin, 'gh'), env: process.env }),
    check: createNccCheck({ command: join(bin, 'ncc'), root: join(dir, 'root'), env: process.env }),
    drift: createDiskDriftStore(data),
    facts: createGhRepositoryFacts({ command: join(bin, 'gh'), env: process.env }),
    worktrees: createDiskWorktrees(join(dir, 'root')),
    ...(ci === undefined ? {} : { ci }),
    ...(ciStore === undefined ? {} : { ciStore }),
    ciLog: (event) => {
      if (event.kind === 'failed') logger.log.warn('ci read failed', { code: event.code })
      else logger.log.debug('ci read timed', { part: event.part, ms: event.ms })
    },
    ...(repositoryDrift === undefined
      ? {}
      : { repositoryDrift: { ...repositoryDrift, store: createDiskRepositoryDriftStore(data) } }),
    now: () => new Date('2026-11-22T09:00:00.000Z'),
  })
  const app = createApp({ agents, owner: 'owner@example.com', log: logger.log, projects })
  return { app, logger, agents, projects }
}

const commit = 'c'.repeat(40)

/**
 * A snapshot source and a check that count their calls and say how many run at once; the check gives `answer`,
 * after `gate` when one is given.
 */
function fakeDrift(answer: Awaited<ReturnType<RepositoryCheck['run']>>, gate?: Promise<void>) {
  const seen = { syncs: 0, checks: 0, active: 0, most: 0, steps: [] as string[] }
  let checking: () => void = () => undefined
  /** Ends when the first check starts, so a test can wait for that step and not for a time. */
  const checkStarted = new Promise<void>((resolve) => {
    checking = resolve
  })
  const enter = () => {
    seen.active += 1
    seen.most = Math.max(seen.most, seen.active)
  }
  const snapshots: SnapshotSource = {
    async sync() {
      enter()
      seen.syncs += 1
      seen.steps.push('sync')
      await Promise.resolve()
      seen.steps.push('synced')
      seen.active -= 1
      return { ok: true, value: { dir: '/snapshots/example-repo', commit } }
    },
  }
  const check: RepositoryCheck = {
    async run() {
      enter()
      seen.checks += 1
      seen.steps.push('check')
      checking()
      await gate
      seen.steps.push('checked')
      seen.active -= 1
      return answer
    },
  }
  return { seen, checkStarted, source: { snapshots, check } }
}

const read = async (app: ReturnType<typeof server>['app'], path: string) => app.request(path, { headers: local })

describe('/api/projects', () => {
  it('lists each project folder with a project.yaml, by name, with its icon', async () => {
    const { app } = server()
    const listed = ProjectsResponse.parse(await (await read(app, '/api/projects')).json())
    expect(listed.projects).toEqual([
      {
        slug: 'another-project',
        name: 'Another',
        purpose: 'The Another project, marker-5150.',
        icon: null,
        pinned: false,
      },
      {
        slug: 'example-project',
        name: 'Example',
        purpose: 'The Example project, marker-5150.',
        icon: 'rocket',
        pinned: false,
      },
    ])
  })

  it('pin survives restart: a pin moves the project first, and a new server process reads it back', async () => {
    const first = server()
    const pinned = await first.app.request('/api/projects/example-project/pin', {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ pinned: true }),
    })
    expect(pinned.status).toBe(200)
    expect(PinProjectResponse.parse(await pinned.json()).project.pinned).toBe(true)
    const again = server()
    const listed = ProjectsResponse.parse(await (await read(again.app, '/api/projects')).json())
    expect(listed.projects.map((p) => [p.slug, p.pinned])).toEqual([
      ['example-project', true],
      ['another-project', false],
    ])
    await again.app.request('/api/projects/example-project/pin', {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ pinned: false }),
    })
    const unpinned = ProjectsResponse.parse(await (await read(server().app, '/api/projects')).json())
    expect(unpinned.projects.map((p) => p.pinned)).toEqual([false, false])
  })

  it('gives the detail with the open PRs of each GitHub repository from gh, newest first, with their status', async () => {
    const { app } = server()
    const detail = ProjectDetailResponse.parse(await (await read(app, '/api/projects/example-project')).json())
    expect(detail.repositories.map((r) => [r.id, r.github])).toEqual([
      ['example-repo', { owner: 'example-owner', name: 'example-repo' }],
      ['local-repo', null],
    ])
    expect(detail.queue.inProgress.map((p) => [p.repository, p.number, p.status])).toEqual([
      ['example-repo', 9, 'ciFailed'],
      ['example-repo', 7, 'draft'],
    ])
    expect(detail.queue.unread).toEqual([])
  })

  it('names a repository whose PRs gh cannot read, and still answers', async () => {
    await writeFile(join(bin, 'gh'), '#!/bin/sh\necho "marker-5150 gh failed" >&2\nexit 4\n')
    const { app } = server()
    const detail = ProjectDetailResponse.parse(await (await read(app, '/api/projects/example-project')).json())
    expect(detail.queue).toEqual({ inProgress: [], unread: ['example-repo'] })
  })

  it('lists the ideas and gives one idea with its body', async () => {
    const { app } = server()
    const ideas = IdeasResponse.parse(await (await read(app, '/api/projects/example-project/ideas')).json())
    expect(ideas.ideas.map((i) => [i.title, i.summary, i.state])).toEqual([
      ['An example idea', 'The first paragraph, marker-5150.', 'open'],
    ])
    const one = IdeaDetailResponse.parse(
      await (await read(app, `/api/projects/example-project/ideas/${ideaId}`)).json(),
    )
    expect(one.body).toContain('## Open questions')
    expect(one.file).toBe('ideas/an-idea.md')
    expect([one.created, one.source, one.links]).toEqual([null, null, []])
    expect((await read(app, '/api/projects/another-project/ideas')).status).toBe(200)
  })

  it("gives an idea's created time, its source kind and the records its body links to", async () => {
    const project = join(brain, 'projects/example-project')
    const other = '5d0c9e2a-7b61-4c3f-9e8d-2a1b3c4d5e6f'
    await mkdir(join(project, 'decisions'), { recursive: true })
    await writeFile(
      join(project, 'ideas/linked.md'),
      [
        '---',
        `id: ${other}`,
        'type: idea',
        'title: A linking idea',
        "created: '2026-11-23T09:00:00Z'",
        "source: marker-owner's discussion, 2026-11-23",
        '---',
        '# A linking idea',
        '',
        'See [the example](an-idea.md) and [d-112](../decisions/d-112-push-and-machine-load.md).',
      ].join('\n'),
    )
    await writeFile(
      join(project, 'decisions/d-112-push-and-machine-load.md'),
      ['---', 'type: decision', 'title: Push and machine load', '---', '# Push'].join('\n'),
    )
    const { app } = server()
    const one = IdeaDetailResponse.parse(await (await read(app, `/api/projects/example-project/ideas/${other}`)).json())
    expect(one.created).toBe('2026-11-23T09:00:00.000Z')
    expect(one.source).toBe('chat')
    expect(one.links).toEqual([
      { kind: 'idea', ref: null, title: 'An example idea', idea: ideaId },
      { kind: 'decision', ref: 'd-112', title: 'Push and machine load', idea: null },
    ])
    expect(JSON.stringify(one)).not.toContain('marker-owner')
  })

  it('runs the layout check, keeps the project findings and gives them again after a restart', async () => {
    const { app } = server()
    expect(DriftResponse.parse(await (await read(app, '/api/projects/example-project/drift')).json())).toEqual({
      last: null,
    })
    const ran = await app.request('/api/projects/example-project/drift', { method: 'POST', headers: json, body: '{}' })
    expect(ran.status).toBe(200)
    const run = {
      result: 'findings',
      checkedAt: '2026-11-22T09:00:00.000Z',
      findings: [{ text: 'not a git clone: projects/example-project/stray.log (only <repo>/ go here)' }],
    }
    expect(DriftResponse.parse(await ran.json())).toEqual({ last: run })
    const again = server()
    expect(DriftResponse.parse(await (await read(again.app, '/api/projects/example-project/drift')).json())).toEqual({
      last: run,
    })
  })

  it('answers 404 for a project folder with no project.yaml, a bad name and a bad idea ID, as an ErrorBody', async () => {
    const { app } = server()
    for (const path of [
      '/api/projects/no-yaml',
      '/api/projects/..%2Fengine',
      '/api/projects/example-project/ideas/not-a-uuid',
      '/api/projects/example-project/ideas/1b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69',
      '/api/projects/no-yaml/drift',
    ]) {
      const response = await read(app, path)
      expect([path, response.status]).toEqual([path, 404])
      expect(ErrorBody.parse(await response.json()).error.kind).toBe('not-found')
    }
  })

  it('checks the bodies before any work: 400 for a pin with another field or a body that is not JSON', async () => {
    const { app } = server()
    const extra = await app.request('/api/projects/example-project/pin', {
      method: 'PUT',
      headers: json,
      body: JSON.stringify({ pinned: true, path: '/home/dev' }),
    })
    expect(extra.status).toBe(400)
    const form = await app.request('/api/projects/example-project/drift', { method: 'POST', headers: local, body: 'x' })
    expect(form.status).toBe(400)
    expect(ProjectsResponse.parse(await (await read(app, '/api/projects')).json()).projects.some((p) => p.pinned)).toBe(
      false,
    )
  })

  it('answers 500 with the request ID for a store fault, and logs the code only', async () => {
    await mkdir(data, { recursive: true })
    await writeFile(join(data, 'pins.json'), '{ not json marker-5150')
    const { app, logger } = server()
    const response = await read(app, '/api/projects')
    expect(response.status).toBe(500)
    expect(ErrorBody.parse(await response.json()).error.kind).toBe('internal')
    const lines = logger.text()
    expect(lines).toContain('EBADDATA')
    expect(lines).not.toContain('marker-5150')
  })

  describe('GET /:slug/chats (R7)', () => {
    const chat = (local: string) => ChatId.parse(`test-mac/${local}`)

    it("lists the chats tagged with the project, in the workspaces' order, with their workspace and tags", async () => {
      const { app, agents } = server()
      agents.setChatTags(chat('brain-git'), { project: 'example-project', role: 'builder' })
      agents.setChatTags(chat('bridge-themes'), { project: 'example-project', area: 'bridge' })
      agents.setChatTags(chat('drift-check'), { project: 'another-project' })
      const response = await read(app, '/api/projects/example-project/chats')
      expect(response.status).toBe(200)
      const { chats } = ProjectChatsResponse.parse(await response.json())
      expect(chats.map((c) => [c.title, c.workspace.label, c.tags])).toEqual([
        [
          'bridge themes',
          'omni-brain',
          [
            { key: 'project', value: 'example-project' },
            { key: 'area', value: 'bridge' },
          ],
        ],
        [
          'brain git',
          'omni',
          [
            { key: 'project', value: 'example-project' },
            { key: 'role', value: 'builder' },
          ],
        ],
      ])
    })

    it('keeps only the project, area and role tags with a slug value, at most 3, and logs no tag value', async () => {
      const { app, agents, logger } = server()
      agents.setChatTags(chat('bridge-themes'), {
        project: 'example-project',
        area: 'Bad Value marker-5150',
        role: 'builder',
        Project: 'example-project',
        token: 'secret-marker-5150',
        owner: 'marker-5150',
      })
      agents.setChatTags(chat('brain-git'), { project: '../example-project' })
      const { chats } = ProjectChatsResponse.parse(
        await (await read(app, '/api/projects/example-project/chats')).json(),
      )
      expect(chats.map((c) => [c.title, c.tags])).toEqual([
        [
          'bridge themes',
          [
            { key: 'project', value: 'example-project' },
            { key: 'role', value: 'builder' },
          ],
        ],
      ])
      expect(logger.text()).not.toContain('marker-5150')
    })

    it('answers 404 for an unknown project as the detail does, and reads no chats for a bad slug', async () => {
      const { app, agents } = server()
      for (const slug of ['no-such-project', 'Bad%20Slug']) {
        const [chats, detail] = await Promise.all([
          read(app, `/api/projects/${slug}/chats`),
          read(app, `/api/projects/${slug}`),
        ])
        expect([chats.status, detail.status]).toEqual([404, 404])
        const kindAndMessage = async (r: Response) => {
          const { kind, message } = ErrorBody.parse(await r.json()).error
          return { kind, message }
        }
        expect(await kindAndMessage(chats)).toEqual(await kindAndMessage(detail))
      }
      expect(agents.reads()).toBe(0)
    })

    it("answers herdr's fault as the workspaces routes do: 503 when it does not answer, 502 for a bad reply", async () => {
      const { agents, logger } = server()
      const failingWith = (reason: 'unreachable' | 'badReply') =>
        createApp({
          agents,
          owner: 'owner@example.com',
          log: logger.log,
          projects: createProjects({
            brain: createBrainProjects(brain),
            pins: createDiskPins(data),
            pulls: createGhPulls({ command: join(bin, 'gh'), env: process.env }),
            check: createNccCheck({ command: join(bin, 'ncc'), root: join(dir, 'root'), env: process.env }),
            drift: createDiskDriftStore(data),
            agents: createFakeAgents(MachineId.parse('test-mac'), {
              error: { reason, message: 'herdr is down marker-5150' },
            }),
          }),
        })
      const down = await read(failingWith('unreachable'), '/api/projects/example-project/chats')
      expect(down.status).toBe(503)
      expect(ErrorBody.parse(await down.json()).error.kind).toBe('herdr-unavailable')
      const bad = await read(failingWith('badReply'), '/api/projects/example-project/chats')
      expect(bad.status).toBe(502)
      expect(ErrorBody.parse(await bad.json()).error.kind).toBe('herdr-bad-reply')
      expect(logger.text()).not.toContain('marker-5150')
    })
  })
})

describe('/api/projects/:slug/repositories', () => {
  it('gives each repository in project.yaml order with its GitHub facts and counts', async () => {
    const worktrees = join(dir, 'root', 'projects', 'example-project', 'example-repo-worktrees')
    for (const name of ['feature-a', 'feature-b']) {
      await mkdir(join(worktrees, name), { recursive: true })
      await writeFile(join(worktrees, name, '.git'), 'gitdir: elsewhere\n')
    }
    const { app } = server()
    const res = await read(app, '/api/projects/example-project/repositories')
    expect(res.status).toBe(200)
    expect(RepositoriesResponse.parse(await res.json()).repositories).toEqual([
      {
        id: 'example-repo',
        role: 'the app',
        github: { owner: 'example-owner', name: 'example-repo' },
        visibility: 'public',
        release: {
          tag: 'v1.0.0-beta.2',
          url: 'https://github.com/example-owner/example-repo/releases/tag/v1.0.0-beta.2',
          publishedAt: '2026-11-21T10:00:00.000Z',
        },
        openPulls: 2,
        worktrees: 2,
        unread: [],
      },
      {
        id: 'local-repo',
        role: 'a local folder',
        github: null,
        visibility: null,
        release: null,
        openPulls: null,
        worktrees: 0,
        unread: [],
      },
    ])
  })

  it('names the GitHub parts it could not read, and answers 200', async () => {
    await writeFile(join(bin, 'gh'), '#!/bin/sh\necho "marker-5150" >&2\nexit 1\n')
    const { app, logger } = server()
    const res = await read(app, '/api/projects/example-project/repositories')
    expect(res.status).toBe(200)
    const [first] = RepositoriesResponse.parse(await res.json()).repositories
    expect(first).toMatchObject({ visibility: null, release: null, openPulls: null, unread: ['about', 'pulls'] })
    expect(JSON.stringify(logger.lines())).not.toContain('marker-5150')
  })

  it('is 404 for a slug that names no project', async () => {
    const { app } = server()
    expect((await read(app, '/api/projects/no-such-project/repositories')).status).toBe(404)
    expect(ErrorBody.parse(await (await read(app, '/api/projects/Bad%20Slug/repositories')).json()).error.kind).toBe(
      'not-found',
    )
  })
})

describe('/api/projects/:slug/repositories/:repo/ci', () => {
  const at = (minute: number) => new Date(Date.parse('2026-11-21T10:00:00.000Z') + minute * 60_000).toISOString()
  const run = (id: number, conclusion: string | null, length: number, event = 'pull_request') => ({
    id,
    workflow: id,
    sha: `sha-${String(id)}`,
    event,
    branch: 'a-branch',
    conclusion,
    startedAt: at(0),
    updatedAt: at(length),
  })
  const fakeCi = (fail?: string) => {
    const calls: string[] = []
    const source: CiSource = {
      runs: (_r, since) => {
        calls.push(`runs ${since}`)
        if (fail !== undefined) return Promise.resolve(err({ reason: 'failed', code: fail }))
        return Promise.resolve(
          ok([run(1, 'success', 4), run(2, 'failure', 9), run(3, 'cancelled', 1), run(4, 'success', 6, 'schedule')]),
        )
      },
      merged: () => Promise.resolve(ok([{ createdAt: at(0), mergedAt: at(120) }])),
      jobs: (_r, id) => {
        calls.push(`jobs ${String(id)}`)
        return Promise.resolve(ok([{ name: 'lint', conclusion: 'success', minutes: 2 }]))
      },
    }
    return { source, calls }
  }

  const numbers = {
    since: '2026-10-23T09:00:00.000Z',
    runs: { green: 1, finished: 2 },
    runMinutes: 4,
    merge: { count: 1, medianHours: 2, p90Hours: 2 },
    jobs: [{ name: 'lint', medianMinutes: 2 }],
    jobRuns: 1,
  }
  const path = '/api/projects/example-project/repositories/example-repo/ci'
  const answer = async (app: ReturnType<typeof server>['app']) =>
    RepositoryCiResponse.parse(await (await read(app, path)).json())
  /** A store in memory, with the repositories each prune kept. */
  const memoryStore = (start: KeptCi | null = null) => {
    let kept = start
    const prunes: string[][] = []
    const store: CiStore = {
      load: () => Promise.resolve(kept),
      save: (_r, next) => {
        kept = next
        return Promise.resolve(ok(undefined))
      },
      prune: (keep) => {
        prunes.push(keep.map((r) => `${r.owner}/${r.name}`))
        return Promise.resolve(ok(undefined))
      },
    }
    return { store, prunes, kept: () => kept }
  }
  /** Resolves on the next `projects.changed` of the app's projects. */
  const nextChange = (projects: ReturnType<typeof server>['projects']) =>
    new Promise<void>((resolve) => {
      const stop = projects.watch(() => {
        stop()
        resolve()
      })
    })

  it('answers a first read at once as reading, then gives the numbers with their read time and keeps them', async () => {
    const { source, calls } = fakeCi()
    const { store, kept } = memoryStore()
    const { app, projects } = server(source, store)
    const changed = nextChange(projects)
    const res = await read(app, path)
    expect(res.status).toBe(200)
    expect(RepositoryCiResponse.parse(await res.json())).toEqual({ ci: null, readAt: null, reading: true })
    await changed
    expect(await answer(app)).toEqual({ ci: numbers, readAt: '2026-11-22T09:00:00.000Z', reading: false })
    expect(kept()).toEqual({ ci: numbers, readAt: '2026-11-22T09:00:00.000Z' })
    expect(calls).toEqual(['runs 2026-10-23T09:00:00.000Z', 'jobs 1'])
  })

  it('answers from the store after a restart with no read, and reads again in the background once it is 10 minutes old', async () => {
    const fresh = memoryStore({ ci: numbers, readAt: '2026-11-22T08:55:00.000Z' })
    const first = fakeCi()
    expect(await answer(server(first.source, fresh.store).app)).toEqual({
      ci: numbers,
      readAt: '2026-11-22T08:55:00.000Z',
      reading: false,
    })
    expect(first.calls).toEqual([])
    const old = memoryStore({ ci: numbers, readAt: '2026-11-22T08:40:00.000Z' })
    const second = fakeCi()
    const { app } = server(second.source, old.store)
    expect(await answer(app)).toEqual({ ci: numbers, readAt: '2026-11-22T08:40:00.000Z', reading: true })
    await vi.waitFor(() => {
      expect(old.kept()?.readAt).toBe('2026-11-22T09:00:00.000Z')
    })
    expect(second.calls).toHaveLength(2)
  })

  it('sends one projects.changed at the end of each refresh, also when its numbers are equal', async () => {
    const same = memoryStore({ ci: numbers, readAt: '2026-11-22T08:40:00.000Z' })
    const { app, projects } = server(fakeCi().source, same.store)
    let changes = 0
    projects.watch(() => {
      changes++
    })
    expect((await answer(app)).reading).toBe(true)
    await vi.waitFor(() => {
      expect(changes).toBe(1)
    })
    expect(await answer(app)).toEqual({ ci: numbers, readAt: '2026-11-22T09:00:00.000Z', reading: false })
    expect(changes).toBe(1)
  })

  it('keeps the old answer when a refresh fails or throws, with the code in the log', async () => {
    const before = { ci: { ...numbers, jobRuns: 9 }, readAt: '2026-11-22T08:40:00.000Z' }
    const failing = memoryStore(before)
    const one = server(fakeCi('exit-1').source, failing.store)
    await answer(one.app)
    await vi.waitFor(() => {
      expect(one.logger.lines()).toContainEqual(expect.objectContaining({ msg: 'ci read failed', code: 'exit-1' }))
    })
    // The failed refresh ended, and it holds the next read off, so the old answer comes with no read.
    await vi.waitFor(async () => {
      expect(await answer(one.app)).toEqual({ ...before, reading: false })
    })
    expect(failing.kept()).toEqual(before)
    const throwing: CiSource = { ...fakeCi().source, runs: () => Promise.reject(new Error('gh went away')) }
    const two = server(throwing, memoryStore(before).store)
    expect(await answer(two.app)).toEqual({ ...before, reading: true })
    await vi.waitFor(() => {
      expect(two.logger.lines()).toContainEqual(expect.objectContaining({ msg: 'ci read failed', code: 'threw' }))
    })
  })

  it('ends a first read that fails as not read, with an event, and reads no more for 10 minutes', async () => {
    let reads = 0
    const { source } = fakeCi('exit-1')
    const counted: CiSource = {
      ...source,
      runs: (r, since) => {
        reads++
        return source.runs(r, since)
      },
    }
    const { app, projects } = server(counted, memoryStore().store)
    const changed = nextChange(projects)
    expect((await answer(app)).reading).toBe(true)
    await changed
    expect(await answer(app)).toEqual({ ci: null, readAt: null, reading: false })
    expect(await answer(app)).toEqual({ ci: null, readAt: null, reading: false })
    expect(reads).toBe(1)
  })

  it('prunes the kept answers only after a project list read that succeeded', async () => {
    const good = memoryStore()
    const one = server(fakeCi().source, good.store)
    const changed = nextChange(one.projects)
    await answer(one.app)
    await changed
    await vi.waitFor(() => {
      expect(good.prunes).toHaveLength(1)
    })
    expect(good.prunes[0]).toContain('example-owner/example-repo')
    const real = createBrainProjects(brain)
    let lists = 0
    const failingList = {
      ...real,
      list: () => (++lists === 1 ? real.list() : Promise.resolve(err({ reason: 'failed' as const, code: 'EIO' }))),
    }
    const bad = memoryStore()
    const two = server(fakeCi().source, bad.store, failingList)
    const twoChanged = nextChange(two.projects)
    await answer(two.app)
    await twoChanged
    expect(bad.kept()?.readAt).toBe('2026-11-22T09:00:00.000Z')
    expect(bad.prunes).toEqual([])
  })

  it('logs the time of each part at debug, with no owner or name', async () => {
    const { app, projects, logger } = server(fakeCi().source, memoryStore().store)
    const changed = nextChange(projects)
    await answer(app)
    await changed
    const timed = logger.lines().filter((l) => l.msg === 'ci read timed')
    expect(timed.map((l) => l.part).sort()).toEqual(['jobs', 'merged', 'runs'])
    expect(JSON.stringify(timed)).not.toContain('example')
  })

  it('is not read for a repository off GitHub, and 404 for a repository the project does not have', async () => {
    const { app } = server(fakeCi().source)
    const local = await read(app, '/api/projects/example-project/repositories/local-repo/ci')
    expect(RepositoryCiResponse.parse(await local.json())).toEqual({ ci: null, readAt: null, reading: false })
    const res = await read(app, '/api/projects/example-project/repositories/no-repo/ci')
    expect(ErrorBody.parse(await res.json()).error.kind).toBe('not-found')
    expect((await read(app, '/api/projects/no-such-project/repositories/example-repo/ci')).status).toBe(404)
  })
})

describe('/api/projects/:slug/repositories/:repo/drift', () => {
  const driftServer = (drift: { snapshots: SnapshotSource; check: RepositoryCheck }) =>
    server(undefined, undefined, undefined, drift)
  const post = (app: ReturnType<typeof server>['app'], repo = 'example-repo') =>
    app.request(`/api/projects/example-project/repositories/${repo}/drift`, {
      method: 'POST',
      headers: json,
      body: '{}',
    })
  const finding = { kind: 'over-budget' as const, path: 'web/AGENTS.md', detail: '(62 > 60 lines)' }

  it("gives null before the first run, then the run with the snapshot's commit, kept over a restart", async () => {
    const fake = fakeDrift({ ok: true, value: { findings: [finding], total: 1 } })
    const { app } = driftServer(fake.source)
    const path = '/api/projects/example-project/repositories/example-repo/drift'
    expect(RepositoryDriftResponse.parse(await (await read(app, path)).json())).toEqual({ last: null })
    const ran = await post(app)
    expect(ran.status).toBe(200)
    const last = {
      result: 'findings',
      checkedAt: '2026-11-22T09:00:00.000Z',
      commit,
      findings: [finding],
      total: 1,
    }
    expect(RepositoryDriftResponse.parse(await ran.json())).toEqual({ last })
    expect(RepositoryDriftResponse.parse(await (await read(driftServer(fake.source).app, path)).json())).toEqual({
      last,
    })
  })

  it('runs one sync and one check for requests that cross, never a sync while a check reads', async () => {
    let open: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      open = resolve
    })
    const fake = fakeDrift({ ok: true, value: { findings: [], total: 0 } }, gate)
    // Each request reads the project list, then goes to the snapshot's join in microtasks only. So when all three
    // reads have ended, one macrotask later each request waits at the join, however slow the machine is.
    const disk = createBrainProjects(brain)
    let arrived = 0
    let allArrived: () => void = () => undefined
    const arrivals = new Promise<void>((resolve) => {
      allArrived = resolve
    })
    const counted: typeof disk = {
      ...disk,
      list: async () => {
        const listed = await disk.list()
        arrived += 1
        if (arrived === 3) allArrived()
        return listed
      },
    }
    const { app } = server(undefined, undefined, counted, fake.source)
    const runs = [post(app), post(app), post(app)]
    await arrivals
    await new Promise((resolve) => setImmediate(resolve))
    open()
    const bodies = await Promise.all(runs.map(async (r) => RepositoryDriftResponse.parse(await (await r).json())))
    expect(bodies.map((b) => b.last?.result)).toEqual(['clean', 'clean', 'clean'])
    expect(fake.seen).toMatchObject({ syncs: 1, checks: 1, most: 1 })
  })

  it('checks the snapshot in the same turn as its sync, so the next sync waits for the check to end', async () => {
    let open: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      open = resolve
    })
    const fake = fakeDrift({ ok: true, value: { findings: [], total: 0 } }, gate)
    const { app } = driftServer(fake.source)
    const first = post(app)
    await fake.checkStarted
    expect(fake.seen.steps).toEqual(['sync', 'synced', 'check'])
    open()
    await first
    await post(app)
    expect(fake.seen.steps).toEqual(['sync', 'synced', 'check', 'checked', 'sync', 'synced', 'check', 'checked'])
  })

  it('is a failed run with the code in the warn log for a sync fault, a new kind and a repository off GitHub', async () => {
    const snapshotFault: SnapshotSource = {
      sync: () => Promise.resolve({ ok: false, error: { reason: 'failed', code: 'exit-128' } }),
    }
    const newKind = fakeDrift({ ok: false, error: { reason: 'failed', code: 'unknown-kind' } })
    for (const [source, repo, code] of [
      [{ snapshots: snapshotFault, check: newKind.source.check }, 'example-repo', 'exit-128'],
      [newKind.source, 'example-repo', 'unknown-kind'],
      [newKind.source, 'local-repo', 'no-github'],
    ] as const) {
      const { app, logger } = driftServer(source)
      const ran = await post(app, repo)
      expect([code, ran.status]).toEqual([code, 200])
      const { last } = RepositoryDriftResponse.parse(await ran.json())
      expect(last).toMatchObject({ result: 'failed', findings: [], total: 0 })
      expect(last?.commit).toBe(code === 'unknown-kind' ? commit : null)
      expect(logger.lines()).toContainEqual(expect.objectContaining({ msg: 'drift check failed', code }))
    }
  })

  it('answers 404 for a repository the project does not list, a bad ID and a project with no project.yaml', async () => {
    const { app } = driftServer(fakeDrift({ ok: true, value: { findings: [], total: 0 } }).source)
    for (const path of [
      '/api/projects/example-project/repositories/other-repo/drift',
      '/api/projects/example-project/repositories/..%2Fx/drift',
      '/api/projects/no-yaml/repositories/example-repo/drift',
    ]) {
      const response = await read(app, path)
      expect([path, response.status]).toEqual([path, 404])
      expect(ErrorBody.parse(await response.json()).error.kind).toBe('not-found')
    }
    expect((await post(app, 'other-repo')).status).toBe(404)
  })
})
