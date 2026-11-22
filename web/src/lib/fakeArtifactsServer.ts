// A fake of the server's Artifacts routes (R26, R27; the-bridge #404), for
// tests: `GET /api/artifacts`, `GET /api/artifacts/:artifact`, `POST
// /api/artifacts` (Add a link: 201 for a new link, 200 with the library's own
// entry for a link it has, a removed one back), `PATCH /api/artifacts/:artifact`
// (file in a project, 204), `DELETE /api/artifacts/:artifact` (remove, 204)
// and `POST /api/artifacts/seen` (204). Every list, body and answer is checked
// against the contract, so a test cannot send or get what the server would
// not: a body the contract refuses, or one that is not JSON, is 400
// invalid-input, and an unknown or removed ID is 404. `findLater` holds
// artifacts back for a later list, as the server's scan stops at its cap: the
// next list says `partial: true` without them, and the one after lists them.
// `answerNext` answers the next request of one kind with a test's answer, and
// `requests` records each one with its body. A test plugs `handle` into its
// `fetch` stub.
import {
  AddArtifactRequest,
  Artifact,
  ArtifactDetailResponse,
  ArtifactId,
  ArtifactsResponse,
  ArtifactsSeenRequest,
  type ErrorBody,
  FileArtifactRequest,
} from '@bridge/contract'
import { errorAnswer } from './fakeTranscriptServer.ts'

/** A request kind the fake takes. */
export type ArtifactsCall = 'list' | 'get' | 'add' | 'file' | 'remove' | 'seen'

/** The stored entry: the contract's artifact and whether the owner removed it. */
type Stored = { artifact: Artifact; removed: boolean }

/** 16 hex characters from `link` (FNV-1a, 64 bit), as the server's ID is the start of its sha256. */
function fakeArtifactId(link: string): ArtifactId {
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(link)) {
    hash ^= BigInt(byte)
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn
  }
  return ArtifactId.parse(hash.toString(16).padStart(16, '0'))
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
const gone = (path: string) =>
  errorAnswer({ kind: 'not-found', path, message: 'no artifact has this ID', requestId: 'r-404' }, 404)

/** A server error answer of `kind` with `status`, such as `internal` 500, for `answerNext`. */
export const artifactsError = (kind: 'internal' | 'forbidden' | 'too-many-requests', status: number): Response =>
  errorAnswer({ kind, message: 'Failed', requestId: `r-${String(status)}` } satisfies ErrorBody['error'], status)

export type FakeArtifactsOptions = {
  /** The library's artifacts, newest first or not; each is checked against the contract. */
  readonly artifacts?: readonly unknown[]
  readonly lastSeenAt?: string | null
  /** The time the fake gives a list's `checkedAt`, an add's times and a seen. */
  readonly now?: () => Date
}

export function fakeArtifactsServer({
  artifacts = [],
  lastSeenAt: seenFirst = null,
  now = () => new Date(),
}: FakeArtifactsOptions = {}) {
  const library = new Map<string, Stored>(
    artifacts.map((a) => {
      const artifact = Artifact.parse(a)
      return [artifact.id, { artifact, removed: false }]
    }),
  )
  let lastSeenAt = seenFirst
  let checkedAt: string | null = null
  /** The artifacts the next list holds back (`partial: true`); the list after it adds them. */
  let later: Artifact[] | undefined
  let laterHeld = false
  const answers = new Map<ArtifactsCall, { answer: () => Response | Promise<Response>; times: number }>()
  /** Each request the page sent, in order, with its body as JSON. */
  const requests: { call: ArtifactsCall; path: string; body: unknown }[] = []

  const shown = () =>
    [...library.values()]
      .filter((s) => !s.removed)
      .map((s) => s.artifact)
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))

  const list = (): Response => {
    checkedAt = now().toISOString()
    let partial = false
    if (later !== undefined && !laterHeld) {
      laterHeld = true
      partial = true
    } else if (later !== undefined) {
      for (const artifact of later) library.set(artifact.id, { artifact, removed: false })
      later = undefined
      laterHeld = false
    }
    return json(ArtifactsResponse.parse({ checkedAt, lastSeenAt, partial, artifacts: shown() }))
  }

  const add = (init: RequestInit | undefined): Response => {
    const parsed = AddArtifactRequest.safeParse(bodyOf(init))
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success) return invalid()
    // The library's entry for the link, whatever ID a test gave it; a new link's ID comes from the link.
    const known = [...library.values()].find((s) => s.artifact.link === parsed.data.link)
    const id = fakeArtifactId(parsed.data.link)
    if (known !== undefined) {
      known.removed = false
      return json({ artifact: known.artifact }, 200)
    }
    const at = now().toISOString()
    const artifact = Artifact.parse({
      id,
      link: parsed.data.link,
      source: parsed.data.source,
      title: parsed.data.title,
      description: '',
      project: parsed.data.project ?? null,
      chat: null,
      publishedAt: at,
      foundAt: at,
      foundBy: 'owner',
    })
    library.set(id, { artifact, removed: false })
    return json({ artifact }, 201)
  }

  const one = (id: string, path: string): Stored | Response => {
    const stored = ArtifactId.safeParse(id).success ? library.get(id) : undefined
    return stored === undefined || stored.removed ? gone(path) : stored
  }

  const file = (id: string, path: string, init: RequestInit | undefined): Response => {
    const parsed = FileArtifactRequest.safeParse(bodyOf(init))
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success) return invalid()
    const stored = one(id, path)
    if (stored instanceof Response) return stored
    stored.artifact = Artifact.parse({ ...stored.artifact, project: parsed.data.project })
    return new Response(null, { status: 204 })
  }

  const remove = (id: string, path: string): Response => {
    const stored = one(id, path)
    if (stored instanceof Response) return stored
    stored.removed = true
    return new Response(null, { status: 204 })
  }

  const seen = (init: RequestInit | undefined): Response => {
    if (!ArtifactsSeenRequest.safeParse(bodyOf(init)).success) return invalid()
    lastSeenAt = now().toISOString()
    return new Response(null, { status: 204 })
  }

  const callOf = (path: string, method: string): { call: ArtifactsCall; id?: string } | undefined => {
    if (path === '/api/artifacts') return method === 'POST' ? { call: 'add' } : { call: 'list' }
    if (path === '/api/artifacts/seen' && method === 'POST') return { call: 'seen' }
    const item = /^\/api\/artifacts\/([^/]+)$/.exec(path)
    if (item === null) return undefined
    const id = decodeURIComponent(item[1] ?? '')
    if (method === 'PATCH') return { call: 'file', id }
    if (method === 'DELETE') return { call: 'remove', id }
    return { call: 'get', id }
  }

  return {
    requests,
    /** The requests of `call` so far. */
    calls: (call: ArtifactsCall) => requests.filter((r) => r.call === call),
    /** The library now, as the next list would give it, removed entries left out. */
    artifacts: shown,
    lastSeenAt: () => lastSeenAt,
    /** The next list says `partial: true` and lists none of `found`; the list after it lists them too. */
    findLater: (found: readonly unknown[]) => {
      later = found.map((a) => Artifact.parse(a))
      laterHeld = false
    },
    /** Answers the next `times` requests of `call` (one when not set) with `answer`. */
    answerNext: (call: ArtifactsCall, answer: () => Response | Promise<Response>, times = 1) => {
      answers.set(call, { answer, times })
    },
    /** The answer to a request for `path`, or undefined when it is not an artifacts route. */
    handle: (path: string, init?: RequestInit): Response | Promise<Response> | undefined => {
      const method = (init?.method ?? 'GET').toUpperCase()
      const route = callOf(path, method)
      if (route === undefined) return undefined
      requests.push({ call: route.call, path, body: bodyOf(init) })
      const next = answers.get(route.call)
      if (next !== undefined) {
        next.times -= 1
        if (next.times <= 0) answers.delete(route.call)
        return next.answer()
      }
      const id = route.id ?? ''
      switch (route.call) {
        case 'list':
          return list()
        case 'add':
          return add(init)
        case 'seen':
          return seen(init)
        case 'file':
          return file(id, path, init)
        case 'remove':
          return remove(id, path)
        case 'get': {
          const stored = one(id, path)
          if (stored instanceof Response) return stored
          return json(ArtifactDetailResponse.parse({ artifact: stored.artifact, madeIn: null }))
        }
      }
    },
  }
}

export type FakeArtifactsServer = ReturnType<typeof fakeArtifactsServer>
