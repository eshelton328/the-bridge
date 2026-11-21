// The pending sends of the Workspaces page's live Claude chats, for its
// entry: in development, while the page reads live, it loads livePending.ts
// and gives each live Claude chat's pane its pending send (`ChatPending`),
// which the pane reads itself, so a send's bubble renders only that pane,
// never the page or another transcript entry. A build and the fixtures have
// none.
import { useCallback, useEffect, useState } from 'react'
import type { ChatPending } from './blocks/ChatPane.tsx'
import type * as LivePending from './livePending.ts'

// One source for each chat of the loaded module, so a pane does not subscribe again on each render.
const sourcesOf = new WeakMap<typeof LivePending, Map<string, ChatPending>>()

export type LivePendings = {
  /** The pending send of the live chat `liveChat`, for its pane; none when not live. */
  readonly pendingOf: (liveChat: string | undefined) => ChatPending | undefined
  /** Shows the send of `text` with the files `files` (their names) to `liveChat` until it settles; none when not live. */
  readonly start: (liveChat: string, text: string, files: readonly string[]) => LivePending.PendingSend | undefined
}

export function useLivePending(on: boolean): LivePendings {
  const [live, setLive] = useState<typeof LivePending>()
  useEffect(() => {
    if (!on) return
    let gone = false
    void import('./livePending.ts').then((loaded) => {
      if (!gone) setLive(loaded)
    })
    return () => {
      gone = true
    }
  }, [on])
  const shown = on ? live : undefined
  const pendingOf = useCallback(
    (liveChat: string | undefined): ChatPending | undefined => {
      if (shown === undefined || liveChat === undefined) return undefined
      const sources = sourcesOf.get(shown) ?? new Map<string, ChatPending>()
      sourcesOf.set(shown, sources)
      const known = sources.get(liveChat)
      if (known !== undefined) return known
      const source: ChatPending = {
        subscribe: (listener) => shown.subscribePending(liveChat, listener),
        view: () => shown.pendingView(liveChat),
      }
      sources.set(liveChat, source)
      return source
    },
    [shown],
  )
  const start = useCallback(
    (liveChat: string, text: string, files: readonly string[]) => shown?.startPending(liveChat, text, files),
    [shown],
  )
  return { pendingOf, start }
}
