// The Inbox (R20, f-003): what waits on the owner. A chat item is a chat
// that needs the owner (a question) or finished a turn (a review), for that
// turn only: its ID is a hash of the chat, its status and the turn's end,
// so the next turn is a new item and a mark of the last one no longer
// hides it. A brain item is an open or snoozed attention request, read
// through a port that only reads; it takes no action here. The owner's
// marks (snoozed, done, dismissed) are kept in a store. Nothing reads on a
// timer (d-112), and no prompt or transcript text is read.
import { createHash } from 'node:crypto'
import {
  type ChatId,
  type ChatSummary,
  type InboxAction,
  type InboxDetail,
  InboxId,
  type InboxItem,
  type InboxKind,
  type InboxResponse,
  maxInboxTitle,
  type WorkspaceId,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError } from './agentPort.ts'

/** An attention request of the brain, as the records port reads its front matter. */
export type BrainRequest = {
  readonly id: InboxId
  readonly kind: InboxKind
  readonly title: string
  readonly project: string | null
  readonly tags: readonly string[]
  readonly created: string
  /** When a snoozed request returns; null for an open one. */
  readonly snoozedUntil: string | null
}

type Fault = { readonly reason: 'failed'; readonly code: string }

/** The brain's open and snoozed attention requests. It only reads, and only when called. */
export type BrainRequests = {
  list(): Promise<Result<readonly BrainRequest[], Fault>>
  /** The record's Markdown after its front matter; null when no open or snoozed request has the ID. */
  body(id: InboxId): Promise<Result<string | null, Fault>>
}

/** When a chat's turn ended (its session file's last write); null when the adapter cannot tell. */
type ChatTurns = { endOf(chat: ChatSummary): Promise<Result<string | null, AgentPortError>> }

/** The owner's mark of one chat item. */
type Mark = { readonly state: 'done' | 'dismissed' } | { readonly state: 'snoozed'; readonly until: string }
export type InboxMarks = Readonly<Record<string, Mark>>

export type InboxMarkStore = {
  load(): Promise<Result<InboxMarks, Fault>>
  save(marks: InboxMarks): Promise<Result<void, Fault>>
}

type Deps = {
  readonly agents: AgentPort
  readonly brain: BrainRequests
  /** When a chat's turn ended; the agents' `turnEnd` when not given. */
  readonly turns?: ChatTurns
  readonly marks: InboxMarkStore
  readonly now?: () => Date
}

type InboxError = AgentPortError | Fault
type Detail = { readonly item: InboxItem; readonly detail: InboxDetail }
type ActOutcome = 'done' | 'notFound' | 'readOnly'
/** What the owner does to an item: a snooze until a time, a done or a dismiss. */
type InboxChange = { readonly action: 'snooze'; readonly until: string } | { readonly action: 'done' | 'dismiss' }

export type Inbox = {
  list(): Promise<Result<InboxResponse, InboxError>>
  get(id: InboxId): Promise<Result<Detail | 'notFound', InboxError>>
  act(id: InboxId, change: InboxChange): Promise<Result<ActOutcome, InboxError>>
}

/** The turn ends that the agents port gives. A port fault fails the read, so no mark is dropped meanwhile. */
const chatTurns = (agents: AgentPort): ChatTurns => ({ endOf: (chat) => agents.turnEnd(chat.id) })

const chatActions: readonly InboxAction[] = ['snooze', 'done', 'dismiss']
const hashId = (text: string) => InboxId.parse(createHash('sha256').update(text).digest('hex').slice(0, 16))

export function createInbox({ agents, brain, turns = chatTurns(agents), marks, now = () => new Date() }: Deps): Inbox {
  // The time the server first saw a chat in a status, shown as the item's time when the turn port cannot tell
  // the turn's end. Such an item takes no action: the server sees no status change between reads, so a mark
  // could hide the chat's next turn, and the time is lost on a restart.
  const firstSeen = new Map<ChatId, { status: string; at: string }>()
  let queue: Promise<unknown> = Promise.resolve()
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const next = queue.then(work, work)
    queue = next.catch(() => undefined)
    return next
  }

  type Built = {
    items: InboxItem[]
    chats: Map<InboxId, { chat: ChatId; workspace: WorkspaceId; summary: ChatSummary }>
    kept: InboxMarks
  }
  /** The items now, with the marks that still name one; a mark of an ended turn is dropped. */
  const build = async (): Promise<Result<Built, InboxError>> => {
    const [listed, requests, stored] = await Promise.all([agents.listWorkspaces(), brain.list(), marks.load()])
    if (!listed.ok) return listed
    if (!requests.ok) return requests
    if (!stored.ok) return stored
    const at = now()
    const items: InboxItem[] = []
    const chats: Built['chats'] = new Map()
    const kept: Record<string, Mark> = {}
    for (const workspace of listed.value)
      for (const chat of workspace.chats) {
        if (chat.kind === 'shell' || (chat.status !== 'needsYou' && chat.status !== 'done')) {
          firstSeen.delete(chat.id)
          continue
        }
        const turn = await turns.endOf(chat)
        if (!turn.ok) return turn
        const ended = turn.value
        let shownAt = ended
        if (shownAt === null) {
          const seen = firstSeen.get(chat.id)
          shownAt = seen?.status === chat.status ? seen.at : at.toISOString()
          firstSeen.set(chat.id, { status: chat.status, at: shownAt })
        } else firstSeen.delete(chat.id)
        const id = hashId(`chat|${chat.id}|${chat.status}|${ended ?? 'unknown'}`)
        const mark = ended === null ? undefined : stored.value[id]
        if (mark !== undefined) kept[id] = mark
        if (mark?.state === 'done' || mark?.state === 'dismissed') continue
        const snoozed = mark?.state === 'snoozed' && Date.parse(mark.until) > at.getTime() ? mark.until : null
        chats.set(id, { chat: chat.id, workspace: workspace.id, summary: chat })
        items.push({
          id,
          source: 'chat',
          kind: chat.status === 'needsYou' ? 'question' : 'review',
          title: (chat.title || chat.id).slice(0, maxInboxTitle),
          project: null,
          tags: [],
          needsYou: chat.status === 'needsYou' && snoozed === null,
          snoozedUntil: snoozed,
          createdAt: shownAt,
          chat: chat.id,
          actions: ended === null ? [] : [...chatActions],
        })
      }
    for (const request of requests.value) {
      const snoozed =
        request.snoozedUntil !== null && Date.parse(request.snoozedUntil) > at.getTime() ? request.snoozedUntil : null
      items.push({
        id: request.id,
        source: 'brain',
        kind: request.kind,
        title: request.title.slice(0, maxInboxTitle),
        project: request.project,
        tags: [...request.tags],
        needsYou: snoozed === null,
        snoozedUntil: snoozed,
        createdAt: request.created,
        chat: null,
        actions: [],
      })
    }
    items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    // Save only when a mark of an ended turn went, so the file holds the marks of items there now.
    if (Object.keys(kept).length !== Object.keys(stored.value).length) {
      const saved = await marks.save(kept)
      if (!saved.ok) return saved
    }
    return ok({ items, chats, kept })
  }

  return {
    list: () =>
      serial(async () => {
        const built = await build()
        if (!built.ok) return built
        const { items } = built.value
        return ok({ items, counts: { needsYou: items.filter((i) => i.needsYou).length, total: items.length } })
      }),
    get: (id) =>
      serial(async (): Promise<Result<Detail | 'notFound', InboxError>> => {
        const built = await build()
        if (!built.ok) return built
        const item = built.value.items.find((i) => i.id === id)
        if (item === undefined) return ok('notFound')
        if (item.source === 'brain') {
          const body = await brain.body(id)
          if (!body.ok) return body
          if (body.value === null) return ok('notFound')
          return ok({ item, detail: { source: 'brain', body: body.value } })
        }
        const chat = built.value.chats.get(id)
        const shown =
          chat === undefined
            ? null
            : { chat: chat.chat, workspace: chat.workspace, title: chat.summary.title, model: chat.summary.model }
        return ok({ item, detail: { source: 'chat', chat: shown } })
      }),
    act: (id, change) =>
      serial(async (): Promise<Result<ActOutcome, InboxError>> => {
        const built = await build()
        if (!built.ok) return built
        const item = built.value.items.find((i) => i.id === id)
        if (item === undefined) return ok('notFound')
        if (item.actions.length === 0) return ok('readOnly')
        const mark: Mark =
          change.action === 'snooze'
            ? { state: 'snoozed', until: change.until }
            : { state: change.action === 'dismiss' ? 'dismissed' : 'done' }
        const saved = await marks.save({ ...built.value.kept, [id]: mark })
        return saved.ok ? ok('done') : err(saved.error)
      }),
  }
}
