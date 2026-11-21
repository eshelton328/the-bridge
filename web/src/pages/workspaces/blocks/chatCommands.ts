// The commands of a live Claude chat (W5): `/compact` and `/clear` follow
// the chat's other actions in each of its menus, the pane menu, the chat
// actions of the chat shown alone, the tablet's menu and the phone's sheet,
// and each opens its dialog (ChatCommandDialog). They are on only while the
// chat is idle or done, as the server refuses a command for any other status
// (backend #317); a Codex chat, a shell and a sample chat have none, as the
// server takes a command only for a Claude chat.
import type { PaneAction, WorkbenchPane } from '../types.ts'

/** A command a chat's actions can pick: what `ui.chatDialog` opens. */
export type ChatCommandValue = 'compact' | 'clear'

export const isChatCommand = (value: string): value is ChatCommandValue => value === 'compact' || value === 'clear'

/**
 * `actions` with `commands` after them when `pane` is a live Claude chat (`takesCommands` set), each off unless the
 * chat takes commands now (idle or done); `actions` as they are for any other pane.
 */
export function withCommands(
  actions: readonly PaneAction[],
  pane: WorkbenchPane | undefined,
  commands: readonly PaneAction[] | undefined,
): PaneAction[] {
  if (commands === undefined || pane?.type !== 'chat' || pane.takesCommands === undefined) return [...actions]
  const off = !pane.takesCommands
  return [...actions, ...commands.map((c) => (off ? { ...c, disabled: true } : c))]
}
