// Fork on the live page (backend #443): the fork's answer names the new
// chat's pane (useWorkspaceEdits.ts), and the page opens that chat as it
// opens a new chat (openListedChat.ts), once the workspace list shows it on
// that pane, ready or needing the owner; `workspaces.changed` brings it, and
// the edit's own read 2.5 s after the answer too. The page reads no list in
// a loop. A forked chat that needs the owner (Claude's folder trust question)
// gets "This chat needs you on the Mac" under its composer. A later fork
// replaces the one followed. Nothing goes to report() here.
//
// The wait is bounded, as Claude can still end at its start in the new pane,
// which herdr then lists as a shell (the real run of #443; since #446 the
// server refuses a session with no saved turn before it makes a pane). A list read after the answer that shows the pane as a
// shell reads the list once more after `shellCheckMs`; a read after that one
// that still shows a shell there ends the wait with `shellLine`, as a shell
// before Claude starts is never listed after the answer. With no chat by
// `forkOpenWaitMs` the wait ends with `waitLine`. Either line goes to `fail`.
import type { StartChatResponse } from '@bridge/contract'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { showNotice } from './livePending.ts'
import { listedChats, openListedChat } from './openListedChat.ts'
import type { WorkspacesData, WorkspacesUi } from './types.ts'
import { needsYouLine } from './useNewChat.ts'

/** How long the page waits for the forked chat, in ms: as long as it waits for the fork's answer. */
const forkOpenWaitMs = 75_000
/** How long after a read that lists the forked pane as a shell the page reads the list again, in ms. */
const shellCheckMs = 2500
const waitLine = 'Fork did not start'
const shellLine = 'Fork did not start — Claude ended in its new pane; look at it on the Mac'

export type ForkedChatDeps = {
  /** The data the screen draws: a tab the workbench follows is `active` in it (shownTabs.ts). */
  readonly data: WorkspacesData
  /** Herdr's own tabs, before the page's shown tabs: herdr's active tab is `active` in them. */
  readonly herdrTabs: WorkspacesData['liveTabs']
  readonly ui: () => WorkspacesUi
  readonly change: (change: Partial<WorkspacesUi>) => void
  /** Reads the workspace list again. */
  readonly readList: () => void
  /** Shows the line of a fork that did not start. */
  readonly fail: (line: string) => void
}

/** The followed fork: its pane, whether its answer said ready, the data then, and its timers. */
type Follow = {
  readonly pane: string
  readonly ready: boolean
  readonly answered: WorkspacesData
  /** The data when a read first listed the pane as a shell, once it did. */
  shellSeen?: WorkspacesData | undefined
  wait: ReturnType<typeof setTimeout> | undefined
  shellCheck: ReturnType<typeof setTimeout> | undefined
}

const stop = (follow: Follow) => {
  clearTimeout(follow.wait)
  clearTimeout(follow.shellCheck)
}

/** Follows a fork's new chat until the list shows it; gives the follow for the fork's answer. */
export function useForkedChat(deps: ForkedChatDeps): (started: StartChatResponse) => void {
  const depsRef = useRef(deps)
  useLayoutEffect(() => {
    depsRef.current = deps
  })
  const followRef = useRef<Follow | undefined>(undefined)

  const end = useCallback((line?: string) => {
    const follow = followRef.current
    if (follow === undefined) return
    stop(follow)
    followRef.current = undefined
    if (line !== undefined) depsRef.current.fail(line)
  }, [])

  const resolve = useCallback(() => {
    const follow = followRef.current
    if (follow === undefined) return
    const { data, herdrTabs, ui, change, readList } = depsRef.current
    const hit = listedChats(data).find(({ chat }) => chat.pane === follow.pane)
    if (hit === undefined) return
    if (hit.chat.kind === 'shell') {
      // Only a read after the answer counts, and a second read after the check confirms it.
      if (data === follow.answered) return
      if (follow.shellSeen === undefined) {
        follow.shellSeen = data
        follow.shellCheck = setTimeout(readList, shellCheckMs)
      } else if (data !== follow.shellSeen) end(shellLine)
      return
    }
    follow.shellSeen = undefined
    const open = openListedChat(data, herdrTabs, ui(), hit, follow.ready)
    if (open === undefined) return
    end()
    change(open.change)
    if (open.needsYou) showNotice(open.liveChat, { line: needsYouLine, retry: false })
  }, [end])

  // Each list and layout read may bring the forked chat.
  useEffect(() => {
    resolve()
  }, [deps.data, resolve])

  useEffect(
    () => () => {
      const follow = followRef.current
      if (follow !== undefined) stop(follow)
    },
    [],
  )

  return useCallback(
    ({ pane, chat, state }: StartChatResponse) => {
      end()
      const follow: Follow = {
        pane,
        ready: state === 'ready' && chat !== undefined,
        answered: depsRef.current.data,
        wait: undefined,
        shellCheck: undefined,
      }
      follow.wait = setTimeout(() => {
        if (followRef.current === follow) end(waitLine)
      }, forkOpenWaitMs)
      followRef.current = follow
      resolve()
    },
    [end, resolve],
  )
}
