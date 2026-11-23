// The open step of a chat the page started (New chat, W3) or forked (backend
// #443): once the workspace list shows the chat ready or needing the owner,
// it opens as a tap on its row opens it, full screen on the phone; on the
// desktop the workbench shows its tab, while herdr's active tab and pane
// stay as they were. The desktop draws a chat in a herdr tab the layout read
// has, so the step waits for the read that brings it. Pure.
import { openChat } from './blocks/workspaceLayout.ts'
import { followTab } from './shownTabs.ts'
import type { SidebarChat, WorkspacesData, WorkspacesUi } from './types.ts'

/** A chat the list shows, with its workspace. */
export type ListedChat = { readonly chat: SidebarChat; readonly workspace: string }

/** Each chat the workspaces list, with its workspace. */
export const listedChats = (data: WorkspacesData): ListedChat[] =>
  data.workspaces.flatMap((w) => (w.chats ?? []).map((chat) => ({ chat, workspace: w.id })))

/** What opens a listed chat: the ui change, its server ID, and whether it waits for the owner on the Mac. */
export type ListedOpen = {
  readonly change: Partial<WorkspacesUi>
  readonly liveChat: string
  readonly needsYou: boolean
}

/**
 * The step that opens `hit`, or undefined while it cannot open yet: not ready (unless `ready`, the server's answer said
 * so) and not needing the owner, or in a herdr tab the layout read does not have yet. `herdrTabs` are herdr's own tabs,
 * before the page's shown tabs: they say which tab is herdr's active one, as the page may show another (shownTabs.ts).
 */
export function openListedChat(
  data: WorkspacesData,
  herdrTabs: WorkspacesData['liveTabs'],
  now: WorkspacesUi,
  hit: ListedChat,
  ready: boolean,
): ListedOpen | undefined {
  const pane = data.panes.find((p) => p.id === hit.chat.id)
  const needsYou = hit.chat.status.tone === 'needsYou'
  const takes = !needsYou && (ready || (pane?.type === 'chat' && pane.takesCommands === true))
  if (!takes && !needsYou) return undefined
  const tabs = herdrTabs?.[hit.workspace]
  const tab = tabs?.find((t) => t.chats.includes(hit.chat.id))
  if (tabs !== undefined && tab === undefined) return undefined
  const opened: Partial<WorkspacesUi> = {
    ...openChat(data, now, hit.chat.id),
    phoneView: 'chat',
    keyboardOpen: false,
  }
  // A chat in herdr's active tab shows that tab; one in another tab shows it in its place, as a moved chat does.
  const shown =
    tab?.id === undefined
      ? {}
      : tab.active
        ? {
            shownTabs: Object.fromEntries(
              Object.entries(now.shownTabs ?? {}).filter(([workspace]) => workspace !== hit.workspace),
            ),
          }
        : followTab(
            { liveTabs: herdrTabs, current: data.current },
            { ...now, ...opened },
            hit.workspace,
            hit.chat.id,
            tab.id,
          )
  return { change: { ...opened, ...shown }, liveChat: `${data.liveMachine ?? ''}/${hit.chat.id}`, needsYou }
}
