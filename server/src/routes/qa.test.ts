// API tests of /api/projects/:slug/qa (f-008 increment three, NCC-154), in
// process with a fake Linear and a fake brain (no real Linear call).
import { ErrorBody, MachineId, ProjectSlug, QaListResponse, RepositoryId } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { describe, expect, it, vi } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createFakeLinear, type FakeIssue } from '../adapters/fakeLinear.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'
import type { BrainProjects } from '../services/projects.ts'
import { createQa, type LinearIssues } from '../services/qa.ts'

const local = { Host: '127.0.0.1:5181' }
const brain: BrainProjects = {
  list: () =>
    Promise.resolve(
      ok([
        {
          slug: ProjectSlug.parse('example-project'),
          name: 'Example',
          purpose: '',
          icon: null,
          repositories: [{ id: RepositoryId.parse('the-bridge'), role: '', github: null }],
          linearTeam: 'NCC',
        },
      ]),
    ),
  ideas: () => Promise.resolve(ok([])),
}
const askText = 'QA check\nOwner: bridge-projects\nRepository: the-bridge\nPR: 12\n1. Open the QA tab.'
const issue = (key: string, label: string, state: string, comments: FakeIssue['comments'] = []): FakeIssue => ({
  key,
  title: `Work of ${key}`,
  url: `https://linear.app/example/issue/${key.toLowerCase()}`,
  state,
  labels: [label],
  comments,
})
const at = (h: number) => `2026-11-27T${String(h).padStart(2, '0')}:00:00.000Z`
const issues = [
  issue('NCC-1', 'Branch', 'QA', [
    { id: 'a', body: askText, createdAt: at(9) },
    { id: 'b', body: 'secret-5150 note', createdAt: at(10) },
  ]),
  issue('NCC-2', 'Branch', 'In Progress'),
  issue('NCC-3', 'Main', 'Done', [{ id: 'c', body: askText, createdAt: at(8) }]),
  issue('NCC-4', 'Main', 'Done', [{ id: 'd', body: 'QA answer: Approved', createdAt: at(11) }]),
  issue('NCC-5', 'Branch', 'QA', [{ id: 'e', body: askText, createdAt: 'yesterday' }]),
]

function setup(linear: LinearIssues | null = createFakeLinear({ NCC: issues }), now = () => new Date(at(12))) {
  const { log, text } = memoryLogger()
  const app = createApp({
    agents: createFakeAgents(MachineId.parse('mac-mini')),
    owner: 'owner',
    log,
    qa: createQa({ brain, linear, now }),
  })
  const get = (path: string) => app.request(`/api/projects/${path}`, { headers: local })
  return { get, text }
}

describe('GET /api/projects/:slug/qa', () => {
  // No answer counts until Submit records the server's own answers (PR 11), so NCC-4 is listed.
  it('lists Branch issues in QA before merge and Main issues in Done with no answer after merge (AC1, AC2)', async () => {
    const { get, text } = setup()
    const res = await get('example-project/qa')
    expect(res.status).toBe(200)
    expect(text()).not.toContain('secret-5150')
    expect(text()).not.toContain('Open the QA tab')
    const { items } = QaListResponse.parse(await res.json())
    expect(items.map((i) => [i.issue, i.phase, i.worktree])).toEqual([
      ['NCC-1', 'beforeMerge', 'stopped'],
      ['NCC-3', 'afterMerge', 'servedApp'],
      ['NCC-4', 'afterMerge', 'servedApp'],
      ['NCC-5', 'beforeMerge', 'stopped'],
    ])
    // A comment time that is not ISO is left out: NCC-5 has no ask.
    expect(items[3]).toMatchObject({ askedAt: null, launch: { url: null, blocked: 'noAsk' } })
    expect(items[0]).toMatchObject({ repository: 'the-bridge', pr: 12, comments: 1, askedAt: at(9), status: 'waiting' })
    expect(items[0]?.launch).toEqual({ url: null, blocked: 'noMethod' })
  })
  it('answers 503 with no Linear key, 502 for a bad reply and 500 for a key file fault, with the code in the log only (AC4)', async () => {
    const failing = (reason: 'unavailable' | 'badReply' | 'failed', code: string): LinearIssues => ({
      qaIssues: () => Promise.resolve(err({ reason, code })),
    })
    const cases = [
      [null, 503, 'linear-unavailable', 'no-key'],
      [failing('unavailable', 'ECONNRESET'), 503, 'linear-unavailable', 'ECONNRESET'],
      [failing('badReply', 'schema'), 502, 'linear-bad-reply', 'schema'],
      [failing('failed', 'ENOENT'), 500, 'internal', 'ENOENT'],
    ] as const
    for (const [linear, status, kind, code] of cases) {
      const { get, text } = setup(linear)
      const res = await get('example-project/qa')
      expect(res.status).toBe(status)
      const body = ErrorBody.parse(await res.json())
      expect(body.error.kind).toBe(kind)
      expect(JSON.stringify(body)).not.toContain(code)
      expect(text()).toContain(code)
    }
  })
  it('keeps a read 30 s from its end and shares one that runs longer; a throw is 500 and not kept (AC5)', async () => {
    let ms = Date.parse(at(12))
    let reads = 0
    let finish: () => void = () => undefined
    const slow: LinearIssues = {
      qaIssues: () => {
        reads += 1
        if (reads > 1) return Promise.reject(new Error('socket hang up'))
        return new Promise((resolve) => {
          finish = () => {
            resolve(ok([]))
          }
        })
      },
    }
    const { get, text } = setup(slow, () => new Date(ms))
    const first = get('example-project/qa')
    await vi.waitFor(() => {
      expect(reads).toBe(1)
    })
    ms += 31_000
    const second = get('example-project/qa')
    await new Promise((r) => setTimeout(r, 10))
    finish()
    expect([(await first).status, (await second).status, reads]).toEqual([200, 200, 1])
    ms += 29_999
    expect([(await get('example-project/qa')).status, reads]).toEqual([200, 1])
    ms += 1
    expect((await get('example-project/qa')).status).toBe(500)
    expect((await get('example-project/qa')).status).toBe(500)
    expect(reads).toBe(3)
    expect(text()).toContain('threw')
  })
  it('answers 404 for a project that the brain does not have', async () => {
    expect((await setup().get('no-project/qa')).status).toBe(404)
  })
})
