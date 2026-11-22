// The workspaces service: the workspaces of this machine, their chats and
// the layout of each workspace's tabs and panes.
import type { ChatId, WorkspaceId, WorkspaceLayout, WorkspacesResponse } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError, CloseWorkspaceOutcome, OrderOutcome, PaneWriteOutcome } from './agentPort.ts'

export async function listWorkspaces(agents: AgentPort): Promise<Result<WorkspacesResponse, AgentPortError>> {
  const read = await agents.listWorkspaces()
  return read.ok ? ok({ machine: agents.machine, workspaces: read.value }) : read
}

/** Gives `workspace` a new label (R41). */
export function renameWorkspace(
  agents: AgentPort,
  workspace: WorkspaceId,
  label: string,
): Promise<Result<PaneWriteOutcome, AgentPortError>> {
  return agents.renameWorkspace(workspace, label)
}

/** Gives the pane of `chat` a new label, which the list shows as the chat's title (R42). */
export function renameChat(
  agents: AgentPort,
  chat: ChatId,
  label: string,
): Promise<Result<PaneWriteOutcome, AgentPortError>> {
  return agents.renameChat(chat, label)
}

/**
 * Closes `workspace` and each pane in it when `confirm` names it (`notConfirmed` otherwise, with no call to the
 * port) and it has the `panes` panes the owner saw. The port refuses a workspace that works, waits for the owner or
 * runs the server (R41).
 */
export async function closeWorkspace(
  agents: AgentPort,
  workspace: WorkspaceId,
  request: { readonly confirm: WorkspaceId; readonly panes: number },
): Promise<Result<CloseWorkspaceOutcome | 'notConfirmed', AgentPortError>> {
  if (request.confirm !== workspace) return ok('notConfirmed')
  return agents.closeWorkspace(workspace, request.panes)
}

/** Puts the workspaces in the owner's order (R41); `stale` when it does not name each listed workspace once. */
export function orderWorkspaces(
  agents: AgentPort,
  order: readonly WorkspaceId[],
): Promise<Result<OrderOutcome, AgentPortError>> {
  return agents.orderWorkspaces(order)
}

/** The layout of `workspace`; `null` when this machine has no such workspace. */
export function readLayout(
  agents: AgentPort,
  workspace: WorkspaceId,
): Promise<Result<WorkspaceLayout | null, AgentPortError>> {
  return agents.readLayout(workspace)
}
