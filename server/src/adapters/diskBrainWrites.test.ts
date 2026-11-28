// The brain's writes on disk, on a scratch brain with a stub of the helper (never the real brain).
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ProjectSlug } from '@bridge/contract'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { projectShim } from '../services/brainWrites.ts'
import { createDiskBrainWrites, createMessage } from './diskBrainWrites.ts'
import { stubBrain } from './stubBrainWrites.ts'

let dir: string
let paths: { brain: string; chatRoot: string; python: string }
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-writes-'))
  paths = { brain: join(dir, 'root', 'engine'), chatRoot: join(dir, 'root'), python: join(dir, 'python') }
  await mkdir(join(paths.brain, 'projects', 'other'), { recursive: true })
  await writeFile(join(paths.brain, 'projects', 'other', 'notes.md'), 'one\n')
  await stubBrain(paths.brain, paths.chatRoot, paths.python)
})
afterEach(() => rm(dir, { recursive: true, force: true }))

const writes = () =>
  createDiskBrainWrites({
    ...paths,
    brainDir: paths.brain,
    helper: '/the/helper.py',
    env: { ...process.env, SECRET_TOKEN: 'x' },
  })
const slug = ProjectSlug.parse('new-app')
const project = { slug, name: '-New app', purpose: 'One line.', icon: 'rocket' }
const git = (...args: string[]) => execFileSync('git', ['-C', paths.brain, ...args], { encoding: 'utf8' })

describe('createDiskBrainWrites', () => {
  it('runs init as python -I with an argument list and a minimum environment, then commits only its paths', async () => {
    await writeFile(join(paths.brain, 'projects', 'other', 'notes.md'), 'two\n')
    expect(await writes().createProject(project)).toEqual({ ok: true, value: 'created' })
    const args = '-I|/the/helper.py|init|--brain|.|--slug=new-app|--name=-New app|--purpose=One line.|--icon=rocket|'
    expect(await readFile(`${paths.python}.args`, 'utf8')).toBe(args.replaceAll('|', '\n'))
    const env = (await readFile(`${paths.python}.env`, 'utf8')).split('\n').map((line) => line.split('=')[0] ?? '')
    expect(
      env.filter(
        (key) => key !== '' && !['PATH', 'HOME', 'LANG', 'TMPDIR', 'PWD', 'SHLVL', '_', 'OLDPWD'].includes(key),
      ),
    ).toEqual([])
    expect(git('log', '-1', '--format=%s')).toBe(`${createMessage}\n`)
    const files = [
      'AGENTS.md',
      'README.md',
      'new-app/AGENTS.md',
      'new-app/CLAUDE.md',
      'new-app/README.md',
      'new-app/project.yaml',
    ]
    expect(git('show', '--name-only', '--format=', 'HEAD')).toBe(`${files.map((f) => `projects/${f}`).join('\n')}\n`)
    // The second changed file stays out of the commit, still changed in the work tree.
    expect(git('status', '--porcelain')).toBe(' M projects/other/notes.md\n')
    expect(await readFile(join(paths.chatRoot, 'projects', 'new-app', 'CLAUDE.md'), 'utf8')).toBe(projectShim(slug))
  })

  it('answers taken with no call to the helper when either projects folder has the name', async () => {
    await mkdir(join(paths.chatRoot, 'projects', 'new-app'))
    expect(await writes().taken(slug)).toEqual({ ok: true, value: true })
    expect(await writes().createProject(project)).toEqual({ ok: true, value: 'taken' })
    await expect(access(`${paths.python}.args`)).rejects.toThrow()
  })

  it('answers busy at once when the brain index is locked', async () => {
    await writeFile(join(paths.brain, '.git', 'index.lock'), '')
    expect(await writes().createProject(project)).toEqual({ ok: false, error: { reason: 'busy' } })
    await expect(access(`${paths.python}.args`)).rejects.toThrow()
  })

  it('undoes the home and the folder when the commit fails, so a retry makes the project', async () => {
    const hook = join(paths.brain, '.git', 'hooks', 'pre-commit')
    await writeFile(hook, '#!/bin/sh\nexit 1\n')
    execFileSync('chmod', ['755', hook])
    expect(await writes().createProject(project)).toEqual({
      ok: false,
      error: { reason: 'failed', code: 'git-exit-1' },
    })
    expect(await writes().taken(slug)).toEqual({ ok: true, value: false })
    expect(git('status', '--porcelain')).toBe('')
    await rm(hook)
    expect(await writes().createProject(project)).toEqual({ ok: true, value: 'created' })
  })

  it('keeps a chat-root folder that another process made after the check', async () => {
    await writeFile(
      paths.python,
      `#!/bin/sh\nmkdir "${join(paths.chatRoot, 'projects', 'new-app')}"\nmkdir projects/new-app\necho '{"ok": true, "created": true}'\n`,
    )
    expect(await writes().createProject(project)).toEqual({ ok: false, error: { reason: 'failed', code: 'EEXIST' } })
    await expect(access(join(paths.chatRoot, 'projects', 'new-app'))).resolves.toBeUndefined()
    await expect(access(join(paths.brain, 'projects', 'new-app'))).rejects.toThrow()
  })

  it('refuses a chat root whose projects folder is a symlink', async () => {
    await rm(join(paths.chatRoot, 'projects'), { recursive: true })
    execFileSync('ln', ['-s', dir, join(paths.chatRoot, 'projects')])
    expect(await writes().createProject(project)).toEqual({ ok: false, error: { reason: 'failed', code: 'symlink' } })
  })
})

// The brain's ncc script is beside the clone, not in the repository, so CI has no copy to compare with.
const nccSource = (() => {
  for (let at = dirname(fileURLToPath(import.meta.url)); at !== dirname(at); at = dirname(at))
    if (existsSync(join(at, 'engine', 'toolkit', 'layout', 'ncc')))
      return join(at, 'engine', 'toolkit', 'layout', 'ncc')
  return null
})()

describe.runIf(nccSource !== null)('projectShim', () => {
  it('is the text of project_shim in the brain ncc script', async () => {
    const source = await readFile(nccSource ?? '', 'utf8')
    expect(source).toContain(
      'def project_shim(project):\n    return f"@../../engine/projects/{project}/AGENTS.md\\n"\n',
    )
    expect(projectShim(slug)).toBe('@../../engine/projects/new-app/AGENTS.md\n')
  })
})
