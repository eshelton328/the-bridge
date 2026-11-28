// A fake of the server's Projects routes (f-008 R2, R3, R4), for tests:
// `GET /api/projects` (the pinned projects first, then the others, each part
// by name, as the server sorts them), `PUT /api/projects/:slug/pin` (the
// card as it is now) and `GET /api/projects/:slug` (the project, with no
// repositories, and the test's open PRs and unread repositories by slug) and
// `GET /api/projects/:slug/chats` (the test's chats of the project, none by
// default), `GET /api/projects/:slug/ideas` (the test's ideas of the
// project, none by default), `GET /api/projects/:slug/repositories` (the
// test's sections of the project, none by default), `GET /api/projects/:slug/drift` (the test's last
// drift run, none by default) and `POST /api/projects/:slug/drift` (a clean run
// now, kept as the last), `GET /api/projects/-/slug?name=` (the server's slug of
// the name, free when no project has it) and `POST /api/projects` (the new
// project, unpinned, or 409 slugTaken). Every project, body and answer is checked against the
// contract, so a test cannot send or get what the server would not: a body the
// contract refuses is 400 invalid-input, and an unknown slug is 404. The pins
// live in the fake, as the server keeps them in a file, so a new page (a
// reload) reads them. `answerNext` answers the next request of one kind with a
// test's answer, and `requests` records each one with its body. A test plugs
// `handle` into its `fetch` stub.
import {
  DriftResponse,
  IdeaDetailResponse,
  IdeasResponse,
  PinProjectRequest,
  ProjectDetailsRequest,
  ProjectChat,
  ProjectChatsResponse,
  ProjectDetailResponse,
  ProjectsResponse,
  ProjectSummary,
  RepositoriesResponse,
  RunDriftRequest,
  SlugResponse,
} from '@bridge/contract'
import { errorAnswer } from './fakeTranscriptServer.ts'

/** A request kind the fake takes. */
export type ProjectsCall =
  | 'list'
  | 'pin'
  | 'detail'
  | 'chats'
  | 'ideas'
  | 'repositories'
  | 'drift'
  | 'runDrift'
  | 'slug'
  | 'create'

/** The server's slug of a name (server/src/services/brainWrites.ts `slugOf`), or null. */
const slugOf = (name: string) => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return /^[a-z0-9][a-z0-9._-]{0,63}$/.test(slug) ? slug : null
}

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
  /** Each project's ideas (`{ idea, body }`) by its slug, in the list's order; each is checked against the contract. */
  readonly ideas?: Readonly<Record<string, readonly unknown[]>>
  /** Each project's repository sections (`RepositorySection`) by its slug; none by default. */
  readonly repositories?: Readonly<Record<string, readonly unknown[]>>
  /** Each project's last drift run (`DriftRun`) by its slug; none (never checked) by default. */
  readonly drift?: Readonly<Record<string, unknown>>
}

export function fakeProjectsServer(
  projects: readonly unknown[] = [],
  { chats = {}, queues = {}, ideas = {}, repositories = {}, drift = {} }: FakeProjectsOptions = {},
) {
  const sectionsOf = new Map(
    Object.entries(repositories).map(([slug, list]) => [slug, RepositoriesResponse.parse({ repositories: list })]),
  )
  const ideasOf = new Map(
    Object.entries(ideas).map(([slug, list]) => [slug, list.map((i) => IdeaDetailResponse.parse(i))]),
  )
  const chatsOf = new Map(Object.entries(chats).map(([slug, list]) => [slug, list.map((c) => ProjectChat.parse(c))]))
  const stored = new Map(
    projects.map((p) => {
      const project = ProjectSummary.parse(p)
      return [project.slug, project]
    }),
  )
  const lastRun = new Map(Object.entries(drift).map(([slug, run]) => [slug, DriftResponse.parse({ last: run }).last]))
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

  const create = (init: RequestInit | undefined): Response => {
    const parsed = ProjectDetailsRequest.safeParse(bodyOf(init))
    const slug = parsed.success ? slugOf(parsed.data.name) : null
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success || slug === null)
      return invalid()
    if (stored.has(slug))
      return errorAnswer(
        {
          kind: 'project-not-ready',
          state: 'slugTaken',
          message: 'a project folder has this name',
          requestId: 'r-409',
        },
        409,
      )
    const project = ProjectSummary.parse({ ...parsed.data, slug, pinned: false })
    stored.set(slug, project)
    return json({ project }, 201)
  }

  const driftAnswer = (call: 'drift' | 'runDrift', slug: string, path: string, init: RequestInit | undefined) => {
    if (!stored.has(slug))
      return errorAnswer({ kind: 'not-found', path, message: 'no project has this slug', requestId: 'r-404' }, 404)
    if (call === 'runDrift') {
      const body = RunDriftRequest.safeParse(bodyOf(init))
      if (new Headers(init?.headers).get('content-type') !== 'application/json' || !body.success) return invalid()
      lastRun.set(slug, { result: 'clean', checkedAt: new Date().toISOString(), findings: [] })
    }
    return json(DriftResponse.parse({ last: lastRun.get(slug) ?? null }))
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
    /** The answer to a request for `url` (a path and its query), or undefined when it is not a Projects route. */
    handle: (url: string, init?: RequestInit): Response | Promise<Response> | undefined => {
      const [path = '', query = ''] = url.split('?')
      const method = (init?.method ?? 'GET').toUpperCase()
      const pinPath = /^\/api\/projects\/([^/]+)\/pin$/.exec(path)
      const detailPath = /^\/api\/projects\/([^/]+)$/.exec(path)
      const chatsPath = /^\/api\/projects\/([^/]+)\/chats$/.exec(path)
      const ideasPath = /^\/api\/projects\/([^/]+)\/ideas$/.exec(path)
      const reposPath = /^\/api\/projects\/([^/]+)\/repositories$/.exec(path)
      const driftPath = /^\/api\/projects\/([^/]+)\/drift$/.exec(path)
      const call: ProjectsCall | undefined =
        path === '/api/projects' && method === 'GET'
          ? 'list'
          : pinPath !== null && method === 'PUT'
            ? 'pin'
            : detailPath !== null && method === 'GET'
              ? 'detail'
              : chatsPath !== null && method === 'GET'
                ? 'chats'
                : ideasPath !== null && method === 'GET'
                  ? 'ideas'
                  : reposPath !== null && method === 'GET'
                    ? 'repositories'
                    : driftPath !== null && method === 'GET'
                      ? 'drift'
                      : driftPath !== null && method === 'POST'
                        ? 'runDrift'
                        : path === '/api/projects/-/slug' && method === 'GET'
                          ? 'slug'
                          : path === '/api/projects' && method === 'POST'
                            ? 'create'
                            : undefined
      if (call === undefined) return undefined
      requests.push({ call, path: url, body: bodyOf(init) })
      const next = answers.get(call)
      if (next !== undefined) {
        answers.delete(call)
        return next()
      }
      if (call === 'create') return create(init)
      if (call === 'slug') {
        const slug = slugOf(new URLSearchParams(query).get('name') ?? '')
        return json(SlugResponse.parse({ slug, free: slug !== null && !stored.has(slug) }))
      }
      if (call === 'list') return json(ProjectsResponse.parse({ projects: shown() }))
      if (call === 'detail') return detail(decodeURIComponent(detailPath?.[1] ?? ''), path)
      if (call === 'drift' || call === 'runDrift')
        return driftAnswer(call, decodeURIComponent(driftPath?.[1] ?? ''), path, init)
      if (call === 'chats') {
        const slug = decodeURIComponent(chatsPath?.[1] ?? '')
        if (!stored.has(slug))
          return errorAnswer({ kind: 'not-found', path, message: 'no project has this slug', requestId: 'r-404' }, 404)
        return json(ProjectChatsResponse.parse({ chats: chatsOf.get(slug) ?? [] }))
      }
      if (call === 'repositories') {
        const slug = decodeURIComponent(reposPath?.[1] ?? '')
        if (!stored.has(slug))
          return errorAnswer({ kind: 'not-found', path, message: 'no project has this slug', requestId: 'r-404' }, 404)
        return json(sectionsOf.get(slug) ?? { repositories: [] })
      }
      if (call === 'ideas') {
        const slug = decodeURIComponent(ideasPath?.[1] ?? '')
        if (!stored.has(slug))
          return errorAnswer({ kind: 'not-found', path, message: 'no project has this slug', requestId: 'r-404' }, 404)
        return json(IdeasResponse.parse({ ideas: (ideasOf.get(slug) ?? []).map((i) => i.idea) }))
      }
      return pin(decodeURIComponent(pinPath?.[1] ?? ''), path, init)
    },
  }
}

export type FakeProjectsServer = ReturnType<typeof fakeProjectsServer>
