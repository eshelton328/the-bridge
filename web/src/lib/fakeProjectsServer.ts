// A fake of the server's Projects routes (f-008 R2, R3, R4), for tests:
// `GET /api/projects` (the pinned projects first, then the others, each part
// by name, as the server sorts them), `PUT /api/projects/:slug/pin` (the
// card as it is now) and `GET /api/projects/:slug` (the project, with no
// repositories, and the test's open PRs and unread repositories by slug) and
// `GET /api/projects/:slug/chats` (the test's chats of the project, none by
// default), `GET /api/projects/:slug/ideas` and `.../ideas/:id` (the test's
// ideas of the project, none by default; an unknown idea is 404),
// `GET /api/projects/:slug/repositories` (the test's sections of the
// project, none by default), `.../repositories/:repo/ci` (the test's CI
// answer, not read by default; `setCi` changes it; a repository the
// project does not list is 404), `GET /api/projects/:slug/qa` (the test's QA
// items of the project, none by default), `GET /api/projects/:slug/architecture` and
// `.../architecture/:scope` (the test's scopes and kept diagrams; by default
// System alone with no diagram, as the server answers; an unknown scope is 404), `GET /api/projects/:slug/drift` (the test's last
// drift run, none by default) and `POST /api/projects/:slug/drift` (a clean run
// now, kept as the last). Every project, body and answer is checked against the
// contract, so a test cannot send or get what the server would not: a body the
// contract refuses is 400 invalid-input, and an unknown slug is 404. The pins
// live in the fake, as the server keeps them in a file, so a new page (a
// reload) reads them. `answerNext` answers the next request of one kind with a
// test's answer, and `requests` records each one with its body. A test plugs
// `handle` into its `fetch` stub.
import {
  ArchitectureModel,
  ArchitectureResponse,
  ArchitectureScopeResponse,
  DriftResponse,
  IdeaDetailResponse,
  IdeasResponse,
  PinProjectRequest,
  ProjectChat,
  ProjectChatsResponse,
  ProjectDetailResponse,
  ProjectsResponse,
  ProjectSummary,
  QaListResponse,
  RepositoriesResponse,
  RepositoryCiResponse,
  RunDriftRequest,
} from '@bridge/contract'
import { errorAnswer } from './fakeTranscriptServer.ts'

/** A request kind the fake takes. */
export type ProjectsCall =
  | 'list'
  | 'pin'
  | 'detail'
  | 'chats'
  | 'ideas'
  | 'idea'
  | 'repositories'
  | 'ci'
  | 'qa'
  | 'drift'
  | 'runDrift'
  | 'architecture'
  | 'diagram'

/** A project's Architecture list with no fixture: System alone, with no diagram yet, as the server answers. */
const noArchitecture = ArchitectureResponse.parse({
  scopes: [
    {
      scope: '@system',
      title: 'How the system works',
      commit: null,
      generatedAt: null,
      stale: false,
      running: false,
      failed: null,
    },
  ],
})

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
  /** Each project's ideas (`{ idea, body, file }`, as the detail route gives them) by its slug, in the list's order; each is checked against the contract. */
  readonly ideas?: Readonly<Record<string, readonly unknown[]>>
  /** Each project's repository sections (`RepositorySection`) by its slug; none by default. */
  readonly repositories?: Readonly<Record<string, readonly unknown[]>>
  /** Each repository's CI answer (`RepositoryCiResponse`) by `<slug>/<repository ID>`; not read by default. */
  readonly ci?: Readonly<Record<string, unknown>>
  /** Each project's QA items (`QaItem`) by its slug, in the list's order; none by default. */
  readonly qa?: Readonly<Record<string, readonly unknown[]>>
  /** Each project's last drift run (`DriftRun`) by its slug; none (never checked) by default. */
  readonly drift?: Readonly<Record<string, unknown>>
  /**
   * Each project's Architecture tab by its slug: its scopes (`ArchitectureScopeState`, in the list's order) and each
   * scope's kept model or null; by default System alone with no diagram.
   */
  readonly architecture?: Readonly<
    Record<string, { readonly scopes: readonly unknown[]; readonly models?: Readonly<Record<string, unknown>> }>
  >
}

/**
 * An idea's detail as the server gives it for a record with no `created`, `source` or links, for a fixture: one
 * place to add a key that `IdeaDetailResponse` gains.
 */
export function fakeIdeaDetail(idea: unknown, body: string, file: string | null) {
  return IdeaDetailResponse.parse({ idea, body, file, created: null, source: null, links: [] })
}

export function fakeProjectsServer(
  projects: readonly unknown[] = [],
  {
    chats = {},
    queues = {},
    ideas = {},
    repositories = {},
    ci = {},
    qa = {},
    drift = {},
    architecture = {},
  }: FakeProjectsOptions = {},
) {
  const archOf = new Map(
    Object.entries(architecture).map(([slug, a]) => [
      slug,
      {
        list: ArchitectureResponse.parse({ scopes: a.scopes }),
        models: new Map(
          Object.entries(a.models ?? {}).map(([scope, m]) => [scope, ArchitectureModel.nullable().parse(m)]),
        ),
      },
    ]),
  )
  const sectionsOf = new Map(
    Object.entries(repositories).map(([slug, list]) => [slug, RepositoriesResponse.parse({ repositories: list })]),
  )
  const ciOf = new Map(Object.entries(ci).map(([key, answer]) => [key, RepositoryCiResponse.parse(answer)]))
  const qaOf = new Map(Object.entries(qa).map(([slug, list]) => [slug, QaListResponse.parse({ items: list })]))
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
    /** Sets repository `repo`'s CI answer, as a server's CI read that ends does. */
    setCi: (slug: string, repo: string, answer: unknown) => {
      ciOf.set(`${slug}/${repo}`, RepositoryCiResponse.parse(answer))
    },
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
      const ideasPath = /^\/api\/projects\/([^/]+)\/ideas$/.exec(path)
      const reposPath = /^\/api\/projects\/([^/]+)\/repositories$/.exec(path)
      const ciPath = /^\/api\/projects\/([^/]+)\/repositories\/([^/]+)\/ci$/.exec(path)
      const qaPath = /^\/api\/projects\/([^/]+)\/qa$/.exec(path)
      const ideaPath = /^\/api\/projects\/([^/]+)\/ideas\/([^/]+)$/.exec(path)
      const driftPath = /^\/api\/projects\/([^/]+)\/drift$/.exec(path)
      const archPath = /^\/api\/projects\/([^/]+)\/architecture$/.exec(path)
      const diagramPath = /^\/api\/projects\/([^/]+)\/architecture\/([^/]+)$/.exec(path)
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
                    : ciPath !== null && method === 'GET'
                      ? 'ci'
                      : ideaPath !== null && method === 'GET'
                        ? 'idea'
                        : driftPath !== null && method === 'GET'
                          ? 'drift'
                          : driftPath !== null && method === 'POST'
                            ? 'runDrift'
                            : qaPath !== null && method === 'GET'
                              ? 'qa'
                              : archPath !== null && method === 'GET'
                                ? 'architecture'
                                : diagramPath !== null && method === 'GET'
                                  ? 'diagram'
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
      if (call === 'ci') {
        const slug = decodeURIComponent(ciPath?.[1] ?? '')
        const repo = decodeURIComponent(ciPath?.[2] ?? '')
        const listed = sectionsOf.get(slug)?.repositories.some((r) => r.id === repo) ?? false
        if (!stored.has(slug) || !listed)
          return errorAnswer(
            { kind: 'not-found', path, message: 'no project has a repository with this name', requestId: 'r-404' },
            404,
          )
        return json(ciOf.get(`${slug}/${repo}`) ?? { ci: null, readAt: null, reading: false })
      }
      if (call === 'qa') {
        const slug = decodeURIComponent(qaPath?.[1] ?? '')
        if (!stored.has(slug))
          return errorAnswer({ kind: 'not-found', path, message: 'no project has this slug', requestId: 'r-404' }, 404)
        return json(qaOf.get(slug) ?? { items: [] })
      }
      if (call === 'architecture' || call === 'diagram') {
        const slug = decodeURIComponent((archPath ?? diagramPath)?.[1] ?? '')
        if (!stored.has(slug))
          return errorAnswer({ kind: 'not-found', path, message: 'no project has this slug', requestId: 'r-404' }, 404)
        const arch = archOf.get(slug)
        if (call === 'architecture') return json(arch?.list ?? noArchitecture)
        const scope = decodeURIComponent(diagramPath?.[2] ?? '')
        const state = (arch?.list ?? noArchitecture).scopes.find((s) => s.scope === scope)
        if (state === undefined)
          return errorAnswer({ kind: 'not-found', path, message: 'no such scope', requestId: 'r-404' }, 404)
        return json(ArchitectureScopeResponse.parse({ state, model: arch?.models.get(scope) ?? null }))
      }
      if (call === 'ideas' || call === 'idea') {
        const slug = decodeURIComponent((ideasPath ?? ideaPath)?.[1] ?? '')
        if (!stored.has(slug))
          return errorAnswer({ kind: 'not-found', path, message: 'no project has this slug', requestId: 'r-404' }, 404)
        const list = ideasOf.get(slug) ?? []
        if (call === 'ideas') return json(IdeasResponse.parse({ ideas: list.map((i) => i.idea) }))
        const found = list.find((i) => i.idea.id === decodeURIComponent(ideaPath?.[2] ?? ''))
        if (found === undefined)
          return errorAnswer({ kind: 'not-found', path, message: 'no idea has this ID', requestId: 'r-404' }, 404)
        return json(found)
      }
      return pin(decodeURIComponent(pinPath?.[1] ?? ''), path, init)
    },
  }
}

export type FakeProjectsServer = ReturnType<typeof fakeProjectsServer>
