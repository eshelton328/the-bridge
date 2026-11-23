// Sends a Web Push to the owner (d-118) when a chat starts to wait for
// them (needsYou) or ends its turn (working, then done or idle). It holds one
// subscription to the agents while at least one push subscription is
// stored, so the owner hears of a chat with no page open; with none
// stored, it holds none. No push goes while a page of the owner was
// visible in the last 30 s. A push names the chat, its workspace and the
// event; to a subscription that wants a preview (the default) it also holds
// one line of what the chat did or waits on (pushPreview.ts). The chat's
// transcript is read only when a stored subscription wants that line, and
// the line never goes into a log.
import {
  type ChatId,
  type ChatStatus,
  LegacyPushPayload,
  maxPushName,
  type PushEvent,
  PushPayload,
} from '@bridge/contract'
import type { Logger } from '../logger.ts'
import type { AgentPort, AgentSubscription } from './agentPort.ts'
import type { PushSeen, PushSender, PushStore } from './push.ts'
import { previewOf } from './pushPreview.ts'

export type PushNotifier = {
  /** Reads the subscriptions again: opens the watch when there are some, closes it when there are none. */
  refresh(): Promise<void>
  close(): void
}

type Deps = {
  readonly agents: AgentPort
  readonly store: PushStore
  readonly sender: PushSender
  readonly seen: PushSeen
  readonly log: Logger
  /** The wait before the watch opens again after the agents stopped answering. */
  readonly retryMs?: number
}

/**
 * The event of a status change: needsYou when a chat starts to wait, done when a working chat ends its turn. herdr
 * gives `idle`, not `done`, for a turn that ends in the pane its own screen shows, so that change is `done` too.
 */
function eventOf(before: ChatStatus | undefined, now: ChatStatus): PushEvent | null {
  if (now === 'needsYou' && before !== 'needsYou') return 'needsYou'
  if ((now === 'done' || now === 'idle') && before === 'working') return 'done'
  return null
}

export function createPushNotifier({ agents, store, sender, seen, log, retryMs = 5_000 }: Deps): PushNotifier {
  const last = new Map<ChatId, ChatStatus>()
  let watch: AgentSubscription | undefined
  let opening: Promise<void> | undefined
  let retry: ReturnType<typeof setTimeout> | undefined
  let closed = false

  const notify = async (chat: ChatId, event: PushEvent) => {
    if (seen.visible()) return
    const [keys, subscriptions, list] = await Promise.all([
      store.keys(),
      store.subscriptions(),
      agents.listWorkspaces(),
    ])
    if (!keys.ok || !subscriptions.ok) {
      log.error('push store failed', {
        code: keys.ok ? (subscriptions.ok ? '' : subscriptions.error.code) : keys.error.code,
      })
      return
    }
    const workspace = list.ok ? list.value.find((w) => w.chats.some((c) => c.id === chat)) : undefined
    const title = workspace?.chats.find((c) => c.id === chat)?.title ?? ''
    const plain = PushPayload.parse({
      chat,
      name: Array.from(title).slice(0, maxPushName).join(''),
      workspace: Array.from(workspace?.label ?? '')
        .slice(0, maxPushName)
        .join(''),
      event,
      body: null,
    })
    // A subscription with no `preview` key was saved by a page from before the choice, whose sw.js (version 2) takes
    // only the old payload; the page saves it again at its next start, with the key.
    const legacy = LegacyPushPayload.parse({ chat, name: plain.name, event })
    let body: string | null = null
    if (subscriptions.value.some((s) => s.preview === true)) {
      const read = await agents.readTranscript(chat)
      body = read.ok && read.value !== null ? previewOf(event, read.value.entries) : null
    }
    const rich = body === null ? plain : PushPayload.parse({ ...plain, body })
    const gone = await Promise.all(
      subscriptions.value.map(async (subscription) => {
        const payload = subscription.preview === undefined ? legacy : subscription.preview ? rich : plain
        const sent = await sender.send(subscription, payload, keys.value)
        if (!sent.ok) log.warn('push failed', { event, code: sent.error.code })
        if (!sent.ok || sent.value !== 'gone') return false
        await store.remove(subscription.endpoint)
        return true
      }),
    )
    // With the last subscription gone, the watch of the agents closes.
    if (gone.includes(true)) await refresh()
  }

  // The status of each chat that the list shows and no event told yet, so its first change is known
  // as a change (a chat that a list change adds while it works ends with done). A chat that left the
  // list is forgotten.
  const learn = async () => {
    const list = await agents.listWorkspaces()
    if (!list.ok) return
    const chats = list.value.flatMap((w) => w.chats)
    const listed = new Set(chats.map((c) => c.id))
    for (const id of last.keys()) if (!listed.has(id)) last.delete(id)
    for (const c of chats) if (!last.has(c.id)) last.set(c.id, c.status)
  }

  const open = async () => {
    await learn()
    // A remove during the list read leaves no subscription; then no watch opens.
    const still = await store.subscriptions()
    if (closed || !still.ok || still.value.length === 0) return
    watch = agents.subscribe(
      (event) => {
        if (event.type === 'workspacesChanged') {
          void learn()
          return
        }
        if (event.type !== 'chatStatus') return
        const before = last.get(event.chat)
        last.set(event.chat, event.status)
        const push = eventOf(before, event.status)
        if (push !== null) void notify(event.chat, push)
      },
      (error) => {
        watch = undefined
        log.warn('push watch ended', { reason: error.reason })
        if (!closed) retry = setTimeout(() => void refresh(), retryMs)
      },
    )
  }

  const refresh = async () => {
    const subscriptions = await store.subscriptions()
    const wanted = subscriptions.ok && subscriptions.value.length > 0 && !closed
    if (wanted && watch === undefined) {
      opening ??= open().finally(() => {
        opening = undefined
      })
      await opening
    }
    if (!wanted) {
      await opening
      watch?.close()
      watch = undefined
    }
  }

  return {
    refresh,
    close: () => {
      closed = true
      clearTimeout(retry)
      watch?.close()
      watch = undefined
    },
  }
}
