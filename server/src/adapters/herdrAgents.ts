// The herdr adapter of the AgentPort (d-110). It reads herdr's
// workspace.list, agent.list and pane.list, finds each Claude chat's session
// file from its agent_session, and reads the model and the context share
// from it. Every pane that
// is not a Claude or Codex chat is a shell chat; its model is the program
// it runs, from pane.process_info: process names only, never an argument
// or the terminal title, which can hold a token or a path. readLayout reads
// a workspace's tabs (tab.list) and each tab's split tree (layout.export),
// and names each pane by the chat ID the list gives it. It reads only when
// listWorkspaces or readLayout is called. subscribe holds one events.subscribe stream
// open: each chat's status, each workspace's layout changes, and the panes
// and workspaces that come and go;
// when one comes or goes it opens the stream again for the new panes and
// tells the app to read the list again. herdr's pane IDs stay here: a chat's ID is its
// agent session ID, or herdr's terminal ID when it has none or when another
// pane has resumed the same session, so each chat ID is on one chat only.
// A herdr ID that the contract's IDs cannot hold makes the reply badReply.
import { createHash, randomBytes } from 'node:crypto'
import { existsSync, type FSWatcher, watch } from 'node:fs'
import { realpath, stat } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import {
  ChatId,
  type ChatStatus,
  type ChatSummary,
  chatsOf,
  type KeyEffort,
  type LayoutNode,
  type ModelAlias,
  LocalIdPart,
  type MachineId,
  PaneId,
  type RestartModelResponse,
  SessionId,
  splitId,
  type StartChatRequest,
  type StartState,
  WorkspaceId,
  WorkspaceLayout,
  type WorkspaceSummary,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type { Logger } from '../logger.ts'
import type {
  AgentEvent,
  AgentPort,
  AgentPortError,
  ChatCommand,
  PaneWriteOutcome,
  PromptOutcome,
  SideRunner,
} from '../services/agentPort.ts'
import { type SocketFailure, type HerdrStream, herdrRequest, herdrSubscribe } from './herdrSocket.ts'
import {
  boxKeys,
  effortKeys,
  effortOf,
  type InputBox,
  inputBoxOf,
  promptKey,
  switchModelDialogOf,
} from './claudeInput.ts'
import { readCodeMode, sideRecord } from './claudeSide.ts'
import { readClaudeTranscript, readClaudeTranscriptPage } from './claudeTranscript.ts'
import { readClaudeSkills } from './claudeSkills.ts'
import { readCompactWindows } from './claudeSettings.ts'
import { claudeProjectFolder, modelAliasOf, readClaudeSession } from './sessionFile.ts'
import { launchArgsOf, restartArgs } from './claudeArgs.ts'

const HerdrStatus = z.enum(['idle', 'working', 'blocked', 'done', 'unknown'])

const WorkspaceList = z.object({
  workspaces: z.array(z.object({ workspace_id: LocalIdPart, label: z.string(), active_tab_id: z.string().optional() })),
})

const TabList = z.object({
  tabs: z.array(z.object({ tab_id: LocalIdPart, label: z.string(), focused: z.boolean().optional() })),
})

/** herdr's split tree; a pane leaf's other fields (its folder, its command) are not read. */
const HerdrPaneNode = z.object({ type: z.literal('pane'), pane_id: z.string() })
const HerdrSplitNode = z.object({
  type: z.literal('split'),
  direction: z.enum(['right', 'down']),
  ratio: z.number(),
  get first() {
    return HerdrNode
  },
  get second() {
    return HerdrNode
  },
})
const HerdrNode: z.ZodDiscriminatedUnion<[typeof HerdrPaneNode, typeof HerdrSplitNode]> = z.discriminatedUnion('type', [
  HerdrPaneNode,
  HerdrSplitNode,
])
type HerdrNode = z.infer<typeof HerdrNode>

const LayoutExport = z.object({
  layout: z.object({ focused_pane_id: z.string(), zoomed: z.boolean().optional(), root: HerdrNode }),
})
/** A reply whose fields the adapter does not read. */
const AnyReply = z.object({})
/** herdr's reason when a zoom or a swap changed nothing; null when it changed. */
const Reason = z.string().nullable().optional()
const ZoomReply = z.object({ zoom: z.object({ reason: Reason }) })
const SwapReply = z.object({ swap: z.object({ reason: Reason }) })
/** herdr's reply to a split: the new pane, of which the adapter reads only its terminal. */
const SplitReply = z.object({ pane: z.object({ terminal_id: LocalIdPart }) })
/** herdr's new pane of a start: its pane ID and terminal, from `pane.split` or from the root pane of `tab.create`. */
const NewPane = z.object({ pane_id: z.string(), terminal_id: LocalIdPart })
const StartSplitReply = z.object({ pane: NewPane })
const StartTabReply = z.object({ root_pane: NewPane })
/** herdr's reply to `workspace.create`, of which the adapter reads only the new workspace's ID. */
const CreatedWorkspace = z.object({ workspace: z.object({ workspace_id: LocalIdPart }) })
/** The waits before each read of the screen after the effort keys, about 1.5 s in all. */
const effortReadGapsMs = [100, 200, 400, 800]
/** How often and how far apart a start tries again while herdr says the new pane's shell is busy (starting). */
const busyTries = 10
const busyGapMs = 200
/** How long a start waits for the new Claude chat to be ready or to wait for the owner. */
const startWaitMs = 30_000

/** Whether `folder` is in `root` once both are real paths, so a link or ".." cannot leave the root. */
async function insideRoot(root: string | undefined, folder: string | undefined): Promise<boolean> {
  if (root === undefined || folder === undefined) return false
  try {
    const [top, real] = await Promise.all([realpath(root), realpath(folder)])
    // From the root, so a root of "/" holds each folder; ".." first means the folder is outside it.
    const rel = relative(top, real)
    return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
  } catch {
    return false
  }
}
/** herdr's reply to a move: whether the pane moved, and why not (`same_tab`, `zoomed_tab`). */
/** Moves a map's value from one key to another. */
function moveKey<V>(map: Map<string, V>, from: string, to: string): void {
  const kept = map.get(from)
  if (kept === undefined) return
  map.delete(from)
  map.set(to, kept)
}

/** A move to another workspace: herdr names the pane's terminal after the move (probe in a test herdr session, 2026-11-23). */
const WorkspaceMoveReply = z.object({
  move_result: z.object({
    changed: z.boolean(),
    pane: z.object({ pane_id: z.string(), terminal_id: LocalIdPart }).optional(),
    closed_workspace_id: z.string().nullable().optional(),
  }),
})
const MoveReply = z.object({
  move_result: z.object({ changed: z.boolean(), reason: z.string().nullable().optional() }),
})
/** herdr's error codes that say the pane, the tab or the split of a layout write is not there. */
const notFoundCodes = new Set(['pane_not_found', 'tab_not_found', 'split_not_found', 'workspace_not_found'])

/** herdr's tree in the app's terms, each pane by its chat ID; undefined when a pane has no listed chat. */
function nodeOf(node: HerdrNode, ids: ReadonlyMap<string, ChatId>): LayoutNode | undefined {
  if (node.type === 'pane') {
    const chat = ids.get(node.pane_id)
    return chat === undefined ? undefined : { kind: 'pane', chat }
  }
  const first = nodeOf(node.first, ids)
  const second = nodeOf(node.second, ids)
  if (first === undefined || second === undefined) return undefined
  // The contract takes a ratio strictly between 0 and 1; a pane at its minimum size could give 0 or 1.
  const ratio = Math.min(Math.max(node.ratio, 0.01), 0.99)
  return { kind: 'split', direction: node.direction === 'right' ? 'row' : 'column', ratio, first, second }
}

const AgentList = z.object({
  agents: z.array(
    z.object({
      agent: z.string().nullable().optional(),
      agent_session: z.object({ kind: z.string(), value: z.string() }).nullable().optional(),
      // Read as any string: a status a new herdr adds is the chat's unknown, not a bad reply (audit S-3).
      agent_status: z.string(),
      cwd: z.string().nullable().optional(),
      name: z.string().nullable().optional(),
      pane_id: z.string(),
      terminal_id: LocalIdPart,
      terminal_title_stripped: z.string().nullable().optional(),
      workspace_id: LocalIdPart,
    }),
  ),
})
type HerdrAgent = z.infer<typeof AgentList>['agents'][number]
/** herdr's reply to `agent.wait`: the agent, as `agent.list` gives it, and whether it takes a prompt yet. */
const AgentInfo = z.object({
  agent: AgentList.shape.agents.element.extend({ interactive_ready: z.boolean().optional() }),
})
type AgentInfoAgent = z.infer<typeof AgentInfo>['agent']

const PaneList = z.object({
  panes: z.array(
    z.object({
      pane_id: z.string(),
      terminal_id: LocalIdPart,
      workspace_id: LocalIdPart,
      tab_id: z.string().optional(),
      cwd: z.string().nullable().optional(),
      agent_status: z.string(),
      label: z.string().nullable().optional(),
      // Read only to guard a workspace close; a shell's title never leaves the adapter.
      terminal_title_stripped: z.string().nullable().optional(),
    }),
  ),
})
type HerdrPane = z.infer<typeof PaneList>['panes'][number]

const ProcessInfo = z.object({
  process_info: z.object({
    shell_pid: z.number().nullable().optional(),
    foreground_process_group_id: z.number().nullable().optional(),
    foreground_processes: z.array(
      z.object({
        pid: z.number(),
        name: z.string(),
        argv0: z.string().nullable().optional(),
        // Read only for a model restart, never for the list: an argument can hold a token or a path.
        argv: z.array(z.string()).nullable().optional(),
        cwd: z.string().nullable().optional(),
      }),
    ),
  }),
})

/**
 * A process's name with no path, no login-shell dash and no argument: the base name of argv0, else herdr's name
 * when argv0 is empty or holds a space (a program such as Node can write its arguments into argv0), and only
 * the first word of what remains.
 */
const processName = (p: { readonly name: string; readonly argv0?: string | null | undefined }): string => {
  const argv0 = p.argv0 ?? ''
  const name = basename(argv0 === '' || /\s/.test(argv0) ? p.name : argv0).replace(/^-/, '')
  return name.split(/\s/)[0] ?? name
}

/**
 * The program a shell pane runs, as process names only, never their arguments: the shell's name when its own
 * process group is in the foreground (no job), else each foreground process's name, joined with " | "; null when
 * herdr gives no process.
 */
function programOf({ process_info: info }: z.infer<typeof ProcessInfo>): string | null {
  const shell = info.foreground_processes.find((p) => p.pid === info.shell_pid)
  if (shell !== undefined) return processName(shell)
  const names = info.foreground_processes.map(processName)
  return names.length === 0 ? null : names.join(' | ')
}

const knownStatus = {
  working: 'working',
  blocked: 'needsYou',
  idle: 'idle',
  done: 'done',
  unknown: 'unknown',
} as const satisfies Record<z.infer<typeof HerdrStatus>, ChatStatus>

/** The status line of one pane, from events.subscribe. */
const StatusChanged = z.object({
  event: z.literal('pane.agent_status_changed'),
  data: z.object({ pane_id: z.string(), agent_status: z.string() }),
})

/**
 * The events that change a workspace's layout: a tab came, went, moved, was renamed or focused, a pane was
 * focused, or a split changed. Each names its workspace, so the app reads that workspace's layout again.
 */
const layoutEvents = [
  'tab.created',
  'tab.closed',
  'tab.renamed',
  'tab.moved',
  'tab.focused',
  'pane.focused',
  'layout.updated',
] as const
const isLayoutEvent: ReadonlySet<string> = new Set(layoutEvents)

/** A layout event line: its workspace is in data, in data.layout or in data.tab. */
const LayoutLine = z.object({
  event: z.string(),
  data: z.object({
    workspace_id: z.string().optional(),
    layout: z.object({ workspace_id: z.string() }).optional(),
    tab: z.object({ workspace_id: z.string() }).optional(),
  }),
})

/** The events that change the list: a pane or workspace came, went, moved or was renamed. */
const listEvents = [
  'workspace.created',
  'workspace.closed',
  'workspace.renamed',
  'workspace.moved',
  'workspace.reordered',
  'pane.created',
  'pane.closed',
  'pane.moved',
  'pane.agent_detected',
] as const

/** herdr did not answer (`unreachable`), or answered with something this adapter does not read (`badReply`). */
function portErrorOf(failure: SocketFailure): AgentPortError {
  switch (failure.kind) {
    case 'connect':
    case 'timeout':
    case 'closed':
      return { reason: 'unreachable', message: failure.message }
    case 'notJson':
    case 'tooLong':
    case 'badShape':
    case 'herdrError':
      return { reason: 'badReply', message: failure.message }
  }
}

/** The longest the adapter holds a workspace's layout change while layout events keep coming. */
const maxLayoutWaitMs = 500

/**
 * herdr refuses a subscription that names a pane that closed after the list read (the owner closes panes). The
 * adapter then reads the list again and subscribes to the panes that are left, this many times in a row at most.
 */
const maxGoneRetries = 5
const paneGone = (failure: SocketFailure) => failure.kind === 'herdrError' && failure.code === 'pane_not_found'

/** How long the adapter waits for more list events before it opens the stream again. */
const settleMs = 100

const isChat = (agent: HerdrAgent): agent is HerdrAgent & { agent: 'claude' | 'codex' } =>
  agent.agent === 'claude' || agent.agent === 'codex'

export type HerdrAgentsOptions = {
  readonly socket: string
  readonly machine: MachineId
  /** Where Claude Code keeps its session files, such as ~/.claude/projects. */
  readonly claudeProjects: string
  /** Claude Code's settings file, read only for each model's auto-compact window; none: the model's window. */
  readonly claudeSettings?: string
  /** Starts a file system watch; a test can give one that loses events, as a macOS folder watch can. */
  readonly watch?: (path: string, listener: (event: string, name: string | null) => void) => FSWatcher
  /** The folder of the owner's uploads; a transcript shows a prompt's files in it by name. */
  readonly uploads?: string
  /** The owner's home folder: a transcript shows a path in it with "~". */
  readonly home: string
  /** Gets one warning for each herdr status the adapter does not know. */
  readonly log: Logger
  /** The folder under which a start may open a chat (slice W3); none: every start is `folderNotAllowed`. */
  readonly chatRoot?: string
  /**
   * The server's own process and each one above it, which no workspace close may end (`processAncestors`);
   * undefined when the walk failed, which refuses each close.
   */
  readonly serverPids?: () => Promise<ReadonlySet<number> | undefined>
  /** The herdr names of the chats whose workspace never closes (the coordinator's). */
  readonly guardedAgents?: readonly string[]
  /** The time in ms, for the stop hold; a test can move it. */
  readonly now?: () => number
  /** Answers a side question from a copy of a session; with none, a side question of a saved session is `unreachable`. */
  readonly runSide?: SideRunner
}

/** How long a restart waits for the chat to end after its ctrl+c, and the time between two reads. */
const restartExitMs = 5000
const restartExitGapMs = 200

/**
 * herdr sends no event when a pane's Claude session changes (a /clear typed in the terminal), so the list stream
 * watches the folders of the listed Claude sessions: a new session file there reads the list again, now and once
 * more after this many ms, as herdr can learn the new session after Claude Code writes its file.
 */
const lateSessionMs = 1500

/** How long after a stop's Escape a pane gets no other Escape. */
const stopHoldMs = 2000
/** How long a stop waits for the chat to go idle, and so put the stopped prompt back, before it reads the box. */
const putBackWaitMs = 3000
/** How many times a stop reads the box for the prompt that comes back, and the time between two reads. */
const putBackReads = 5
const putBackReadGapMs = 100
/**
 * The waits before each read of the box after a send, to see that the chat took its prompt. The first reads come
 * soon, as an idle chat takes its Enter in tens of ms; the waits add up to 1.3 s, so a lost Enter is still found.
 */
const submitReadGapsMs = [30, 50, 70, 100, 150, 150, 150, 150, 150, 150, 150]

/** The time of each step of one send, in ms, for the log; never its text. */
/** How long after a send an empty box, with no read that showed the prompt, counts as the prompt taken. */
const emptyProofMs = 150

type SendSteps = { boxMs?: number; promptMs?: number; checkMs?: number; checkReads?: number }
const msSince = (start: number) => Date.now() - start

const PaneRead = z.object({ read: z.object({ text: z.string() }) })

/** The hash of a prompt as the box can show it (`promptKey`). */
const hashOf = (key: string) => createHash('sha256').update(key).digest('hex')

/** A Claude session ID that is safe in a file name: no slash and no dot. */
const sessionName = /^[A-Za-z0-9_-]{1,100}$/

export function createHerdrAgents({
  socket,
  machine,
  claudeProjects,
  claudeSettings,
  home,
  uploads,
  log,
  watch: watchFs = (path, listener) => watch(path, listener),
  now = Date.now,
  chatRoot,
  serverPids = () => Promise.resolve(new Set<number>()),
  guardedAgents = [],
  runSide,
}: HerdrAgentsOptions): AgentPort {
  const unknownSeen = new Set<string>()
  /** The chat's status for herdr's `status`; one it does not know is `unknown`, logged once. */
  const statusOf = (status: string): ChatStatus => {
    const known = HerdrStatus.safeParse(status)
    if (known.success) return knownStatus[known.data]
    if (!unknownSeen.has(status)) {
      unknownSeen.add(status)
      log.warn('herdr status not known', { status })
    }
    return 'unknown'
  }

  const call = async <T>(
    method: string,
    schema: z.ZodType<T>,
    params: Readonly<Record<string, unknown>> = {},
  ): Promise<Result<T, AgentPortError>> => {
    const reply = await herdrRequest(socket, method, params)
    if (!reply.ok) return err(portErrorOf(reply.error))
    const parsed = schema.safeParse(reply.value)
    return parsed.success
      ? ok(parsed.data)
      : err({ reason: 'badReply', message: `herdr ${method}: ${parsed.error.issues[0]?.message ?? 'unknown shape'}` })
  }

  const sessionPath = (agent: HerdrAgent): string | undefined => {
    const session = agent.agent_session
    if (!session) return undefined
    // A path from herdr is read only when it is a session file in the Claude projects folder.
    if (session.kind === 'path') {
      const rel = relative(claudeProjects, resolve(session.value))
      return rel.startsWith('..') || isAbsolute(rel) || !rel.endsWith('.jsonl') ? undefined : session.value
    }
    if (session.kind === 'id' && agent.cwd && sessionName.test(session.value))
      return join(claudeProjects, claudeProjectFolder(agent.cwd), `${session.value}.jsonl`)
    return undefined
  }

  const sessionOf = (agent: HerdrAgent): string | undefined =>
    agent.agent_session?.kind === 'id' ? agent.agent_session.value : undefined

  /** The sessions that two or more panes show; their chats take the terminal ID. */
  const sharedSessions = (agents: readonly HerdrAgent[]): ReadonlySet<string> => {
    const sessions = agents.flatMap((a) => sessionOf(a) ?? [])
    return new Set(sessions.filter((s, i) => sessions.indexOf(s) !== i))
  }

  const chatIdOf = (agent: HerdrAgent, shared: ReadonlySet<string>): ChatId => {
    const session = sessionOf(agent)
    const id = ChatId.safeParse(`${machine}/${session === undefined || shared.has(session) ? '' : session}`)
    return id.success ? id.data : ChatId.parse(`${machine}/${agent.terminal_id}`)
  }

  /** The pane's opaque ID: a hash of herdr's terminal ID, which stays the same for the pane's life (also over /clear). */
  const paneIdOf = (terminal: string): PaneId => PaneId.parse(`${machine}/${hashOf(`pane:${terminal}`).slice(0, 20)}`)

  /**
   * The effort that `setEffort` set for each pane and its Claude session file, with the file's change time then: the
   * keys write nothing to the file, so the list shows this level until a newer write (the next turn) names its own.
   * The key holds the pane too, as two panes can resume one session and each keeps its own effort.
   */
  const setEfforts = new Map<string, { readonly effort: KeyEffort; readonly mtimeMs: number }>()
  const effortKey = (pane: string, path: string) => JSON.stringify([pane, path])
  /** The model of each pane and session file that `restartModel` started, kept as an effort is: the restart writes no turn. */
  const setModels = new Map<string, { readonly model: ModelAlias; readonly mtimeMs: number }>()
  /** The transcript watches, each told the chat and its new herdr pane after a move. */
  const moveTellers = new Set<(chat: ChatId, pane: string) => void>()
  /** The model kept for a pane's session file, while the file has not changed since. */
  const keptModel = async (pane: string, path: string): Promise<ModelAlias | undefined> => {
    const set = setModels.get(effortKey(pane, path))
    if (set === undefined) return undefined
    if ((await mtimeOf(path)) === set.mtimeMs) return set.model
    setModels.delete(effortKey(pane, path))
    return undefined
  }
  const mtimeOf = (path: string) =>
    stat(path).then(
      (s) => s.mtimeMs,
      () => -1,
    )
  /** The tellers of each open list stream, so a write by this adapter can tell `workspacesChanged`. */
  const listTellers = new Set<() => void>()

  const chatOf = async (
    agent: HerdrAgent,
    kind: 'claude' | 'codex',
    shared: ReadonlySet<string>,
    label?: string | null,
  ): Promise<ChatSummary> => {
    const path = kind === 'claude' ? sessionPath(agent) : undefined
    const windows = path === undefined || claudeSettings === undefined ? {} : await readCompactWindows(claudeSettings)
    const session =
      path === undefined
        ? { model: null, contextUsed: null, effort: null }
        : await readClaudeSession(path, undefined, windows)
    const key = path === undefined ? undefined : effortKey(agent.pane_id, path)
    const set = key === undefined ? undefined : setEfforts.get(key)
    if (path !== undefined && key !== undefined && set !== undefined && (await mtimeOf(path)) !== set.mtimeMs)
      setEfforts.delete(key)
    const kept = key === undefined ? undefined : setEfforts.get(key)?.effort
    const model = path === undefined ? undefined : await keptModel(agent.pane_id, path)
    return {
      id: chatIdOf(agent, shared),
      kind,
      // The owner's name for the pane comes first (a rename from the app), then the agent's own title.
      title: [label, agent.terminal_title_stripped, agent.name].find((t): t is string => Boolean(t)) ?? kind,
      model: model ?? session.model,
      modelId: model ?? modelAliasOf(session.model),
      effort: kept ?? session.effort,
      contextUsed: session.contextUsed,
      status: statusOf(agent.agent_status),
      parent: null,
      pane: paneIdOf(agent.terminal_id),
    }
  }

  /** The ID of a shell chat: its pane's terminal ID. */
  const shellIdOf = (pane: HerdrPane): ChatId => ChatId.parse(`${machine}/${pane.terminal_id}`)

  /** The listed chat ID of each pane, by herdr pane ID: its Claude or Codex chat's, else its shell chat's. */
  const chatIdsOf = (agents: readonly HerdrAgent[], panes: readonly HerdrPane[]): Map<string, ChatId> => {
    const shared = sharedSessions(agents)
    const agentOf = new Map(agents.map((a) => [a.pane_id, a]))
    return new Map(
      panes.map((p) => {
        const agent = agentOf.get(p.pane_id)
        return [p.pane_id, agent !== undefined && isChat(agent) ? chatIdOf(agent, shared) : shellIdOf(p)]
      }),
    )
  }

  /** A pane with no Claude or Codex chat: a shell chat named by its terminal ID; no model when herdr gives no process. */
  const shellOf = async (pane: HerdrPane): Promise<ChatSummary> => {
    const info = await call('pane.process_info', ProcessInfo, { pane_id: pane.pane_id })
    const program = info.ok ? programOf(info.value) : null
    return {
      id: shellIdOf(pane),
      kind: 'shell',
      // Never the terminal title: a shell sets it to the command line or to user@host:path.
      title: [pane.label, program].find((t): t is string => Boolean(t)) ?? 'shell',
      model: program,
      modelId: null,
      effort: null,
      contextUsed: null,
      status: statusOf(pane.agent_status),
      parent: null,
      pane: paneIdOf(pane.terminal_id),
    }
  }

  /** The chat of each pane, by herdr pane ID: its Claude or Codex chat, else a shell chat. */
  const chatsOfPanes = async (
    agents: readonly HerdrAgent[],
    panes: readonly HerdrPane[],
  ): Promise<Map<string, ChatSummary>> => {
    const shared = sharedSessions(agents)
    const agentOf = new Map(agents.map((a) => [a.pane_id, a]))
    const chats = await Promise.all(
      panes.map(async (pane) => {
        const agent = agentOf.get(pane.pane_id)
        return {
          pane: pane.pane_id,
          chat:
            agent !== undefined && isChat(agent)
              ? await chatOf(agent, agent.agent, shared, pane.label)
              : await shellOf(pane),
        }
      }),
    )
    return new Map(chats.map((c) => [c.pane, c.chat]))
  }

  const badReply = (message: string): AgentPortError => ({ reason: 'badReply', message })

  const strayPane = 'herdr layout.export: a pane that pane.list does not list'

  /** One read of a workspace's layout; `strayPane` when a tree names a pane that pane.list does not list. */
  const readLayoutOnce = async (workspace: WorkspaceId): Promise<Result<WorkspaceLayout | null, AgentPortError>> => {
    const { machine: on, local } = splitId(workspace)
    if (on !== machine) return ok(null)
    const [workspaces, agents, panes] = await Promise.all([
      call('workspace.list', WorkspaceList),
      call('agent.list', AgentList),
      call('pane.list', PaneList),
    ])
    if (!workspaces.ok) return workspaces
    if (!agents.ok) return agents
    if (!panes.ok) return panes
    const found = workspaces.value.workspaces.find((w) => w.workspace_id === local)
    if (found === undefined) return ok(null)
    const tabs = await call('tab.list', TabList, { workspace_id: local })
    if (!tabs.ok) return tabs
    const exports = await Promise.all(
      tabs.value.tabs.map((t) => call('layout.export', LayoutExport, { tab_id: t.tab_id })),
    )
    // herdr names the active tab; without it, the tab that tab.list marks focused, else the first.
    const listed = tabs.value.tabs
    const active =
      listed.find((t) => t.tab_id === found.active_tab_id)?.tab_id ??
      listed.find((t) => t.focused === true)?.tab_id ??
      listed[0]?.tab_id
    const own = panes.value.panes.filter((p) => p.workspace_id === local)
    const summaries = await chatsOfPanes(agents.value.agents, own)
    const byChat = new Map([...summaries.values()].map((c) => [c.id, c]))
    const ids = new Map([...summaries].map(([pane, chat]) => [pane, chat.id]))
    const layouts: unknown[] = []
    for (const [at, tab] of tabs.value.tabs.entries()) {
      const exported = exports[at]
      if (exported === undefined) return err(badReply(`herdr layout.export: no reply for tab ${tab.tab_id}`))
      if (!exported.ok) return exported
      const root = nodeOf(exported.value.layout.root, ids)
      if (root === undefined) return err(badReply(strayPane))
      layouts.push({
        id: `${machine}/${tab.tab_id}`,
        label: tab.label,
        active: tab.tab_id === active,
        root,
        focusedChat: ids.get(exported.value.layout.focused_pane_id),
        zoomed: exported.value.layout.zoomed ?? false,
        chats: chatsOf(root).map((id) => byChat.get(id)),
      })
    }
    const layout = WorkspaceLayout.safeParse({ workspace, tabs: layouts })
    return layout.success
      ? ok(layout.data)
      : err(badReply(`herdr layout: ${layout.error.issues[0]?.message ?? 'unknown shape'}`))
  }

  /**
   * Where a chat is: its session file (none for a shell or a Codex chat), its status, and its pane (none for a
   * shell); null for no such chat.
   */
  const locate = async (
    chat: ChatId,
  ): Promise<
    Result<
      {
        path: string | undefined
        working: boolean
        status: ChatStatus
        cwd: string | undefined
        pane: string | undefined
        claude: boolean
      } | null,
      AgentPortError
    >
  > => {
    const { machine: on } = splitId(chat)
    if (on !== machine) return ok(null)
    const [agents, panes] = await Promise.all([call('agent.list', AgentList), call('pane.list', PaneList)])
    if (!agents.ok) return agents
    if (!panes.ok) return panes
    const shared = sharedSessions(agents.value.agents)
    const agent = agents.value.agents.filter(isChat).find((a) => chatIdOf(a, shared) === chat)
    if (agent === undefined) {
      const shell = panes.value.panes.some((p) => shellIdOf(p) === chat)
      return ok(
        shell
          ? { path: undefined, working: false, status: 'idle', cwd: undefined, pane: undefined, claude: false }
          : null,
      )
    }
    // Only this chat's session is read. A Codex transcript is not read yet.
    const status = statusOf(agent.agent_status)
    return ok({
      path: agent.agent === 'claude' ? sessionPath(agent) : undefined,
      working: status === 'working',
      status,
      cwd: agent.cwd ?? undefined,
      pane: agent.pane_id,
      claude: agent.agent === 'claude',
    })
  }

  /**
   * The herdr pane of any chat, a shell too, with its tab and its status (a shell is `idle`); null for no such
   * chat. The pane ID stays here (d-110).
   */
  /** A pane that the coordinator's chat holds: its chat's herdr name, its label or its title (Claude's session name). */
  const guardedPane = (
    pane: { label?: string | null | undefined; terminal_title_stripped?: string | null | undefined },
    name?: string | null,
  ) => [name, pane.label, pane.terminal_title_stripped].some((n) => typeof n === 'string' && guardedAgents.includes(n))
  /**
   * Whether a pane's shell or foreground process is the server or above it; a walk that fails proves nothing, so
   * it counts as true.
   */
  const runsServer = async (panes: readonly string[]): Promise<Result<boolean, AgentPortError>> => {
    const guarded = await serverPids()
    if (guarded === undefined) return ok(true)
    for (const pane of panes) {
      const info = await call('pane.process_info', ProcessInfo, { pane_id: pane })
      if (!info.ok) return info
      const { shell_pid: shell, foreground_processes: foreground } = info.value.process_info
      if ([shell, ...foreground.map((f) => f.pid)].some((pid) => typeof pid === 'number' && guarded.has(pid)))
        return ok(true)
    }
    return ok(false)
  }

  const paneOf = async (
    chat: ChatId,
  ): Promise<
    Result<
      {
        pane: string
        terminal: string | undefined
        tab: string | undefined
        workspace: string | undefined
        cwd: string | undefined
        status: ChatStatus
      } | null,
      AgentPortError
    >
  > => {
    const { machine: on } = splitId(chat)
    if (on !== machine) return ok(null)
    const [agents, panes] = await Promise.all([call('agent.list', AgentList), call('pane.list', PaneList)])
    if (!agents.ok) return agents
    if (!panes.ok) return panes
    const shared = sharedSessions(agents.value.agents)
    const agent = agents.value.agents.filter(isChat).find((a) => chatIdOf(a, shared) === chat)
    // A pane that runs an agent now is no shell, so an old shell ID of it finds nothing.
    const agentPanes = new Set(agents.value.agents.map((a) => a.pane_id))
    const pane =
      agent?.pane_id ?? panes.value.panes.find((p) => !agentPanes.has(p.pane_id) && shellIdOf(p) === chat)?.pane_id
    if (pane === undefined) return ok(null)
    const listed = panes.value.panes.find((p) => p.pane_id === pane)
    return ok({
      pane,
      terminal: listed?.terminal_id,
      tab: listed?.tab_id,
      workspace: listed?.workspace_id,
      cwd: listed?.cwd ?? undefined,
      status: agent === undefined ? 'idle' : statusOf(agent.agent_status),
    })
  }

  /**
   * One layout write to herdr: its parsed reply, or `notFound` when the pane closed before the write. Another herdr
   * error keeps only its code.
   */
  /** A write's herdr error: notFound for a pane or tab that closed, else the port error with herdr's code only. */
  const writeFailed = (method: string, error: SocketFailure): Result<'notFound', AgentPortError> => {
    if (error.kind !== 'herdrError') return err(portErrorOf(error))
    if (notFoundCodes.has(error.code)) return ok('notFound')
    return err(badReply(`herdr ${method}: ${error.code}`))
  }

  const paneWrite = async <T>(
    method: string,
    schema: z.ZodType<T>,
    params: Readonly<Record<string, unknown>>,
  ): Promise<Result<T | 'notFound', AgentPortError>> => {
    const reply = await herdrRequest(socket, method, params)
    if (!reply.ok) return writeFailed(method, reply.error)
    const parsed = schema.safeParse(reply.value)
    return parsed.success
      ? ok(parsed.data)
      : err(badReply(`herdr ${method}: ${parsed.error.issues[0]?.message ?? 'unknown shape'}`))
  }

  /** Done, or notFound when the pane closed before the write. */
  const doneOf = (written: Result<unknown, AgentPortError>): Result<PaneWriteOutcome, AgentPortError> =>
    written.ok ? ok(written.value === 'notFound' ? 'notFound' : 'done') : written

  /**
   * When each pane last got a stop's Escape. A second Escape soon after opens Claude Code's rewind menu, so a stop
   * in the next `stopHoldMs` sends none: two taps of Stop, or two clients, give one Escape.
   */
  const stoppedAt = new Map<string, number>()

  /**
   * Where each agent chat is, from the newest list read of an open list stream, with its status from that stream's
   * events, so a prompt needs no list read of its own. A change of the list or of a layout empties it, and it is
   * used only while a stream is open: it reads nothing itself (d-112).
   */
  const places = new Map<ChatId, { pane: string; status: ChatStatus; claude: boolean }>()
  /** Goes up at each emptying, so a list read that started before it fills nothing. */
  let placesAge = 0
  let openStreams = 0
  const forgetPlaces = () => {
    placesAge += 1
    places.clear()
  }

  /**
   * The pane and status of a Claude or Codex chat, or why the chat takes no input: no such chat, or a shell. With
   * `cached`, a place that an open stream keeps comes first.
   */
  const agentPane = async (
    chat: ChatId,
    cached = false,
  ): Promise<
    Result<
      { pane: string; status: ChatStatus; claude: boolean; cached: boolean } | 'notFound' | 'shell',
      AgentPortError
    >
  > => {
    const place = cached && openStreams > 0 ? places.get(chat) : undefined
    if (place !== undefined) return ok({ ...place, cached: true })
    const located = await locate(chat)
    if (!located.ok) return located
    if (located.value === null) return ok('notFound')
    const { pane, status, claude } = located.value
    return ok(pane === undefined ? 'shell' : { pane, status, claude, cached: false })
  }

  /**
   * The hash of the last prompt this port sent to each pane, as the box can show it (`promptKey`): never the text
   * itself. A stop clears the box only when it holds that prompt.
   */
  const lastSent = new Map<string, string>()
  /** Moves what the adapter keeps for a herdr pane to the pane's new ID, as a move to another workspace gives one. */
  const repane = (from: string, to: string) => {
    moveKey(stoppedAt, from, to)
    moveKey(lastSent, from, to)
    // An effort or model key starts with its pane: the JSON of [pane, path].
    const head = (pane: string) => JSON.stringify([pane]).slice(0, -1)
    const renamed = (key: string) => head(to) + key.slice(head(from).length)
    for (const key of [...setEfforts.keys()])
      if (key.startsWith(`${head(from)},`)) moveKey(setEfforts, key, renamed(key))
    for (const key of [...setModels.keys()]) if (key.startsWith(`${head(from)},`)) moveKey(setModels, key, renamed(key))
  }

  /** The screen of a pane with its colours; it never leaves the adapter. */
  const screenOf = async (pane: string): Promise<Result<string, AgentPortError>> => {
    const read = await call('pane.read', PaneRead, { pane_id: pane, source: 'visible', format: 'ansi' })
    return read.ok ? ok(read.value.read.text) : read
  }

  /** The input box of a Claude chat's pane, from its screen; null when the screen shows none. */
  const inputBox = async (pane: string): Promise<Result<InputBox | null, AgentPortError>> => {
    const screen = await screenOf(pane)
    return screen.ok ? ok(inputBoxOf(screen.value)) : screen
  }

  /**
   * After `/model <name>`, a chat with history asks "Switch model?" first, also while it works. The owner asked for
   * the switch, so one Enter picks "Yes, switch", only when the screen shows that dialog with that choice picked;
   * then the screen is read until the dialog is gone and the input box shows again (`sent`), else
   * `inputUnreadable`. Each read of the check looks for the dialog, as it can come late; `none` when no read
   * showed it and the box shows: the chat switched at once or kept the text.
   */
  const confirmModelSwitch = async (pane: string): Promise<Result<'none' | PromptOutcome, AgentPortError>> => {
    let box: InputBox | null = null
    for (const gap of submitReadGapsMs) {
      await new Promise((resolve) => setTimeout(resolve, gap))
      const screen = await screenOf(pane)
      if (!screen.ok) return screen
      if (switchModelDialogOf(screen.value)) {
        const enter = await input('agent.send_keys', { target: pane, keys: ['enter'] })
        if (!enter.ok || enter.value !== 'sent') return enter
        for (const next of submitReadGapsMs) {
          await new Promise((resolve) => setTimeout(resolve, next))
          const after = await screenOf(pane)
          if (!after.ok) return after
          if (!switchModelDialogOf(after.value) && inputBoxOf(after.value) !== null) return ok('sent')
        }
        return ok('inputUnreadable')
      }
      box = inputBoxOf(screen.value)
    }
    // Another dialog hides the box: the page must not count it as sent.
    return ok(box === null ? 'inputUnreadable' : 'none')
  }

  /**
   * After a stop, Claude Code puts the stopped prompt back in its input box when its turn ends. When the box holds
   * the last prompt this port sent, this clears it: one ctrl+u deletes one screen line, and one more the line break
   * before it. Other text stays, so the next prompt gets `inputNotEmpty`; a failed step leaves the box as it is.
   */
  const clearPutBack = async (pane: string) => {
    const sent = lastSent.get(pane)
    if (sent === undefined) return
    await herdrRequest(socket, 'agent.wait', { target: pane, until: ['idle'], timeout_ms: putBackWaitMs })
    for (let read = 0; read < putBackReads; read += 1) {
      const box = await inputBox(pane)
      if (!box.ok || box.value === null) return
      if (box.value.text !== '') {
        if (!boxKeys(box.value).some((key) => hashOf(key) === sent)) return
        lastSent.delete(pane)
        await emptyBox(pane, box.value)
        return
      }
      // The turn ended, but the prompt may come back a moment later.
      await new Promise((resolve) => setTimeout(resolve, putBackReadGapMs))
    }
  }

  /** Empties the box with ctrl+u: one deletes one screen line, and one more the line break before it. */
  const emptyBox = (pane: string, box: InputBox) =>
    input('agent.send_keys', { target: pane, keys: Array.from({ length: box.lines * 2 }, () => 'ctrl+u') })

  /**
   * What stays in the box after a send, at each of a few reads: null when the box empties, as the chat takes the
   * prompt (a working chat queues it, which empties the box too) or when the screen cannot be read. Otherwise the
   * box at the last read, and whether it holds the prompt this port sent (`sent`, its hash): a box too long to
   * match, or with other text, is not `ours`.
   */
  const leftInBox = async (
    pane: string,
    sent: string,
    steps: SendSteps,
  ): Promise<{ box: InputBox; ours: boolean } | null> => {
    let left: { box: InputBox; ours: boolean } | null = null
    let waited = 0
    for (const gap of submitReadGapsMs) {
      await new Promise((resolve) => setTimeout(resolve, gap))
      waited += gap
      const now = await inputBox(pane)
      steps.checkReads = (steps.checkReads ?? 0) + 1
      if (!now.ok || now.value === null) return null
      // An empty box shows that the chat took the prompt only once the prompt showed there, or after
      // `emptyProofMs`: an earlier read can come before the prompt shows at all.
      if (now.value.text === '') {
        if (left !== null || waited >= emptyProofMs) return null
        continue
      }
      left = { box: now.value, ours: boxKeys(now.value).some((key) => hashOf(key) === sent) }
    }
    return left
  }

  /**
   * Sends one input request to a chat's pane. A herdr error gives only its method and code, never its message,
   * which could quote the input; herdr's `agent_blocked` is the chat's `needsYou`.
   */
  const input = async (method: string, params: Readonly<Record<string, unknown>>) => {
    const reply = await herdrRequest(socket, method, params)
    if (reply.ok) return ok('sent' as const)
    if (reply.error.kind !== 'herdrError') return err(portErrorOf(reply.error))
    if (reply.error.code === 'agent_blocked') return ok('needsYou' as const)
    return err(badReply(`herdr ${method}: ${reply.error.code}`))
  }

  type Launched =
    | { readonly started: false; readonly error: SocketFailure }
    | { readonly started: true; readonly waitFailed: string | undefined; readonly agent: AgentInfoAgent | undefined }

  /**
   * Starts Claude in a shell pane with an argument list, never a shell line (again while herdr says the shell is
   * still starting: `agent_pane_busy`), then waits for it as a start does: `agent` is undefined when herdr's wait
   * timed out, and `waitFailed` holds herdr's code of any other wait failure (the agent or its pane ended).
   */
  const launchClaude = async (pane: string, name: string, args: readonly string[]): Promise<Launched> => {
    const start = { name, kind: 'claude', pane_id: pane, args, timeout_ms: startWaitMs }
    let started = await herdrRequest(socket, 'agent.start', start)
    for (
      let tries = 0;
      tries < busyTries &&
      !started.ok &&
      started.error.kind === 'herdrError' &&
      started.error.code === 'agent_pane_busy';
      tries += 1
    ) {
      await new Promise((resolve) => setTimeout(resolve, busyGapMs))
      started = await herdrRequest(socket, 'agent.start', start)
    }
    if (!started.ok) return { started: false, error: started.error }
    // herdr answers the start at once. The adapter answers no prompt of the new chat (a folder trust question too).
    const waited = await herdrRequest(
      socket,
      'agent.wait',
      { target: pane, until: ['idle', 'done', 'blocked'], timeout_ms: startWaitMs },
      startWaitMs + 5000,
    )
    if (!waited.ok && waited.error.kind === 'herdrError' && waited.error.code !== 'timeout')
      return { started: true, waitFailed: waited.error.code, agent: undefined }
    const info = waited.ok ? AgentInfo.safeParse(waited.value) : undefined
    return { started: true, waitFailed: undefined, agent: info?.success === true ? info.data.agent : undefined }
  }

  /** A started chat's state: an idle agent whose launch herdr has not finished still refuses a prompt (`starting`). */
  const startStateOf = (agent: AgentInfoAgent): StartState => {
    const status = statusOf(agent.agent_status)
    if (status === 'needsYou') return 'needsYou'
    return agent.interactive_ready === true && (status === 'idle' || status === 'done') ? 'ready' : 'starting'
  }

  /** The Claude agent of a pane when it is idle or done with an empty input box, else why a restart waits. */
  const restartReady = async (
    pane: string,
  ): Promise<
    Result<HerdrAgent | 'notFound' | 'needsYou' | 'working' | 'inputNotEmpty' | 'inputUnreadable', AgentPortError>
  > => {
    const agents = await call('agent.list', AgentList)
    if (!agents.ok) return agents
    const agent = agents.value.agents.find((a) => a.pane_id === pane && a.agent === 'claude')
    if (agent === undefined) return ok('notFound')
    const status = statusOf(agent.agent_status)
    if (status === 'needsYou') return ok('needsYou')
    if (status !== 'idle' && status !== 'done') return ok('working')
    const box = await inputBox(pane)
    if (!box.ok) return box
    if (box.value === null) return ok('inputUnreadable')
    return box.value.text === '' ? ok(agent) : ok('inputNotEmpty')
  }

  /** The Claude process in a pane's foreground, with its arguments and folder as herdr gives them, if any. */
  const claudeProcess = async (pane: string) => {
    const info = await call('pane.process_info', ProcessInfo, { pane_id: pane })
    if (!info.ok) return info
    return ok(info.value.process_info.foreground_processes.find((p) => processName(p) === 'claude'))
  }

  /**
   * Whether the pane's Claude process ended within `restartExitMs`, and herdr let go of its agent: herdr keeps the
   * agent's name for a moment after the process ends, and refuses a start with it (`agent_name_taken`).
   */
  const claudeEnded = async (pane: string): Promise<boolean> => {
    for (let waited = 0; waited < restartExitMs; waited += restartExitGapMs) {
      await new Promise((resolve) => setTimeout(resolve, restartExitGapMs))
      const [running, agents] = await Promise.all([claudeProcess(pane), call('agent.list', AgentList)])
      if (
        running.ok &&
        running.value === undefined &&
        agents.ok &&
        !agents.value.agents.some((x) => x.pane_id === pane)
      )
        return true
    }
    return false
  }

  /** Whether two folders are the same once both are real paths. */
  const sameFolder = async (a: string, b: string): Promise<boolean> => {
    // A folder that is gone compares by its path.
    const [ra, rb] = await Promise.all([realpath(a).catch(() => resolve(a)), realpath(b).catch(() => resolve(b))])
    return ra === rb
  }

  /** Keeps the effort set for the pane's session file, and tells each open list stream that the list changed. */
  const keepEffort = async (pane: string, effort: KeyEffort) => {
    const agents = await call('agent.list', AgentList)
    const agent = agents.ok ? agents.value.agents.find((a) => a.pane_id === pane) : undefined
    const path = agent === undefined ? undefined : sessionPath(agent)
    if (path !== undefined) setEfforts.set(effortKey(pane, path), { effort, mtimeMs: await mtimeOf(path) })
    for (const tellList of listTellers) tellList()
  }

  /** Sends effort keys, then reads the screen until `shows` holds: `set`, else `effortNotConfirmed`. */
  const effortStep = async (
    pane: string,
    keys: string[],
    shows: (shown: ReturnType<typeof effortOf>) => boolean,
  ): Promise<Result<'set' | 'needsYou' | 'effortNotConfirmed', AgentPortError>> => {
    if (keys.length > 0) {
      const sent = await input('agent.send_keys', { target: pane, keys })
      if (!sent.ok) return sent
      if (sent.value === 'needsYou') return ok('needsYou')
    }
    for (const gap of effortReadGapsMs) {
      await new Promise((resolve) => setTimeout(resolve, gap))
      const after = await screenOf(pane)
      if (!after.ok) return after
      if (shows(effortOf(after.value))) return ok('set')
    }
    return ok('effortNotConfirmed')
  }

  /**
   * Types `text` into a chat's pane and sends it: nothing when a Claude chat's box holds text; after the send, a
   * prompt that stays in the box is taken back (`notSubmitted`).
   */
  const submit = async (
    pane: string,
    claude: boolean,
    text: string,
    steps: SendSteps = {},
  ): Promise<Result<PromptOutcome, AgentPortError>> => {
    // The prompt would join text in the box: text the owner typed, or a prompt that a stop put back.
    if (claude) {
      const boxAt = Date.now()
      const box = await inputBox(pane)
      steps.boxMs = msSince(boxAt)
      if (!box.ok) return box
      // A screen whose box the adapter cannot read (a dialog, or a draft with a line of "─" in it) may hold text too,
      // so nothing is sent; its own state tells the owner that the box was not read, not that it holds text.
      if (box.value === null) return ok('inputUnreadable')
      if (box.value.text !== '') return ok('inputNotEmpty')
    }
    const promptAt = Date.now()
    const sent = await input('agent.prompt', { target: pane, text })
    steps.promptMs = msSince(promptAt)
    if (!sent.ok || sent.value !== 'sent') return sent
    const key = hashOf(promptKey(text))
    lastSent.set(pane, key)
    if (!claude) return sent
    if (modelSwitch.test(text.trim())) {
      const switchAt = Date.now()
      const switched = await confirmModelSwitch(pane)
      steps.checkMs = msSince(switchAt)
      if (!switched.ok) return switched
      if (switched.value !== 'none') return ok(switched.value)
    }
    // A lost Enter leaves the prompt in the box, where it would block each next send: take it back.
    const checkAt = Date.now()
    const left = await leftInBox(pane, key, steps)
    steps.checkMs = msSince(checkAt)
    if (left === null) return sent
    lastSent.delete(pane)
    // Text the adapter cannot match to the prompt stays; the owner's input clear removes it.
    if (!left.ours) return ok('inputNotEmpty')
    const keys = await emptyBox(pane, left.box)
    if (!keys.ok) return keys
    const after = await inputBox(pane)
    if (!after.ok) return after
    if (after.value === null) return ok('inputUnreadable')
    return ok(after.value.text === '' ? 'notSubmitted' : 'inputNotEmpty')
  }

  /** The text of a model change, which may open the "Switch model?" dialog. */
  const modelSwitch = /^\/model\s+\S/

  /** The text of a command as the owner would type it; one line, so one Enter sends it. */
  const commandText = (command: ChatCommand) =>
    command.command === 'clear'
      ? '/clear'
      : `/compact${command.instructions === undefined || command.instructions.trim() === '' ? '' : ` ${command.instructions.trim()}`}`

  /** Starts Claude in a new pane, as `startChat` does; a fork adds its resume flags in `extra`. */
  /** A Claude chat's agent and saved session; `noSession` for a shell, a Codex chat or a session with no file yet. */
  const savedSession = async (chat: ChatId) => {
    const { machine: on } = splitId(chat)
    if (on !== machine) return ok('notFound' as const)
    const [agents, panes] = await Promise.all([call('agent.list', AgentList), call('pane.list', PaneList)])
    if (!agents.ok) return agents
    if (!panes.ok) return panes
    const shared = sharedSessions(agents.value.agents)
    const agent = agents.value.agents.filter(isChat).find((a) => chatIdOf(a, shared) === chat)
    if (agent === undefined)
      return ok(panes.value.panes.some((p) => shellIdOf(p) === chat) ? ('noSession' as const) : ('notFound' as const))
    const session = agent.agent === 'claude' ? sessionOf(agent) : undefined
    const file = session === undefined ? undefined : sessionPath(agent)
    // A session with no saved turn has no file, and `--resume` of it starts nothing.
    const saved =
      file !== undefined &&
      (await stat(file).then(
        (s) => s.isFile() && s.size > 0,
        () => false,
      ))
    if (session === undefined || file === undefined || !saved) return ok('noSession' as const)
    return ok({ agent, session, file, agents: agents.value.agents })
  }
  const startIn = async (
    { name, model, place }: Omit<StartChatRequest, 'createId'>,
    extra: readonly string[],
  ): ReturnType<AgentPort['startChat']> => {
    // The new pane's place: beside the chat in its folder, or a new tab in the folder of the workspace's first pane.
    let beside: string | undefined
    let workspace: string
    let cwd: string | undefined
    if (place.in === 'split') {
      const found = await paneOf(place.beside)
      if (!found.ok) return found
      if (found.value?.workspace === undefined) return ok('notFound')
      ;({ pane: beside, workspace, cwd } = found.value)
    } else {
      const { machine: on, local } = splitId(place.workspace)
      if (on !== machine) return ok('notFound')
      const panes = await call('pane.list', PaneList)
      if (!panes.ok) return panes
      const first = panes.value.panes.find((p) => p.workspace_id === local)
      if (first === undefined) return ok('notFound')
      workspace = local
      cwd = first.cwd ?? undefined
    }
    if (cwd === undefined || !(await insideRoot(chatRoot, cwd))) return ok('folderNotAllowed')
    const agents = await call('agent.list', AgentList)
    if (!agents.ok) return agents
    const chatName = name ?? `chat-${randomBytes(3).toString('hex')}`
    if (agents.value.agents.some((a) => a.name === chatName)) return ok('nameTaken')
    // No focus change: herdr's active tab and pane stay as they were.
    const made =
      beside === undefined
        ? await paneWrite('tab.create', StartTabReply, { workspace_id: workspace, cwd, focus: false })
        : await paneWrite('pane.split', StartSplitReply, {
            target_pane_id: beside,
            direction: place.in === 'split' && place.direction === 'row' ? 'right' : 'down',
            focus: false,
            cwd,
          })
    if (!made.ok) return made
    if (made.value === 'notFound') return ok('notFound')
    const pane = 'pane' in made.value ? made.value.pane : made.value.root_pane
    forgetPlaces()
    // An argument list, never a shell line: the name, model alias and fork flags only; no flag that skips a permission.
    const args = ['-n', chatName, ...(model === undefined ? [] : ['--model', model]), ...extra]
    const launched = await launchClaude(pane.pane_id, chatName, args)
    if (!launched.started) return writeFailed('agent.start', launched.error)
    if (launched.waitFailed !== undefined) return err(badReply(`herdr agent.wait: ${launched.waitFailed}`))
    const paneId = paneIdOf(pane.terminal_id)
    if (launched.agent === undefined) return ok({ pane: paneId, state: 'starting' })
    const state = startStateOf(launched.agent)
    const chat = sessionOf(launched.agent) === undefined ? undefined : chatIdOf(launched.agent, new Set())
    return ok({ pane: paneId, ...(chat === undefined ? {} : { chat }), state })
  }

  const listAll = async (): Promise<Result<WorkspaceSummary[], AgentPortError>> => {
    const [workspaces, agents, panes] = await Promise.all([
      call('workspace.list', WorkspaceList),
      call('agent.list', AgentList),
      call('pane.list', PaneList),
    ])
    if (!workspaces.ok) return workspaces
    if (!agents.ok) return agents
    if (!panes.ok) return panes
    const chats = await chatsOfPanes(agents.value.agents, panes.value.panes)
    return ok(
      workspaces.value.workspaces.map((w) => ({
        id: WorkspaceId.parse(`${machine}/${w.workspace_id}`),
        label: w.label,
        chats: panes.value.panes
          .filter((p) => p.workspace_id === w.workspace_id)
          .flatMap((p) => chats.get(p.pane_id) ?? []),
      })),
    )
  }

  return {
    machine,
    async sendPrompt(chat, text) {
      const start = Date.now()
      let target = await agentPane(chat, true)
      if (!target.ok) return target
      if (typeof target.value === 'string') return ok(target.value)
      if (target.value.status === 'needsYou') return ok('needsYou')
      let steps: SendSteps = {}
      const locateMs = msSince(start)
      let sent = await submit(target.value.pane, target.value.claude, text, steps)
      // A cached pane that herdr no longer knows fails before any text is typed: read the list once and try again.
      // A failure of agent.prompt itself is retried only for herdr's refusal, never for a timeout, which may have typed.
      const untyped =
        steps.promptMs === undefined || (!sent.ok && /: (pane_not_found|agent_not_found)$/.test(sent.error.message))
      const retried = target.value.cached && !sent.ok && untyped
      if (retried) {
        forgetPlaces()
        target = await agentPane(chat)
        if (!target.ok) return target
        if (typeof target.value === 'string') return ok(target.value)
        if (target.value.status === 'needsYou') return ok('needsYou')
        steps = {}
        sent = await submit(target.value.pane, target.value.claude, text, steps)
      }
      // The time of each step, so a slow send shows where its time went; no text, no pane ID.
      const outcome = sent.ok ? sent.value : sent.error.reason
      log.info('prompt sent', {
        outcome,
        totalMs: msSince(start),
        locateMs,
        cached: target.value.cached,
        retried,
        ...steps,
      })
      return sent
    },
    async sendCommand(chat, command) {
      const target = await agentPane(chat)
      if (!target.ok) return target
      if (typeof target.value === 'string') return ok(target.value)
      const { pane, status, claude } = target.value
      if (!claude) return ok('noCommands')
      if (status === 'needsYou') return ok('needsYou')
      // A working Claude Code queues a command behind its turn; the owner asked for it now, so it is refused. A chat
      // whose state herdr cannot tell may work too, so only an idle or done chat takes a command.
      if (status !== 'idle' && status !== 'done') return ok('working')
      return submit(pane, claude, commandText(command))
    },
    async setEffort(chat, effort) {
      const target = await agentPane(chat)
      if (!target.ok) return target
      if (typeof target.value === 'string') return ok(target.value)
      const { pane, status, claude } = target.value
      if (!claude) return ok('noCommands')
      if (status === 'needsYou') return ok('needsYou')
      // The keys go only to an idle chat at an empty prompt: in a box with text they would join the owner's draft.
      if (status !== 'idle' && status !== 'done') return ok('working')
      const screen = await screenOf(pane)
      if (!screen.ok) return screen
      const box = inputBoxOf(screen.value)
      if (box === null) return ok('inputUnreadable')
      if (box.text !== '') return ok('inputNotEmpty')
      // A target of low goes through medium: low can show no mark, and so can a chat whose effort the keys do not
      // change (CLAUDE_CODE_EFFORT_LEVEL), so medium on the screen first shows that the keys work.
      const via = effort === 'low' ? 'medium' : effort
      const first = await effortStep(pane, effortKeys(effortOf(screen.value), via), (shown) => shown === via)
      const done =
        !first.ok || first.value !== 'set' || effort !== 'low'
          ? first
          : await effortStep(pane, ['shift+down'], (shown) => shown === 'low' || shown === 'none')
      if (done.ok && done.value === 'set') await keepEffort(pane, effort)
      return done
    },
    async clearInputBox(chat) {
      const target = await agentPane(chat)
      if (!target.ok) return target
      if (typeof target.value === 'string') return ok(target.value)
      const { pane, status, claude } = target.value
      if (!claude) return ok('noCommands')
      if (status === 'needsYou') return ok('needsYou')
      const box = await inputBox(pane)
      if (!box.ok) return box
      if (box.value === null) return ok('inputUnreadable')
      if (box.value.text === '') return ok('cleared')
      const keys = await emptyBox(pane, box.value)
      if (!keys.ok) return keys
      if (keys.value === 'needsYou') return ok('needsYou')
      const after = await inputBox(pane)
      if (!after.ok) return after
      if (after.value === null) return ok('inputUnreadable')
      return ok(after.value.text === '' ? 'cleared' : 'inputNotEmpty')
    },
    async cancel(chat) {
      const target = await agentPane(chat)
      if (!target.ok) return target
      if (typeof target.value === 'string') return ok(target.value)
      // A second Escape in Claude Code opens the rewind menu, so a chat that does not work gets none.
      if (target.value.status !== 'working') return ok('notWorking')
      const { pane } = target.value
      const last = stoppedAt.get(pane)
      if (last !== undefined && now() - last < stopHoldMs) return ok('sent')
      // Set before the send, so a stop that comes while this one waits for herdr sends nothing.
      stoppedAt.set(pane, now())
      const sent = await input('agent.send_keys', { target: pane, keys: ['esc'] })
      if (!sent.ok) return sent
      if (sent.value === 'needsYou') return ok('notWorking')
      if (target.value.claude) await clearPutBack(pane)
      return ok('sent')
    },
    async restartModel(chat, model) {
      const target = await agentPane(chat)
      if (!target.ok) return target
      if (typeof target.value === 'string') return ok(target.value)
      const { pane, claude } = target.value
      if (!claude) return ok('noCommands')
      const ready = await restartReady(pane)
      if (!ready.ok) return ready
      if (typeof ready.value === 'string') return ok(ready.value)
      const agent = ready.value
      // A /clear between the reads gives the pane another session, and so another chat.
      if (chatIdOf(agent, new Set()) !== chat && `${machine}/${agent.terminal_id}` !== chat) return ok('notFound')
      const session = sessionOf(agent)
      const path = sessionPath(agent)
      const old = SessionId.safeParse(session)
      if (path === undefined || !old.success) return ok('launchArgsUnknown')
      const shown = (await keptModel(pane, path)) ?? modelAliasOf((await readClaudeSession(path)).model)
      if (shown === model) return ok('sameModel')
      // The chat's own command line, read from its process: only known flags pass, and none that skips a permission.
      const running = await claudeProcess(pane)
      if (!running.ok) return running
      if (running.value?.argv == null) return ok('launchArgsUnknown')
      const launch = launchArgsOf(running.value.argv)
      if (typeof launch === 'string') return ok(launch)
      const folder = running.value.cwd
      if (folder == null || agent.cwd == null || !(await sameFolder(folder, agent.cwd))) return ok('folderChanged')
      // The owner can type between the checks and the exit: read the status and the box once more, right before it.
      const again = await restartReady(pane)
      if (!again.ok) return again
      if (typeof again.value === 'string') return ok(again.value)
      if (sessionOf(again.value) !== session) return ok('working')
      const sent = await input('agent.send_keys', { target: pane, keys: ['ctrl+c', 'ctrl+c'] })
      if (!sent.ok) return sent
      if (sent.value === 'needsYou') return ok('needsYou')
      forgetPlaces()
      if (!(await claudeEnded(pane))) return err(badReply('the chat did not end after ctrl+c'))
      // From here the old chat has ended: a failure answers `failed` with the session, and nothing starts again.
      const failed = { state: 'failed', session: old.data } satisfies RestartModelResponse
      const herdrName = agent.name ?? undefined
      const name = launch.name ?? herdrName ?? `chat-${randomBytes(3).toString('hex')}`
      const launched = await launchClaude(pane, name, restartArgs(launch, herdrName, old.data, model))
      log.info('chat restarted', {
        flags: launch.kept.filter((token) => token.startsWith('-')),
        started: launched.started && launched.waitFailed === undefined,
        failure: launched.started
          ? launched.waitFailed
          : launched.error.kind === 'herdrError'
            ? launched.error.code
            : launched.error.kind,
      })
      if (!launched.started || launched.waitFailed !== undefined) return ok(failed)
      const resumed = launched.agent === undefined ? undefined : sessionOf(launched.agent)
      if (resumed !== undefined && resumed !== session) return ok(failed)
      // Also when the start is still `starting`: the chat runs with this model once it is up. The new process takes its
      // effort from its flags, so a level the effort keys set is gone.
      setEfforts.delete(effortKey(pane, path))
      setModels.set(effortKey(pane, path), { model, mtimeMs: await mtimeOf(path) })
      for (const tellList of listTellers) tellList()
      if (launched.agent === undefined) return ok({ state: 'starting', chat })
      return ok({ state: resumed === undefined ? 'starting' : startStateOf(launched.agent), chat })
    },
    async focusChat(chat) {
      const found = await paneOf(chat)
      if (!found.ok) return found
      if (found.value === null) return ok('notFound')
      return doneOf(await paneWrite('pane.focus', AnyReply, { pane_id: found.value.pane }))
    },
    async zoomChat(chat, zoomed) {
      const found = await paneOf(chat)
      if (!found.ok) return found
      if (found.value === null) return ok('notFound')
      const written = await paneWrite('pane.zoom', ZoomReply, {
        pane_id: found.value.pane,
        mode: zoomed ? 'on' : 'off',
      })
      if (!written.ok || written.value === 'notFound') return doneOf(written)
      return ok(written.value.zoom.reason === 'single_pane' ? 'singlePane' : 'done')
    },
    async swapChats(chat, other) {
      const [one, two] = await Promise.all([paneOf(chat), paneOf(other)])
      if (!one.ok) return one
      if (!two.ok) return two
      if (one.value === null || two.value === null) return ok('notFound')
      if (one.value.pane === two.value.pane) return ok('samePane')
      if (one.value.tab !== two.value.tab) return ok('otherTab')
      const written = await paneWrite('pane.swap', SwapReply, {
        source_pane_id: one.value.pane,
        target_pane_id: two.value.pane,
      })
      if (!written.ok || written.value === 'notFound') return doneOf(written)
      const { reason } = written.value.swap
      if (reason === 'cross_tab') return ok('otherTab')
      if (reason === 'not_found') return ok('notFound')
      return ok(reason === 'same_pane' ? 'samePane' : 'done')
    },
    async closeChat(chat) {
      const found = await paneOf(chat)
      if (!found.ok) return found
      if (found.value === null) return ok('notFound')
      const { status, pane } = found.value
      if (status === 'needsYou') return ok('needsYou')
      // A chat whose state herdr cannot tell may work, so only an idle or done chat (or a shell) closes.
      if (status !== 'idle' && status !== 'done') return ok('working')
      return doneOf(await paneWrite('pane.close', AnyReply, { pane_id: pane }))
    },
    async moveChat(chat, tab, direction, beside) {
      const { machine: on, local } = splitId(tab)
      if (on !== machine) return ok('notFound')
      const [found, near] = await Promise.all([paneOf(chat), beside === undefined ? ok(undefined) : paneOf(beside)])
      if (!found.ok) return found
      if (!near.ok) return near
      if (found.value === null || near.value === null) return ok('notFound')
      // A herdr tab ID holds its workspace's ID before the colon; a chat moves only to a tab of its own workspace.
      const { workspace, pane } = found.value
      if (workspace !== undefined && local.split(':')[0] !== workspace) return ok('notFound')
      if (found.value.tab === local) return ok('sameTab')
      if (near.value !== undefined && near.value.tab !== local) return ok('notFound')
      const written = await paneWrite('pane.move', MoveReply, {
        pane_id: pane,
        destination: {
          type: 'tab',
          tab_id: local,
          split: direction === 'row' ? 'right' : 'down',
          ...(near.value === undefined ? {} : { target_pane_id: near.value.pane }),
        },
        focus: false,
      })
      if (!written.ok || written.value === 'notFound') return doneOf(written)
      const { reason } = written.value.move_result
      if (reason === 'same_tab') return ok('sameTab')
      return ok(reason === 'zoomed_tab' ? 'zoomedTab' : 'done')
    },
    async moveToWorkspace(chat, workspace) {
      const { machine: on, local } = splitId(workspace)
      if (on !== machine) return ok('notFound')
      // herdr also takes a workspace's number ("1") as its ID, so only a listed ID is a target.
      const [listed, found] = await Promise.all([call('workspace.list', WorkspaceList), paneOf(chat)])
      if (!listed.ok) return listed
      if (!found.ok) return found
      if (found.value === null || !listed.value.workspaces.some((w) => w.workspace_id === local)) return ok('notFound')
      const { pane, terminal, workspace: from, status } = found.value
      if (from === local) return ok('sameWorkspace')
      if (status === 'needsYou') return ok('needsYou')
      // As for a close: a state herdr cannot tell may work.
      if (status !== 'idle' && status !== 'done') return ok('working')
      // A workspace that holds the coordinator's chat or the server keeps all its panes (the close guard's rule).
      const [agents, panes] = await Promise.all([call('agent.list', AgentList), call('pane.list', PaneList)])
      if (!agents.ok) return agents
      if (!panes.ok) return panes
      const names = new Map(agents.value.agents.filter(isChat).map((a) => [a.pane_id, a.name]))
      const source = panes.value.panes.filter((p) => p.workspace_id === from)
      if (source.some((p) => guardedPane(p, names.get(p.pane_id)))) return ok('holdsServer')
      const runs = await runsServer(source.map((p) => p.pane_id))
      if (!runs.ok) return runs
      if (runs.value) return ok('holdsServer')
      // Another client can start a turn or move the pane during those reads, so the chat is read again just before.
      const last = await paneOf(chat)
      if (!last.ok) return last
      if (last.value === null) return ok('notFound')
      if (last.value.status === 'needsYou') return ok('needsYou')
      // A pane that moved meanwhile counts as busy: the page reads the list again and can try again.
      const changed = last.value.pane !== pane || last.value.workspace !== from
      if (changed || (last.value.status !== 'idle' && last.value.status !== 'done')) return ok('working')
      // A new tab of the target, so no pane there changes its size; a workspace whose last pane leaves closes.
      const written = await paneWrite('pane.move', WorkspaceMoveReply, {
        pane_id: pane,
        destination: { type: 'new_tab', workspace_id: local },
        focus: false,
      })
      if (!written.ok) return written
      if (written.value === 'notFound') return ok('notFound')
      const before = terminal ?? written.value.move_result.pane?.terminal_id
      const after = written.value.move_result.pane?.terminal_id ?? terminal
      if (before === undefined || after === undefined) return err(badReply('herdr pane.move: no terminal'))
      // herdr gives the pane a new ID: what the adapter keeps by pane, and each status watch of the chat, follow it.
      const next = written.value.move_result.pane?.pane_id
      if (next !== undefined && next !== pane) {
        repane(pane, next)
        for (const tellMoved of moveTellers) tellMoved(chat, next)
      }
      for (const tellList of listTellers) tellList()
      // herdr closes a workspace whose last pane leaves, and names it in the reply.
      const sourceClosed = from !== undefined && written.value.move_result.closed_workspace_id === from
      return ok({ from: paneIdOf(before), to: paneIdOf(after), sourceClosed })
    },
    async renameWorkspace(workspace, label) {
      const { machine: on, local } = splitId(workspace)
      if (on !== machine) return ok('notFound')
      // herdr also takes a workspace's number ("1") as its ID, so only a listed ID is renamed.
      const listed = await call('workspace.list', WorkspaceList)
      if (!listed.ok) return listed
      if (!listed.value.workspaces.some((w) => w.workspace_id === local)) return ok('notFound')
      // herdr sends workspace.renamed, so each list stream reads the list again.
      return doneOf(await paneWrite('workspace.rename', AnyReply, { workspace_id: local, label }))
    },
    async renameChat(chat, label) {
      const found = await paneOf(chat)
      if (!found.ok) return found
      if (found.value === null) return ok('notFound')
      const written = doneOf(await paneWrite('pane.rename', AnyReply, { pane_id: found.value.pane, label }))
      // herdr sends no list event for a pane's label.
      if (written.ok && written.value === 'done') for (const tellList of listTellers) tellList()
      return written
    },
    async closeWorkspace(workspace, count) {
      const { machine: on, local } = splitId(workspace)
      if (on !== machine) return ok('notFound')
      const workspaces = await call('workspace.list', WorkspaceList)
      if (!workspaces.ok) return workspaces
      if (!workspaces.value.workspaces.some((w) => w.workspace_id === local)) return ok('notFound')
      // The workspace's panes, with the status and herdr name of each chat in them.
      const snapshot = async () => {
        const [agents, panes] = await Promise.all([call('agent.list', AgentList), call('pane.list', PaneList)])
        if (!agents.ok) return agents
        if (!panes.ok) return panes
        const chats = new Map(agents.value.agents.filter(isChat).map((a) => [a.pane_id, a]))
        const inWorkspace = panes.value.panes.filter((p) => p.workspace_id === local)
        const own = inWorkspace.map((p) => p.pane_id)
        const statuses = own.map((p) => {
          const chat = chats.get(p)
          return chat === undefined ? 'idle' : statusOf(chat.agent_status)
        })
        // A herdr name clears when its agent ends, so the pane's label and title (Claude's session name) count too.
        const guardedName = inWorkspace.some((p) => guardedPane(p, chats.get(p.pane_id)?.name))
        return ok({ own, statuses, guardedName })
      }
      const first = await snapshot()
      if (!first.ok) return first
      if (first.value.own.length !== count) return ok('panesChanged')
      // The coordinator's chat never closes, wherever the server runs.
      if (first.value.guardedName) return ok('holdsServer')
      // Nor a pane whose shell or foreground process is the server or above it.
      const runs = await runsServer(first.value.own)
      if (!runs.ok) return runs
      if (runs.value) return ok('holdsServer')
      // Another client can add a pane or start a turn during those reads, so the lists are read again just before.
      const last = await snapshot()
      if (!last.ok) return last
      const { own, statuses, guardedName } = last.value
      if (own.length !== first.value.own.length || own.some((p) => !first.value.own.includes(p)))
        return ok('panesChanged')
      if (guardedName) return ok('holdsServer')
      if (statuses.includes('needsYou')) return ok('needsYou')
      // As for a chat's close: a state herdr cannot tell may work.
      if (statuses.some((s) => s !== 'idle' && s !== 'done')) return ok('working')
      const reply = await herdrRequest(socket, 'workspace.close', { workspace_id: local, close_group: false })
      if (reply.ok) return ok('done')
      if (reply.error.kind === 'herdrError' && reply.error.code === 'workspace_group_close_required') return ok('group')
      return writeFailed('workspace.close', reply.error)
    },
    async orderWorkspaces(order) {
      const listed = await call('workspace.list', WorkspaceList)
      if (!listed.ok) return listed
      const locals = order.filter((id) => splitId(id).machine === machine).map((id) => splitId(id).local)
      const current = listed.value.workspaces.map((w) => w.workspace_id)
      const same = locals.length === order.length && locals.length === current.length
      if (!same || new Set(locals).size !== locals.length || !current.every((id) => locals.includes(id)))
        return ok('stale')
      // One move of the whole list, before no workspace: herdr then shows them in this order and sends a list event.
      return doneOf(
        await paneWrite('workspace.move_block', AnyReply, { workspace_ids: locals, before_workspace_id: null }),
      )
    },
    async splitChat(chat, direction) {
      const found = await paneOf(chat)
      if (!found.ok) return found
      if (found.value === null) return ok('notFound')
      const { pane, cwd } = found.value
      const written = await paneWrite('pane.split', SplitReply, {
        target_pane_id: pane,
        direction: direction === 'row' ? 'right' : 'down',
        focus: false,
        // The new shell starts in the chat's folder.
        ...(cwd === undefined ? {} : { cwd }),
      })
      if (!written.ok) return written
      if (written.value === 'notFound') return ok('notFound')
      return ok({ chat: ChatId.parse(`${machine}/${written.value.pane.terminal_id}`) })
    },
    startChat: (request) => startIn(request, []),
    async projectWorkspaces() {
      const [spaces, panes] = await Promise.all([call('workspace.list', WorkspaceList), call('pane.list', PaneList)])
      if (!spaces.ok) return spaces
      if (!panes.ok) return panes
      const found = new Map<string, WorkspaceId>()
      const top = chatRoot === undefined ? null : await realpath(join(chatRoot, 'projects')).catch(() => null)
      if (top === null) return ok(found)
      for (const space of spaces.value.workspaces) {
        for (const pane of panes.value.panes.filter((p) => p.workspace_id === space.workspace_id)) {
          const real = pane.cwd === undefined || pane.cwd === null ? null : await realpath(pane.cwd).catch(() => null)
          // The first folder name below projects/ is the project, as in <chat root>/projects/<project>/<repo>.
          const project = real?.startsWith(top + sep) ? real.slice(top.length + 1).split(sep)[0] : undefined
          if (project !== undefined && project !== '' && !found.has(project))
            found.set(project, WorkspaceId.parse(`${machine}/${space.workspace_id}`))
        }
      }
      return ok(found)
    },
    async askSide(chat, question, signal) {
      const found = await savedSession(chat)
      if (!found.ok || typeof found.value === 'string') return found
      const folder = found.value.agent.cwd
      if (folder == null) return ok('noSession')
      if (runSide === undefined) return err({ reason: 'unreachable', message: 'this server runs no side questions' })
      const { session, file } = found.value
      const record = {
        codeMode: await readCodeMode(file),
        // Read only for a run that cannot resume; the record has no tool results (claudeTranscript.ts).
        text: async () =>
          sideRecord((await readClaudeTranscript(file, { working: false, cwd: folder, home, uploads })).entries),
      }
      return ok(runSide({ session, folder, question, record, signal }))
    },
    async forkChat(chat, { name, direction }) {
      const found = await savedSession(chat)
      if (!found.ok || typeof found.value === 'string') return found
      const { agent, session, agents } = found.value
      const base = /^[a-z][a-z0-9_-]*$/.test(agent.name ?? '') ? (agent.name ?? 'chat') : 'chat'
      const stem = `${base.slice(0, 25)}-fork`
      const taken = new Set(agents.map((a) => a.name))
      const free = [stem, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (n === stem ? stem : `${stem}-${String(n)}`))
      return startIn(
        {
          kind: 'claude',
          name: name ?? free.find((n) => !taken.has(n)) ?? stem,
          place: { in: 'split', beside: chat, direction },
        },
        ['--resume', session, '--fork-session'],
      )
    },
    async setSplitRatio(tab, path, ratio) {
      const { machine: on, local } = splitId(tab)
      if (on !== machine) return ok('notFound')
      return doneOf(
        await paneWrite('layout.set_split_ratio', AnyReply, {
          tab_id: local,
          // herdr names each step by a boolean: true for the second part.
          path: path.map((side) => side === 'second'),
          ratio,
        }),
      )
    },
    async readTranscript(chat) {
      const located = await locate(chat)
      if (!located.ok) return located
      if (located.value === null) return ok(null)
      const { path, working, cwd } = located.value
      if (path === undefined) return ok({ entries: [], earlier: false })
      return ok(await readClaudeTranscript(path, { working, cwd, home, uploads }))
    },
    async readTranscriptPage(chat, page) {
      const located = await locate(chat)
      if (!located.ok) return located
      if (located.value === null) return ok(null)
      const { path, working, cwd } = located.value
      if (path === undefined) return ok(page.before === undefined ? { entries: [], earlier: false } : 'entryNotFound')
      return ok(await readClaudeTranscriptPage(path, { working, cwd, home, uploads }, page))
    },
    async turnEnd(chat) {
      const located = await locate(chat)
      if (!located.ok) return located
      const path = located.value?.path
      if (path === undefined) return ok(null)
      const mtime = await mtimeOf(path)
      return ok(mtime < 0 ? null : new Date(mtime).toISOString())
    },
    async readSkills(chat) {
      const located = await locate(chat)
      if (!located.ok) return located
      if (located.value === null) return ok(null)
      const { claude, cwd } = located.value
      // Claude Code's own folder holds the projects folder, the owner's skills and commands.
      return ok(claude ? await readClaudeSkills(cwd, dirname(claudeProjects), home) : [])
    },
    watchTranscript(chat, onChange, onEnd) {
      let over = false
      let watcher: FSWatcher | undefined
      let stream: HerdrStream | undefined
      const close = () => {
        over = true
        moveTellers.delete(onMoved)
        watcher?.close()
        watcher = undefined
        stream?.close()
        stream = undefined
      }
      const end = (error: AgentPortError) => {
        if (over) return
        close()
        onEnd(error)
      }
      const tell = () => {
        if (!over) onChange()
      }
      // A watch that fails ends the stream, so the client opens it again; it does not go quiet.
      const failed = () => {
        end({ reason: 'unreachable', message: 'transcript watch failed' })
      }
      let session: string | undefined
      let onFile = false
      /**
       * Watches the session file itself once it is there. On macOS a folder watch (FSEvents) can lose a write while
       * it starts, and a file watch (kqueue) cannot. Until the file is there, a watch of its folder, or of the
       * projects folder until the folder is there, and each status change of the chat look for it again; when it
       * comes, `tell` makes the reader read it.
       */
      const attach = (told: boolean) => {
        if (over || onFile || session === undefined) return
        const path = session
        const folder = dirname(path)
        // What the watch waits for: the file, or its folder when the folder is not there yet.
        let awaited = path
        watcher?.close()
        watcher = undefined
        try {
          if (existsSync(path)) {
            watcher = watchFs(path, tell)
            onFile = true
          } else if (existsSync(folder)) {
            watcher = watchFs(folder, (_, name) => {
              if (name === basename(path)) attach(true)
            })
          } else {
            awaited = folder
            watcher = watchFs(dirname(folder), (_, name) => {
              if (name === basename(folder)) attach(true)
            })
          }
          watcher.on('error', failed)
        } catch {
          failed()
          return
        }
        if (onFile) {
          if (told) tell()
          return
        }
        // What the watch waits for can come between the check and the watch.
        if (existsSync(awaited)) attach(true)
      }
      /** A tool stops running when its chat stops working, which can come with no write to the session file. */
      const statusWatch = (pane: string) =>
        new Promise<void>((started) => {
          const mine = herdrSubscribe(socket, [{ type: 'pane.agent_status_changed', pane_id: pane }], {
            onStart: started,
            onEvent: (line) => {
              if (!StatusChanged.safeParse(line).success) return
              attach(true)
              tell()
            },
            onEnd: (failure) => {
              started()
              // A stream that a move replaced ends with nothing to say.
              if (stream !== mine) return
              // The pane closed: its chat leaves the list, and the transcript stream ends there as gone.
              if (paneGone(failure)) stream = undefined
              else end(portErrorOf(failure))
            },
          })
          stream = mine
        })
      /** The pane that the last move gave the chat, and whether the status stream was started yet. */
      let movedTo: string | undefined
      let watching = false
      // A move gives the chat's pane a new herdr ID, and its status stream then follows the new one. A move while the
      // watch starts leaves it to the start; a stream that ended first (the old ID is gone) starts again.
      const onMoved = (moved: ChatId, pane: string) => {
        if (over || moved !== chat) return
        movedTo = pane
        if (!watching) return
        const old = stream
        stream = undefined
        old?.close()
        void statusWatch(pane)
      }
      moveTellers.add(onMoved)
      const ready = locate(chat).then(async (located) => {
        if (over) return
        if (!located.ok) {
          end(located.error)
          return
        }
        const found = located.value
        if (found === null) return
        const { path, pane } = found
        session = path
        attach(false)
        if (pane === undefined) return
        watching = true
        await statusWatch(movedTo ?? pane)
      })
      return { ready, close }
    },
    async readLayout(workspace) {
      const first = await readLayoutOnce(workspace)
      // A pane can close between layout.export and pane.list; one more read sees the tree without it.
      return !first.ok && first.error.message === strayPane ? readLayoutOnce(workspace) : first
    },
    listWorkspaces: listAll,
    async createWorkspace(label) {
      const made = await call('workspace.create', CreatedWorkspace, {
        label,
        focus: false,
        ...(chatRoot === undefined ? {} : { cwd: chatRoot }),
      })
      if (!made.ok) return made
      const id = WorkspaceId.parse(`${machine}/${made.value.workspace.workspace_id}`)
      // herdr sends workspace.created, so each list stream reads the list again.
      const listed = await listAll()
      if (!listed.ok) return listed
      return ok(listed.value.find((w) => w.id === id) ?? { id, label, chats: [] })
    },
    subscribe(onEvent, onEnd) {
      let listening: () => void = () => undefined
      const ready = new Promise<void>((resolve) => {
        listening = resolve
      })
      let over = false
      let stream: HerdrStream | undefined
      let settle: ReturnType<typeof setTimeout> | undefined
      let lateSession: ReturnType<typeof setTimeout> | undefined
      let folderWatches: FSWatcher[] = []
      /** The session folders that this stream watches now; a Claude chat in another folder is not cached. */
      const watchedFolders = new Set<string>()
      const unwatchFolders = () => {
        for (const w of folderWatches) w.close()
        folderWatches = []
        watchedFolders.clear()
      }
      /** Whether this subscription counts as an open stream for the place cache. */
      let counted = false
      const uncount = () => {
        if (!counted) return
        counted = false
        openStreams -= 1
        if (openStreams === 0) forgetPlaces()
      }
      const end = (error: AgentPortError) => {
        if (over) return
        over = true
        listTellers.delete(tellList)
        uncount()
        clearTimeout(settle)
        clearTimeout(lateSession)
        unwatchFolders()
        clearTimeout(layoutSettle)
        clearTimeout(layoutMax)
        stream?.close()
        listening()
        onEnd(error)
      }
      const tell = (event: AgentEvent) => {
        if (!over) onEvent(event)
      }
      // Only an open stream is in `listTellers`: its end and its close take it out.
      const tellList = () => {
        onEvent({ type: 'workspacesChanged' })
      }
      listTellers.add(tellList)

      /** The workspace a layout event names, in the app's terms; undefined for any other line. */
      const layoutWorkspaceOf = (line: unknown): WorkspaceId | undefined => {
        const parsed = LayoutLine.safeParse(line)
        if (!parsed.success) return undefined
        // herdr names an event "tab.created" in a stream; accept its "tab_created" form too.
        const name = parsed.data.event.includes('.') ? parsed.data.event : parsed.data.event.replace('_', '.')
        const { data } = parsed.data
        const local = data.workspace_id ?? data.layout?.workspace_id ?? data.tab?.workspace_id
        const id = WorkspaceId.safeParse(`${machine}/${local ?? ''}`)
        return isLayoutEvent.has(name) && local !== undefined && id.success ? id.data : undefined
      }

      /**
       * Layout events come in bursts (a focus and a split change): tell each workspace once when the burst
       * settles, or at most `maxLayoutWaitMs` after its first event, so the app follows a long split drag.
       */
      const changedLayouts = new Set<WorkspaceId>()
      let layoutSettle: ReturnType<typeof setTimeout> | undefined
      let layoutMax: ReturnType<typeof setTimeout> | undefined
      const flushLayouts = () => {
        clearTimeout(layoutSettle)
        clearTimeout(layoutMax)
        layoutMax = undefined
        const changed = [...changedLayouts]
        changedLayouts.clear()
        for (const w of changed) tell({ type: 'layoutChanged', workspace: w })
      }
      const changedLayout = (workspace: WorkspaceId) => {
        // A pane may have moved or closed: no prompt uses a cached place until the list is read again.
        forgetPlaces()
        changedLayouts.add(workspace)
        clearTimeout(layoutSettle)
        layoutSettle = setTimeout(flushLayouts, settleMs)
        layoutMax ??= setTimeout(flushLayouts, maxLayoutWaitMs)
      }

      /** Reads the agents, then opens the stream for their panes; `changed` tells the app to read the list once it is open. */
      /** The number of the newest open; an older one that ends its reads later opens nothing. */
      let opens = 0
      /** The subscriptions in a row that herdr refused for a pane that closed. */
      let goneRetries = 0
      const open = async (changed: boolean) => {
        opens += 1
        const mine = opens
        const age = placesAge
        const [agents, panes] = await Promise.all([call('agent.list', AgentList), call('pane.list', PaneList)])
        if (over || mine !== opens) return
        if (!agents.ok) {
          end(agents.error)
          return
        }
        if (!panes.ok) {
          end(panes.error)
          return
        }
        const chats = chatIdsOf(agents.value.agents, panes.value.panes)
        watchSessionFolders(agents.value.agents)
        const subscriptions = [
          ...listEvents.map((type) => ({ type })),
          ...layoutEvents.map((type) => ({ type })),
          ...[...chats.keys()].map((pane_id) => ({ type: 'pane.agent_status_changed', pane_id })),
        ]
        stream = herdrSubscribe(socket, subscriptions, {
          onStart: () => {
            goneRetries = 0
            if (!counted) {
              counted = true
              openStreams += 1
            }
            // The places of this read, unless the cache was emptied while it ran.
            if (age === placesAge) {
              const shared = sharedSessions(agents.value.agents)
              for (const a of agents.value.agents.filter(isChat)) {
                // A /clear shows only through the session folder's watch: with none, the chat may have a new session.
                const path = a.agent === 'claude' ? sessionPath(a) : undefined
                if (a.agent === 'claude' && (path === undefined || !watchedFolders.has(dirname(path)))) continue
                const id = chatIdOf(a, shared)
                // A status that a stream's event gave after this read began is newer than the read's own.
                const had = places.get(id)
                const status = had?.pane === a.pane_id ? had.status : statusOf(a.agent_status)
                places.set(id, { pane: a.pane_id, status, claude: a.agent === 'claude' })
              }
            }
            listening()
            if (changed) tell({ type: 'workspacesChanged' })
          },
          onEvent: (line) => {
            const status = StatusChanged.safeParse(line)
            const chat = status.success ? chats.get(status.data.data.pane_id) : undefined
            if (status.success && chat) {
              const next = statusOf(status.data.data.agent_status)
              const place = places.get(chat)
              if (place !== undefined) places.set(chat, { ...place, status: next })
              tell({ type: 'chatStatus', chat, status: next })
              // A turn that ends changes the chat's model and context share: the app reads the list again.
              if (next === 'idle') tell({ type: 'workspacesChanged' })
              return
            }
            const workspace = layoutWorkspaceOf(line)
            if (workspace === undefined) reopen()
            else changedLayout(workspace)
          },
          onEnd: (failure) => {
            // A pane closed after the list read: subscribe again to the chats that are left, and end no stream.
            if (paneGone(failure) && goneRetries < maxGoneRetries) {
              forgetPlaces()
              goneRetries += 1
              void open(true)
              return
            }
            end(portErrorOf(failure))
          },
        })
      }

      /** Watches the folder of each listed Claude session; a session file that no listed chat has reads the list again. */
      const watchSessionFolders = (agents: readonly HerdrAgent[]) => {
        unwatchFolders()
        const paths = agents.flatMap((a) => (a.agent === 'claude' ? (sessionPath(a) ?? []) : []))
        const known = new Set(paths.map((p) => basename(p)))
        for (const folder of new Set(paths.map((p) => dirname(p)))) {
          try {
            const watcher = watchFs(folder, (event, name) => {
              // Only a new top-level session file: an append is a change event, and a subagent's file is in a subfolder.
              if (event !== 'rename' || name === null || known.has(name)) return
              if (!name.endsWith('.jsonl') || !sessionName.test(name.slice(0, -'.jsonl'.length))) return
              reopen()
              clearTimeout(lateSession)
              lateSession = setTimeout(reopen, lateSessionMs)
            })
            // A folder that goes away ends its watch; the list stream still runs, and no cached place trusts it.
            watcher.on('error', () => {
              watcher.close()
              watchedFolders.delete(folder)
              forgetPlaces()
            })
            folderWatches.push(watcher)
            watchedFolders.add(folder)
          } catch (error) {
            // A folder that is not there yet gets a watch when the list is read again. The log keeps no path.
            const code = error instanceof Error && 'code' in error ? String(error.code) : 'unknown'
            log.warn('session folder not watched', { code })
          }
        }
      }

      /** A pane or workspace came or went: wait for the burst to settle, then open the stream again. */
      const reopen = () => {
        forgetPlaces()
        clearTimeout(settle)
        settle = setTimeout(() => {
          stream?.close()
          void open(true)
        }, settleMs)
      }

      // The app read the list before this stream started; a change in between is told when it starts.
      void open(true)
      return {
        ready,
        close: () => {
          over = true
          listTellers.delete(tellList)
          uncount()
          listening()
          clearTimeout(settle)
          clearTimeout(lateSession)
          unwatchFolders()
          clearTimeout(layoutSettle)
          clearTimeout(layoutMax)
          stream?.close()
        },
      }
    },
  }
}
