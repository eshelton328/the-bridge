// Pane follow (W5): a live chat keeps its pane when its chat ID changes, as
// /clear starts a new session on the same pane (backend #319), from the page
// or from the terminal. The list then drops the old ID and lists a chat with
// a new ID on the same pane (`ChatSummary.pane`). The page moves every choice
// it keeps by chat ID to the new one: the open chat (`focusedPane`, with the
// phone's chat view), each workspace's saved panes and their focus, the menu,
// skill list and drag that name it, the name the owner gave it and the name
// field he has open on it. The draft is not moved: it was written for the old
// context, so the new chat starts with an empty composer.
import type { WorkspaceLayout, WorkspacesData, WorkspacesUi } from './types.ts'

/** Each live chat's pane by its chat ID, as the page's data lists them; a chat with no pane (a sample's) has none. */
export function chatPanesOf(data: WorkspacesData): ReadonlyMap<string, string> {
  const panes = new Map<string, string>()
  for (const w of data.workspaces) for (const c of w.chats ?? []) if (c.pane !== undefined) panes.set(c.id, c.pane)
  return panes
}

/**
 * The chats that moved from `before` to `now`, old ID to new: a chat of `before` that `now` does not list, whose pane a
 * chat of `now` holds that `before` did not list.
 */
export function paneMoves(
  before: ReadonlyMap<string, string>,
  now: ReadonlyMap<string, string>,
): ReadonlyMap<string, string> {
  const moves = new Map<string, string>()
  for (const [old, pane] of before) {
    if (now.has(old)) continue
    const next = [...now].find(([id, p]) => p === pane && !before.has(id))?.[0]
    if (next !== undefined) moves.set(old, next)
  }
  return moves
}

/**
 * The panes to compare the next list with: `now`'s, and the chats of `before` that left with no chat on their pane yet,
 * so a list that drops the old chat before it lists the new one still moves it. An empty list, such as a read that
 * missed, keeps `before`.
 */
export function nextSeen(before: ReadonlyMap<string, string>, now: ReadonlyMap<string, string>) {
  if (now.size === 0) return before
  const held = new Set(now.values())
  return new Map([...now, ...[...before].filter(([id, pane]) => !now.has(id) && !held.has(pane))])
}

/** `id` moved, or as it is. */
const moved = (moves: ReadonlyMap<string, string>, id: string) => moves.get(id) ?? id

/** `record` with each key that moved under its new ID. */
function movedKeys<T>(record: Record<string, T> | undefined, moves: ReadonlyMap<string, string>) {
  return record === undefined
    ? undefined
    : Object.fromEntries(Object.entries(record).map(([k, v]) => [moved(moves, k), v]))
}

function movedLayout(layout: WorkspaceLayout, moves: ReadonlyMap<string, string>): WorkspaceLayout {
  const panes = layout.panes.map((id) => moved(moves, id))
  return layout.focusedPane === undefined
    ? { ...layout, panes }
    : { ...layout, panes, focusedPane: moved(moves, layout.focusedPane) }
}

/** A saved layout as JSON (`layoutsSeen`) with its panes moved, so a loaded layout equal to it stays seen. */
function movedSeen(json: string, moves: ReadonlyMap<string, string>): string {
  const layout: unknown = JSON.parse(json)
  // Each pane ID sits in `panes` (keys "0", "1", …) or `focusedPane`; the sizes are numbers. The keys keep their order.
  return JSON.stringify(layout, (key, value: unknown) =>
    (key === 'focusedPane' || /^\d+$/.test(key)) && typeof value === 'string' ? moved(moves, value) : value,
  )
}

/** The owner's ui changes with each chat ID of `moves` replaced by its new one; the drafts stay as they are. */
export function withMovedChats(ui: Partial<WorkspacesUi>, moves: ReadonlyMap<string, string>): Partial<WorkspacesUi> {
  if (moves.size === 0) return ui
  const id = (value: string | null | undefined) => (value == null ? value : moved(moves, value))
  const layouts =
    ui.layouts === undefined
      ? undefined
      : Object.fromEntries(Object.entries(ui.layouts).map(([w, layout]) => [w, movedLayout(layout, moves)]))
  const seen =
    ui.layoutsSeen === undefined
      ? undefined
      : Object.fromEntries(Object.entries(ui.layoutsSeen).map(([w, json]) => [w, movedSeen(json, moves)]))
  return {
    ...ui,
    ...(ui.focusedPane === undefined ? {} : { focusedPane: moved(moves, ui.focusedPane) }),
    ...(ui.menuFor === undefined ? {} : { menuFor: id(ui.menuFor) ?? null }),
    ...(ui.skillsFor === undefined ? {} : { skillsFor: id(ui.skillsFor) ?? null }),
    ...(ui.commandFor === undefined ? {} : { commandFor: id(ui.commandFor) ?? null }),
    ...(ui.drag == null ? {} : { drag: { ...ui.drag, chat: moved(moves, ui.drag.chat) } }),
    ...(ui.paneDrag == null
      ? {}
      : {
          paneDrag: {
            ...ui.paneDrag,
            chat: moved(moves, ui.paneDrag.chat),
            ...(ui.paneDrag.pane === undefined ? {} : { pane: moved(moves, ui.paneDrag.pane) }),
          },
        }),
    ...(layouts === undefined ? {} : { layouts }),
    ...(seen === undefined ? {} : { layoutsSeen: seen }),
    ...(ui.names === undefined ? {} : { names: movedKeys(ui.names, moves) }),
    ...(ui.renamingChats === undefined ? {} : { renamingChats: movedKeys(ui.renamingChats, moves) }),
  }
}
