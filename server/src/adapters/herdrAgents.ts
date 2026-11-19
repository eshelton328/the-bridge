// The herdr adapter of the AgentPort (d-110). It reads herdr's
// workspace.list and agent.list, finds each Claude chat's session file from
// its agent_session, and reads the model from it. It reads only when
// listWorkspaces is called. herdr's pane IDs stay here: a chat's ID is its
// agent session ID, or herdr's terminal ID when it has none.
import { join } from 'node:path'
import { ChatId, type ChatStatus, type ChatSummary, type MachineId, WorkspaceId } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type { AgentPort, AgentPortError } from '../services/agentPort.ts'
import { herdrRequest } from './herdrSocket.ts'
import { claudeProjectFolder, readClaudeModel } from './sessionFile.ts'

const HerdrStatus = z.enum(['idle', 'working', 'blocked', 'done', 'unknown'])

const WorkspaceList = z.object({
  workspaces: z.array(z.object({ workspace_id: z.string(), label: z.string() })),
})

const AgentList = z.object({
  agents: z.array(
    z.object({
      agent: z.string().nullable().optional(),
      agent_session: z.object({ kind: z.string(), value: z.string() }).nullable().optional(),
      agent_status: HerdrStatus,
      cwd: z.string().nullable().optional(),
      name: z.string().nullable().optional(),
      terminal_id: z.string(),
      terminal_title_stripped: z.string().nullable().optional(),
      workspace_id: z.string(),
    }),
  ),
})
type HerdrAgent = z.infer<typeof AgentList>['agents'][number]

const statusOf = {
  working: 'working',
  blocked: 'needsYou',
  idle: 'idle',
  done: 'done',
  unknown: 'unknown',
} as const satisfies Record<z.infer<typeof HerdrStatus>, ChatStatus>

export type HerdrAgentsOptions = {
  readonly socket: string
  readonly machine: MachineId
  /** Where Claude Code keeps its session files, such as ~/.claude/projects. */
  readonly claudeProjects: string
}

export function createHerdrAgents({ socket, machine, claudeProjects }: HerdrAgentsOptions): AgentPort {
  const call = async <T>(method: string, schema: z.ZodType<T>): Promise<Result<T, AgentPortError>> => {
    const reply = await herdrRequest(socket, method, {})
    if (!reply.ok) return err({ reason: 'unreachable', message: reply.error })
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

  const chatOf = async (agent: HerdrAgent, kind: 'claude' | 'codex'): Promise<ChatSummary> => {
    const session = agent.agent_session?.kind === 'id' ? agent.agent_session.value : undefined
    const id = ChatId.safeParse(`${machine}/${session ?? ''}`)
    const path = kind === 'claude' ? sessionPath(agent) : undefined
    return {
      id: id.success ? id.data : ChatId.parse(`${machine}/${agent.terminal_id}`),
      kind,
      title: [agent.terminal_title_stripped, agent.name].find((t): t is string => Boolean(t)) ?? kind,
      model: path === undefined ? null : await readClaudeModel(path),
      contextUsed: null,
      status: statusOf[agent.agent_status],
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
      const summaries = await Promise.all(
        workspaces.value.workspaces.map(async (w) => ({
          id: WorkspaceId.parse(`${machine}/${w.workspace_id}`),
          label: w.label,
          chats: await Promise.all(
            agents.value.agents.flatMap((a) =>
              a.workspace_id === w.workspace_id && (a.agent === 'claude' || a.agent === 'codex')
                ? [chatOf(a, a.agent)]
                : [],
            ),
          ),
        })),
      )
      return ok(summaries)
    },
  }
}
