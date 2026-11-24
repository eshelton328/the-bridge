// The fake adapter of the AgentPort: fixed workspaces and chats, or a fixed
// error. API tests and web's mock-api source use it; the contract suite in
// agentPortContract.ts keeps it true to the herdr adapter.
import {
  type SplitDirection,
  type SplitSide,
  type StartChatRequest,
  type ChatSummary,
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
  type AnswerDialogRequest,
  type PaneDialog,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { builtinCommands } from './claudeSkills.ts'
import type {
  ChatCommand,
  AgentEvent,
  AgentPort,
  AgentPortError,
  SideChunk,
  TranscriptRead,
  DialogRead,
} from '../services/agentPort.ts'

/** What a chat of the fake got from the owner: a prompt's text, or a stop. */
type FakeInput = { readonly chat: ChatId } & (
  | { readonly text: string }
  | { readonly stop: true }
  | { readonly command: ChatCommand }
)

/** The fake's transcript of its working chat "bridge themes": a prompt, a tool call that runs and a reply. */
export function fakeTranscript(): TranscriptRead {
  return {
    entries: [
      { type: 'user', id: 'u1', text: 'Make the dark theme follow the system setting.', cut: false },
      {
        type: 'tool',
        id: 't1',
        name: 'Read',
        target: 'web/src/theme.ts',
        running: false,
        kind: 'read',
        title: 'Read a file',
        label: '',
      },
      { type: 'assistant', id: 'a1', text: 'The theme now reads `prefers-color-scheme`.', cut: false },
      {
        type: 'tool',
        id: 't2',
        name: 'Bash',
        target: 'pnpm',
        running: true,
        kind: 'shell',
        title: 'Ran a command',
        label: 'Run the web tests',
      },
    ],
    earlier: false,
  }
}

/** When each fake Claude chat's last turn ended, until `setTurnEnd` changes it. */
export const fakeTurnEnd = '2026-11-21T10:00:00.000Z'

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
  /** Maps a project to a workspace, as a workspace with a pane in that project's folder. */
  readonly setProjectWorkspace: (project: string, workspace: WorkspaceId) => void
  /** The chats that a caller forked, in order. */
  readonly forks: () => ChatId[]
  /** Each side question that a chat got, in order. */
  readonly sideQuestions: () => { readonly chat: ChatId; readonly question: string }[]
  /**
   * The pieces of a chat's next side answers, in order (else one piece "A side answer." and `done`); `hang` waits
   * until the question is stopped.
   */
  readonly setSideAnswer: (chat: ChatId, pieces: readonly (SideChunk | 'hang')[]) => void
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
  /** Sets when a Claude chat's last turn ended; each Claude chat starts with `fakeTurnEnd`. */
  readonly setTurnEnd: (chat: ChatId, at: string) => void
  /** Tells each subscription that the layout of `workspace` changed. */
  readonly changeLayout: (workspace: WorkspaceId) => void
  /** Tells each subscription that the list changed. */
  readonly changeList: () => void
  /** Gives a chat a new session, as /clear does: the chat takes the ID `next`, and each subscription is told. */
  readonly renewSession: (chat: ChatId, next: ChatId) => void
  /** Ends each subscription with `error`, as a host that stops answering. */
  readonly endAll: (error: AgentPortError) => void
  /** Marks a workspace as one whose pane runs the server, which no close may end. */
  readonly holdServer: (workspace: WorkspaceId) => void
  /** Shows `dialog` on a chat's screen (R69), or none; the port reads it only while the chat needs the owner. */
  readonly showDialog: (chat: ChatId, dialog: PaneDialog | null) => void
  /** Each dialog answer that reached a chat, in order. */
  readonly dialogAnswers: () => ({ readonly chat: ChatId } & AnswerDialogRequest)[]
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

/** The fake's split tree of one tab, by pane: a pane keeps its place when its chat gets a new ID (`/clear`). */
type PaneTree =
  | { readonly kind: 'pane'; readonly pane: PaneId }
  | {
      readonly kind: 'split'
      readonly direction: SplitDirection
      readonly ratio: number
      readonly first: PaneTree
      readonly second: PaneTree
    }

/** Panes side by side in list order; each split gives its first pane an equal share of what is left. */
function chainOf(panes: readonly PaneId[]): PaneTree | undefined {
  const [first, ...rest] = panes
  if (first === undefined) return undefined
  const second = chainOf(rest)
  return second === undefined
    ? { kind: 'pane', pane: first }
    : { kind: 'split', direction: 'row', ratio: 1 / panes.length, first: { kind: 'pane', pane: first }, second }
}

/** The tree without the panes that `keep` lacks; a split with one part left becomes that part. */
function pruned(tree: PaneTree, keep: ReadonlySet<PaneId>): PaneTree | undefined {
  if (tree.kind === 'pane') return keep.has(tree.pane) ? tree : undefined
  const first = pruned(tree.first, keep)
  const second = pruned(tree.second, keep)
  if (first === undefined || second === undefined) return first ?? second
  return { ...tree, first, second }
}

/** The tree with each pane leaf replaced by what `change` gives for it. */
function mapPanes(tree: PaneTree, change: (pane: PaneId) => PaneTree): PaneTree {
  if (tree.kind === 'pane') return change(tree.pane)
  return { ...tree, first: mapPanes(tree.first, change), second: mapPanes(tree.second, change) }
}

/** The tree with the split at `path` given `ratio`; undefined when no split is there. */
function withRatio(tree: PaneTree, path: readonly SplitSide[], ratio: number): PaneTree | undefined {
  if (tree.kind === 'pane') return undefined
  const [side, ...rest] = path
  if (side === undefined) return { ...tree, ratio }
  const part = withRatio(tree[side], rest, ratio)
  return part === undefined ? undefined : { ...tree, [side]: part }
}

function panesOf(tree: PaneTree): PaneId[] {
  return tree.kind === 'pane' ? [tree.pane] : [...panesOf(tree.first), ...panesOf(tree.second)]
}

/**
 * The fake's layout of a workspace: one tab with the tree of its chats' panes (side by side in list order until a
 * write changes it), with `focused` (else the first) focused; null with no chat.
 */
function layoutOf(
  workspace: WorkspaceSummary,
  tree: PaneTree | undefined,
  focused?: ChatId,
  zoomed = false,
): WorkspaceLayout | null {
  const byPane = new Map(workspace.chats.map((c) => [c.pane, c]))
  const kept = tree === undefined ? undefined : pruned(tree, new Set(byPane.keys()))
  // A tree that lacks a listed chat's pane is not this list's: the chain stands in for it.
  const root = kept !== undefined && panesOf(kept).length === byPane.size ? kept : chainOf([...byPane.keys()])
  if (root === undefined) return null
  const node = (t: PaneTree): LayoutNode => {
    if (t.kind === 'split') return { ...t, first: node(t.first), second: node(t.second) }
    const chat = byPane.get(t.pane)
    if (chat === undefined) throw new Error('the fake tree holds a pane with no chat')
    return { kind: 'pane', chat: chat.id }
  }
  const chats = panesOf(root).flatMap((p) => byPane.get(p) ?? [])
  const first = chats[0]
  if (first === undefined) return null
  return {
    workspace: workspace.id,
    tabs: [
      {
        id: TabId.parse(`${workspace.id}:t1`),
        label: '1',
        active: true,
        root: node(root),
        focusedChat: chats.some((c) => c.id === focused) && focused !== undefined ? focused : first.id,
        zoomed,
        chats: structuredClone(chats),
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
  const turnEnds = new Map<ChatId, string>()
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
  const dialogs = new Map<ChatId, PaneDialog>()
  const answered: ({ readonly chat: ChatId } & AnswerDialogRequest)[] = []
  /** The dialog a chat shows while it needs the owner, as the port reads it. */
  const dialogOf = (chat: ChatId): Result<DialogRead, AgentPortError> => {
    if ('error' in answer) return err(answer.error)
    const found = chatOf(chat)
    if (found?.kind !== 'claude')
      return ok(found === undefined ? 'notFound' : found.kind === 'shell' ? 'shell' : 'noCommands')
    return ok(found.status === 'needsYou' ? (dialogs.get(chat) ?? null) : null)
  }
  const chatOf = (chat: ChatId) => (data ?? []).flatMap((w) => w.chats).find((c) => c.id === chat)
  /** The workspace that holds a chat; the fake has one tab in each workspace. */
  const workspaceOf = (chat: ChatId) => (data ?? []).find((w) => w.chats.some((c) => c.id === chat))
  /** The focused chat of each workspace whose focus a caller changed, and the workspaces that are zoomed. */
  /** How many workspaces `createWorkspace` made, for each new one's ID. */
  let made = 0
  const focus = new Map<WorkspaceId, ChatId>()
  const zooms = new Set<WorkspaceId>()
  const serverHeld = new Set<WorkspaceId>()
  /** The split tree of each workspace's tab, from its first layout write on. */
  const trees = new Map<WorkspaceId, PaneTree>()
  const treeOf = (workspace: WorkspaceSummary) => trees.get(workspace.id) ?? chainOf(workspace.chats.map((c) => c.pane))
  let splits = 0
  const tell = (event: AgentEvent) => {
    for (const listener of [...listeners]) listener.onEvent(event)
  }
  /** Gives a chat a new ID, as a new session does, and tells each subscription. */
  const renew = (chat: ChatId, next: ChatId) => {
    const found = chatOf(chat)
    if (found === undefined) throw new Error(`the fake has no chat ${chat}`)
    found.id = next
    transcripts.delete(chat)
    tell({ type: 'workspacesChanged' })
  }
  /** Splits the pane of `chat` in two, as herdr does, with the chat that `make` gives in the new pane. */
  const addPane = (
    chat: ChatId,
    direction: SplitDirection,
    make: (id: ChatId, pane: PaneId) => ChatSummary,
  ): ChatSummary | undefined => {
    const workspace = workspaceOf(chat)
    const target = chatOf(chat)
    const tree = workspace === undefined ? undefined : treeOf(workspace)
    if (workspace === undefined || target === undefined || tree === undefined) return undefined
    splits += 1
    const local = `split-${String(splits)}`
    const made = make(ChatId.parse(`${machine}/${local}`), PaneId.parse(`${machine}/pane-${local}`))
    // As herdr does: the chat's pane becomes a split of it and the new pane, half each.
    trees.set(
      workspace.id,
      mapPanes(tree, (pane) =>
        pane === target.pane
          ? {
              kind: 'split',
              direction,
              ratio: 0.5,
              first: { kind: 'pane', pane },
              second: { kind: 'pane', pane: made.pane },
            }
          : { kind: 'pane', pane },
      ),
    )
    workspace.chats.splice(workspace.chats.findIndex((c) => c.id === chat) + 1, 0, made)
    tell({ type: 'workspacesChanged' })
    tell({ type: 'layoutChanged', workspace: workspace.id })
    return made
  }
  const start = ({ name, model, place }: Omit<StartChatRequest, 'createId'>): ReturnType<AgentPort['startChat']> => {
    if ('error' in answer) return Promise.resolve(err(answer.error))
    const chatName = name ?? `chat-${String(splits + 1)}`
    if ((data ?? []).some((w) => w.chats.some((c) => c.title === chatName))) return Promise.resolve(ok('nameTaken'))
    const make = (id: ChatId, pane: PaneId): ChatSummary => ({
      id,
      kind: 'claude',
      title: chatName,
      model: `claude-${model ?? 'opus'}`,
      modelId: model ?? 'opus',
      effort: null,
      contextUsed: null,
      status: 'idle',
      parent: null,
      pane,
    })
    // The fake has one tab in each workspace, so a start in a new tab splits that tab beside its first chat.
    const beside =
      place.in === 'split' ? place.beside : (data ?? []).find((w) => w.id === place.workspace)?.chats[0]?.id
    const started =
      beside === undefined ? undefined : addPane(beside, place.in === 'split' ? place.direction : 'row', make)
    return Promise.resolve(
      ok(started === undefined ? 'notFound' : { pane: started.pane, chat: started.id, state: 'ready' }),
    )
  }
  const forks: ChatId[] = []
  const sideQuestions: { readonly chat: ChatId; readonly question: string }[] = []
  const sidePieces = new Map<ChatId, readonly (SideChunk | 'hang')[]>()
  const projects = new Map<string, WorkspaceId>()
  let clears = 0
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
    readTranscriptPage(chat, { limit, before }) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      transcriptReads.push(chat)
      const found = transcriptOf(chat)
      if (found === undefined) return Promise.resolve(ok(null))
      const end = before === undefined ? found.entries.length : found.entries.findIndex((e) => e.id === before)
      if (end === -1) return Promise.resolve(ok('entryNotFound'))
      const start = Math.max(0, end - limit)
      return Promise.resolve(
        ok({ entries: structuredClone(found.entries.slice(start, end)), earlier: start > 0 || found.earlier }),
      )
    },
    turnEnd(chat) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = (data ?? []).flatMap((w) => w.chats).find((c) => c.id === chat)
      return Promise.resolve(ok(found?.kind === 'claude' ? (turnEnds.get(chat) ?? fakeTurnEnd) : null))
    },
    setTurnEnd(chat, at) {
      turnEnds.set(chat, at)
    },
    readSkills(chat) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = (data ?? []).flatMap((w) => w.chats).find((c) => c.id === chat)
      if (found === undefined) return Promise.resolve(ok(null))
      // A Claude chat has the built-in commands and one skill of the owner's; a Codex chat and a shell have none.
      const writer = { name: 'writer', description: 'Use before writing any doc', source: 'user' } as const
      return Promise.resolve(ok(found.kind === 'claude' ? [...builtinCommands, writer] : []))
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
      return Promise.resolve(
        ok(found === undefined ? null : layoutOf(found, trees.get(found.id), focus.get(found.id), zooms.has(found.id))),
      )
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
    renewSession: renew,
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
    sendCommand(chat, command) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = chatOf(chat)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      if (found.kind === 'shell') return Promise.resolve(ok('shell'))
      if (found.kind === 'codex') return Promise.resolve(ok('noCommands'))
      if (found.status === 'needsYou') return Promise.resolve(ok('needsYou'))
      if (found.status !== 'idle' && found.status !== 'done') return Promise.resolve(ok('working'))
      if ((drafts.get(chat) ?? '') !== '') return Promise.resolve(ok('inputNotEmpty'))
      // As a prompt: the port takes back a command whose Enter the chat did not take.
      if (dropEnter.delete(chat)) return Promise.resolve(ok('notSubmitted'))
      inputs.push({ chat, command: structuredClone(command) })
      // /clear starts a new session, so the chat gets a new ID on the same pane.
      if (command.command === 'clear') {
        clears += 1
        renew(chat, ChatId.parse(`${chat}-c${String(clears)}`))
      }
      return Promise.resolve(ok('sent'))
    },
    setEffort(chat, effort) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = chatOf(chat)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      if (found.kind === 'shell') return Promise.resolve(ok('shell'))
      if (found.kind === 'codex') return Promise.resolve(ok('noCommands'))
      if (found.status === 'needsYou') return Promise.resolve(ok('needsYou'))
      if (found.status !== 'idle' && found.status !== 'done') return Promise.resolve(ok('working'))
      if ((drafts.get(chat) ?? '') !== '') return Promise.resolve(ok('inputNotEmpty'))
      found.effort = effort
      tell({ type: 'workspacesChanged' })
      return Promise.resolve(ok('set'))
    },
    restartModel(chat, model) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = chatOf(chat)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      if (found.kind === 'shell') return Promise.resolve(ok('shell'))
      if (found.kind === 'codex') return Promise.resolve(ok('noCommands'))
      if (found.status === 'needsYou') return Promise.resolve(ok('needsYou'))
      if (found.status !== 'idle' && found.status !== 'done') return Promise.resolve(ok('working'))
      if ((drafts.get(chat) ?? '') !== '') return Promise.resolve(ok('inputNotEmpty'))
      if (found.modelId === model) return Promise.resolve(ok('sameModel'))
      // The same session resumes, so the chat keeps its ID.
      found.modelId = model
      found.model = model
      tell({ type: 'workspacesChanged' })
      return Promise.resolve(ok({ state: 'ready' as const, chat }))
    },
    focusChat(chat) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const workspace = workspaceOf(chat)
      if (workspace === undefined) return Promise.resolve(ok('notFound'))
      focus.set(workspace.id, chat)
      tell({ type: 'layoutChanged', workspace: workspace.id })
      return Promise.resolve(ok('done'))
    },
    zoomChat(chat, zoomed) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const workspace = workspaceOf(chat)
      if (workspace === undefined) return Promise.resolve(ok('notFound'))
      if (workspace.chats.length === 1) return Promise.resolve(ok('singlePane'))
      if (zoomed) {
        zooms.add(workspace.id)
        focus.set(workspace.id, chat)
      } else zooms.delete(workspace.id)
      tell({ type: 'layoutChanged', workspace: workspace.id })
      return Promise.resolve(ok('done'))
    },
    moveChat(chat, tab) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const workspace = workspaceOf(chat)
      if (workspace === undefined) return Promise.resolve(ok('notFound'))
      // The fake's workspace has one tab, so the chat's own tab is the only tab it can name.
      return Promise.resolve(ok(tab === `${workspace.id}:t1` ? 'sameTab' : 'notFound'))
    },
    swapChats(chat, other) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const workspace = workspaceOf(chat)
      if (workspace === undefined || workspaceOf(other) === undefined) return Promise.resolve(ok('notFound'))
      if (chat === other) return Promise.resolve(ok('samePane'))
      if (workspaceOf(other) !== workspace) return Promise.resolve(ok('otherTab'))
      const at = workspace.chats.findIndex((c) => c.id === chat)
      const to = workspace.chats.findIndex((c) => c.id === other)
      const [one, two] = [workspace.chats[at], workspace.chats[to]]
      if (one === undefined || two === undefined) return Promise.resolve(ok('notFound'))
      const tree = treeOf(workspace)
      workspace.chats[at] = two
      workspace.chats[to] = one
      if (tree !== undefined)
        trees.set(
          workspace.id,
          mapPanes(tree, (pane) => ({
            kind: 'pane',
            pane: pane === one.pane ? two.pane : pane === two.pane ? one.pane : pane,
          })),
        )
      tell({ type: 'layoutChanged', workspace: workspace.id })
      return Promise.resolve(ok('done'))
    },
    createWorkspace(label) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      made += 1
      const local = `new-${String(made)}`
      const workspace: WorkspaceSummary = {
        id: WorkspaceId.parse(`${machine}/${local}`),
        label,
        chats: [
          {
            id: ChatId.parse(`${machine}/${local}-shell`),
            kind: 'shell',
            title: 'zsh',
            model: 'zsh',
            modelId: null,
            effort: null,
            contextUsed: null,
            status: 'idle',
            parent: null,
            pane: PaneId.parse(`${machine}/pane-${local}`),
          },
        ],
      }
      data?.push(workspace)
      tell({ type: 'workspacesChanged' })
      return Promise.resolve(ok(structuredClone(workspace)))
    },
    renameWorkspace(workspace, label) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = (data ?? []).find((w) => w.id === workspace)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      found.label = label
      tell({ type: 'workspacesChanged' })
      return Promise.resolve(ok('done'))
    },
    renameChat(chat, label) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = chatOf(chat)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      found.title = label
      tell({ type: 'workspacesChanged' })
      return Promise.resolve(ok('done'))
    },
    moveToWorkspace(chat, workspace) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const source = workspaceOf(chat)
      const target = (data ?? []).find((w) => w.id === workspace)
      const moved = source?.chats.find((c) => c.id === chat)
      if (source === undefined || target === undefined || moved === undefined) return Promise.resolve(ok('notFound'))
      if (source === target) return Promise.resolve(ok('sameWorkspace'))
      if (moved.status === 'needsYou') return Promise.resolve(ok('needsYou'))
      if (moved.kind !== 'shell' && moved.status !== 'idle' && moved.status !== 'done')
        return Promise.resolve(ok('working'))
      if (serverHeld.has(source.id)) return Promise.resolve(ok('holdsServer'))
      source.chats.splice(source.chats.indexOf(moved), 1)
      target.chats.push(moved)
      // As herdr does, a workspace whose last pane leaves closes.
      const sourceClosed = source.chats.length === 0
      if (sourceClosed) data?.splice(data.indexOf(source), 1)
      tell({ type: 'workspacesChanged' })
      return Promise.resolve(ok({ from: moved.pane, to: moved.pane, sourceClosed }))
    },
    closeWorkspace(workspace, count) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = (data ?? []).find((w) => w.id === workspace)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      if (found.chats.length !== count) return Promise.resolve(ok('panesChanged'))
      if (serverHeld.has(workspace)) return Promise.resolve(ok('holdsServer'))
      if (found.chats.some((c) => c.status === 'needsYou')) return Promise.resolve(ok('needsYou'))
      if (found.chats.some((c) => c.kind !== 'shell' && c.status !== 'idle' && c.status !== 'done'))
        return Promise.resolve(ok('working'))
      data?.splice(data.indexOf(found), 1)
      tell({ type: 'workspacesChanged' })
      return Promise.resolve(ok('done'))
    },
    holdServer(workspace) {
      serverHeld.add(workspace)
    },
    orderWorkspaces(order) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const listed = data ?? []
      const ids = listed.map((w) => w.id)
      if (order.length !== ids.length || new Set(order).size !== order.length || !ids.every((id) => order.includes(id)))
        return Promise.resolve(ok('stale'))
      listed.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
      tell({ type: 'workspacesChanged' })
      return Promise.resolve(ok('done'))
    },
    closeChat(chat) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const workspace = workspaceOf(chat)
      const found = chatOf(chat)
      if (workspace === undefined || found === undefined) return Promise.resolve(ok('notFound'))
      if (found.status === 'needsYou') return Promise.resolve(ok('needsYou'))
      if (found.kind !== 'shell' && found.status !== 'idle' && found.status !== 'done')
        return Promise.resolve(ok('working'))
      workspace.chats = workspace.chats.filter((c) => c.id !== chat)
      transcripts.delete(chat)
      if (focus.get(workspace.id) === chat) focus.delete(workspace.id)
      tell({ type: 'workspacesChanged' })
      tell({ type: 'layoutChanged', workspace: workspace.id })
      return Promise.resolve(ok('done'))
    },
    splitChat(chat, direction) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const shell = addPane(chat, direction, (id, pane) => ({
        id,
        kind: 'shell',
        title: 'zsh',
        model: 'zsh',
        modelId: null,
        effort: null,
        contextUsed: null,
        status: 'idle',
        parent: null,
        pane,
      }))
      return Promise.resolve(ok(shell === undefined ? 'notFound' : { chat: shell.id }))
    },
    startChat: (request) => start(request),
    projectWorkspaces() {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const listed = new Set((data ?? []).map((w) => w.id))
      return Promise.resolve(ok(new Map([...projects].filter(([, w]) => listed.has(w)))))
    },
    setProjectWorkspace: (project, workspace) => {
      projects.set(project, workspace)
    },
    forkChat(chat, { name, direction }) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = chatOf(chat)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      if (found.kind !== 'claude') return Promise.resolve(ok('noSession'))
      forks.push(chat)
      const stem = `${found.title.slice(0, 25)}-fork`
      const titles = new Set((data ?? []).flatMap((w) => w.chats.map((c) => c.title)))
      const free = [stem, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (n === stem ? stem : `${stem}-${String(n)}`))
      return start({
        kind: 'claude',
        name: name ?? free.find((n) => !titles.has(n)) ?? stem,
        place: { in: 'split', beside: chat, direction },
      })
    },
    forks: () => [...forks],
    sideQuestions: () => [...sideQuestions],
    setSideAnswer: (chat, pieces) => {
      sidePieces.set(chat, pieces)
    },
    askSide(chat, question, signal) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const found = chatOf(chat)
      if (found === undefined) return Promise.resolve(ok('notFound'))
      if (found.kind !== 'claude') return Promise.resolve(ok('noSession'))
      sideQuestions.push({ chat, question })
      const pieces = sidePieces.get(chat) ?? [{ text: 'A side answer.' }, { end: 'done' }]
      async function* run(): AsyncIterable<SideChunk> {
        for (const piece of pieces) {
          if (piece !== 'hang') {
            yield piece
            continue
          }
          await new Promise<void>((resolve) => {
            if (signal.aborted) resolve()
            else
              signal.addEventListener(
                'abort',
                () => {
                  resolve()
                },
                { once: true },
              )
          })
          return
        }
      }
      return Promise.resolve(ok(run()))
    },
    setSplitRatio(tab, path, ratio) {
      if ('error' in answer) return Promise.resolve(err(answer.error))
      const workspace = (data ?? []).find((w) => `${w.id}:t1` === tab)
      const tree = workspace === undefined ? undefined : treeOf(workspace)
      const changed = tree === undefined ? undefined : withRatio(tree, path, ratio)
      if (workspace === undefined || changed === undefined) return Promise.resolve(ok('notFound'))
      trees.set(workspace.id, changed)
      tell({ type: 'layoutChanged', workspace: workspace.id })
      return Promise.resolve(ok('done'))
    },
    dropNextEnter: (chat) => {
      dropEnter.add(chat)
    },
    showDialog: (chat, dialog) => {
      if (dialog === null) dialogs.delete(chat)
      else dialogs.set(chat, dialog)
    },
    dialogAnswers: () => [...answered],
    readDialog(chat) {
      return Promise.resolve(dialogOf(chat))
    },
    answerDialog(chat, { id, n }) {
      const found = dialogOf(chat)
      if (!found.ok) return Promise.resolve(found)
      if (typeof found.value === 'string') return Promise.resolve(ok(found.value))
      const dialog = found.value
      if (dialog?.id !== id || dialog.options?.some((o) => o.n === n) !== true)
        return Promise.resolve(ok('dialogChanged'))
      dialogs.delete(chat)
      answered.push({ chat, id, n })
      return Promise.resolve(ok('sent'))
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
