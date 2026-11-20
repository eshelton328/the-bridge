// The workspaces service: the workspaces of this machine, their chats and
// the layout of each workspace's tabs and panes.
import type { WorkspaceId, WorkspaceLayout, WorkspacesResponse } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError } from './agentPort.ts'

export async function listWorkspaces(agents: AgentPort): Promise<Result<WorkspacesResponse, AgentPortError>> {
  const read = await agents.listWorkspaces()
  return read.ok ? ok({ machine: agents.machine, workspaces: read.value }) : read
}

/** The layout of `workspace`; `null` when this machine has no such workspace. */
export function readLayout(
  agents: AgentPort,
  workspace: WorkspaceId,
): Promise<Result<WorkspaceLayout | null, AgentPortError>> {
  return agents.readLayout(workspace)
}
