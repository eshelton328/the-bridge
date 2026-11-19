// The Vite proxy with Tailscale Serve's headers (handoff step 4): the
// served app's Vite sends /api to the server and keeps each header, so the
// server's auth (server/src/auth.ts) sees what Tailscale Serve sent. A
// request on the tailnet host with X-Forwarded-For and no
// Tailscale-User-Login gets 403 from the server; with the owner's login it
// gets 200, and the event stream flows through the proxy.
import { request } from 'node:http'
import { ErrorBody, WorkspacesResponse } from '@bridge/contract'
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { reportAgent } from './reportAgent.ts'
import { owner, startStack, stopStack } from './stack.ts'

const tailnetHost = 'bridge-e2e.tailnet.example'
const tailscale = { Host: `${tailnetHost}:443`, 'X-Forwarded-For': '203.0.113.7', 'X-Forwarded-Proto': 'https' }
let port = 0

beforeAll(async () => {
  port = (await startStack(tailnetHost)).webPort
})

afterAll(() => {
  stopStack()
})

/** One GET through Vite with `headers`; `until` ends the read early once the body so far passes it. */
function get(
  path: string,
  headers: Record<string, string>,
  until?: (body: string) => boolean,
): Promise<{ status: number; type: string; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, headers }, (res) => {
      let body = ''
      const done = () => {
        resolve({ status: res.statusCode ?? 0, type: String(res.headers['content-type']), body })
      }
      res.setEncoding('utf8')
      res.on('data', (chunk: string) => {
        body += chunk
        if (until?.(body)) {
          done()
          req.destroy()
        }
      })
      res.on('end', done)
    })
    req.on('error', (e) => {
      if (!req.destroyed) reject(e)
    })
    req.setTimeout(20_000, () => req.destroy(new Error(`no answer for ${path}`)))
    req.end()
  })
}

describe('the Vite proxy with Tailscale headers', () => {
  it('gives 403 from the server to a tailnet request with no Tailscale-User-Login', async () => {
    const res = await get('/api/workspaces', tailscale)
    expect(res.status).toBe(403)
    // The server's refusal, not Vite's host check.
    expect(ErrorBody.parse(JSON.parse(res.body)).error).toMatchObject({
      kind: 'forbidden',
      message: 'requests must come through Tailscale, signed in',
    })
  })

  it('gives 403 to another tailnet login', async () => {
    const res = await get('/api/workspaces', { ...tailscale, 'Tailscale-User-Login': 'someone@example.com' })
    expect(res.status).toBe(403)
    expect(ErrorBody.parse(JSON.parse(res.body)).error.kind).toBe('forbidden')
    expect(res.body).not.toContain('someone@example.com')
  })

  it("gives 200 and the herdr session's workspaces to the owner's login", async () => {
    const res = await get('/api/workspaces', { ...tailscale, 'Tailscale-User-Login': owner })
    expect(res.status).toBe(200)
    const workspaces = WorkspacesResponse.parse(JSON.parse(res.body)).workspaces
    expect(workspaces.map((w) => w.label)).toContain(inject('fakeChat').workspace)
  })

  it('gives 200 to a browser on this computer with no proxy header', async () => {
    const res = await get('/api/workspaces', { Host: `localhost:${String(port)}` })
    expect(res.status).toBe(200)
  })

  it("streams the events to the owner's login through the proxy, and refuses the stream with no login", async () => {
    expect((await get('/api/events', tailscale)).status).toBe(403)
    const stream = get(
      '/api/events',
      { ...tailscale, 'Tailscale-User-Login': owner, Accept: 'text/event-stream' },
      (body) => body.includes('event: chat.status'),
    )
    await new Promise((r) => setTimeout(r, 1500))
    try {
      await reportAgent('working')
      const res = await stream
      expect(res.status).toBe(200)
      expect(res.type).toContain('text/event-stream')
      expect(res.body).toContain('"status":"working"')
    } finally {
      await reportAgent('idle')
    }
  })
})
