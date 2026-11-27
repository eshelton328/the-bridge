import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createGhPulls, statusOf } from './ghPulls.ts'

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-gh-'))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

const pull = {
  number: 3,
  title: 'feat: an example',
  url: 'https://github.com/example-owner/example-repo/pull/3',
  headRefName: 'dev/ncc-3-example',
  isDraft: false,
  updatedAt: '2026-11-21T10:00:00Z',
  statusCheckRollup: [] as unknown[],
}

async function gh(script: string) {
  const path = join(dir, 'gh')
  await writeFile(path, `#!/bin/sh\n${script}\n`)
  await chmod(path, 0o755)
  return createGhPulls({ command: path, env: { PATH: process.env.PATH, HOME: '/home/dev', SECRET_X: 'marker-5150' } })
}

describe('statusOf', () => {
  const run = (status: string, conclusion: string | null) => ({ __typename: 'CheckRun' as const, status, conclusion })
  it('gives draft first, then a failed check, then a running check, else in review', () => {
    expect(statusOf({ ...pull, isDraft: true, statusCheckRollup: [run('COMPLETED', 'FAILURE')] })).toBe('draft')
    expect(statusOf({ ...pull, statusCheckRollup: [run('IN_PROGRESS', null), run('COMPLETED', 'FAILURE')] })).toBe(
      'ciFailed',
    )
    expect(statusOf({ ...pull, statusCheckRollup: [run('IN_PROGRESS', null), run('COMPLETED', 'SUCCESS')] })).toBe(
      'ciRunning',
    )
    expect(statusOf({ ...pull, statusCheckRollup: [{ __typename: 'StatusContext', state: 'PENDING' }] })).toBe(
      'ciRunning',
    )
    expect(statusOf({ ...pull, statusCheckRollup: [{ __typename: 'StatusContext', state: 'ERROR' }] })).toBe('ciFailed')
    expect(statusOf({ ...pull, statusCheckRollup: [run('COMPLETED', 'SUCCESS'), run('COMPLETED', 'SKIPPED')] })).toBe(
      'inReview',
    )
    expect(statusOf({ ...pull, statusCheckRollup: null })).toBe('inReview')
  })
})

describe('createGhPulls', () => {
  it('asks gh for the open PRs of the repository and gives each with its status', async () => {
    const args = join(dir, 'args')
    const source = await gh(`echo "$@" > ${args}\nenv > ${args}.env\ncat <<'EOF'\n${JSON.stringify([pull])}\nEOF`)
    const open = await source.open({ owner: 'example-owner', name: 'example-repo' })
    expect(open).toEqual({
      ok: true,
      value: [
        {
          number: 3,
          title: 'feat: an example',
          url: 'https://github.com/example-owner/example-repo/pull/3',
          branch: 'dev/ncc-3-example',
          status: 'inReview',
          updatedAt: '2026-11-21T10:00:00.000Z',
        },
      ],
    })
    expect(await readFile(args, 'utf8')).toContain('pr list --repo example-owner/example-repo --state open --limit 50')
    expect(await readFile(`${args}.env`, 'utf8')).not.toContain('marker-5150')
  })

  it('drops a PR whose link is not a github.com PR', async () => {
    const source = await gh(`cat <<'EOF'\n${JSON.stringify([{ ...pull, url: 'https://example.com/x' }])}\nEOF`)
    expect(await source.open({ owner: 'example-owner', name: 'example-repo' })).toEqual({ ok: true, value: [] })
  })

  it('is a fault with a code only for a failed run or a reply it does not read', async () => {
    const failed = await gh('echo "marker-5150" >&2\nexit 1')
    expect(await failed.open({ owner: 'o', name: 'r' })).toEqual({
      ok: false,
      error: { reason: 'failed', code: 'exit-1' },
    })
    const bad = await gh('echo "not json"')
    expect(await bad.open({ owner: 'o', name: 'r' })).toEqual({
      ok: false,
      error: { reason: 'failed', code: 'EBADDATA' },
    })
    const wrong = await gh(`echo '[{"number": "x"}]'`)
    expect(await wrong.open({ owner: 'o', name: 'r' })).toEqual({
      ok: false,
      error: { reason: 'failed', code: 'EBADDATA' },
    })
  })
})
