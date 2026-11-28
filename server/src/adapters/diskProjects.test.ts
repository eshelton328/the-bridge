import { mkdir, mkdtemp, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ok } from '@bridge/shared'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  createBrainProjects,
  createDiskArchitectureStore,
  createDiskCiStore,
  createDiskPins,
  githubOf,
  readProjectYaml,
} from './diskProjects.ts'

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-disk-projects-'))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

async function brainWith(files: Record<string, string>) {
  const brain = join(dir, 'brain')
  for (const [path, text] of Object.entries(files)) {
    await mkdir(join(brain, path, '..'), { recursive: true })
    await writeFile(join(brain, path), text)
  }
  return brain
}

const yaml = [
  'schema_version: 1',
  'id: "457cf21b-1f04-4c74-bf98-9a4d861a7a6d"',
  'slug: "example-project"',
  'name: "Example"',
  `purpose: "An example's purpose, marker-5150."`,
  'repositories:',
  '  - id: example-repo',
  "    role: the app's repository (d-001)",
  '    url: https://github.com/example-owner/example-repo',
  '  - id: local-repo',
  '    role: local only',
  '    url: file:///home/dev/local-repo',
  'linear:',
  '  - team: EX',
  '    id: x',
  'resources: []',
].join('\n')

describe('readProjectYaml', () => {
  it('reads the top-level scalars and the repositories list only', () => {
    const read = readProjectYaml(yaml)
    expect(read.scalars).toMatchObject({
      slug: 'example-project',
      name: 'Example',
      purpose: "An example's purpose, marker-5150.",
    })
    expect(read.repositories).toEqual([
      {
        id: 'example-repo',
        role: "the app's repository (d-001)",
        url: 'https://github.com/example-owner/example-repo',
      },
      { id: 'local-repo', role: 'local only', url: 'file:///home/dev/local-repo' },
    ])
  })

  it('reads the linear list, whose first team key is the team of the project', () => {
    expect(readProjectYaml(yaml).linear).toEqual([{ team: 'EX', id: 'x' }])
  })

  it('reads an empty repositories list', () => {
    expect(readProjectYaml('name: X\nrepositories: []\n').repositories).toEqual([])
  })
})

describe('githubOf', () => {
  it('gives the owner and name of a github.com URL only', () => {
    expect(githubOf('https://github.com/example-owner/example-repo')).toEqual({
      owner: 'example-owner',
      name: 'example-repo',
    })
    expect(githubOf('https://github.com/example-owner/example-repo.git')).toEqual({
      owner: 'example-owner',
      name: 'example-repo',
    })
    expect(githubOf('../../../omni')).toBeNull()
    expect(githubOf('https://example.com/example-owner/example-repo')).toBeNull()
    expect(githubOf(null)).toBeNull()
  })
})

describe('createBrainProjects', () => {
  it('lists each folder with a project.yaml, with the folder name as slug, and skips a linked file or folder', async () => {
    const brain = await brainWith({
      'projects/example-project/project.yaml': yaml,
      'projects/no-name/project.yaml': 'schema_version: 1\n',
      'projects/no-yaml/README.md': '# x',
      'projects/Odd Name/project.yaml': yaml,
    })
    await writeFile(join(dir, 'outside.yaml'), yaml)
    await mkdir(join(brain, 'projects', 'linked-file'))
    await symlink(join(dir, 'outside.yaml'), join(brain, 'projects', 'linked-file', 'project.yaml'))
    await symlink(join(brain, 'projects', 'example-project'), join(brain, 'projects', 'linked-folder'))
    const listed = await createBrainProjects(brain).list()
    expect(listed.ok && [...listed.value].sort((a, b) => a.slug.localeCompare(b.slug))).toEqual([
      {
        slug: 'example-project',
        name: 'Example',
        purpose: "An example's purpose, marker-5150.",
        icon: null,
        repositories: [
          {
            id: 'example-repo',
            role: "the app's repository (d-001)",
            github: { owner: 'example-owner', name: 'example-repo' },
          },
          { id: 'local-repo', role: 'local only', github: null },
        ],
        linearTeam: 'EX',
      },
      { slug: 'no-name', name: 'no-name', purpose: '', icon: null, repositories: [] },
    ])
  })

  it('gives no projects for a brain with no projects folder', async () => {
    expect(await createBrainProjects(join(dir, 'none')).list()).toEqual(ok([]))
  })
})

describe('createDiskPins', () => {
  it('keeps the pins in a 0600 file in a 0700 folder, and a bad file is a fault, never no pins', async () => {
    const root = join(dir, 'data')
    const pins = createDiskPins(root)
    expect(await pins.load()).toEqual(ok([]))
    expect(await pins.save(['example-project'])).toEqual(ok(undefined))
    expect(await createDiskPins(root).load()).toEqual(ok(['example-project']))
    expect((await stat(join(root, 'pins.json'))).mode & 0o777).toBe(0o600)
    expect((await stat(root)).mode & 0o777).toBe(0o700)
    await writeFile(join(root, 'pins.json'), '{"pins": ["/home/dev"]}')
    expect(await pins.load()).toEqual({ ok: false, error: { reason: 'failed', code: 'EBADDATA' } })
  })
})

describe('createDiskCiStore', () => {
  const repo = { owner: 'Example-Owner', name: 'example-repo' }
  const kept = {
    ci: {
      since: '2026-10-28T00:00:00.000Z',
      runs: { green: 3, finished: 4 },
      runMinutes: 8,
      merge: { count: 2, medianHours: 1.5, p90Hours: 3 },
      jobs: [{ name: 'lint', medianMinutes: 2 }],
      jobRuns: 3,
    },
    readAt: '2026-11-27T10:00:00.000Z',
  }

  it('keeps an answer for each repository, by a sha256 file name that holds no name, 0600 in a 0700 folder', async () => {
    const store = createDiskCiStore(dir)
    expect(await store.load(repo)).toBeNull()
    expect(await store.save(repo, kept)).toEqual(ok(undefined))
    expect(await store.load({ owner: 'example-owner', name: 'Example-Repo' })).toEqual(kept)
    expect(await createDiskCiStore(dir).load(repo)).toEqual(kept)
    const names = await readdir(join(dir, 'ci'))
    expect(names).toHaveLength(1)
    expect(names[0]).toMatch(/^[0-9a-f]{64}\.json$/)
    expect((await stat(join(dir, 'ci'))).mode & 0o777).toBe(0o700)
    expect((await stat(join(dir, 'ci', names[0] ?? ''))).mode & 0o777).toBe(0o600)
  })

  it('reads a file that is not JSON or not an answer as no answer, never a fault', async () => {
    const store = createDiskCiStore(dir)
    await store.save(repo, kept)
    const [name] = await readdir(join(dir, 'ci'))
    await writeFile(join(dir, 'ci', name ?? ''), '{not json')
    expect(await store.load(repo)).toBeNull()
    await writeFile(join(dir, 'ci', name ?? ''), JSON.stringify({ ci: null, readAt: 'yesterday' }))
    expect(await store.load(repo)).toBeNull()
  })

  it('prunes the answers of the repositories it is not told to keep, and only its own files', async () => {
    const store = createDiskCiStore(dir)
    const other = { owner: 'example-owner', name: 'other-repo' }
    expect(await store.prune([repo])).toEqual(ok(undefined))
    await store.save(repo, kept)
    await store.save(other, kept)
    await writeFile(join(dir, 'ci', 'notes.txt'), 'kept')
    expect(await store.prune([repo])).toEqual(ok(undefined))
    expect(await store.load(repo)).toEqual(kept)
    expect(await store.load(other)).toBeNull()
    expect(await readdir(join(dir, 'ci'))).toHaveLength(2)
  })
})

describe('createDiskArchitectureStore', () => {
  const kept = {
    model: {
      view: 'component' as const,
      parts: [{ id: 'server', name: 'server', shape: 'service' as const, ours: true, typeLine: 'Server · Hono' }],
      boundaries: [],
      arrows: [],
      stack: [],
    },
    commit: 'a'.repeat(40),
    generatedAt: '2026-11-28T08:00:00.000Z',
  }
  const system = { slug: 'example-project', scope: '@system' }
  const repo = { slug: 'example-project', scope: 'system' }

  it('keeps each scope in its own sha256-named file, so @system and a repository named system do not clash', async () => {
    const store = createDiskArchitectureStore(dir)
    expect(await store.load(system)).toBeNull()
    expect(await store.save(system, kept)).toEqual(ok(undefined))
    expect(await store.load(repo)).toBeNull()
    expect(await createDiskArchitectureStore(dir).load(system)).toEqual(kept)
    const names = await readdir(join(dir, 'architecture'))
    expect(names).toEqual([expect.stringMatching(/^[0-9a-f]{64}\.json$/)])
    expect((await stat(join(dir, 'architecture', names[0] ?? ''))).mode & 0o777).toBe(0o600)
  })

  it('loads a file that is not a diagram as no diagram, never a fault', async () => {
    const store = createDiskArchitectureStore(dir)
    await store.save(system, kept)
    const [name] = await readdir(join(dir, 'architecture'))
    await writeFile(join(dir, 'architecture', name ?? ''), '{"model": 1}')
    expect(await store.load(system)).toBeNull()
  })

  it('prunes the scopes it is not told to keep', async () => {
    const store = createDiskArchitectureStore(dir)
    await store.save(system, kept)
    await store.save(repo, kept)
    expect(await store.prune([repo])).toEqual(ok(undefined))
    expect(await store.load(repo)).toEqual(kept)
    expect(await store.load(system)).toBeNull()
  })
})
