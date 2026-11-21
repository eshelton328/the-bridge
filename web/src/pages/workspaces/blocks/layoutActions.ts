// The layout writes of a live chat's pane (slice W2): focus, zoom, swap,
// close and split, which the server sends to herdr (`POST
// /api/chats/:chat/focus`, `/zoom`, `/swap`, `/close`, `/split`), and the
// ratio of a split (`POST /api/workspaces/:workspace/layout/ratio`). Only a chat in a herdr tab the page read
// (`data.liveTabs`) has them; a fixture's pane and a workspace whose layout
// read missed have none, so no control shows that could not work. No Figma
// frame draws Zoom pane, Swap with…, Split right, Split down or the close
// dialog (deviations in D01 and D13). The page never moves a pane itself: it waits for the
// server's `layout.changed` and reads the layout again.
import type { SetSplitRatioRequest, SplitDirection } from '@bridge/contract'
import type { LiveTab, PaneAction, WorkspacesData } from '../types.ts'

/** A layout write the page sends for a chat, or for a split of a workspace's tab (`ratio`). */
export type LayoutWriteAction = 'focus' | 'zoom' | 'swap' | 'close' | 'split' | 'ratio'

/** The key of a workspace's ratio write in `LayoutWrites.pending`: it differs from every chat ID. */
export const ratioKey = (workspace: string) => `ratio:${workspace}`

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
  /** Puts a new shell pane beside the chat's (`row`) or below it (`column`); herdr does not focus it. */
  readonly split: (chat: string, direction: SplitDirection) => void
  /**
   * Sets a split's ratio in a tab of `workspace` (the page's ID); a newer ratio of the workspace takes the place of one
   * that waits. `false` when it sent nothing.
   */
  readonly ratio: (workspace: string, write: SetSplitRatioRequest) => boolean
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
 * `actions` with a live chat's layout actions (W2). In the workbench (`pane`): Focus in terminal while herdr focuses
 * another pane, Zoom pane or Unzoom pane when its tab has more than one pane, Swap with… when the tab holds another
 * chat, Split right and Split down (W2c, off while herdr zooms the tab), then Close pane…, in the place of the sample's Close pane. The chat beside the desktop's sidebar (`desktopChat`):
 * Focus in terminal, then Close pane… last. The tablet's menu and the phone's sheet (`chat`): Close pane… last, as they
 * never move herdr's focus. Focus in terminal is the keyboard's way to what a tap on the pane's header does. Any other
 * pane keeps `actions` as they are.
 */
export function withLayoutActions(
  actions: readonly PaneAction[],
  data: Pick<WorkspacesData, 'liveTabs'>,
  chat: string | undefined,
  where: 'pane' | 'desktopChat' | 'chat',
): PaneAction[] {
  const found = chat === undefined ? undefined : tabOf(data, chat)
  if (chat === undefined || found === undefined) return [...actions]
  const close: PaneAction = { value: 'close', label: closeLabel }
  const rest = actions.filter((a) => a.value !== 'close')
  if (where === 'chat') return [...rest, close]
  const focus: PaneAction[] = herdrFocuses(data, chat) ? [] : [{ value: 'focus', label: 'Focus in terminal' }]
  if (where === 'desktopChat') return [...rest, ...focus, close]
  const { tab } = found
  const zoomed = tab.zoomed && tab.focused === chat
  const zoom: PaneAction[] =
    tab.chats.length > 1
      ? [zoomed ? { value: 'unzoom', label: 'Unzoom pane' } : { value: 'zoom', label: 'Zoom pane' }]
      : []
  const swap: PaneAction[] = tab.chats.length > 1 ? [{ value: 'swap', label: 'Swap with…' }] : []
  const split: PaneAction[] = [
    { value: 'splitRight', label: 'Split right', ...(tab.zoomed ? { disabled: true } : {}) },
    { value: 'splitDown', label: 'Split down', ...(tab.zoomed ? { disabled: true } : {}) },
  ]
  return [...rest, ...focus, ...zoom, ...swap, ...split, close]
}
