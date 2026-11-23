// A pick in a live chat's Move to workspace list (backend #435): the chat
// moves at once, unless it is the last chat of its workspace, whose move
// closes that workspace; then the screen asks first (`ui.moveAsk`,
// MoveWorkspaceDialog.tsx). Pure.
import type { WorkspaceEdits, WorkspaceLayout, WorkspacesData, WorkspacesUi } from '../types.ts'
import { openChat } from './workspaceLayout.ts'

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

/** `layout` without `chat`: not among its panes, and not its focused pane. */
function without(layout: WorkspaceLayout, chat: string): WorkspaceLayout {
  const { focusedPane, ...rest } = layout
  const panes = rest.panes.filter((p) => p !== chat)
  return focusedPane === undefined || focusedPane === chat ? { ...rest, panes } : { ...rest, panes, focusedPane }
}

/**
 * The ui change that opens `chat` in the workspace the list shows it in now, after a move (Codex review of #438): that
 * workspace's tab is selected, a workspace that closed with the move keeps no saved layout, and no other workspace's
 * saved layout keeps the chat, so a layout saved before the move never shows it in its old place.
 */
export function openMoved(data: WorkspacesData, ui: WorkspacesUi, chat: string): Partial<WorkspacesUi> {
  const owner = workspaceOf(data, chat)?.id
  if (owner === undefined) return openChat(data, ui, chat)
  const listed = new Set(data.workspaces.map((w) => w.id))
  const layouts = Object.fromEntries(
    Object.entries(ui.layouts ?? {}).flatMap(([id, layout]) =>
      id === owner ? [[id, layout]] : listed.has(id) ? [[id, without(layout, chat)]] : [],
    ),
  )
  return { layouts, ...openChat(data, { ...ui, layouts, workspace: owner }, chat), workspace: owner }
}
