// agentsMdCheck.ts with a stub python that prints set lines and exits with a
// set code: exit 0 is clean, exit 1 the findings with their kind, path and
// detail (a local path masked), and a kind or a line it does not know, any
// other end or exit 1 with no line a fault code.
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createAgentsMdCheck, findingsOf } from './agentsMdCheck.ts'

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-agentsmd-'))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

/** A python that logs its arguments, folder and environment, prints `out` and exits with `code`. */
async function stub(out: string, code: number) {
  const python = join(dir, 'python3')
  await writeFile(
    python,
    [
      '#!/bin/sh',
      `echo "$* | cwd=$(pwd -P) token=\${GH_TOKEN:-none}" > ${join(dir, 'call')}`,
      `cat <<'EOF'\n${out}\nEOF`,
      `exit ${String(code)}`,
    ].join('\n'),
  )
  await chmod(python, 0o755)
  const brainDir = join(dir, 'brain')
  await mkdir(brainDir, { recursive: true })
  const snapshot = join(dir, 'snapshots', 'example-repo')
  await mkdir(snapshot, { recursive: true })
  return {
    check: createAgentsMdCheck({ python, brainDir, env: { ...process.env, GH_TOKEN: 'secret' } }),
    snapshot,
  }
}

describe('createAgentsMdCheck', () => {
  it('is clean on exit 0, and runs the skill script on the snapshot from the brain with no token', async () => {
    const { check, snapshot } = await stub('ok: every directory has a linked AGENTS.md', 0)
    expect(await check.run(snapshot)).toEqual({ ok: true, value: { findings: [], total: 0 } })
    const call = await readFile(join(dir, 'call'), 'utf8')
    expect(call).toContain(`-I ${join(dir, 'brain', 'toolkit/skills/agents-md/scripts/check')} ${snapshot}`)
    expect(call).toMatch(/cwd=.*\/brain token=none/)
  })

  it('gives each line of exit 1 as a kind, a path and its detail, with no local path', async () => {
    const { check, snapshot } = await stub(
      [
        'exempt       references/AGENTS.md',
        'over-budget  contract/src/AGENTS.md (165 > 60 lines)',
        `dead-link    web/AGENTS.md: ${dir}/private/x.md`,
      ].join('\n'),
      1,
    )
    const run = await check.run(snapshot)
    expect(run).toEqual({
      ok: true,
      value: {
        findings: [
          { kind: 'exempt', path: 'references/AGENTS.md', detail: null },
          { kind: 'over-budget', path: 'contract/src/AGENTS.md', detail: '(165 > 60 lines)' },
          { kind: 'dead-link', path: 'web/AGENTS.md', detail: '<path>' },
        ],
        total: 3,
      },
    })
  })

  it('is a fault for exit 1 with no finding, another exit, or a program that is not there', async () => {
    expect(await (await stub('', 1)).check.run(dir)).toEqual({
      ok: false,
      error: { reason: 'failed', code: 'no-output' },
    })
    expect(await (await stub('missing a/b\nKilled', 1)).check.run(dir)).toMatchObject({
      error: { code: 'EBADDATA' },
    })
    expect(await (await stub('', 2)).check.run(dir)).toMatchObject({ error: { code: 'exit-2' } })
    const missing = createAgentsMdCheck({ python: join(dir, 'none'), brainDir: dir, env: {} })
    expect(await missing.run(dir)).toMatchObject({ error: { code: 'ENOENT' } })
  })

  it('fails a run on a kind the contract does not know, never dropping the line', async () => {
    const { check, snapshot } = await stub('missing      a/AGENTS.md\nnew-kind     b/AGENTS.md', 1)
    expect(await check.run(snapshot)).toEqual({ ok: false, error: { reason: 'failed', code: 'unknown-kind' } })
  })

  it('reads each kind as scripts/check writes it: folders, the root, a separator, spaces and quoted paths', () => {
    expect(
      findingsOf([
        'missing      ./',
        'missing      src/',
        'shim         ./CLAUDE.md',
        'exempt       docs/my folder/AGENTS.md',
        'over-budget  ./AGENTS.md (165 > 120 lines)',
        'unlinked     web/my app/AGENTS.md (no link from ./AGENTS.md)',
        'dead-link    web/AGENTS.md: ../gone.md#top',
        `old-pointer  ./AGENTS.md: \`${tmpdir()}/old folder/notes\``,
      ]),
    ).toEqual({
      ok: true,
      value: {
        findings: [
          { kind: 'missing', path: '.', detail: null },
          { kind: 'missing', path: 'src', detail: null },
          { kind: 'shim', path: 'CLAUDE.md', detail: null },
          { kind: 'exempt', path: 'docs/my folder/AGENTS.md', detail: null },
          { kind: 'over-budget', path: 'AGENTS.md', detail: '(165 > 120 lines)' },
          { kind: 'unlinked', path: 'web/my app/AGENTS.md', detail: '(no link from ./AGENTS.md)' },
          { kind: 'dead-link', path: 'web/AGENTS.md', detail: '../gone.md#top' },
          { kind: 'old-pointer', path: 'AGENTS.md', detail: '`<path>`' },
        ],
        total: 8,
      },
    })
  })

  it('fails a line whose path leaves the repository, and keeps the first 200 findings with the full count', () => {
    for (const line of ['missing ../x', 'missing /etc', 'missing a/./b'])
      expect(findingsOf([line])).toEqual({ ok: false, error: { reason: 'failed', code: 'EBADDATA' } })
    const lines = Array.from({ length: 250 }, (_, i) => `missing p${String(i)}/AGENTS.md`)
    const checked = findingsOf(lines)
    expect(checked.ok && [checked.value.findings.length, checked.value.total]).toEqual([200, 250])
  })
})
