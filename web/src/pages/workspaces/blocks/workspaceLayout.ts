// Each workspace keeps its own layout (R6, D1's open question 4): its panes,
// how its split places them, the sizes of its handles, its focused pane and
// whether its side chat is open, in `ui.layouts` by
// workspace id. A workspace with no saved layout shows the state's panes
// when it is `data.current`, and its last chat alone in one pane when it is
// another. These helpers give the shown workspace's layout and the ui
// change that a tab switch, a resize or a closed pane makes.
import type { SplitSizes, WorkbenchPane, WorkspaceLayout, WorkspacesData, WorkspacesUi } from '../types.ts'
import { zoomedTab } from './layoutActions.ts'

/** The workspace whose tab is selected: the one the owner picked, else the state's; null when there are none. */
export const shownWorkspace = (data: WorkspacesData, ui: WorkspacesUi): string | null => ui.workspace ?? data.current

/** The sizes the shown split has now: its handles' sizes with the dragged handle's (D14) over them. */
const liveSizes = (data: WorkspacesData, ui: WorkspacesUi, sizes: SplitSizes | undefined): SplitSizes | undefined =>
  data.split === 'rows' && ui.resize != null && shownWorkspace(data, ui) === data.current
    ? { ...sizes, [ui.resize.part]: ui.resize.sizes }
    : sizes

/**
 * The layout of `workspace`: the saved one, else the state's own for `data.current`, else its last chat alone. With
 * no workspace (`null`, an empty live list) it has no panes.
 */
function layoutOf(data: WorkspacesData, ui: WorkspacesUi, workspace: string | null): WorkspaceLayout {
  if (workspace === null) return { panes: [] }
  const saved = ui.layouts?.[workspace]
  if (saved !== undefined) return saved
  if (workspace === data.current) {
    return {
      panes: data.panes.map((p) => p.id),
      split: data.split,
      splitSizes: ui.splitSizes,
      focusedPane: ui.focusedPane,
      sideChatOpen: ui.sideChatOpen,
    }
  }
  const last = data.lastChats?.[workspace]
  return last === undefined ? { panes: [] } : { panes: [last.id], focusedPane: last.id }
}

/** The pane a layout names: one of the state's panes, else a workspace's last chat. */
const paneById = (data: WorkspacesData, id: string): WorkbenchPane | undefined =>
  data.panes.find((p) => p.id === id) ?? Object.values(data.lastChats ?? {}).find((p) => p.id === id)

/**
 * The data and ui the shown workspace's panes draw from: its panes, its split (its layout's, else the state's for the
 * state's own workspace) and its sizes, and the status bar's summary counted again when the panes are not the state's.
 * With `zoom` (the workbench only), a tab herdr zooms gives only its focused pane: the sidebar's chat, the chats a row
 * can open and the chat actions' targets keep every pane of the tab, so a row of a zoomed tab still opens its chat.
 */
export function shownView(
  data: WorkspacesData,
  ui: WorkspacesUi,
  zoom = false,
): { data: WorkspacesData; ui: WorkspacesUi } {
  const shown = shownWorkspace(data, ui)
  const layout = layoutOf(data, ui, shown)
  const all = layout.panes.flatMap((id) => {
    const pane = paneById(data, id)
    return pane === undefined ? [] : [pane]
  })
  // A tab herdr zooms (slice W2) draws only its focused pane, at full size, until the zoom ends.
  const zoomed = zoom ? zoomedTab(data, shown) : undefined
  const zoomedPane = zoomed === undefined ? undefined : all.find((p) => p.id === zoomed.focused)
  const panes = zoomedPane === undefined ? all : [zoomedPane]
  const own = shown === data.current && panes.length === data.panes.length
  const label = data.workspaces.find((w) => w.id === shown)?.label ?? shown
  const summary =
    zoomed !== undefined && zoomedPane !== undefined && label !== null
      ? `${label} · zoomed · 1 of ${String(zoomed.chats.length)} panes`
      : own || label === null
        ? data.status.summary
        : `${label} · ${String(panes.length)} ${panes.length === 1 ? 'pane' : 'panes'}`
  const { split: stateSplit, ...rest } = data
  const split =
    zoomedPane === undefined ? (layout.split ?? (shown === data.current ? stateSplit : undefined)) : undefined
  const viewData = { ...rest, current: shown, panes, status: { ...data.status, summary } }
  return {
    data: split === undefined ? viewData : { ...viewData, split },
    ui: { ...ui, splitSizes: zoomedPane === undefined ? layout.splitSizes : undefined },
  }
}

/**
 * The ui change of a click on `next`'s tab: the shown workspace's layout saved as it is now, then `next` shown with
 * its own focused pane and side chat (closed when it has none), and the open menus, skill list, drag and handle readout
 * closed, as they belong to a pane of the workspace left.
 */
export function switchTo(data: WorkspacesData, ui: WorkspacesUi, next: string): Partial<WorkspacesUi> {
  const shown = shownWorkspace(data, ui)
  const left = layoutOf(data, ui, shown)
  const saved: WorkspaceLayout = {
    panes: left.panes,
    split: left.split,
    splitSizes: liveSizes(data, ui, left.splitSizes),
    focusedPane: ui.focusedPane,
    sideChatOpen: ui.sideChatOpen,
  }
  const target = next === shown ? saved : layoutOf(data, ui, next)
  const focusedPane = target.focusedPane ?? target.panes[0]
  return {
    workspace: next,
    layouts: shown === null ? ui.layouts : { ...ui.layouts, [shown]: saved },
    focusedPane: focusedPane ?? ui.focusedPane,
    sideChatOpen: target.sideChatOpen ?? false,
    menuFor: null,
    moveOpen: false,
    skillsFor: null,
    resize: null,
    paneDrag: null,
  }
}

/** The ui change of a handle of the shown split resized: the shown workspace's layout keeps the sizes. */
export function resizeShown(data: WorkspacesData, ui: WorkspacesUi, splitSizes: SplitSizes): Partial<WorkspacesUi> {
  const shown = shownWorkspace(data, ui)
  if (shown === null) return {}
  return { layouts: { ...ui.layouts, [shown]: { ...layoutOf(data, ui, shown), splitSizes } } }
}

/**
 * The ui change of a pane of the shown workspace closed: its layout drops the pane, and the others share the room
 * equally, as the split's handles change. A closed pane that had the focus gives it to the first pane left.
 */
export function closeShownPane(data: WorkspacesData, ui: WorkspacesUi, pane: string): Partial<WorkspacesUi> {
  const shown = shownWorkspace(data, ui)
  if (shown === null) return {}
  const layout = layoutOf(data, ui, shown)
  const panes = layout.panes.filter((id) => id !== pane)
  const focusedPane = ui.focusedPane === pane ? panes[0] : ui.focusedPane
  return {
    layouts: { ...ui.layouts, [shown]: { panes, split: layout.split, focusedPane, sideChatOpen: layout.sideChatOpen } },
    focusedPane: focusedPane ?? ui.focusedPane,
    resize: null,
  }
}

/** The most panes a workspace's split draws (the library's `SplitPanes`). */
export const maxPanes = 4

/** The workspace that lists `chat` in the sidebar, or none. */
const ownerOf = (data: WorkspacesData, chat: string) => data.workspaces.find((w) => w.chats?.some((c) => c.id === chat))

/**
 * The chats a sidebar row can open alone: the chat panes of the shown workspace, and those of the state's own panes,
 * which a live state gives every chat of every workspace (d-117).
 */
export function openableChats(data: WorkspacesData, ui: WorkspacesUi): string[] {
  const shown = shownView(data, ui).data.panes
  return [...new Set([...shown, ...data.panes].flatMap((p) => (p.type === 'chat' ? [p.id] : [])))]
}

/**
 * The ui change of a sidebar row picked: its chat shows alone, focused. A chat of another workspace switches to that
 * workspace first (`switchTo`), and a chat its workspace's layout does not hold goes first in it, within `maxPanes`.
 */
export function openChat(data: WorkspacesData, ui: WorkspacesUi, chat: string): Partial<WorkspacesUi> {
  const owner = ownerOf(data, chat)?.id
  const tab = liveTabChange(data, ui, chat)
  const shown = shownWorkspace(data, ui)
  // A chat the shown workspace's panes hold shows at once, as a row always has.
  if (shown !== null && layoutOf(data, ui, shown).panes.includes(chat)) return { ...tab, focusedPane: chat }
  if (owner === undefined) return { focusedPane: chat }
  const change = owner === shown ? {} : switchTo(data, ui, owner)
  // A chat in a herdr tab the page read shows in that tab's own layout (R74), so no layout of the page's goes over it.
  if (tab !== undefined) return { ...change, ...tab, focusedPane: chat }
  const layout = layoutOf(data, ui, owner)
  const panes = layout.panes.includes(chat) ? layout.panes : [chat, ...layout.panes].slice(0, maxPanes)
  return {
    ...change,
    layouts: { ...(change.layouts ?? ui.layouts), [owner]: { ...layout, panes, focusedPane: chat } },
    focusedPane: chat,
  }
}

/**
 * The shown-tab change that a row's chat needs (R74): the workbench shows the herdr tab that holds `chat`. A chat in
 * herdr's active tab drops the workspace's shown tab, so herdr's active tab shows; a chat in another tab shows that tab
 * in its place, as a moved chat does (`shownTabs.ts`). The page sends herdr no focus for it. Undefined with no layout
 * read of the workspace, or for a chat no tab holds.
 */
function liveTabChange(data: WorkspacesData, ui: WorkspacesUi, chat: string): Partial<WorkspacesUi> | undefined {
  const workspace = ownerOf(data, chat)?.id
  if (workspace === undefined) return undefined
  const tabs = data.liveTabs?.[workspace]
  const tab = tabs?.find((t) => t.chats.includes(chat))
  // The data the screen gets marks a shown tab `active`, with herdr's own flag in `herdrActive`.
  const herdr = tabs?.find((t) => t.herdrActive ?? t.active)
  if (tab === undefined || herdr?.id === undefined) return undefined
  if (tab === herdr) {
    if (ui.shownTabs?.[workspace] === undefined) return {}
    return { shownTabs: Object.fromEntries(Object.entries(ui.shownTabs).filter(([id]) => id !== workspace)) }
  }
  if (tab.id === undefined) return undefined
  return { shownTabs: { ...ui.shownTabs, [workspace]: { tab: tab.id, over: herdr.id } } }
}

/** Each layout of `layouts` as JSON, by workspace id: what `layoutsSeen` holds. */
export const layoutsSeenOf = (layouts: WorkspacesUi['layouts']): Record<string, string> =>
  Object.fromEntries(Object.entries(layouts ?? {}).map(([id, layout]) => [id, JSON.stringify(layout)]))

/**
 * The ui the screen draws: the loaded state's `loaded` with the owner's `changed` over it, each workspace's layout
 * merged by id, so a workspace that came after his change keeps its loaded layout. A loaded layout that differs from
 * the one he saw when he last changed the ui (`changed.layoutsSeen`) is newer than his change: a herdr layout read
 * again (slice 3a). It replaces his layout of that workspace. When that workspace is shown (`current` when he picked
 * none) it ends a handle drag's sizes (`resize`), which would hide its handle sizes, and takes the focused pane too
 * when the owner's focus was one of that workspace's panes and no phone or tablet view is open on a chat
 * (`phoneView`), as there the focused pane is the chat he opened. A state whose layouts never change, such as a
 * fixture, keeps every change.
 */
export function withLoadedLayouts(
  loaded: WorkspacesUi,
  changed: Partial<WorkspacesUi>,
  current: string | null,
): WorkspacesUi {
  const merged = { ...loaded, ...changed }
  if (loaded.layouts === undefined || changed.layouts === undefined) return merged
  const seen = changed.layoutsSeen ?? {}
  const now = layoutsSeenOf(loaded.layouts)
  const newer = Object.entries(loaded.layouts).filter(([id]) => seen[id] !== undefined && seen[id] !== now[id])
  const layouts = { ...loaded.layouts, ...changed.layouts, ...Object.fromEntries(newer) }
  const shown = merged.workspace ?? current
  const replaced = newer.find(([id]) => id === shown)?.[1]
  if (replaced === undefined || shown === null) return { ...merged, layouts }
  const saw = changed.layouts[shown] ?? loaded.layouts[shown]
  const follows =
    (merged.phoneView === undefined || merged.phoneView === 'list') && saw?.panes.includes(merged.focusedPane) === true
  return {
    ...merged,
    layouts,
    focusedPane: follows ? (replaced.focusedPane ?? merged.focusedPane) : merged.focusedPane,
    resize: null,
  }
}
