// The page's layout writes of live chats (slice W2): focus, zoom, swap and
// close, through liveLayoutWrites.ts, loaded when first used so a build has
// no live code. There is no optimistic layout: after a 204 the write stays
// pending, and its control shows it, until the next layout read changes that
// workspace's tabs (the server's `layout.changed`), or for 2.5 s, after
// which the page reads the layout again itself, and the list after a close. One write at a time for a
// chat. A focus goes only to a chat herdr does not focus already. A stale
// view (409 singlePane, otherTab) reads the layout again quietly, a gone
// chat (404) the list; any other miss but a close's shows one line in the
// status bar ("Not zoomed — herdr-unavailable"), and a close's shows in its
// dialog.
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { report } from '../../errors/reporter.ts'
import {
  type CloseAnswer,
  herdrFocuses,
  type LayoutWriteAction,
  type LayoutWrites,
  tabOf,
} from './blocks/layoutActions.ts'
import type { WriteAnswer } from './liveLayoutWrites.ts'
import type { WorkspacesData } from './types.ts'

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
export function useLayoutWrites(live: boolean, data: WorkspacesData): LayoutWrites | undefined {
  const [pending, setPending] = useState<ReadonlyMap<string, LayoutWriteAction>>(() => new Map())
  const [line, setLine] = useState<string>()
  const dataRef = useRef(data)
  const pendingRef = useRef(new Map<string, Pending>())
  const done = useCallback((chat: string) => {
    const was = pendingRef.current.get(chat)
    if (was === undefined) return
    clearTimeout(was.timer)
    pendingRef.current.delete(chat)
    setPending(new Map([...pendingRef.current].map(([id, p]) => [id, p.action])))
  }, [])
  // A new layout read of a pending write's workspace ends the wait of each write the server took.
  useLayoutEffect(() => {
    dataRef.current = data
    for (const [chat, p] of pendingRef.current)
      if (p.timer !== undefined && tabsJson(data, p.workspace) !== p.seen) done(chat)
  })

  const start = useCallback(
    (chat: string, action: LayoutWriteAction, run: (live: Live, id: string) => Promise<WriteAnswer>) => {
      const found = tabOf(dataRef.current, chat)
      const machine = dataRef.current.liveMachine
      if (found === undefined || machine === undefined || pendingRef.current.has(chat)) return undefined
      const workspace = `${machine}/${found.workspace}`
      const entry: Pending = { action, workspace: found.workspace, seen: tabsJson(dataRef.current, found.workspace) }
      pendingRef.current.set(chat, entry)
      setPending(new Map([...pendingRef.current].map(([id, p]) => [id, p.action])))
      setLine(undefined)
      return viaLive((m) => run(m, `${machine}/${chat}`)).then((answer) => {
        if (answer.kind === 'done') {
          // The event may have come before the 204: a layout that changed since the write started is its answer.
          if (tabsJson(dataRef.current, found.workspace) !== entry.seen) done(chat)
          else
            entry.timer = setTimeout(() => {
              readAgain(workspace)
              // A close also drops the chat from the list (`workspaces.changed`), which the sidebar and the phone draw.
              if (action === 'close') readAgain(workspace, true)
              done(chat)
            }, layoutEventWaitMs)
          return answer
        }
        done(chat)
        if (answer.kind === 'stale') readAgain(workspace)
        if (answer.kind === 'gone') readAgain(workspace, true)
        if (answer.kind === 'miss' && action !== 'close') setLine(answer.line)
        return answer
      })
    },
    [done],
  )

  // A new object only when what the screen draws changes: `pending` or `line`. The writes read the data through a ref.
  const writes = useMemo<LayoutWrites>(
    () => ({
      pending,
      line,
      focus: (chat: string) => {
        if (herdrFocuses(dataRef.current, chat)) return
        void start(chat, 'focus', (m, id) => m.focusChat(id))
      },
      zoom: (chat: string, zoomed: boolean) => {
        void start(chat, 'zoom', (m, id) => m.zoomChat(id, zoomed))
      },
      swap: (chat: string, other: string) => {
        const machine = dataRef.current.liveMachine
        if (machine === undefined) return
        void start(chat, 'swap', (m, id) => m.swapChats(id, `${machine}/${other}`))
      },
      close: async (chat: string): Promise<CloseAnswer> => {
        const answer = await start(chat, 'close', (m, id) => m.closeChat(id))
        if (answer === undefined) return { line: 'Not closed — wait for the last change to this pane', stop: false }
        if (answer.kind === 'working') return { line: closeLines.working, stop: true }
        if (answer.kind === 'needsYou') return { line: closeLines.needsYou, stop: false }
        if (answer.kind === 'miss') return { line: answer.line, stop: false }
        return true
      },
    }),
    [pending, line, start],
  )
  return live ? writes : undefined
}
