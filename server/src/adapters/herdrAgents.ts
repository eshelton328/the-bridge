// The herdr adapter of the AgentPort (d-110). It reads herdr's
// workspace.list and agent.list, finds each Claude chat's session file from
// its agent_session, and reads the model from it. It reads only when
// listWorkspaces is called. subscribe holds one events.subscribe stream
// open: each chat's status, and the panes and workspaces that come and go;
// when one comes or goes it opens the stream again for the new panes and
// tells the app to read the list again. herdr's pane IDs stay here: a chat's ID is its
// agent session ID, or herdr's terminal ID when it has none or when another
// pane has resumed the same session, so each chat ID is on one chat only.
// A herdr ID that the contract's IDs cannot hold makes the reply badReply.
import { join } from 'node:path'
import { ChatId, type ChatStatus, type ChatSummary, LocalIdPart, type MachineId, WorkspaceId } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type { Logger } from '../logger.ts'
import type { AgentEvent, AgentPort, AgentPortError } from '../services/agentPort.ts'
import { type SocketFailure, type HerdrStream, herdrRequest, herdrSubscribe } from './herdrSocket.ts'
import { claudeProjectFolder, readClaudeModel } from './sessionFile.ts'

const HerdrStatus = z.enum(['idle', 'working', 'blocked', 'done', 'unknown'])

const WorkspaceList = z.object({
  workspaces: z.array(z.object({ workspace_id: LocalIdPart, label: z.string() })),
})

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

  const call = async <T>(method: string, schema: z.ZodType<T>): Promise<Result<T, AgentPortError>> => {
    const reply = await herdrRequest(socket, method, {})
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

  return {
    machine,
    async listWorkspaces() {
      const [workspaces, agents] = await Promise.all([
        call('workspace.list', WorkspaceList),
        call('agent.list', AgentList),
      ])
      if (!workspaces.ok) return workspaces
      if (!agents.ok) return agents
      const shared = sharedSessions(agents.value.agents)
      const summaries = await Promise.all(
        workspaces.value.workspaces.map(async (w) => ({
          id: WorkspaceId.parse(`${machine}/${w.workspace_id}`),
          label: w.label,
          chats: await Promise.all(
            agents.value.agents.flatMap((a) =>
              a.workspace_id === w.workspace_id && isChat(a) ? [chatOf(a, a.agent, shared)] : [],
            ),
          ),
        })),
      )
      return ok(summaries)
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
        stream?.close()
        listening()
        onEnd(error)
      }
      const tell = (event: AgentEvent) => {
        if (!over) onEvent(event)
      }

      /** Reads the agents, then opens the stream for their panes; `changed` tells the app to read the list once it is open. */
      const open = async (changed: boolean) => {
        const agents = await call('agent.list', AgentList)
        if (over) return
        if (!agents.ok) {
          end(agents.error)
          return
        }
        const shared = sharedSessions(agents.value.agents)
        const chats = new Map(agents.value.agents.filter(isChat).map((a) => [a.pane_id, chatIdOf(a, shared)]))
        const subscriptions = [
          ...listEvents.map((type) => ({ type })),
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
            if (status.success && chat)
              tell({ type: 'chatStatus', chat, status: statusOf(status.data.data.agent_status) })
            else reopen()
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
          stream?.close()
        },
      }
    },
  }
}
