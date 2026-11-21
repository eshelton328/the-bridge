// A link to one chat, `/workspaces?chat=<ChatId>` (d-118): what a tap on a
// push notification opens (public/sw.js, app/push/openChatMessages.ts). When
// the page's live data lists the chat, it opens as a tap on its row would,
// full screen on the phone; then the param goes from the URL, so Back and a
// reload do not open it again. A chat the data does not list leaves the page
// as it is.
import { useEffect, useRef } from 'react'
import { openChat } from './blocks/workspaceLayout.ts'
import type { WorkspacesData, WorkspacesUi } from './types.ts'

/** The ui change that opens the live chat `chat` (a server chat ID), or undefined when no pane shows it. */
function chatLinkChange(data: WorkspacesData, ui: WorkspacesUi, chat: string): Partial<WorkspacesUi> | undefined {
  const pane = data.panes.find((p) => p.type === 'chat' && p.liveChat === chat)
  if (pane === undefined) return undefined
  return { ...openChat(data, ui, pane.id), phoneView: 'chat' }
}

/** Opens the linked chat once for each link, then clears the param. */
export function useChatLink(
  chat: string | undefined,
  data: WorkspacesData,
  ui: () => WorkspacesUi,
  apply: (change: Partial<WorkspacesUi>) => void,
  clear: () => void,
): void {
  // The link this hook opened last: a render before the param leaves the URL must not open it again.
  const openedRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (chat === undefined) {
      openedRef.current = undefined
      return
    }
    if (openedRef.current === chat) return
    openedRef.current = chat
    const change = chatLinkChange(data, ui(), chat)
    if (change !== undefined) apply(change)
    clear()
  }, [chat, data, ui, apply, clear])
}
