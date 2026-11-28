// The Linear GraphQL adapter, with a stub fetch that answers as Linear and a
// made-up key file: no real Linear call.
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { maxProjectTitle, maxQaText } from '@bridge/contract'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createLinearIssues } from './linearGraphql.ts'
import { contractTeams, linearPortContract } from './linearPortContract.ts'

const key = 'made-up-key-5150'
let dir: string
let keyFile: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-linear-'))
  keyFile = join(dir, 'linear-api-key')
  await writeFile(keyFile, `${key}\n`, { mode: 0o600 })
})
afterEach(() => rm(dir, { recursive: true, force: true }))

const Body = z.object({
  variables: z.object({ team: z.string(), labels: z.array(z.string()), after: z.string().nullable() }),
})
type Sent = { url: string; authorization: string | null; variables: z.infer<typeof Body>['variables'] }

/** A fetch that answers as Linear for `contractTeams`, a page of one issue at a time, and keeps each request. */
function linearStub(sent: Sent[] = []): typeof fetch {
  return (input, init) => {
    const { variables } = Body.parse(JSON.parse(typeof init?.body === 'string' ? init.body : '{}'))
    const url = input instanceof Request ? input.url : input.toString()
    sent.push({ url, authorization: new Headers(init?.headers).get('authorization'), variables })
    const all = (contractTeams[variables.team] ?? []).filter((i) => i.labels.some((l) => variables.labels.includes(l)))
    const at = variables.after === null ? 0 : Number(variables.after)
    const node = (i: (typeof all)[number]) => ({
      identifier: i.key,
      title: i.title,
      url: i.url,
      state: { name: i.state },
      labels: { nodes: i.labels.map((name) => ({ name })) },
      comments: {
        nodes: i.comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.createdAt })),
        pageInfo: { hasNextPage: false },
      },
    })
    const page = {
      nodes: all.slice(at, at + 1).map(node),
      pageInfo: { hasNextPage: at + 1 < all.length, endCursor: String(at + 1) },
    }
    return Promise.resolve(Response.json({ data: { issues: page } }))
  }
}

linearPortContract(() => createLinearIssues({ keyFile, fetch: linearStub() }))

describe('createLinearIssues', () => {
  it('sends the key from the file only in the Authorization header, to api.linear.app', async () => {
    const sent: Sent[] = []
    await createLinearIssues({ keyFile, fetch: linearStub(sent) }).qaIssues('NCC', ['Branch'])
    expect(sent.map((s) => [s.url, s.authorization])).toEqual([['https://api.linear.app/graphql', key]])
    expect(JSON.stringify(sent.map((s) => s.variables))).not.toContain(key)
  })
  /** A fetch that answers one page of one issue with `comments`. */
  const oneIssue =
    (title: string, comments: { nodes: object[]; pageInfo: { hasNextPage: boolean } }): typeof fetch =>
    () =>
      Promise.resolve(
        Response.json({
          data: {
            issues: {
              nodes: [
                {
                  identifier: 'NCC-1',
                  title,
                  url: 'https://linear.app/x',
                  state: { name: 'QA' },
                  labels: { nodes: [] },
                  comments,
                },
              ],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        }),
      )
  const comment = { id: 'c', body: 'b'.repeat(20_000), createdAt: '2026-11-27T10:00:00.000Z' }
  it('cuts a long title and comment text to the contract limits', async () => {
    const long = oneIssue('t'.repeat(500), { nodes: [comment], pageInfo: { hasNextPage: false } })
    const read = await createLinearIssues({ keyFile, fetch: long }).qaIssues('NCC', ['Branch'])
    expect(read.ok && [read.value[0]?.title.length, read.value[0]?.comments[0]?.body.length]).toEqual([
      maxProjectTitle,
      maxQaText,
    ])
  })
  it('refuses an issue with more than one page of comments, as its newest ask could be past it (Codex review of #607)', async () => {
    const more = oneIssue('t', { nodes: [comment], pageInfo: { hasNextPage: true } })
    expect(await createLinearIssues({ keyFile, fetch: more }).qaIssues('NCC', ['Branch'])).toEqual({
      ok: false,
      error: { reason: 'badReply', code: 'comments' },
    })
  })
  it('gives each fault a reason and a code, never the key', async () => {
    const answer =
      (res: Response | Error): typeof fetch =>
      () =>
        res instanceof Error ? Promise.reject(res) : Promise.resolve(res)
    const cases = [
      [answer(new Response('', { status: 401 })), 'failed', 'http-401'],
      [answer(new Response('', { status: 503 })), 'unavailable', 'http-503'],
      [answer(new Response('', { status: 429 })), 'unavailable', 'http-429'],
      [answer(new Response('', { status: 400 })), 'badReply', 'http-400'],
      [answer(new Response('not json')), 'badReply', 'json'],
      [answer(Response.json({ errors: [{ message: key }] })), 'badReply', 'graphql'],
      [answer(Response.json({ data: { issues: { nodes: [{ identifier: 1 }] } } })), 'badReply', 'schema'],
      [answer(new Error('getaddrinfo ENOTFOUND')), 'unavailable', 'fetch'],
    ] as const
    for (const [fetch, reason, code] of cases) {
      const read = await createLinearIssues({ keyFile, fetch }).qaIssues('NCC', ['Branch'])
      expect(read).toEqual({ ok: false, error: { reason, code } })
    }
  })
  it('refuses a missing key file and one that others can read, with no request', async () => {
    const sent: Sent[] = []
    expect(
      await createLinearIssues({ keyFile: join(dir, 'none'), fetch: linearStub(sent) }).qaIssues('NCC', ['Main']),
    ).toEqual({ ok: false, error: { reason: 'failed', code: 'ENOENT' } })
    await chmod(keyFile, 0o644)
    expect(await createLinearIssues({ keyFile, fetch: linearStub(sent) }).qaIssues('NCC', ['Main'])).toEqual({
      ok: false,
      error: { reason: 'failed', code: 'EMODE' },
    })
    expect(sent).toEqual([])
  })
})
