// The live events service: one AgentPort subscription for all the clients of
// GET /api/events (d-112). The first client opens it, the last one to go
// closes it, so with no client open the server reads nothing. It numbers
// the events of its source from 0 up. When the port stops answering it
// ends every client's stream; each browser connects again after its retry
// time, and the first one opens a new subscription. The Inbox changes with
// each chat status, each owner mark and each write in the brain's inbox
// folders, which it watches only while a client is open (R20). It sends
// projects.changed when a background gh run finds other open PRs (NCC-156),
// through a watch it also holds only while a client is open, and
// architecture.changed at the end of each diagram run the same way.
import { type ArchitectureScope, type ChatId, EventSource, type LiveEvent, type ProjectSlug } from '@bridge/contract'
import type { AgentEvent, AgentPort, AgentPortError, AgentSubscription } from './agentPort.ts'

type LiveClient = {
  /** Sends one event to the client. */
  readonly send: (event: LiveEvent) => void
  /** Ends the client's stream: the port stopped answering. */
  readonly end: (error: AgentPortError) => void
}

/** Watches the brain's inbox folders: `onChange` after each change, until the result is called. */
export type InboxWatch = (onChange: () => void) => () => void

/** Watches the diagram runs: `onChange` at the end of each, until the result is called. */
export type ArchitectureWatch = (
  onChange: (key: { readonly slug: ProjectSlug; readonly scope: ArchitectureScope }) => void,
) => () => void

export type LiveEvents = {
  /** Adds a client; the result removes it. */
  connect(client: LiveClient): () => void
  /** How many clients are connected now. */
  clients(): number
  /** Tells each client that the Inbox changed, as after an owner's mark. */
  readonly inboxChanged: () => void
}

export function createLiveEvents(
  agents: AgentPort,
  watchInbox?: InboxWatch,
  watchProjects?: InboxWatch,
  watchArchitecture?: ArchitectureWatch,
): LiveEvents {
  const source = EventSource.parse(`${agents.machine}/agents`)
  const clients = new Set<LiveClient>()
  let seq = 0
  let subscription: AgentSubscription | undefined
  let unwatch: (() => void) | undefined
  let unwatchProjects: (() => void) | undefined
  let unwatchArchitecture: (() => void) | undefined

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
    // A status change adds or removes the chat's Inbox item, and a list change too (a closed or cleared chat).
    if (event.type === 'chatStatus' || event.type === 'workspacesChanged') inboxChanged()
  }
  const stopWatch = () => {
    unwatch?.()
    unwatchProjects?.()
    unwatchArchitecture?.()
    unwatch = unwatchProjects = unwatchArchitecture = undefined
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
      unwatchProjects ??= watchProjects?.(() => {
        send({ source, seq: seq++, type: 'projects.changed', data: {} })
      })
      unwatchArchitecture ??= watchArchitecture?.(({ slug, scope }) => {
        send({ source, seq: seq++, type: 'architecture.changed', data: { slug, scope } })
      })
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
