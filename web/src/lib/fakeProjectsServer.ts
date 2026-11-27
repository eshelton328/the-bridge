// A fake of the server's Projects list route (f-008 R2), for tests:
// `GET /api/projects` (the pinned projects first, then the others, each part
// by name, as the server sorts them). Every project and answer is checked
// against the contract, so a test cannot get what the server would not.
// `answerNext` answers the next request of one kind with a
// test's answer, and `requests` records each one with its body. A test plugs
// `handle` into its `fetch` stub.
import { ProjectsResponse, ProjectSummary } from '@bridge/contract'

/** A request kind the fake takes. */
export type ProjectsCall = 'list'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const bodyOf = (init: RequestInit | undefined): unknown => {
  try {
    return typeof init?.body === 'string' ? JSON.parse(init.body) : undefined
  } catch {
    return undefined
  }
}

/** The server's order: pinned first, then by name, by code point. */
const byPinThenName = (a: ProjectSummary, b: ProjectSummary) =>
  a.pinned === b.pinned ? (a.name < b.name ? -1 : a.name > b.name ? 1 : 0) : a.pinned ? -1 : 1

export function fakeProjectsServer(projects: readonly unknown[] = []) {
  const stored = new Map(
    projects.map((p) => {
      const project = ProjectSummary.parse(p)
      return [project.slug, project]
    }),
  )
  const answers = new Map<ProjectsCall, () => Response | Promise<Response>>()
  // Each call by its name, so a test can ask for any.
  const requests: { call: string; path: string; body: unknown }[] = []
  const shown = () => [...stored.values()].sort(byPinThenName)

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
      const call: ProjectsCall | undefined = path === '/api/projects' && method === 'GET' ? 'list' : undefined
      if (call === undefined) return undefined
      requests.push({ call, path, body: bodyOf(init) })
      const next = answers.get(call)
      if (next !== undefined) {
        answers.delete(call)
        return next()
      }
      return json(ProjectsResponse.parse({ projects: shown() }))
    },
  }
}

export type FakeProjectsServer = ReturnType<typeof fakeProjectsServer>
