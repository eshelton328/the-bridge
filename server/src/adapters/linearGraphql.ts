// The Linear port's real adapter (f-008 increment three): one GraphQL read of
// a team's issues with the QA labels, in pages, through fetch. The key is a
// 0600 file that `BRIDGE_LINEAR_KEY_FILE` names, read at each request and
// sent only in the Authorization header; it never goes into a result, a
// fault or a log. Text is cut to the contract's limits before the schema
// reads it. A fault is its reason and a code only.
import { lstat, readFile } from 'node:fs/promises'
import { maxProjectTitle, maxQaText } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type { LinearFault, LinearIssue, LinearIssues } from '../services/qa.ts'

const endpoint = 'https://api.linear.app/graphql'
/** The most pages of 50 issues one read follows; more is the fault `too-many`. */
const maxPages = 5

const query = `query($team: String!, $labels: [String!]!, $after: String) {
  issues(first: 50, after: $after, filter: { team: { key: { eq: $team } }, labels: { some: { name: { in: $labels } } } }) {
    nodes { identifier title url state { name } labels(first: 50) { nodes { name } } comments(first: 100) { nodes { id body createdAt parentId } pageInfo { hasNextPage } } }
    pageInfo { hasNextPage endCursor }
  }
}`

const cut = (max: number) => z.string().transform((s) => s.slice(0, max))
const Page = z.object({
  data: z.object({
    issues: z.object({
      nodes: z.array(
        z.object({
          identifier: z.string(),
          title: cut(maxProjectTitle),
          url: z.string(),
          state: z.object({ name: z.string() }),
          labels: z.object({ nodes: z.array(z.object({ name: z.string() })) }),
          comments: z.object({
            nodes: z.array(
              z.object({
                id: z.string(),
                body: cut(maxQaText),
                createdAt: z.iso.datetime(),
                parentId: z.string().nullable(),
              }),
            ),
            pageInfo: z.object({ hasNextPage: z.boolean() }),
          }),
        }),
      ),
      pageInfo: z.object({ hasNextPage: z.boolean(), endCursor: z.string().nullable() }),
    }),
  }),
})

const codeOf = (thrown: unknown) =>
  thrown instanceof Error && 'code' in thrown && typeof thrown.code === 'string' ? thrown.code : 'unknown'

/** The key, from a regular file that only its owner can read; else the fault `failed` (500) with its code. */
async function keyOf(file: string): Promise<Result<string, LinearFault>> {
  try {
    const stat = await lstat(file)
    if (!stat.isFile() || (stat.mode & 0o077) !== 0) return err({ reason: 'failed', code: 'EMODE' })
    const key = (await readFile(file, 'utf8')).trim()
    return key === '' ? err({ reason: 'failed', code: 'EKEY' }) : ok(key)
  } catch (thrown) {
    return err({ reason: 'failed', code: codeOf(thrown) })
  }
}

/** One page, or the fault: a key Linear refuses is `failed`, a busy or down Linear `unavailable`. */
async function pageOf(
  send: typeof fetch,
  key: string,
  variables: Record<string, unknown>,
  timeoutMs: number,
): Promise<Result<z.infer<typeof Page>['data']['issues'], LinearFault>> {
  let res: Response
  try {
    res = await send(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: key },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (thrown) {
    const timedOut = thrown instanceof Error && thrown.name === 'TimeoutError'
    return err({ reason: 'unavailable', code: timedOut ? 'timeout' : 'fetch' })
  }
  const code = `http-${String(res.status)}`
  if (res.status === 401 || res.status === 403) return err({ reason: 'failed', code })
  if (res.status === 429 || res.status >= 500) return err({ reason: 'unavailable', code })
  if (res.status !== 200) return err({ reason: 'badReply', code })
  const body: unknown = await res.json().catch(() => undefined)
  if (body === undefined) return err({ reason: 'badReply', code: 'json' })
  if (typeof body === 'object' && body !== null && 'errors' in body) return err({ reason: 'badReply', code: 'graphql' })
  const page = Page.safeParse(body)
  return page.success ? ok(page.data.data.issues) : err({ reason: 'badReply', code: 'schema' })
}

export function createLinearIssues({
  keyFile,
  fetch: send = fetch,
  timeoutMs = 10_000,
}: {
  readonly keyFile: string
  readonly fetch?: typeof fetch
  readonly timeoutMs?: number
}): LinearIssues {
  return {
    async qaIssues(team, labels) {
      const key = await keyOf(keyFile)
      if (!key.ok) return key
      const issues: LinearIssue[] = []
      let after: string | null = null
      for (let n = 0; n < maxPages; n++) {
        const page = await pageOf(send, key.value, { team, labels: [...labels], after }, timeoutMs)
        if (!page.ok) return page
        // An issue's newest ask can be past its first 100 comments, so a longer thread is no answer to guess from.
        if (page.value.nodes.some((i) => i.comments.pageInfo.hasNextPage))
          return err({ reason: 'badReply', code: 'comments' })
        for (const i of page.value.nodes)
          issues.push({
            key: i.identifier,
            title: i.title,
            url: i.url,
            state: i.state.name,
            labels: i.labels.nodes.map((l) => l.name),
            comments: i.comments.nodes,
          })
        if (!page.value.pageInfo.hasNextPage) return ok(issues)
        after = page.value.pageInfo.endCursor
      }
      return err({ reason: 'badReply', code: 'too-many' })
    },
  }
}
