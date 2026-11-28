// snapshotReader.ts on a real git repository in a temporary folder: only
// tracked regular package.json files outside node_modules are read, each cap
// is a fault code, and the worker gives the model.
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSnapshotReader } from './snapshotReader.ts'

let dir: string
let outside: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-reader-'))
  outside = await mkdtemp(join(tmpdir(), 'bridge-outside-'))
})
afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
  await rm(outside, { recursive: true, force: true })
})

const git = (...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-C', dir, ...args], {
    env: { PATH: process.env.PATH ?? '', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' },
  })

async function repo(files: Record<string, string>) {
  git('init', '-q')
  for (const [path, text] of Object.entries(files)) {
    await mkdir(join(dir, path, '..'), { recursive: true })
    await writeFile(join(dir, path), text)
  }
  git('add', '-A')
  git('commit', '-q', '-m', 'x')
}

const reader = (options = {}) => createSnapshotReader({ command: 'git', env: process.env, ...options })
const codeOf = async (options = {}) => {
  const read = await reader(options).read(dir)
  return read.ok ? 'ok' : read.error.code
}

describe('createSnapshotReader', () => {
  it('reads the tracked package.json files outside node_modules in a worker', async () => {
    await repo({
      'package.json': JSON.stringify({ name: 'root' }),
      'web/package.json': JSON.stringify({ name: 'web' }),
      'web/src/adapters/herdrSocket.ts': '',
      'node_modules/dep/package.json': JSON.stringify({ name: 'dep' }),
    })
    await writeFile(join(dir, 'untracked.json'), '{}')
    await mkdir(join(dir, 'new'))
    await writeFile(join(dir, 'new/package.json'), JSON.stringify({ name: 'untracked' }))
    const read = await reader().read(dir)
    expect(read.ok && read.value.parts.map((p) => p.name)).toEqual(['web/adapters', 'herdr'])
  })

  it('never reads a tracked symlink, also one to a package.json outside the snapshot', async () => {
    await writeFile(join(outside, 'package.json'), JSON.stringify({ name: 'secret' }))
    await mkdir(join(dir, 'a'), { recursive: true })
    await symlink(join(outside, 'package.json'), join(dir, 'a/package.json'))
    await repo({ 'package.json': JSON.stringify({ name: 'root' }) })
    const read = await reader().read(dir)
    expect(read.ok && read.value.parts.map((p) => p.name)).toEqual(['root'])
  })

  it('skips a file over the file cap and gives a fault code for each other cap', async () => {
    await repo({
      'package.json': JSON.stringify({ name: 'root' }),
      'big/package.json': JSON.stringify({ name: 'b'.repeat(400) }),
    })
    const read = await reader({ maxFileBytes: 100 }).read(dir)
    expect(read.ok && read.value.parts.map((p) => p.name)).toEqual(['root'])
    expect(await codeOf({ maxFiles: 1 })).toBe('too-many-files')
    expect(await codeOf({ maxTotalBytes: 20 })).toBe('too-large')
    expect(await codeOf({ timeoutMs: 1 })).toBe('timeout')
  })

  it('gives no-packages for a repository with no package.json, and no-snapshot for no folder', async () => {
    await repo({ 'README.md': '# x' })
    expect(await codeOf()).toBe('no-packages')
    const gone = await reader().read(join(dir, 'missing'))
    expect(gone.ok ? 'ok' : gone.error.code).toBe('no-snapshot')
  })

  it('gives timeout for a slow worker after git has ended, and EBADDATA for a model the contract refuses', async () => {
    await repo({ 'package.json': JSON.stringify({ name: 'root' }) })
    const slow = join(outside, 'slow.mjs')
    await writeFile(slow, 'setInterval(() => {}, 1000)\n')
    expect(await codeOf({ timeoutMs: 1_000, workerFile: pathToFileURL(slow) })).toBe('timeout')
    const bad = join(outside, 'bad.mjs')
    await writeFile(
      bad,
      "import { parentPort } from 'node:worker_threads'\nparentPort.postMessage({ model: { view: 'x' } })\n",
    )
    expect(await codeOf({ workerFile: pathToFileURL(bad) })).toBe('EBADDATA')
  })
})
