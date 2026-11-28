// A fake of the server's Inbox routes (R20; the-bridge #412, #413), for
// tests: `GET /api/inbox`, `GET /api/inbox/:item`, `POST
// /api/inbox/:item/snooze | done | dismiss` (204; a brain item 409
// inbox-read-only) and the event stream (`GET /api/events`) with its
// `inbox.changed` events. Every item, detail, body and answer is checked
// against the contract, so a test cannot send or get what the server would
// not: a body the contract refuses is 400 invalid-input, an ID that is not 16
// hex characters 400, and an unknown ID 404. A mark changes the list as the
// server's does: done and dismiss take the item out, a snooze puts it in
// Snoozed and out of the needs-you count; then the stream sends
// `inbox.changed`. `emit` sends events of a test's own, `answerNext` answers
// the next request of one kind with a test's answer, and `requests` records
// each one with its body. A test plugs `handle` into its `fetch` stub.
import {
  type ErrorBody,
  InboxActionRequest,
  InboxDetail,
  InboxDetailResponse,
  InboxId,
  InboxItem,
  InboxResponse,
  SnoozeInboxRequest,
} from '@bridge/contract'
import { errorAnswer } from './fakeTranscriptServer.ts'

/** A request kind the fake takes. */
export type InboxCall = 'list' | 'detail' | 'snooze' | 'done' | 'dismiss' | 'events'

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
  errorAnswer({ kind: 'not-found', path, message: 'no Inbox item has this ID', requestId: 'r-404' }, 404)
const readOnly = () =>
  errorAnswer({ kind: 'inbox-read-only', message: 'this item takes no action here', requestId: 'r-409' }, 409)

/** A server error answer of `kind` with `status`, such as `internal` 500, for `answerNext`. */
export const inboxError = (kind: 'internal' | 'forbidden' | 'inbox-read-only', status: number): Response =>
  errorAnswer({ kind, message: 'Failed', requestId: `r-${String(status)}` } satisfies ErrorBody['error'], status)

export type FakeInboxOptions = {
  /** The items, each checked against the contract; the list gives them newest first. */
  readonly items?: readonly unknown[]
  /** Each item's detail by its ID; a chat item without one names no chat, a brain item has an empty body. */
  readonly details?: Readonly<Record<string, unknown>>
  /** The time a snooze is compared with: an item snoozed until after it is in Snoozed. */
  readonly now?: () => Date
}

export function fakeInboxServer({ items = [], details = {}, now = () => new Date() }: FakeInboxOptions = {}) {
  const stored = new Map<string, InboxItem>(
    items.map((i) => {
      const item = InboxItem.parse(i)
      return [item.id, item]
    }),
  )
  const answers = new Map<InboxCall, { answer: () => Response | Promise<Response>; times: number }>()
  /** Each request the page sent, in order, with its body as JSON. */
  const requests: { call: InboxCall; path: string; body: unknown }[] = []
  const streams = new Set<ReadableStreamDefaultController<Uint8Array>>()

  const shown = () => [...stored.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

  const list = (): Response => {
    const all = shown()
    return json(
      InboxResponse.parse({
        items: all,
        counts: { needsYou: all.filter((i) => i.needsYou).length, total: all.length },
      }),
    )
  }

  const detailOf = (item: InboxItem): InboxDetail =>
    InboxDetail.parse(
      details[item.id] ?? (item.source === 'chat' ? { source: 'chat', chat: null } : { source: 'brain', body: '' }),
    )

  let seq = 0
  const emit = (type: string, data: unknown = {}) => {
    // The contract's envelope (EventEnvelope), so a client that parses an event's data sees what the server sends.
    const envelope = { source: 'test-box/fake', seq: seq++, type, data }
    const frame = new TextEncoder().encode(`event: ${type}\ndata: ${JSON.stringify(envelope)}\n\n`)
    for (const control of streams) control.enqueue(frame)
  }

  const events = (signal: AbortSignal | null | undefined): Response => {
    let mine: ReadableStreamDefaultController<Uint8Array> | undefined
    const body = new ReadableStream<Uint8Array>({
      start: (control) => {
        mine = control
        streams.add(control)
        control.enqueue(new TextEncoder().encode('event: open\nretry: 5000\ndata: {}\n\n'))
        signal?.addEventListener('abort', () => {
          if (!streams.delete(control)) return
          control.close()
        })
      },
      cancel: () => {
        if (mine !== undefined) streams.delete(mine)
      },
    })
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } })
  }

  const act = (call: 'snooze' | 'done' | 'dismiss', id: string, path: string, init: RequestInit | undefined) => {
    const parsed = (call === 'snooze' ? SnoozeInboxRequest : InboxActionRequest).safeParse(bodyOf(init))
    if (new Headers(init?.headers).get('content-type') !== 'application/json' || !parsed.success) return invalid()
    const item = stored.get(id)
    if (item === undefined) return gone(path)
    if (item.actions.length === 0) return readOnly()
    if (call === 'snooze') {
      const until = SnoozeInboxRequest.parse(parsed.data).until
      const later = Date.parse(until) > now().getTime()
      stored.set(
        id,
        InboxItem.parse({ ...item, snoozedUntil: later ? until : null, needsYou: !later && item.kind === 'question' }),
      )
    } else stored.delete(id)
    emit('inbox.changed')
    return new Response(null, { status: 204 })
  }

  const callOf = (path: string, method: string): { call: InboxCall; id?: string } | undefined => {
    if (path === '/api/events') return { call: 'events' }
    if (path === '/api/inbox' && method === 'GET') return { call: 'list' }
    const posted = /^\/api\/inbox\/([^/]+)\/(snooze|done|dismiss)$/.exec(path)
    if (posted !== null && method === 'POST') {
      const action = posted[2]
      const id = decodeURIComponent(posted[1] ?? '')
      if (action === 'snooze' || action === 'done' || action === 'dismiss') return { call: action, id }
    }
    const item = /^\/api\/inbox\/([^/]+)$/.exec(path)
    if (item !== null && method === 'GET') return { call: 'detail', id: decodeURIComponent(item[1] ?? '') }
    return undefined
  }

  const answer = (route: { call: InboxCall; id?: string }, path: string, init: RequestInit | undefined) => {
    const id = route.id ?? ''
    if (route.call === 'events') return events(init?.signal)
    if (route.call === 'list') return list()
    if (!InboxId.safeParse(id).success)
      return errorAnswer(
        { kind: 'invalid-input', issues: ['an item ID is 16 hex characters'], message: 'Invalid', requestId: 'r-400' },
        400,
      )
    if (route.call === 'detail') {
      const item = stored.get(id)
      return item === undefined ? gone(path) : json(InboxDetailResponse.parse({ item, detail: detailOf(item) }))
    }
    return act(route.call, id, path, init)
  }

  return {
    requests,
    /** The requests of `call` so far. */
    calls: (call: InboxCall) => requests.filter((r) => r.call === call),
    /** The items now, newest first. */
    items: shown,
    /** Puts `item` in the Inbox, or changes it, and sends `inbox.changed`, as a chat's turn or a brain write does. */
    put: (item: unknown) => {
      const parsed = InboxItem.parse(item)
      stored.set(parsed.id, parsed)
      emit('inbox.changed')
    },
    /** Sends one event of `type` on every open stream. */
    emit,
    /** How many event streams are open now. */
    streams: () => streams.size,
    /** Answers the next `times` requests of `call` (one when not set) with `answer`. */
    answerNext: (call: InboxCall, next: () => Response | Promise<Response>, times = 1) => {
      answers.set(call, { answer: next, times })
    },
    /** The answer to a request for `path`, or undefined when it is not an Inbox or events route. */
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
      return answer(route, path, init)
    },
  }
}

export type FakeInboxServer = ReturnType<typeof fakeInboxServer>
