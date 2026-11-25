// The herdr tab the workbench follows a moved chat to (W2d, review of
// the-bridge #353). After a move of the open pane to another tab, the page
// shows that tab while herdr's active tab stays the one it was
// (`ui.shownTabs`): the page never sends a focus for a move, as a focus
// moves the owner's real terminal. The shown tab is drawn live from each
// layout read, so a split, a swap, a close or a ratio in it shows as it
// does in an active tab. The data the screen gets marks the shown tab
// `active` (what the workbench draws, zooms and resizes) and keeps herdr's
// own in `herdrActive` (what a focus needs). The page shows herdr's active
// tab again once herdr's active tab changes (a header tap, Focus in
// terminal, the terminal) or the shown tab closes. A chat the owner opens
// in herdr's active tab that the page's drawn panes leave out (a tab of more
// than `maxPanes`) draws that tab around it, as herdr's layout read does
// around its focused pane (R74).
import { layoutOfLiveTab } from './liveLayout.ts'
import type { LiveTab, WorkspacesData, WorkspacesUi } from './types.ts'

type Shown = NonNullable<WorkspacesUi['shownTabs']>[string]

/** The shown tab of `workspace` that still holds: its tab is there, and herdr's active tab is the one it was. */
function holding(tabs: readonly LiveTab[] | undefined, shown: Shown | undefined): LiveTab | undefined {
  if (shown === undefined) return undefined
  const active = tabs?.find((t) => t.active)
  const tab = tabs?.find((t) => t.id === shown.tab)
  return active?.id === shown.over && tab !== active ? tab : undefined
}

/** The ui change that shows `tab` (its server ID) of `workspace`, where herdr moved `chat`, the open pane. */
export function followTab(
  data: Pick<WorkspacesData, 'liveTabs' | 'current'>,
  ui: WorkspacesUi,
  workspace: string,
  chat: string,
  tab: string,
): Partial<WorkspacesUi> {
  const over = data.liveTabs?.[workspace]?.find((t) => t.active)?.id
  if (over === undefined) return {}
  const shown = (ui.workspace ?? data.current) === workspace
  return { shownTabs: { ...ui.shownTabs, [workspace]: { tab, over } }, ...(shown ? { focusedPane: chat } : {}) }
}

/**
 * The data and ui the screen draws with each shown tab that holds: the tab is `active` in `liveTabs` (herdr's own in
 * `herdrActive`), and the workspace's layout is that tab's, with the owner's focused pane when the tab has it, else
 * the tab's focused pane.
 */
export function withShownTabs(data: WorkspacesData, ui: WorkspacesUi): { data: WorkspacesData; ui: WorkspacesUi } {
  let liveTabs = data.liveTabs
  let next = ui
  for (const [workspace, tabs] of Object.entries(data.liveTabs ?? {})) {
    const isShown = (next.workspace ?? data.current) === workspace
    const tab = holding(tabs, ui.shownTabs?.[workspace])
    if (tab === undefined) {
      next = isShown ? aroundOpened(tabs, workspace, next) : next
      continue
    }
    const focus = tab.chats.includes(next.focusedPane) ? next.focusedPane : tab.focused
    const layout = layoutOfLiveTab(tab, focus)
    if (layout === undefined) continue
    liveTabs = {
      ...liveTabs,
      [workspace]: tabs.map((t) => ({ ...t, active: t === tab, herdrActive: t.active })),
    }
    next = {
      ...next,
      layouts: { ...next.layouts, [workspace]: { ...layout, sideChatOpen: next.layouts?.[workspace]?.sideChatOpen } },
      ...(isShown ? { focusedPane: focus } : {}),
    }
  }
  // A ui change alone (a tab drawn around an opened chat) keeps the data object, so nothing that reads only the data
  // renders again.
  return { data: liveTabs === data.liveTabs ? data : { ...data, liveTabs }, ui: next }
}

/**
 * The shown workspace's ui with herdr's active tab drawn around the chat the owner opened (R74, a row or a `?chat=`
 * link), when that tab holds it but its drawn panes, at most `maxPanes` of a larger tab, leave it out.
 */
function aroundOpened(tabs: readonly LiveTab[], workspace: string, ui: WorkspacesUi): WorkspacesUi {
  const active = tabs.find((t) => t.active)
  const drawn = ui.layouts?.[workspace]?.panes
  if (active === undefined || drawn === undefined || !active.chats.includes(ui.focusedPane)) return ui
  if (drawn.includes(ui.focusedPane)) return ui
  const layout = layoutOfLiveTab(active, ui.focusedPane)
  if (layout === undefined) return ui
  return {
    ...ui,
    layouts: { ...ui.layouts, [workspace]: { ...layout, sideChatOpen: ui.layouts?.[workspace]?.sideChatOpen } },
  }
}
