// Fork on the live page (backend #443): the fork's answer names the new
// chat's pane (useWorkspaceEdits.ts), and the page opens that chat as it
// opens a new chat (openListedChat.ts), once the workspace list shows it on
// that pane, ready or needing the owner; `workspaces.changed` brings it, and
// the edit's own read 2.5 s after the answer too. The page reads no list in
// a loop. A forked chat that needs the owner (Claude's folder trust question)
// gets "This chat needs you on the Mac" under its composer. A later fork
// replaces the one followed. Nothing goes to report() here.
import type { StartChatResponse } from '@bridge/contract'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { showNotice } from './livePending.ts'
import { listedChats, openListedChat } from './openListedChat.ts'
import type { WorkspacesData, WorkspacesUi } from './types.ts'
import { needsYouLine } from './useNewChat.ts'

export type ForkedChatDeps = {
  /** The data the screen draws: a tab the workbench follows is `active` in it (shownTabs.ts). */
  readonly data: WorkspacesData
  /** Herdr's own tabs, before the page's shown tabs: herdr's active tab is `active` in them. */
  readonly herdrTabs: WorkspacesData['liveTabs']
  readonly ui: () => WorkspacesUi
  readonly change: (change: Partial<WorkspacesUi>) => void
}

/** Follows a fork's new chat until the list shows it; gives the follow for the fork's answer. */
export function useForkedChat(deps: ForkedChatDeps): (started: StartChatResponse) => void {
  const depsRef = useRef(deps)
  useLayoutEffect(() => {
    depsRef.current = deps
  })
  /** The forked chat's pane, and whether the fork's answer said it was ready. */
  const followRef = useRef<{ readonly pane: string; readonly ready: boolean } | undefined>(undefined)

  const resolve = useCallback(() => {
    const follow = followRef.current
    if (follow === undefined) return
    const { data, herdrTabs, ui, change } = depsRef.current
    const hit = listedChats(data).find(({ chat }) => chat.pane === follow.pane)
    if (hit === undefined) return
    const open = openListedChat(data, herdrTabs, ui(), hit, follow.ready)
    if (open === undefined) return
    followRef.current = undefined
    change(open.change)
    if (open.needsYou) showNotice(open.liveChat, { line: needsYouLine, retry: false })
  }, [])

  // Each list and layout read may bring the forked chat.
  useEffect(() => {
    resolve()
  }, [deps.data, resolve])

  return useCallback(
    ({ pane, chat, state }: StartChatResponse) => {
      followRef.current = { pane, ready: state === 'ready' && chat !== undefined }
      resolve()
    },
    [resolve],
  )
}
