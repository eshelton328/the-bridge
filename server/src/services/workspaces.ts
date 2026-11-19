// The workspaces service: the workspaces of this machine and their chats.
import type { WorkspacesResponse } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError } from './agentPort.ts'

export async function listWorkspaces(agents: AgentPort): Promise<Result<WorkspacesResponse, AgentPortError>> {
  const read = await agents.listWorkspaces()
  return read.ok ? ok({ machine: agents.machine, workspaces: read.value }) : read
}
