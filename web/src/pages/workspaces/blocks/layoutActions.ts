// The layout writes of a live chat's pane (slice W2): focus, zoom, swap and
// close, which the server sends to herdr (`POST /api/chats/:chat/focus`,
// `/zoom`, `/swap`, `/close`). Only a chat in a herdr tab the page read
// (`data.liveTabs`) has them; a fixture's pane and a workspace whose layout
// read missed have none, so no control shows that could not work. No Figma
// frame draws Zoom pane, Swap with… or the close dialog (deviations in
// D01 and D13). The page never moves a pane itself: it waits for the
// server's `layout.changed` and reads the layout again.
import type { LiveTab, PaneAction, WorkspacesData } from '../types.ts'

/** A layout write the page sends for a chat. */
export type LayoutWriteAction = 'focus' | 'zoom' | 'swap' | 'close'

/** The answer of a close: `true` when the server closed the pane, else the dialog's line, with Stop for a working chat. */
export type CloseAnswer = true | { readonly line: string; readonly stop: boolean }

/**
 * What the page gives the screen for the layout writes (useLayoutWrites.ts). Each takes a pane's local chat ID; a chat
 * with no live tab sends nothing.
 */
export type LayoutWrites = {
  /** The write each chat waits on, by local chat ID, until `layout.changed` brings the new layout or 2.5 s pass. */
  readonly pending: ReadonlyMap<string, LayoutWriteAction>
  /** The status bar's line about the last write that missed, such as "Not zoomed — herdr-unavailable". */
  readonly line: string | undefined
  /** Focuses the chat's pane in herdr, unless herdr focuses it already: a tap on its header or a Send in it. */
  readonly focus: (chat: string) => void
  readonly zoom: (chat: string, zoomed: boolean) => void
  readonly swap: (chat: string, other: string) => void
  readonly close: (chat: string) => Promise<CloseAnswer>
}

/** The live tab that holds `chat`, with its workspace, or none. */
export function tabOf(
  data: Pick<WorkspacesData, 'liveTabs'>,
  chat: string,
): { readonly workspace: string; readonly tab: LiveTab } | undefined {
  for (const [workspace, tabs] of Object.entries(data.liveTabs ?? {})) {
    const tab = tabs.find((t) => t.chats.includes(chat))
    if (tab !== undefined) return { workspace, tab }
  }
  return undefined
}

/** Herdr focuses `chat` now: its tab is the active one and its pane the focused one. */
export function herdrFocuses(data: Pick<WorkspacesData, 'liveTabs'>, chat: string): boolean {
  const found = tabOf(data, chat)
  return found !== undefined && found.tab.active && found.tab.focused === chat
}

/** The active tab of `workspace` when herdr zooms it, else none. */
export function zoomedTab(data: Pick<WorkspacesData, 'liveTabs'>, workspace: string | null): LiveTab | undefined {
  if (workspace === null) return undefined
  const tab = data.liveTabs?.[workspace]?.find((t) => t.active)
  return tab?.zoomed === true ? tab : undefined
}

/** The other chats of `chat`'s tab, which Swap with… lists: none for a chat with no live tab or alone in it. */
export const swapTargets = (data: Pick<WorkspacesData, 'liveTabs'>, chat: string): string[] =>
  tabOf(data, chat)?.tab.chats.filter((c) => c !== chat) ?? []

/** The label of Close for a live chat: it asks first, as herdr's close ends the chat. */
const closeLabel = 'Close pane…'

/**
 * `actions` with a live chat's layout actions (W2). In the workbench (`pane`): Zoom pane or Unzoom pane when its tab has
 * more than one pane, Swap with… when the tab holds another chat, then Close pane…, in the place of the sample's Close
 * pane. In a chat's actions (`chat`: the chat beside the sidebar, the tablet's menu, the phone's sheet): Close pane…
 * last. Any other pane keeps `actions` as they are.
 */
export function withLayoutActions(
  actions: readonly PaneAction[],
  data: Pick<WorkspacesData, 'liveTabs'>,
  chat: string | undefined,
  where: 'pane' | 'chat',
): PaneAction[] {
  const found = chat === undefined ? undefined : tabOf(data, chat)
  if (chat === undefined || found === undefined) return [...actions]
  const close: PaneAction = { value: 'close', label: closeLabel }
  const rest = actions.filter((a) => a.value !== 'close')
  if (where === 'chat') return [...rest, close]
  const { tab } = found
  const zoomed = tab.zoomed && tab.focused === chat
  const zoom: PaneAction[] =
    tab.chats.length > 1
      ? [zoomed ? { value: 'unzoom', label: 'Unzoom pane' } : { value: 'zoom', label: 'Zoom pane' }]
      : []
  const swap: PaneAction[] = tab.chats.length > 1 ? [{ value: 'swap', label: 'Swap with…' }] : []
  return [...rest, ...zoom, ...swap, close]
}
