// The layout check with a stub `ncc`, the drift store, and the service's
// run that stores the result of each project.
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ok } from '@bridge/shared'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createProjects, findingsFor } from '../services/projects.ts'
import { createDiskDriftStore } from './diskProjects.ts'
import { createNccCheck, relativeLines } from './projectDrift.ts'

let dir: string
let root: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-drift-'))
  root = join(dir, 'root')
  await mkdir(root)
})
afterEach(() => rm(dir, { recursive: true, force: true }))

async function stub(script: string) {
  const path = join(dir, 'ncc')
  await writeFile(path, `#!/bin/sh\n${script}\n`)
  await chmod(path, 0o755)
  return path
}

const check = (command: string) => createNccCheck({ command, root, env: { PATH: process.env.PATH, HOME: '/home/dev' } })

describe('createNccCheck', () => {
  it('gives no lines for a clean layout (exit 0)', async () => {
    const command = await stub('echo "OK: the layout follows ~/ncc-1701/AGENTS.md"')
    expect(await check(command).run()).toEqual(ok([]))
  })

  it('gives each problem line with the root cut off its paths (exit 1), and passes NCC_ROOT', async () => {
    const command = await stub(
      'echo "not a git clone: $NCC_ROOT/projects/example-project/stray.log (marker-5150)"\necho "missing folder: $NCC_ROOT"\necho "a file in /home/dev/x"\nexit 1',
    )
    expect(await check(command).run()).toEqual(
      ok(['not a git clone: projects/example-project/stray.log (marker-5150)', 'missing folder: .', 'a file in ~/x']),
    )
  })

  it('is a fault for exit 1 with no problem line, as a check that broke', async () => {
    const command = await stub('echo "PermissionError: marker-5150" >&2\nexit 1')
    expect(await check(command).run()).toEqual({ ok: false, error: { reason: 'failed', code: 'no-output' } })
  })

  it('is a fault with the exit code only for any other end, and for a program that is missing', async () => {
    const command = await stub('echo "marker-5150" >&2\nexit 2')
    expect(await check(command).run()).toEqual({ ok: false, error: { reason: 'failed', code: 'exit-2' } })
    expect(await check(join(dir, 'missing')).run()).toEqual({ ok: false, error: { reason: 'failed', code: 'ENOENT' } })
  })
})

describe('findingsFor', () => {
  const lines = [
    'not a git clone: projects/example-project/stray.log (only <repo>/ go here)',
    'no engine notes for project example-project: make engine/projects/example-project/',
    'missing or stale projects/example-project/CLAUDE.md (run `ncc check --fix`)',
    'not a git clone: projects/example-project-two/x (only <repo>/ go here)',
    'loose file in projects/: projects/other.txt',
    'no commit-msg hook in example-repo (run `ncc check --fix`)',
    'example-repo sets core.hooksPath; add the hook to that folder by hand',
    'no commit-msg hook in example-repo-two (run `ncc check --fix`)',
  ]
  it('keeps the lines about the project only, not a project whose name starts the same', () => {
    expect(findingsFor('example-project', [], lines).map((f) => f.text)).toEqual(lines.slice(0, 3))
  })

  it('keeps a git hook line that names one of the project repositories by its folder name alone', () => {
    expect(findingsFor('example-project', ['example-repo'], lines.slice(3)).map((f) => f.text)).toEqual([
      'no commit-msg hook in example-repo (run `ncc check --fix`)',
      'example-repo sets core.hooksPath; add the hook to that folder by hand',
    ])
  })

  it('makes paths relative with the longest root first', () => {
    expect(relativeLines('x /r/real/a\n', ['/r/real', '/r'], undefined)).toEqual(['x a'])
  })

  it('gives "<path>" for an absolute path outside the root and the home folder', () => {
    expect(
      relativeLines(
        'lock in /private/tmp/example/lock.json and (/var/example) and /r/real/a\n',
        ['/r/real'],
        '/home/dev',
      ),
    ).toEqual(['lock in <path> and (<path>) and a'])
  })

  it('keeps the projects/<slug> part of a hidden path, so the finding still names its project', () => {
    const lines = relativeLines('not in its place: /tmp/projects/example-project/stray\n', ['/r'], '/home/dev')
    expect(lines).toEqual(['not in its place: <path>/projects/example-project/stray'])
    expect(findingsFor('example-project', [], lines).map((f) => f.text)).toEqual(lines)
  })
})

describe('a drift run', () => {
  it('runs the check, stores its result in 0600 drift.json and gives it again, a failed check as failed', async () => {
    const data = join(dir, 'data')
    let lines = ok<readonly string[]>(['not a git clone: projects/example-project/stray.log'])
    const projects = createProjects({
      brain: {
        list: () =>
          Promise.resolve(
            ok([{ slug: 'example-project', name: 'Example', purpose: '', icon: null, repositories: [] }]),
          ),
        ideas: () => Promise.resolve(ok([])),
      },
      pins: { load: () => Promise.resolve(ok([])), save: () => Promise.resolve(ok(undefined)) },
      pulls: { open: () => Promise.resolve(ok([])) },
      check: { run: () => Promise.resolve(lines) },
      drift: createDiskDriftStore(data),
      now: () => new Date('2026-11-22T09:00:00.000Z'),
    })
    const ran = await projects.runDrift('example-project')
    expect(ran.ok && ran.value !== 'notFound' && ran.value.drift.last?.result).toBe('findings')
    expect((await stat(join(data, 'drift.json'))).mode & 0o777).toBe(0o600)
    expect(JSON.parse(await readFile(join(data, 'drift.json'), 'utf8'))).toHaveProperty(
      'example-project.result',
      'findings',
    )
    lines = ok([])
    const clean = await projects.runDrift('example-project')
    expect(clean.ok && clean.value !== 'notFound' && clean.value.drift.last?.result).toBe('clean')
    const read = await projects.drift('example-project')
    expect(read.ok && read.value !== 'notFound' && read.value.last?.result).toBe('clean')
    expect(await projects.runDrift('no-such-project')).toEqual(ok('notFound'))
  })

  it('gives no run for a project whose slug is an Object property name, such as constructor', async () => {
    const projects = createProjects({
      brain: {
        list: () =>
          Promise.resolve(ok([{ slug: 'constructor', name: 'Example', purpose: '', icon: null, repositories: [] }])),
        ideas: () => Promise.resolve(ok([])),
      },
      pins: { load: () => Promise.resolve(ok([])), save: () => Promise.resolve(ok(undefined)) },
      pulls: { open: () => Promise.resolve(ok([])) },
      check: { run: () => Promise.resolve(ok([])) },
      drift: createDiskDriftStore(join(dir, 'data')),
    })
    expect(await projects.drift('constructor')).toEqual(ok({ last: null }))
  })

  it('stores a failed check as a failed run with its code for the log', async () => {
    const projects = createProjects({
      brain: {
        list: () =>
          Promise.resolve(
            ok([{ slug: 'example-project', name: 'Example', purpose: '', icon: null, repositories: [] }]),
          ),
        ideas: () => Promise.resolve(ok([])),
      },
      pins: { load: () => Promise.resolve(ok([])), save: () => Promise.resolve(ok(undefined)) },
      pulls: { open: () => Promise.resolve(ok([])) },
      check: { run: () => Promise.resolve({ ok: false, error: { reason: 'failed', code: 'timeout' } }) },
      drift: createDiskDriftStore(join(dir, 'data')),
      now: () => new Date('2026-11-22T09:00:00.000Z'),
    })
    expect(await projects.runDrift('example-project')).toEqual(
      ok({
        drift: { last: { result: 'failed', checkedAt: '2026-11-22T09:00:00.000Z', findings: [] } },
        code: 'timeout',
      }),
    )
  })
})
