// The fake adapter of the AgentPort: fixed workspaces and chats, or a fixed
// error. API tests and web's mock-api source use it; the contract suite in
// agentPortContract.ts keeps it true to the herdr adapter.
import {
  ChatId,
  type ChatStatus,
  type LayoutNode,
  type TranscriptEntry,
  type MachineId,
  PaneId,
  TabId,
  type WorkspaceLayout,
  type WorkspaceSummary,
  WorkspaceId,
} from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import type { AgentEvent, AgentPort, AgentPortError, TranscriptRead } from '../services/agentPort.ts'

/** What a chat of the fake got from the owner: a prompt's text, or a stop. */
type FakeInput = { readonly chat: ChatId } & ({ readonly text: string } | { readonly stop: true })

/** The fake's transcript of its working chat "bridge themes": a prompt, a tool call that runs and a reply. */
export function fakeTranscript(): TranscriptRead {
  return {
    entries: [
      { type: 'user', id: 'u1', text: 'Make the dark theme follow the system setting.', cut: false },
      { type: 'tool', id: 't1', name: 'Read', target: 'web/src/theme.ts', running: false },
      { type: 'assistant', id: 'a1', text: 'The theme now reads `prefers-color-scheme`.', cut: false },
      { type: 'tool', id: 't2', name: 'Bash', target: 'pnpm', running: true },
    ],
    earlier: false,
  }
}

/** The fake's default data: two workspaces of `machine`, one with a chat that needs the owner, one with a shell. */
export function fakeWorkspaces(machine: MachineId): WorkspaceSummary[] {
  const chat = (local: string) => ChatId.parse(`${machine}/${local}`)
  const pane = (local: string) => PaneId.parse(`${machine}/pane-${local}`)
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
          modelId: 'opus',
          effort: 'high',
          contextUsed: 0.42,
          status: 'working',
          parent: null,
          pane: pane('bridge-themes'),
        },
        {
          id: chat('drift-check'),
          kind: 'codex',
          title: 'drift check',
          model: 'gpt-5.5',
          modelId: null,
          effort: null,
          contextUsed: 0.23,
          status: 'needsYou',
          parent: null,
          pane: pane('drift-check'),
        },
      ],
    },
    {
      id: WorkspaceId.parse(`${machine}/omni`),
      label: 'omni',
      chats: [
        {
          id: chat('brain-git'),
          kind: 'shell',
          title: 'brain git',
          model: 'zsh',
          modelId: null,
          effort: null,
          contextUsed: null,
          status: 'idle',
          parent: null,
          pane: pane('brain-git'),
        },
      ],
    },
  ]
}

export type FakeAgents = AgentPort & {
  /** How many times a caller read the workspaces. */
  readonly reads: () => number
  /** How many transcript watches are open now. */
  readonly watchers: () => number
  /** Adds an entry to a chat's transcript, or replaces the entry with its ID, and tells each watch of that chat. */
  readonly changeTranscript: (chat: ChatId, entry: TranscriptEntry) => void
  /** The chats whose transcript a caller read, in order. */
  readonly transcriptReads: () => ChatId[]
  /** How many subscriptions are open now. */
  readonly subscriptions: () => number
  /** Gives a chat a new status, as an agent would, and tells each subscription. */
  readonly setStatus: (chat: ChatId, status: ChatStatus) => void
  /** Tells each subscription that the layout of `workspace` changed. */
  readonly changeLayout: (workspace: WorkspaceId) => void
  /** Tells each subscription that the list changed. */
  readonly changeList: () => void
  /** Gives a chat a new session, as /clear does: the chat takes the ID `next`, and each subscription is told. */
  readonly renewSession: (chat: ChatId, next: ChatId) => void
  /** Ends each subscription with `error`, as a host that stops answering. */
  readonly endAll: (error: AgentPortError) => void
  /** Each prompt and stop that a chat got, in order. */
  readonly inputs: () => FakeInput[]
  /** Puts `text` in a chat's input box, as the owner typing in its terminal; '' empties the box. */
  readonly typeInput: (chat: ChatId, text: string) => void
  /**
   * The chat's next prompt stays in its box, as a lost Enter leaves it; the fake then answers as the port does. The
   * fake keeps a box for a Codex chat as for a Claude chat, so the contract suite's chat (a Codex chat here) can hold
   * text; the herdr adapter clears only a Claude chat's box (`noCommands`, `herdrAgents.test.ts`).
   */
  readonly dropNextEnter: (chat: ChatId) => void
}

/** The fake's layout of a workspace: one tab with its chats side by side, the first focused; null with no chat. */
function layoutOf(workspace: WorkspaceSummary): WorkspaceLayout | null {
  const [first, ...rest] = workspace.chats
  if (first === undefined) return null
  // Each split gives its first pane an equal share of what is left, so n panes get 1/n each.
  const root = (at: number): LayoutNode => {
    const chat = workspace.chats[at] ?? first
    return at === workspace.chats.length - 1
      ? { kind: 'pane', chat: chat.id }
      : {
          kind: 'split',
          direction: 'row',
          ratio: 1 / (workspace.chats.length - at),
          first: { kind: 'pane', chat: chat.id },
          second: root(at + 1),
        }
  }
  return {
    workspace: workspace.id,
    tabs: [
      {
        id: TabId.parse(`${workspace.id}:t1`),
        label: '1',
        active: true,
        root: rest.length === 0 ? { kind: 'pane', chat: first.id } : root(0),
        focusedChat: first.id,
        chats: structuredClone(workspace.chats),
      },
    ],
  }
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
  const transcriptReads: ChatId[] = []
  const transcripts = new Map<ChatId, { entries: TranscriptEntry[]; earlier: boolean }>()
  const watchers = new Set<{ readonly chat: ChatId; readonly onChange: () => void }>()
  /** The fake's transcript of `chat`, made the first time it is asked for; undefined for no such chat. */
  const transcriptOf = (chat: ChatId) => {
    const found = (data ?? []).flatMap((w) => w.chats).find((c) => c.id === chat)
    if (found === undefined) return undefined
    const made =
      transcripts.get(chat) ?? (found.title === 'bridge themes' ? fakeTranscript() : { entries: [], earlier: false })
    const copy = { entries: [...made.entries], earlier: made.earlier }
    if (!transcripts.has(chat)) transcripts.set(chat, copy)
    return transcripts.get(chat)
  }
  const data = 'error' in answer ? undefined : structuredClone(answer.workspaces)
  const listeners = new Set<Listener>()
  const inputs: FakeInput[] = []
  /** The text in each chat's input box; the fake's stop puts no prompt back, as the real port clears it. */
  const drafts = new Map<ChatId, string>()
  const dropEnter = new Set<ChatId>()
  const chatOf = (chat: ChatId) => (data ?? []).flatMap((w) => w.chats).find((c) => c.id === chat)
  const tell = (event: AgentEvent) => {
    for (const listener of [...listeners]) listener.onEvent(event)
  }
  return {
    machine,
    reads: () => reads,
    transcriptReads: () => [...transcriptReads],
    subscriptions: () => listeners.size,
    listWorkspaces() {
      reads += 1
      return Promise.resolve('error' in answer ? err(answer.error) : ok(structuredClone(data ?? [])))
    },
    readTranscript(chat) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      transcriptReads.push(chat)
      const found = transcriptOf(chat)
      return Promise.resolve(ok(found === undefined ? null : structuredClone(found)))
    },
    watchTranscript(chat, onChange, onEnd) {
      if ('error' in answer) {
        queueMicrotask(() => {
          onEnd(answer.error)
        })
        return { ready: Promise.resolve(), close: () => undefined }
      }
      const watch = { chat, onChange }
      watchers.add(watch)
      return {
        ready: Promise.resolve(),
        close: () => {
          watchers.delete(watch)
        },
      }
    },
    watchers: () => watchers.size,
    changeTranscript(chat, entry) {
      const found = transcriptOf(chat)
      if (found === undefined) throw new Error(`the fake has no chat ${chat}`)
      const at = found.entries.findIndex((e) => e.id === entry.id)
      if (at === -1) found.entries.push(entry)
      else found.entries[at] = entry
      for (const w of [...watchers]) if (w.chat === chat) w.onChange()
    },
    readLayout(workspace) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = (data ?? []).find((w) => w.id === workspace)
      return Promise.resolve(ok(found === undefined ? null : layoutOf(found)))
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
      if (status === 'idle') tell({ type: 'workspacesChanged' })
      for (const w of [...watchers]) if (w.chat === chat) w.onChange()
    },
    changeLayout(workspace) {
      tell({ type: 'layoutChanged', workspace })
    },
    changeList() {
      tell({ type: 'workspacesChanged' })
    },
    renewSession(chat, next) {
      const found = chatOf(chat)
      if (found === undefined) throw new Error(`the fake has no chat ${chat}`)
      found.id = next
      transcripts.delete(chat)
      tell({ type: 'workspacesChanged' })
    },
    inputs: () => [...inputs],
    typeInput: (chat, text) => {
      drafts.set(chat, text)
    },
    sendPrompt(chat, text) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = chatOf(chat)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      if (found.kind === 'shell') return Promise.resolve(ok('shell'))
      if (found.status === 'needsYou') return Promise.resolve(ok('needsYou'))
      if ((drafts.get(chat) ?? '') !== '') return Promise.resolve(ok('inputNotEmpty'))
      // The port removes a prompt that the chat did not take, so the box is empty again.
      if (dropEnter.delete(chat)) return Promise.resolve(ok('notSubmitted'))
      inputs.push({ chat, text })
      return Promise.resolve(ok('sent'))
    },
    dropNextEnter: (chat) => {
      dropEnter.add(chat)
    },
    clearInputBox(chat) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = chatOf(chat)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      if (found.kind === 'shell') return Promise.resolve(ok('shell'))
      if (found.status === 'needsYou') return Promise.resolve(ok('needsYou'))
      drafts.delete(chat)
      return Promise.resolve(ok('cleared'))
    },
    cancel(chat) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = chatOf(chat)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      if (found.kind === 'shell') return Promise.resolve(ok('shell'))
      if (found.status !== 'working') return Promise.resolve(ok('notWorking'))
      inputs.push({ chat, stop: true })
      return Promise.resolve(ok('sent'))
    },
    endAll(error) {
      const ended = [...listeners]
      listeners.clear()
      for (const listener of ended) listener.onEnd(error)
    },
  }
}
