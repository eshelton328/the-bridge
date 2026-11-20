// API tests of POST /api/client-errors (d-115): the app in process with the fake adapter.
import { ErrorBody, MachineId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'

const machine = MachineId.parse('test-mac')
const owner = 'owner@example.com'
const local = { Host: '127.0.0.1:5181' }
const json = { ...local, 'Content-Type': 'application/json' }
const report = { source: 'query', name: 'Error', message: 'the server answered 503', route: '/workspaces?state=x#top' }

const setup = () => {
  const logger = memoryLogger()
  const app = createApp({ agents: createFakeAgents(machine), owner, log: logger.log })
  const post = (body: string, headers: Record<string, string> = json) =>
    app.request('/api/client-errors', { method: 'POST', headers, body })
  return { logger, post }
}

describe('POST /api/client-errors', () => {
  it('logs one client error line with the report and its route without query or hash, and answers 204', async () => {
    const { logger, post } = setup()
    const res = await post(JSON.stringify(report))
    expect(res.status).toBe(204)
    const lines = logger.lines().filter((e) => e.msg === 'client error')
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ level: 50, report: { ...report, route: '/workspaces' } })
  })

  it('refuses a body that is not JSON content, a report outside the contract and a body over 32 KB, and logs no report', async () => {
    const { logger, post } = setup()
    const refused = [
      await post(JSON.stringify(report), { ...local, 'Content-Type': 'text/plain' }),
      await post(JSON.stringify(report), local),
      await post('not json'),
      await post(JSON.stringify({ ...report, source: 'boundary' })),
      await post(JSON.stringify({ ...report, stack: 'x'.repeat(33 * 1024) })),
    ]
    for (const res of refused) {
      expect(res.status).toBe(400)
      expect(ErrorBody.parse(await res.json()).error.kind).toBe('invalid-input')
    }
    expect(logger.lines().filter((e) => e.msg === 'client error')).toHaveLength(0)
  })

  it('refuses a request from another Tailscale login before it reads the report', async () => {
    const { logger, post } = setup()
    const res = await post(JSON.stringify(report), {
      ...json,
      Host: 'mac.tailnet.example',
      'X-Forwarded-For': '203.0.113.2',
      'Tailscale-User-Login': 'someone@example.com',
    })
    expect(res.status).toBe(403)
    expect(logger.lines().filter((e) => e.msg === 'client error')).toHaveLength(0)
  })

  it('does not count a post with another content type, so cross-site forms cannot use up the quota', async () => {
    const { post } = setup()
    for (let i = 0; i < 60; i += 1) await post(JSON.stringify(report), { ...local, 'Content-Type': 'text/plain' })
    expect((await post(JSON.stringify(report))).status).toBe(204)
  })

  it('counts the owner login in any letter case in one quota', async () => {
    const { post } = setup()
    const tailnet = { ...json, Host: 'mac.tailnet.example', 'X-Forwarded-For': '203.0.113.2' }
    const statuses: number[] = []
    for (let i = 0; i < 61; i += 1) {
      const login = i % 2 === 0 ? owner : owner.toUpperCase()
      statuses.push((await post(JSON.stringify(report), { ...tailnet, 'Tailscale-User-Login': login })).status)
    }
    expect(statuses.filter((s) => s === 204)).toHaveLength(60)
    expect(statuses.at(-1)).toBe(429)
  })

  it('takes 60 reports a minute, then answers 429 and writes no log line for the rest', async () => {
    const { logger, post } = setup()
    const statuses: number[] = []
    for (let i = 0; i < 62; i += 1) statuses.push((await post(JSON.stringify(report))).status)
    expect(statuses.filter((s) => s === 204)).toHaveLength(60)
    expect(statuses.slice(60)).toEqual([429, 429])
    expect(logger.lines()).toHaveLength(120)
  })
})
