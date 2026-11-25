// A link to one chat, `/workspaces?chat=<ChatId>` (d-118): what a tap on a
// push notification opens (public/sw.js, app/push/openChatMessages.ts). When
// the page's live data lists the chat, it opens as a tap on its row would,
// full screen on the phone; then the param goes from the URL, so Back and a
// reload do not open it again. The page can show a list it read before, as
// when it comes back from another page, so for a chat the list does not name
// the page reads the server once: a chat the server lists opens when the
// page's data has it, and one it does not list leaves the page as it is.
import { useEffect, useRef, useState } from 'react'
import { openChat } from './blocks/workspaceLayout.ts'
import type { WorkspacesData, WorkspacesUi } from './types.ts'

/**
 * The ui change that opens the live chat `chat` (a server chat ID, `<liveMachine>/<pane id>`), or undefined when no
 * pane shows it. A Codex chat's pane names no `liveChat`, as the page reads no transcript for it, so the pane is found by
 * its ID.
 */
function chatLinkChange(data: WorkspacesData, ui: WorkspacesUi, chat: string): Partial<WorkspacesUi> | undefined {
  const machine = data.liveMachine
  if (machine === undefined) return undefined
  const pane = data.panes.find((p) => p.type === 'chat' && `${machine}/${p.id}` === chat)
  if (pane === undefined) return undefined
  return { ...openChat(data, ui, pane.id), phoneView: 'chat' }
}

/** Each live chat's server ID (`<machine>/<pane>`) and title, for message mentions; none with no live machine. */
export function liveChatTitles(data: WorkspacesData): ReadonlyMap<string, string> {
  const machine = data.liveMachine
  if (machine === undefined) return new Map()
  return new Map(data.panes.flatMap((p) => (p.type === 'chat' ? [[`${machine}/${p.id}`, p.head.title] as const] : [])))
}

/**
 * Opens the linked chat once for each link, then clears the param. `readAgain` reads the page's data from the server
 * and answers whether the server lists the chat.
 */
export function useChatLink(
  chat: string | undefined,
  data: WorkspacesData,
  ui: () => WorkspacesUi,
  apply: (change: Partial<WorkspacesUi>) => void,
  clear: () => void,
  readAgain: (chat: string) => Promise<boolean>,
): void {
  // The link this hook opened last: a render before the param leaves the URL must not open it again.
  const openedRef = useRef<string | undefined>(undefined)
  // The link whose read of the server started, and the answer of that read once it ends.
  const askedRef = useRef<string | undefined>(undefined)
  const [read, setRead] = useState<{ readonly chat: string; readonly listed: boolean } | undefined>(undefined)
  useEffect(() => {
    if (chat === undefined) {
      openedRef.current = undefined
      askedRef.current = undefined
      return
    }
    if (openedRef.current === chat) return
    const change = chatLinkChange(data, ui(), chat)
    if (change === undefined && (read?.chat !== chat || read.listed)) {
      if (askedRef.current === chat) return
      askedRef.current = chat
      void readAgain(chat).then(
        (listed) => {
          setRead({ chat, listed })
        },
        () => {
          setRead({ chat, listed: false })
        },
      )
      return
    }
    openedRef.current = chat
    if (change !== undefined) apply(change)
    clear()
  }, [chat, data, read, ui, apply, clear, readAgain])
}
