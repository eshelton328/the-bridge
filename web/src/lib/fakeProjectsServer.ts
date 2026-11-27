// A fake of the server's Projects routes (f-008 R2, R3, R4), for tests:
// `GET /api/projects` (the pinned projects first, then the others, each part
// by name, as the server sorts them), `PUT /api/projects/:slug/pin` (the
// card as it is now) and `GET /api/projects/:slug` (the project, with no
// repositories, and the test's open PRs and unread repositories by slug) and
// `GET /api/projects/:slug/chats` (the test's chats of the project, none by
// default). Every project, body and answer is checked against the
// contract, so a test cannot send or get what the server would not: a body the
// contract refuses is 400 invalid-input, and an unknown slug is 404. The pins
// live in the fake, as the server keeps them in a file, so a new page (a
// reload) reads them. `answerNext` answers the next request of one kind with a
// test's answer, and `requests` records each one with its body. A test plugs
// `handle` into its `fetch` stub.
import {
  PinProjectRequest,
  ProjectChat,
  ProjectChatsResponse,
  ProjectDetailResponse,
  ProjectsResponse,
  ProjectSummary,
} from '@bridge/contract'
import { errorAnswer } from './fakeTranscriptServer.ts'

/** A request kind the fake takes. */
export type ProjectsCall = 'list' | 'pin' | 'detail' | 'chats'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const bodyOf = (init: RequestInit | undefined): unknown => {
  try {
    return typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
  } catch {
    return undefined
  }
}

const invalid = () =>
  errorAnswer({ kind: 'invalid-input', issues: ['the body'], message: 'Invalid input', requestId: 'r-400' }, 400)

/** The server's order: pinned first, then by name, by code point. */
const byPinThenName = (a: ProjectSummary, b: ProjectSummary) =>
  a.pinned === b.pinned ? (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) : a.pinned ? -1 : 1

type FakeProjectsOptions = {
  /** Each project's chats by its slug, in the order the route gives them; each is checked against the contract. */
  readonly chats?: Readonly<Record<string, readonly unknown[]>>
  /** Each project's Queue (open PRs and unread repositories) by its slug; none by default. */
  readonly queues?: Readonly<Record<string, unknown>>
}

export function fakeProjectsServer(
  projects: readonly unknown[] = [],
  { chats = {}, queues = {} }: FakeProjectsOptions = {},
) {
  const chatsOf = new Map(Object.entries(chats).map(([slug, list]) => [slug, list.map((c) => ProjectChat.parse(c))]))
  const stored = new Map(
    projects.map((p) => {
      const project = ProjectSummary.parse(p)
      return [project.slug, project]
    }),
  )
  const answers = new Map<ProjectsCall, () => Response | Promise<Response>>()
  const requests: { call: ProjectsCall; path: string; body: unknown }[] = []
  const shown = () => [...stored.values()].sort(byPinThenName)

  const pin = (slug: string, path: string, init: RequestInit | undefined): Response => {
    const parsed = PinProjectRequest.safeParse(bodyOf(init))
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success) return invalid()
    const project = stored.get(slug)
    if (project === undefined)
      return errorAnswer({ kind: 'not-found', path, message: 'no project has this slug', requestId: 'r-404' }, 404)
    const next = ProjectSummary.parse({ ...project, pinned: parsed.data.pinned })
    stored.set(slug, next)
    return json({ project: next })
  }

  const detail = (slug: string, path: string): Response => {
    const project = stored.get(slug)
    if (project === undefined)
      return errorAnswer({ kind: 'not-found', path, message: 'no project has this slug', requestId: 'r-404' }, 404)
    return json(
      ProjectDetailResponse.parse({ project, repositories: [], queue: queues[slug] ?? { inProgress: [], unread: [] } }),
    )
  }

  return {
    requests,
    /** The requests of `call` so far. */
    calls: (call: ProjectsCall) => requests.filter((r) => r.call === call),
    /** The projects in the order the next list gives them. */
    projects: shown,
    /** Answers the next request of `call` with `answer`. */
    answerNext: (call: ProjectsCall, answer: () => Response | Promise<Response>) => {
      answers.set(call, answer)
    },
    /** The answer to a request for `path`, or undefined when it is not a Projects home route. */
    handle: (path: string, init?: RequestInit): Response | Promise<Response> | undefined => {
      const method = (init?.method ?? 'GET').toUpperCase()
      const pinPath = /^\/api\/projects\/([^/]+)\/pin$/.exec(path)
      const detailPath = /^\/api\/projects\/([^/]+)$/.exec(path)
      const chatsPath = /^\/api\/projects\/([^/]+)\/chats$/.exec(path)
      const call: ProjectsCall | undefined =
        path === '/api/projects' && method === 'GET'
          ? 'list'
          : pinPath !== null && method === 'PUT'
            ? 'pin'
            : detailPath !== null && method === 'GET'
              ? 'detail'
              : chatsPath !== null && method === 'GET'
                ? 'chats'
                : undefined
      if (call === undefined) return undefined
      requests.push({ call, path, body: bodyOf(init) })
      const next = answers.get(call)
      if (next !== undefined) {
        answers.delete(call)
        return next()
      }
      if (call === 'list') return json(ProjectsResponse.parse({ projects: shown() }))
      if (call === 'detail') return detail(decodeURIComponent(detailPath?.[1] ?? ''), path)
      if (call === 'chats') {
        const slug = decodeURIComponent(chatsPath?.[1] ?? '')
        if (!stored.has(slug))
          return errorAnswer({ kind: 'not-found', path, message: 'no project has this slug', requestId: 'r-404' }, 404)
        return json(ProjectChatsResponse.parse({ chats: chatsOf.get(slug) ?? [] }))
      }
      return pin(decodeURIComponent(pinPath?.[1] ?? ''), path, init)
    },
  }
}

export type FakeProjectsServer = ReturnType<typeof fakeProjectsServer>
