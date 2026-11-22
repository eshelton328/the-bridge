// The live events service: one AgentPort subscription for all the clients of
// GET /api/events (d-112). The first client opens it, the last one to go
// closes it, so with no client open the server reads nothing. It numbers
// the events of its source from 0 up. When the port stops answering it
// ends every client's stream; each browser connects again after its retry
// time, and the first one opens a new subscription. The Inbox changes with
// each chat status, each owner mark and each write in the brain's inbox
// folders, which it watches only while a client is open (R20).
import { type ChatId, EventSource, type LiveEvent } from '@bridge/contract'
import type { AgentEvent, AgentPort, AgentPortError, AgentSubscription } from './agentPort.ts'

type LiveClient = {
  /** Sends one event to the client. */
  readonly send: (event: LiveEvent) => void
  /** Ends the client's stream: the port stopped answering. */
  readonly end: (error: AgentPortError) => void
}

/** Watches the brain's inbox folders: `onChange` after each change, until the result is called. */
export type InboxWatch = (onChange: () => void) => () => void

export type LiveEvents = {
  /** Adds a client; the result removes it. */
  connect(client: LiveClient): () => void
  /** How many clients are connected now. */
  clients(): number
  /** Tells each client that the Inbox changed, as after an owner's mark. */
  readonly inboxChanged: () => void
}

export function createLiveEvents(agents: AgentPort, watchInbox?: InboxWatch): LiveEvents {
  const source = EventSource.parse(`${agents.machine}/agents`)
  const clients = new Set<LiveClient>()
  let seq = 0
  let subscription: AgentSubscription | undefined
  let unwatch: (() => void) | undefined

  const envelope = (event: AgentEvent): LiveEvent => {
    const base = { source, seq: seq++ }
    switch (event.type) {
      case 'chatStatus':
        return { ...base, type: 'chat.status', data: { chat: event.chat satisfies ChatId, status: event.status } }
      case 'layoutChanged':
        return { ...base, type: 'layout.changed', data: { workspace: event.workspace } }
      case 'workspacesChanged':
        return { ...base, type: 'workspaces.changed', data: {} }
    }
  }

  const send = (live: LiveEvent) => {
    for (const client of [...clients]) client.send(live)
  }
  const inboxChanged = () => {
    if (clients.size > 0) send({ source, seq: seq++, type: 'inbox.changed', data: {} })
  }
  const broadcast = (event: AgentEvent) => {
    send(envelope(event))
    // A status change adds or removes the chat's Inbox item.
    if (event.type === 'chatStatus') inboxChanged()
  }
  const stopWatch = () => {
    unwatch?.()
    unwatch = undefined
  }

  const ended = (error: AgentPortError) => {
    subscription = undefined
    stopWatch()
    const gone = [...clients]
    clients.clear()
    for (const client of gone) client.end(error)
  }

  return {
    connect(client) {
      clients.add(client)
      subscription ??= agents.subscribe(broadcast, ended)
      unwatch ??= watchInbox?.(inboxChanged)
      return () => {
        if (!clients.delete(client) || clients.size > 0) return
        subscription?.close()
        subscription = undefined
        stopWatch()
      }
    },
    clients: () => clients.size,
    inboxChanged,
  }
}
