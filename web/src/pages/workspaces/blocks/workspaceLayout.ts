// Each workspace keeps its own layout (R6, D1's open question 4): its panes,
// the sizes of its handles, its focused pane and whether its side chat is
// open, in `ui.layouts` by
// workspace id. A workspace with no saved layout shows the state's panes
// when it is `data.current`, and its last chat alone in one pane when it is
// another. These helpers give the shown workspace's layout and the ui
// change that a tab switch, a resize or a closed pane makes.
import type { SplitSizes, WorkbenchPane, WorkspaceLayout, WorkspacesData, WorkspacesUi } from '../types.ts'

/** The workspace whose tab is selected: the one Erik picked, else the state's. */
export const shownWorkspace = (data: WorkspacesData, ui: WorkspacesUi): string => ui.workspace ?? data.current

/** The sizes the shown split has now: its handles' sizes with the dragged handle's (D14) over them. */
const liveSizes = (data: WorkspacesData, ui: WorkspacesUi, sizes: SplitSizes | undefined): SplitSizes | undefined =>
  data.split === 'rows' && ui.resize != null && shownWorkspace(data, ui) === data.current
    ? { ...sizes, [ui.resize.part]: ui.resize.sizes }
    : sizes

/** The layout of `workspace`: the saved one, else the state's own for `data.current`, else its last chat alone. */
function layoutOf(data: WorkspacesData, ui: WorkspacesUi, workspace: string): WorkspaceLayout {
  const saved = ui.layouts?.[workspace]
  if (saved !== undefined) return saved
  if (workspace === data.current) {
    return {
      panes: data.panes.map((p) => p.id),
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
 * The data and ui the shown workspace's panes draw from: its panes, its split (rows first only for the state's own
 * workspace) and its sizes, and the status bar's summary counted again when the panes are not the state's.
 */
export function shownView(data: WorkspacesData, ui: WorkspacesUi): { data: WorkspacesData; ui: WorkspacesUi } {
  const shown = shownWorkspace(data, ui)
  const layout = layoutOf(data, ui, shown)
  const panes = layout.panes.flatMap((id) => {
    const pane = paneById(data, id)
    return pane === undefined ? [] : [pane]
  })
  const own = shown === data.current && panes.length === data.panes.length
  const label = data.workspaces.find((w) => w.id === shown)?.label ?? shown
  const summary = own
    ? data.status.summary
    : `${label} · ${String(panes.length)} ${panes.length === 1 ? 'pane' : 'panes'}`
  const { split, ...rest } = data
  const viewData = { ...rest, current: shown, panes, status: { ...data.status, summary } }
  return {
    data: shown === data.current && split !== undefined ? { ...viewData, split } : viewData,
    ui: { ...ui, splitSizes: layout.splitSizes },
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
    splitSizes: liveSizes(data, ui, left.splitSizes),
    focusedPane: ui.focusedPane,
    sideChatOpen: ui.sideChatOpen,
  }
  const target = next === shown ? saved : layoutOf(data, ui, next)
  const focusedPane = target.focusedPane ?? target.panes[0]
  return {
    workspace: next,
    layouts: { ...ui.layouts, [shown]: saved },
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
  return { layouts: { ...ui.layouts, [shown]: { ...layoutOf(data, ui, shown), splitSizes } } }
}

/**
 * The ui change of a pane of the shown workspace closed: its layout drops the pane, and the others share the room
 * equally, as the split's handles change. A closed pane that had the focus gives it to the first pane left.
 */
export function closeShownPane(data: WorkspacesData, ui: WorkspacesUi, pane: string): Partial<WorkspacesUi> {
  const shown = shownWorkspace(data, ui)
  const layout = layoutOf(data, ui, shown)
  const panes = layout.panes.filter((id) => id !== pane)
  const focusedPane = ui.focusedPane === pane ? panes[0] : ui.focusedPane
  return {
    layouts: { ...ui.layouts, [shown]: { panes, focusedPane, sideChatOpen: layout.sideChatOpen } },
    focusedPane: focusedPane ?? ui.focusedPane,
    resize: null,
  }
}
