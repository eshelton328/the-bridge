// The herdr adapter of the AgentPort (d-110). It reads herdr's
// workspace.list, agent.list and pane.list, finds each Claude chat's session
// file from its agent_session, and reads the model from it. Every pane that
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
import { basename, join } from 'node:path'
import {
  ChatId,
  type ChatStatus,
  type ChatSummary,
  chatsOf,
  type LayoutNode,
  LocalIdPart,
  type MachineId,
  splitId,
  WorkspaceId,
  WorkspaceLayout,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type { Logger } from '../logger.ts'
import type { AgentEvent, AgentPort, AgentPortError } from '../services/agentPort.ts'
import { type SocketFailure, type HerdrStream, herdrRequest, herdrSubscribe } from './herdrSocket.ts'
import { claudeProjectFolder, readClaudeModel } from './sessionFile.ts'

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

const LayoutExport = z.object({ layout: z.object({ focused_pane_id: z.string(), root: HerdrNode }) })

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

const PaneList = z.object({
  panes: z.array(
    z.object({
      pane_id: z.string(),
      terminal_id: LocalIdPart,
      workspace_id: LocalIdPart,
      agent_status: z.string(),
      label: z.string().nullable().optional(),
    }),
  ),
})
type HerdrPane = z.infer<typeof PaneList>['panes'][number]

const ProcessInfo = z.object({
  process_info: z.object({
    shell_pid: z.number().nullable().optional(),
    foreground_process_group_id: z.number().nullable().optional(),
    foreground_processes: z.array(
      z.object({ pid: z.number(), name: z.string(), argv0: z.string().nullable().optional() }),
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

/** How long the adapter waits for more list events before it opens the stream again. */
const settleMs = 100

const isChat = (agent: HerdrAgent): agent is HerdrAgent & { agent: 'claude' | 'codex' } =>
  agent.agent === 'claude' || agent.agent === 'codex'

export type HerdrAgentsOptions = {
  readonly socket: string
  readonly machine: MachineId
  /** Where Claude Code keeps its session files, such as ~/.claude/projects. */
  readonly claudeProjects: string
  /** Gets one warning for each herdr status the adapter does not know. */
  readonly log: Logger
}

export function createHerdrAgents({ socket, machine, claudeProjects, log }: HerdrAgentsOptions): AgentPort {
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
    if (session.kind === 'path') return session.value
    if (session.kind === 'id' && agent.cwd)
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

  const chatOf = async (
    agent: HerdrAgent,
    kind: 'claude' | 'codex',
    shared: ReadonlySet<string>,
  ): Promise<ChatSummary> => {
    const path = kind === 'claude' ? sessionPath(agent) : undefined
    return {
      id: chatIdOf(agent, shared),
      kind,
      title: [agent.terminal_title_stripped, agent.name].find((t): t is string => Boolean(t)) ?? kind,
      model: path === undefined ? null : await readClaudeModel(path),
      contextUsed: null,
      status: statusOf(agent.agent_status),
      parent: null,
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
      contextUsed: null,
      status: statusOf(pane.agent_status),
      parent: null,
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
          chat: agent !== undefined && isChat(agent) ? await chatOf(agent, agent.agent, shared) : await shellOf(pane),
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
        chats: chatsOf(root).map((id) => byChat.get(id)),
      })
    }
    const layout = WorkspaceLayout.safeParse({ workspace, tabs: layouts })
    return layout.success
      ? ok(layout.data)
      : err(badReply(`herdr layout: ${layout.error.issues[0]?.message ?? 'unknown shape'}`))
  }

  return {
    machine,
    async readLayout(workspace) {
      const first = await readLayoutOnce(workspace)
      // A pane can close between layout.export and pane.list; one more read sees the tree without it.
      return !first.ok && first.error.message === strayPane ? readLayoutOnce(workspace) : first
    },
    async listWorkspaces() {
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
    },
    subscribe(onEvent, onEnd) {
      let listening: () => void = () => undefined
      const ready = new Promise<void>((resolve) => {
        listening = resolve
      })
      let over = false
      let stream: HerdrStream | undefined
      let settle: ReturnType<typeof setTimeout> | undefined
      const end = (error: AgentPortError) => {
        if (over) return
        over = true
        clearTimeout(settle)
        clearTimeout(layoutSettle)
        clearTimeout(layoutMax)
        stream?.close()
        listening()
        onEnd(error)
      }
      const tell = (event: AgentEvent) => {
        if (!over) onEvent(event)
      }

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
        changedLayouts.add(workspace)
        clearTimeout(layoutSettle)
        layoutSettle = setTimeout(flushLayouts, settleMs)
        layoutMax ??= setTimeout(flushLayouts, maxLayoutWaitMs)
      }

      /** Reads the agents, then opens the stream for their panes; `changed` tells the app to read the list once it is open. */
      const open = async (changed: boolean) => {
        const [agents, panes] = await Promise.all([call('agent.list', AgentList), call('pane.list', PaneList)])
        if (over) return
        if (!agents.ok) {
          end(agents.error)
          return
        }
        if (!panes.ok) {
          end(panes.error)
          return
        }
        const chats = chatIdsOf(agents.value.agents, panes.value.panes)
        const subscriptions = [
          ...listEvents.map((type) => ({ type })),
          ...layoutEvents.map((type) => ({ type })),
          ...[...chats.keys()].map((pane_id) => ({ type: 'pane.agent_status_changed', pane_id })),
        ]
        stream = herdrSubscribe(socket, subscriptions, {
          onStart: () => {
            listening()
            if (changed) tell({ type: 'workspacesChanged' })
          },
          onEvent: (line) => {
            const status = StatusChanged.safeParse(line)
            const chat = status.success ? chats.get(status.data.data.pane_id) : undefined
            if (status.success && chat) {
              tell({ type: 'chatStatus', chat, status: statusOf(status.data.data.agent_status) })
              return
            }
            const workspace = layoutWorkspaceOf(line)
            if (workspace === undefined) reopen()
            else changedLayout(workspace)
          },
          onEnd: (failure) => {
            end(portErrorOf(failure))
          },
        })
      }

      /** A pane or workspace came or went: wait for the burst to settle, then open the stream again. */
      const reopen = () => {
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
          listening()
          clearTimeout(settle)
          clearTimeout(layoutSettle)
          clearTimeout(layoutMax)
          stream?.close()
        },
      }
    },
  }
}
