// The fake adapter of the AgentPort: fixed workspaces and chats, or a fixed
// error. API tests and web's mock-api source use it; the contract suite in
// agentPortContract.ts keeps it true to the herdr adapter.
import { ChatId, type ChatStatus, type MachineId, type WorkspaceSummary, WorkspaceId } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import type { AgentEvent, AgentPort, AgentPortError } from '../services/agentPort.ts'

/** The fake's default data: two workspaces of `machine`, one with a chat that needs the owner. */
export function fakeWorkspaces(machine: MachineId): WorkspaceSummary[] {
  const chat = (local: string) => ChatId.parse(`${machine}/${local}`)
  return [
    {
      id: WorkspaceId.parse(`${machine}/omni-brain`),
      label: 'omni-brain',
      chats: [
        {
          id: chat('bridge-themes'),
          kind: 'claude',
          title: 'bridge themes',
          model: 'claude-opus-5-5',
          contextUsed: 0.42,
          status: 'working',
          parent: null,
        },
        {
          id: chat('drift-check'),
          kind: 'codex',
          title: 'drift check',
          model: 'gpt-5.5',
          contextUsed: 0.23,
          status: 'needsYou',
          parent: null,
        },
      ],
    },
    { id: WorkspaceId.parse(`${machine}/omni`), label: 'omni', chats: [] },
  ]
}

export type FakeAgents = AgentPort & {
  /** How many times a caller read the workspaces. */
  readonly reads: () => number
  /** How many subscriptions are open now. */
  readonly subscriptions: () => number
  /** Gives a chat a new status, as an agent would, and tells each subscription. */
  readonly setStatus: (chat: ChatId, status: ChatStatus) => void
  /** Tells each subscription that the list changed. */
  readonly changeList: () => void
  /** Ends each subscription with `error`, as a host that stops answering. */
  readonly endAll: (error: AgentPortError) => void
}

type Listener = { readonly onEvent: (event: AgentEvent) => void; readonly onEnd: (error: AgentPortError) => void }

/** A port that answers with `workspaces`, or always fails with `error`. */
export function createFakeAgents(
  machine: MachineId,
  answer: { readonly workspaces: WorkspaceSummary[] } | { readonly error: AgentPortError } = {
    workspaces: fakeWorkspaces(machine),
  },
): FakeAgents {
  let reads = 0
  const data = 'error' in answer ? undefined : structuredClone(answer.workspaces)
  const listeners = new Set<Listener>()
  const tell = (event: AgentEvent) => {
    for (const listener of [...listeners]) listener.onEvent(event)
  }
  return {
    machine,
    reads: () => reads,
    subscriptions: () => listeners.size,
    listWorkspaces() {
      reads += 1
      return Promise.resolve('error' in answer ? err(answer.error) : ok(structuredClone(data ?? [])))
    },
    subscribe(onEvent, onEnd) {
      const listener = { onEvent, onEnd }
      if ('error' in answer) {
        queueMicrotask(() => {
          onEnd(answer.error)
        })
        return { ready: Promise.resolve(), close: () => undefined }
      }
      listeners.add(listener)
      return {
        ready: Promise.resolve(),
        close: () => {
          listeners.delete(listener)
        },
      }
    },
    setStatus(chat, status) {
      for (const workspace of data ?? []) for (const c of workspace.chats) if (c.id === chat) c.status = status
      tell({ type: 'chatStatus', chat, status })
    },
    changeList() {
      tell({ type: 'workspacesChanged' })
    },
    endAll(error) {
      const ended = [...listeners]
      listeners.clear()
      for (const listener of ended) listener.onEnd(error)
    },
  }
}
