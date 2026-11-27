import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createGhRepositoryFacts } from './ghRepos.ts'

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-gh-repos-'))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

const reply = (visibility: string, nodes: unknown[]) =>
  JSON.stringify({ data: { repository: { visibility, releases: { nodes } } } })

async function gh(script: string) {
  const path = join(dir, 'gh')
  await writeFile(path, `#!/bin/sh\n${script}\n`)
  await chmod(path, 0o755)
  return createGhRepositoryFacts({ command: path, env: { PATH: process.env.PATH, SECRET_X: 'marker-5150' } })
}

const repo = { owner: 'example-owner', name: 'example-repo' }

describe('createGhRepositoryFacts', () => {
  it('asks gh graphql for the visibility and the newest release, a pre-release too', async () => {
    const args = join(dir, 'args')
    const release = {
      tagName: 'v1.0.0-beta.2',
      url: 'https://github.com/example-owner/example-repo/releases/tag/v1.0.0-beta.2',
      publishedAt: '2026-11-27T17:47:14Z',
    }
    const facts = await gh(
      `printf '%s\\n' "$@" > ${args}\nenv > ${args}.env\ncat <<'EOF'\n${reply('PUBLIC', [release])}\nEOF`,
    )
    expect(await facts.about(repo)).toEqual({
      ok: true,
      value: {
        visibility: 'public',
        release: { tag: 'v1.0.0-beta.2', url: release.url, publishedAt: '2026-11-27T17:47:14.000Z' },
      },
    })
    const sent = await readFile(args, 'utf8')
    expect(sent.split('\n').slice(0, 2)).toEqual(['api', 'graphql'])
    expect(sent).toContain('owner=example-owner')
    expect(sent).toContain('name=example-repo')
    expect(await readFile(`${args}.env`, 'utf8')).not.toContain('marker-5150')
  })

  it('gives no release for a repository with none, a draft or a link off github.com', async () => {
    const none = await gh(`cat <<'EOF'\n${reply('PRIVATE', [])}\nEOF`)
    expect(await none.about(repo)).toEqual({ ok: true, value: { visibility: 'private', release: null } })
    const draft = await gh(
      `cat <<'EOF'\n${reply('PUBLIC', [{ tagName: 'v2', url: 'https://github.com/o/r/releases/tag/v2', publishedAt: null }])}\nEOF`,
    )
    expect(await draft.about(repo)).toEqual({ ok: true, value: { visibility: 'public', release: null } })
    const offSite = await gh(
      `cat <<'EOF'\n${reply('PUBLIC', [{ tagName: 'v3', url: 'https://example.com/v3', publishedAt: '2026-11-27T17:47:14Z' }])}\nEOF`,
    )
    expect(await offSite.about(repo)).toEqual({ ok: true, value: { visibility: 'public', release: null } })
  })

  it('is a fault with a code only for a failed run or a reply it does not read', async () => {
    const failed = await gh('echo "marker-5150" >&2\nexit 1')
    expect(await failed.about(repo)).toEqual({ ok: false, error: { reason: 'failed', code: 'exit-1' } })
    const odd = await gh(`cat <<'EOF'\n${reply('SECRET', [])}\nEOF`)
    expect(await odd.about(repo)).toEqual({ ok: false, error: { reason: 'failed', code: 'EBADDATA' } })
  })
})
