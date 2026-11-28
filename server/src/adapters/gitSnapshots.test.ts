// gitSnapshots.ts with a stub git that logs its arguments and environment:
// a first sync clones at depth 1, a later one fetches and resets, every call
// has the safety config, and a bad name, a git fault or a bad hash is a code.
import { chmod, mkdir, mkdtemp, readdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createGitSnapshots } from './gitSnapshots.ts'

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-snap-'))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

const github = { owner: 'example-owner', name: 'example-repo' }
const hash = 'a'.repeat(40)

/** A git that logs each call and its GIT_ and token variables, makes the clone's .git, and prints `head` for rev-parse. */
async function stub(head = hash, fail = '') {
  const git = join(dir, 'git')
  await writeFile(
    git,
    [
      '#!/bin/sh',
      `echo "$* | prompt=$GIT_TERMINAL_PROMPT global=$GIT_CONFIG_GLOBAL nosystem=$GIT_CONFIG_NOSYSTEM token=\${GH_TOKEN:-none}" >> ${join(dir, 'calls')}`,
      fail === '' ? '' : `case "$*" in *${fail}*) exit 128 ;; esac`,
      'for last; do :; done',
      'case "$*" in *" clone "*) mkdir -p "$last/.git" ;; esac',
      `case "$*" in *rev-parse*) echo ${head} ;; esac`,
    ].join('\n'),
  )
  await chmod(git, 0o755)
  return createGitSnapshots({ command: git, root: join(dir, 'snapshots'), env: { ...process.env, GH_TOKEN: 'secret' } })
}
const calls = async () => (await readFile(join(dir, 'calls'), 'utf8')).trim().split('\n')

describe('createGitSnapshots', () => {
  it('clones at depth 1 first, then fetches and resets, each call with the safety config and no token', async () => {
    const snapshots = await stub()
    const first = await snapshots.sync(github)
    expect(first.ok && first.value.commit).toBe(hash)
    expect(first.ok && first.value.dir.endsWith('/snapshots/example-owner/example-repo')).toBe(true)
    await snapshots.sync(github)
    const made = await calls()
    expect(made.map((c) => c.replace(/^.*?(clone|fetch|reset|rev-parse).*$/, '$1'))).toEqual([
      'clone',
      'rev-parse',
      'fetch',
      'reset',
      'rev-parse',
    ])
    for (const call of made) {
      expect(call).toContain('-c core.hooksPath=/dev/null -c protocol.file.allow=never')
      expect(call).toContain('-c core.symlinks=false -c credential.helper=!gh auth git-credential ')
      expect(call).not.toContain('credential.helper= ')
      expect(call).toContain('prompt=0 global=/dev/null nosystem=1 token=none')
    }
    expect(made[0]).toContain(
      'clone --quiet --depth 1 --no-recurse-submodules -- https://github.com/example-owner/example-repo.git',
    )
    expect(made[2]).toContain(
      'fetch --quiet --depth 1 --no-recurse-submodules -- https://github.com/example-owner/example-repo.git HEAD',
    )
  })

  it('refuses a GitHub name that could leave the folder, with no git call', async () => {
    const snapshots = await stub()
    expect(await snapshots.sync({ owner: 'a/b', name: 'x' })).toEqual({
      ok: false,
      error: { reason: 'failed', code: 'bad-name' },
    })
    expect(await snapshots.sync({ owner: 'a', name: '..' })).toMatchObject({ error: { code: 'bad-name' } })
    expect(await snapshots.sync({ owner: '..', name: 'x' })).toMatchObject({ error: { code: 'bad-name' } })
    await expect(readFile(join(dir, 'calls'), 'utf8')).rejects.toThrow()
  })

  it("is git's exit code when a call fails, and EBADDATA for a hash that is not one", async () => {
    expect(await (await stub(hash, 'clone')).sync(github)).toEqual({
      ok: false,
      error: { reason: 'failed', code: 'exit-128' },
    })
    await rm(join(dir, 'snapshots'), { recursive: true, force: true })
    expect(await (await stub('not-a-hash')).sync(github)).toMatchObject({ error: { code: 'EBADDATA' } })
  })

  it('leaves no snapshot after a first clone with no commit, so the next sync clones again', async () => {
    expect(await (await stub(hash, 'rev-parse')).sync(github)).toMatchObject({
      error: { code: 'exit-128' },
    })
    const good = await (await stub()).sync(github)
    expect(good.ok && good.value.commit).toBe(hash)
    expect((await calls()).map((c) => c.replace(/^.*?(clone|fetch|reset|rev-parse).*$/, '$1'))).toEqual([
      'clone',
      'rev-parse',
      'clone',
      'rev-parse',
    ])
  })

  it('removes a snapshot whose fetch fails, so the next sync clones again', async () => {
    await (await stub()).sync(github)
    expect(await (await stub(hash, 'fetch')).sync(github)).toMatchObject({
      error: { code: 'exit-128' },
    })
    await (await stub()).sync(github)
    expect((await calls()).map((c) => c.replace(/^.*?(clone|fetch|reset|rev-parse).*$/, '$1'))).toEqual([
      'clone',
      'rev-parse',
      'fetch',
      'clone',
      'rev-parse',
    ])
  })

  it('keeps one snapshot for each GitHub repository, so two repositories at once never share one', async () => {
    const snapshots = await stub()
    const other = { owner: 'example-owner', name: 'other-repo' }
    const [a, b] = await Promise.all([snapshots.sync(github), snapshots.sync(other)])
    expect(a.ok && a.value.dir.endsWith('/snapshots/example-owner/example-repo')).toBe(true)
    expect(b.ok && b.value.dir.endsWith('/snapshots/example-owner/other-repo')).toBe(true)
    expect((await calls()).filter((c) => c.includes(' clone '))).toHaveLength(2)
  })

  it('shares a running sync of one repository, so two syncs at once give one clone', async () => {
    const snapshots = await stub()
    const [a, b] = await Promise.all([
      snapshots.sync(github),
      snapshots.sync({ owner: 'Example-Owner', name: 'Example-Repo' }),
    ])
    expect(a).toEqual(b)
    expect((await calls()).filter((c) => c.includes(' clone '))).toHaveLength(1)
  })

  it('never syncs through a symlink in place of a snapshot, and leaves its target alone', async () => {
    const other = join(dir, 'other-checkout')
    await mkdir(join(other, '.git'), { recursive: true })
    await writeFile(join(other, 'work.txt'), 'unsaved')
    await mkdir(join(dir, 'snapshots', 'example-owner'), { recursive: true })
    await symlink(other, join(dir, 'snapshots', 'example-owner', 'example-repo'))
    const synced = await (await stub()).sync(github)
    expect(synced.ok).toBe(true)
    expect((await calls()).map((c) => c.replace(/^.*?(clone|fetch|reset|rev-parse).*$/, '$1'))).toEqual([
      'clone',
      'rev-parse',
    ])
    expect((await readdir(other)).sort()).toEqual(['.git', 'work.txt'])
    expect((await stat(join(dir, 'snapshots', 'example-owner', 'example-repo', '.git'))).isDirectory()).toBe(true)
  })

  it('makes the snapshots folder private', async () => {
    await (await stub()).sync(github)
    const { mode } = await stat(join(dir, 'snapshots'))
    expect(mode & 0o777).toBe(0o700)
  })
})
