// ghCi.ts with a stub gh that logs its arguments: GET calls only, the pages
// of 100 that the first page's total_count names, at most 10 pages.
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createGhCi } from './ghCi.ts'

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-ghci-'))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

const repo = { owner: 'example-owner', name: 'example-repo' }
const runItem =
  '{"id":7,"workflow_id":3,"head_sha":"abc","event":"push","head_branch":"main","conclusion":"success","run_started_at":"2026-11-21T10:00:00Z","updated_at":"2026-11-21T10:05:00Z"}'

/** A gh that logs each call's arguments, gives `total` as the count and answers `full` pages of 100 runs, then a page of one. */
async function stub(full: number, total = full * 100 + 1) {
  const gh = join(dir, 'gh')
  const page = (n: number) =>
    `{"total_count":${String(total)},"workflow_runs":[${Array.from({ length: n }, () => runItem).join(',')}]}`
  await writeFile(
    gh,
    [
      '#!/bin/sh',
      `echo "$*" >> ${join(dir, 'calls')}`,
      'case "$*" in',
      `  *jobs*) echo '{"total_count":1,"jobs":[{"name":"lint","conclusion":"success","started_at":"2026-11-21T10:00:00Z","completed_at":"2026-11-21T10:03:00Z"}]}' ;;`,
      `  *search*) echo '{"total_count":2,"incomplete_results":false,"items":[{"created_at":"2026-11-21T08:00:00Z","pull_request":{"merged_at":"2026-11-21T10:00:00Z"}},{"created_at":"2026-11-21T08:00:00Z","pull_request":{"merged_at":null}}]}' ;;`,
      ...Array.from({ length: full }, (_, i) => `  *"page=${String(i + 1)} "*) echo '${page(100)}' ;;`),
      `  *) echo '${page(1)}' ;;`,
      'esac',
    ].join('\n'),
  )
  await chmod(gh, 0o755)
  return createGhCi({ command: gh, env: process.env })
}
const calls = async () => (await readFile(join(dir, 'calls'), 'utf8')).trim().split('\n')

describe('createGhCi', () => {
  it('reads the pages that the first page counts, each call a GET', async () => {
    const runs = await (await stub(2)).runs(repo, '2026-10-23T09:00:00.000Z')
    expect(runs.ok && runs.value.length).toBe(201)
    expect(runs.ok && runs.value[0]).toEqual({
      id: 7,
      workflow: 3,
      sha: 'abc',
      event: 'push',
      branch: 'main',
      conclusion: 'success',
      startedAt: '2026-11-21T10:00:00.000Z',
      updatedAt: '2026-11-21T10:05:00.000Z',
    })
    const made = await calls()
    expect(made).toHaveLength(3)
    for (const call of made) expect(call).toMatch(/^api -X GET repos\/example-owner\/example-repo\/actions\/runs /)
    expect(made[0]).toContain('created=>=2026-10-23T09:00:00.000Z')
  })

  it('stops at 10 pages', async () => {
    await (await stub(12, 5_000)).runs(repo, '2026-10-23T09:00:00.000Z')
    expect(await calls()).toHaveLength(10)
  })

  it('runs at most 3 gh calls at once', async () => {
    const gh = join(dir, 'gh')
    const log = join(dir, 'overlap')
    const page = `{"total_count":1000,"workflow_runs":[${Array.from({ length: 100 }, () => runItem).join(',')}]}`
    await writeFile(gh, `#!/bin/sh\necho s >> ${log}\nsleep 0.2\necho e >> ${log}\necho '${page}'\n`)
    await chmod(gh, 0o755)
    const ci = createGhCi({ command: gh, env: process.env })
    await Promise.all([ci.runs(repo, '2026-10-23T09:00:00.000Z'), ci.jobs(repo, 7), ci.jobs(repo, 8)])
    let running = 0
    let most = 0
    for (const mark of (await readFile(log, 'utf8')).trim().split('\n')) {
      running += mark === 's' ? 1 : -1
      most = Math.max(most, running)
    }
    expect(most).toBe(3)
  })

  it('gives the merged PRs of a search and the minutes of each job', async () => {
    const ci = await stub(0)
    const merged = await ci.merged(repo, '2026-10-23T09:00:00.000Z')
    expect(merged).toEqual({
      ok: true,
      value: [{ createdAt: '2026-11-21T08:00:00Z', mergedAt: '2026-11-21T10:00:00.000Z' }],
    })
    expect((await calls())[0]).toContain('q=repo:example-owner/example-repo is:pr is:merged merged:>=2026-10-23')
    expect(await ci.jobs(repo, 7)).toEqual({ ok: true, value: [{ name: 'lint', conclusion: 'success', minutes: 3 }] })
  })

  it('gives null minutes for a job that has not ended, and EBADDATA for a bad time', async () => {
    const gh = join(dir, 'gh')
    const reply = (completed: string) =>
      `{"total_count":1,"jobs":[{"name":"test","conclusion":null,"started_at":"2026-11-21T10:00:00Z","completed_at":${completed}}]}`
    await writeFile(gh, `#!/bin/sh\necho '${reply('null')}'\n`)
    await chmod(gh, 0o755)
    const open = createGhCi({ command: gh, env: process.env })
    expect(await open.jobs(repo, 7)).toEqual({ ok: true, value: [{ name: 'test', conclusion: null, minutes: null }] })
    await writeFile(gh, `#!/bin/sh\necho '${reply('"soon"')}'\n`)
    expect(await open.jobs(repo, 7)).toEqual({ ok: false, error: { reason: 'failed', code: 'EBADDATA' } })
  })

  it('is the fault incomplete when GitHub gives part of a search', async () => {
    const gh = join(dir, 'gh')
    await writeFile(gh, `#!/bin/sh\necho '{"total_count":1,"incomplete_results":true,"items":[]}'\n`)
    await chmod(gh, 0o755)
    const merged = await createGhCi({ command: gh, env: process.env }).merged(repo, '2026-10-23T09:00:00.000Z')
    expect(merged).toEqual({ ok: false, error: { reason: 'failed', code: 'incomplete' } })
  })

  it('is a fault with its code only when gh fails', async () => {
    const gh = join(dir, 'gh')
    await writeFile(gh, '#!/bin/sh\necho "marker-5150" >&2\nexit 1\n')
    await chmod(gh, 0o755)
    const runs = await createGhCi({ command: gh, env: process.env }).runs(repo, '2026-10-23T09:00:00.000Z')
    expect(runs).toEqual({ ok: false, error: { reason: 'failed', code: 'exit-1' } })
  })
})
