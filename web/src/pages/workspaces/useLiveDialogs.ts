// The terminal dialogs of the Workspaces page's live Claude chats (R69), for
// its entry: in development, while the page reads live, it loads
// liveDialogs.ts and gives each live Claude chat's pane its dialog source
// (`ChatDialog`), which the pane reads itself, so a read renders only the
// card. A build and the fixtures have none.
import { useCallback, useEffect, useState } from 'react'
import type { ChatDialog } from './blocks/chatDialog.ts'
import type * as LiveDialogs from './liveDialogs.ts'

// One source for each chat of the loaded module, so a pane does not subscribe again on each render.
const sourcesOf = new WeakMap<typeof LiveDialogs, Map<string, ChatDialog>>()

/** The dialog source of each live chat by its server ID; none when not live. */
export function useLiveDialogs(on: boolean): (liveChat: string | undefined) => ChatDialog | undefined {
  const [live, setLive] = useState<typeof LiveDialogs>()
  useEffect(() => {
    if (!on) return
    let gone = false
    void import('./liveDialogs.ts').then((loaded) => {
      if (!gone) setLive(loaded)
    })
    return () => {
      gone = true
    }
  }, [on])
  const shown = on ? live : undefined
  return useCallback(
    (liveChat: string | undefined): ChatDialog | undefined => {
      if (shown === undefined || liveChat === undefined) return undefined
      const sources = sourcesOf.get(shown) ?? new Map<string, ChatDialog>()
      sourcesOf.set(shown, sources)
      const known = sources.get(liveChat)
      if (known !== undefined) return known
      const source = shown.chatDialogOf(liveChat)
      sources.set(liveChat, source)
      return source
    },
    [shown],
  )
}
