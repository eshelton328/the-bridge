// The page's layout writes of live chats (slice W2): focus, zoom, swap,
// close, split and move to another tab (W2d), and a split's ratio, through liveLayoutWrites.ts, loaded
// when first used so a build has no live code. There is no optimistic
// layout: after a 204 (a split's 201) the write stays pending, and its
// control shows it, until the next layout read changes that workspace's tabs
// (the server's `layout.changed`), or for 2.5 s, after which the page reads
// the layout again itself, and the list after a close, a split or a move. One write at a time
// for a chat; a workspace's newer ratio takes the place of one that waits. A
// focus goes only to a chat herdr does not focus already. A stale view (409
// singlePane, otherTab, sameTab) reads the layout again quietly, and 409
// zoomedTab with its line in the status bar; a 404 reads the list (a
// split's the layout too, a ratio's the layout only); any other miss but a close's shows one line in
// the status bar ("Not zoomed — herdr-unavailable"), and a close's shows in
// its dialog. A move of the open pane (`follow`) shows the tab it went to
// once a layout read has the chat there: `onFollow` gets the workspace, the
// chat and the page's layout of that tab, and the page's ui takes it until
// herdr's next layout change of the workspace, as a chat opened from the
// sidebar does.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { report } from '../../errors/reporter.ts'
import {
  type CloseAnswer,
  herdrFocuses,
  type LayoutWriteAction,
  type LayoutWrites,
  ratioKey,
  tabOf,
} from './blocks/layoutActions.ts'
import type { WriteAnswer } from './liveLayoutWrites.ts'
import type { WorkspaceLayout, WorkspacesData } from './types.ts'

/** Shows the tab a moved chat went to: its workspace (the page's ID), the chat and the page's layout of that tab. */
export type FollowMove = (workspace: string, chat: string, layout: WorkspaceLayout) => void

/** A move of the open pane that the workbench follows: the tab it left and the tab it goes to (server IDs). */
type Follow = { readonly from: string | undefined; readonly to: string }

/** How long a write that went through waits for `layout.changed` before the page reads the layout again, in ms. */
const layoutEventWaitMs = 2500

type Live = typeof import('./liveLayoutWrites.ts')

/** A write in flight: what it does, its workspace's tabs when it started, and its wait once the server took it. */
type Pending = { action: LayoutWriteAction; workspace: string; seen: string; timer?: ReturnType<typeof setTimeout> }

const viaLive = (run: (live: Live) => Promise<WriteAnswer>): Promise<WriteAnswer> =>
  import('./liveLayoutWrites.ts').then(run, (error: unknown) => {
    report(error, 'handler')
    return { kind: 'miss', line: 'Not changed — the page could not load its live code' }
  })

/** Has the open watcher read the layout of `workspace` (a server ID) again, or the list with it. */
const readAgain = (workspace: string, list = false) => {
  void import('./liveWorkspaces.ts').then((m) => {
    m.readLayoutAgain(workspace, list)
  })
}

/** The layout tabs of `workspace` in `data`, as JSON: a write's wait ends when they change. */
const tabsJson = (data: WorkspacesData, workspace: string) => JSON.stringify(data.liveTabs?.[workspace] ?? null)

const closeLines = {
  working: 'Not closed — the chat is working. Stop it first, or cancel.',
  needsYou: 'Not closed — the chat needs an answer first.',
} as const

/** The layout writes of the live page, or none when the page shows fixtures. */
export function useLayoutWrites(live: boolean, data: WorkspacesData, onFollow?: FollowMove): LayoutWrites | undefined {
  const [pending, setPending] = useState<ReadonlyMap<string, LayoutWriteAction>>(() => new Map())
  const [line, setLine] = useState<string>()
  const dataRef = useRef(data)
  const pendingRef = useRef(new Map<string, Pending>())
  const followRef = useRef(onFollow)
  // A page that leaves waits for nothing: no write that answers later reads the layout again.
  const aliveRef = useRef(true)
  // The moves of an open pane that the server took, by local chat ID, until a layout read shows the chat out of its tab.
  const followsRef = useRef(new Map<string, Follow>())
  // Each follow whose chat a layout read shows in another tab ends: in the tab it went to, the workbench shows that tab.
  const follow = useCallback(() => {
    for (const [chat, f] of followsRef.current) {
      const found = tabOf(dataRef.current, chat)
      if (found?.tab.id === f.from) continue
      followsRef.current.delete(chat)
      const there = found?.tab.id === f.to ? found : undefined
      if (there === undefined) continue
      const { workspace, tab } = there
      void import('./liveLayout.ts').then((m) => {
        const layout = m.layoutOfLiveTab(tab, chat)
        if (aliveRef.current && layout !== undefined) followRef.current?.(workspace, chat, layout)
      })
    }
  }, [])
  // Ends the wait of `key`: of the write `entry` only, when given, as a newer ratio may have taken its place.
  const done = useCallback((key: string, entry?: Pending) => {
    const was = pendingRef.current.get(key)
    if (was === undefined || (entry !== undefined && was !== entry)) return
    clearTimeout(was.timer)
    pendingRef.current.delete(key)
    setPending(new Map([...pendingRef.current].map(([id, p]) => [id, p.action])))
  }, [])
  useEffect(() => {
    aliveRef.current = true
    const waits = pendingRef.current
    const follows = followsRef.current
    return () => {
      aliveRef.current = false
      for (const p of waits.values()) clearTimeout(p.timer)
      follows.clear()
    }
  }, [])
  // A new layout read of a pending write's workspace ends the wait of each write the server took.
  useLayoutEffect(() => {
    dataRef.current = data
    followRef.current = onFollow
    for (const [chat, p] of pendingRef.current)
      if (p.timer !== undefined && tabsJson(data, p.workspace) !== p.seen) done(chat)
    if (followsRef.current.size > 0) follow()
  })

  /**
   * Sends one write, pending under `key` (a chat's ID, or a workspace's `ratioKey`) for the page's workspace
   * `workspace`; `run` gets the live module and the machine. None while `key` waits, unless `replace` is set.
   */
  const start = useCallback(
    (
      key: string,
      workspace: string,
      action: LayoutWriteAction,
      run: (live: Live, machine: string) => Promise<WriteAnswer>,
      replace = false,
    ) => {
      const machine = dataRef.current.liveMachine
      const waiting = pendingRef.current.get(key)
      if (machine === undefined || (waiting !== undefined && !replace)) return undefined
      clearTimeout(waiting?.timer)
      const server = `${machine}/${workspace}`
      const entry: Pending = { action, workspace, seen: tabsJson(dataRef.current, workspace) }
      pendingRef.current.set(key, entry)
      setPending(new Map([...pendingRef.current].map(([id, p]) => [id, p.action])))
      setLine(undefined)
      return viaLive((m) => run(m, machine)).then((answer) => {
        if (!aliveRef.current || pendingRef.current.get(key) !== entry) return answer
        if (answer.kind === 'done') {
          // The event may have come before the 204: a layout that changed since the write started is its answer.
          if (tabsJson(dataRef.current, workspace) !== entry.seen) done(key, entry)
          else
            entry.timer = setTimeout(() => {
              readAgain(server)
              // A close drops the chat from the list, a split adds its shell and a move can close a tab
              // (`workspaces.changed`): the panes and the sidebar draw the list's chats.
              if (action === 'close' || action === 'split' || action === 'move') readAgain(server, true)
              done(key, entry)
            }, layoutEventWaitMs)
          return answer
        }
        done(key, entry)
        if (answer.kind === 'stale') {
          readAgain(server)
          if (answer.line !== undefined) setLine(answer.line)
        }
        if (answer.kind === 'gone') {
          // A ratio's tab or split is gone from the layout; a chat's write finds the chat gone from the list too.
          if (action === 'ratio' || action === 'split') readAgain(server)
          if (action !== 'ratio') readAgain(server, true)
        }
        if (answer.kind === 'miss' && action !== 'close') setLine(answer.line)
        return answer
      })
    },
    [done],
  )
  /** Sends a write of `chat`, pending under its ID, when the page read the herdr tab that holds it. */
  const startChat = useCallback(
    (
      chat: string,
      action: LayoutWriteAction,
      run: (live: Live, id: string, machine: string) => Promise<WriteAnswer>,
    ) => {
      const found = tabOf(dataRef.current, chat)
      if (found === undefined) return undefined
      return start(chat, found.workspace, action, (m, machine) => run(m, `${machine}/${chat}`, machine))
    },
    [start],
  )

  // A new object only when what the screen draws changes: `pending` or `line`. The writes read the data through a ref.
  const writes = useMemo<LayoutWrites>(
    () => ({
      pending,
      line,
      focus: (chat: string) => {
        if (herdrFocuses(dataRef.current, chat)) return
        void startChat(chat, 'focus', (m, id) => m.focusChat(id))
      },
      zoom: (chat: string, zoomed: boolean) => {
        void startChat(chat, 'zoom', (m, id) => m.zoomChat(id, zoomed))
      },
      swap: (chat: string, other: string) => {
        void startChat(chat, 'swap', (m, id, machine) => m.swapChats(id, `${machine}/${other}`))
      },
      close: async (chat: string): Promise<CloseAnswer> => {
        const answer = await startChat(chat, 'close', (m, id) => m.closeChat(id))
        if (answer === undefined) return { line: 'Not closed — wait for the last change to this pane', stop: false }
        if (answer.kind === 'working') return { line: closeLines.working, stop: true }
        if (answer.kind === 'needsYou') return { line: closeLines.needsYou, stop: false }
        if (answer.kind === 'miss') return { line: answer.line, stop: false }
        return true
      },
      split: (chat, direction) => {
        void startChat(chat, 'split', (m, id) => m.splitChat(id, direction))
      },
      move: (chat, { tab, direction, beside }, open) => {
        const from = tabOf(dataRef.current, chat)?.tab.id
        void startChat(chat, 'move', (m, id, machine) =>
          m.moveChat(id, { tab, direction, ...(beside === undefined ? {} : { beside: `${machine}/${beside}` }) }),
        )?.then((answer) => {
          if (answer.kind !== 'done' || !open || !aliveRef.current) return
          followsRef.current.set(chat, { from, to: tab })
          // The event may have come before the 204: the layout read now may have the chat in its new tab.
          follow()
        })
      },
      ratio: (workspace, write) =>
        start(
          ratioKey(workspace),
          workspace,
          'ratio',
          (m, machine) => m.setSplitRatio(`${machine}/${workspace}`, write),
          true,
        ) !== undefined,
    }),
    [pending, line, start, startChat, follow],
  )
  return live ? writes : undefined
}
