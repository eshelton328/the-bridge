// A pick in a live chat's Move to workspace list (backend #435): the chat
// moves at once, unless it is the last chat of its workspace, whose move
// closes that workspace; then the screen asks first (`ui.moveAsk`,
// MoveWorkspaceDialog.tsx). Pure.
import type { WorkspaceEdits, WorkspacesData, WorkspacesUi } from '../types.ts'

/** The workspace that lists `chat`, if any. */
export const workspaceOf = (data: WorkspacesData, chat: string) =>
  data.workspaces.find((w) => w.chats?.some((c) => c.id === chat))

/** Whether `chat` is the only chat its workspace lists, so moving it closes that workspace. */
function isLastChat(data: WorkspacesData, chat: string): boolean {
  const owner = workspaceOf(data, chat)
  return owner !== undefined && (owner.chats?.length ?? owner.count) <= 1
}

/**
 * Moves `chat` to `workspace` with `edits`, or asks first when it is its workspace's last chat; answers the ui change
 * that closes the menu (and opens the question).
 */
export function moveOrAsk(
  data: WorkspacesData,
  edits: WorkspaceEdits,
  chat: string,
  workspace: string,
): Partial<WorkspacesUi> {
  const closed = { menuFor: null, moveOpen: false, moveTarget: null }
  if (isLastChat(data, chat)) return { ...closed, moveAsk: { chat, workspace } }
  edits.moveChat(chat, workspace)
  return closed
}
