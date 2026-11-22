// The live list's edits (reviews R41, R42): rename a workspace, rename a
// chat (herdr's label of its pane) and put the workspaces in the owner's
// order, through liveWorkspaceEdits.ts, loaded when first used so a build
// has no live code. One edit at a time for the page. There is no
// optimistic name: after a 204 the edit stays pending until the next list
// read changes the list (the server's `workspaces.changed`), or for 2.5 s,
// after which the page reads the list itself; the name shows only from that
// read. An order holds the owner's order on the page while it is pending
// (`held`), so the list does not jump back before the read, and drops it
// with the pending edit. A name the contract's `Label` refuses (over
// `maxLabel`, a control character) is not sent and says so; an empty name
// is never sent. 409 orderStale and a 404 read the list again with a line;
// any other miss shows one line ("Not renamed — herdr-unavailable"), which
// the screen draws with the live notice in every layout.
import { Label, maxLabel } from '@bridge/contract'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { report } from '../../errors/reporter.ts'
import type { EditAnswer, WorkspaceEdit } from './liveWorkspaceEdits.ts'
import type { WorkspaceEdits, WorkspacesData } from './types.ts'

/** How long an edit that went through waits for `workspaces.changed` before the page reads the list again, in ms. */
const listEventWaitMs = 2500

type Live = typeof import('./liveWorkspaceEdits.ts')

/** The edit in flight: what it does, the list when it started, the order it holds, and its wait once the server took it. */
type Pending = {
  action: WorkspaceEdit
  seen: string
  order?: readonly string[]
  timer?: ReturnType<typeof setTimeout>
}

const lead: Record<WorkspaceEdit, string> = {
  renameWorkspace: 'Not renamed',
  renameChat: 'Not renamed',
  order: 'Not reordered',
}

const viaLive = (run: (live: Live) => Promise<EditAnswer>): Promise<EditAnswer> =>
  import('./liveWorkspaceEdits.ts').then(run, (error: unknown) => {
    report(error, 'handler')
    return { kind: 'miss', line: 'Not changed — the page could not load its live code' }
  })

/** Has the open watcher read the workspace list again. */
const readList = () => {
  void import('./liveWorkspaces.ts').then((m) => {
    m.readListAgain()
  })
}

/** The list as the page draws it, as JSON: the workspaces in order, their names and their chats' titles. */
const listJson = (data: WorkspacesData) =>
  JSON.stringify(data.workspaces.map((w) => [w.id, w.label, (w.chats ?? []).map((c) => [c.id, c.title])]))

/** The live list's edits, or none when the page shows fixtures. */
export function useWorkspaceEdits(live: boolean, data: WorkspacesData): WorkspaceEdits | undefined {
  const [pending, setPending] = useState<Pending>()
  const [line, setLine] = useState<string>()
  const dataRef = useRef(data)
  const pendingRef = useRef<Pending>(undefined)
  const aliveRef = useRef(true)
  const done = useCallback((entry: Pending) => {
    if (pendingRef.current !== entry) return
    clearTimeout(entry.timer)
    pendingRef.current = undefined
    setPending(undefined)
  }, [])
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      clearTimeout(pendingRef.current?.timer)
    }
  }, [])
  // A list read that changed the list ends the wait of an edit the server took.
  useLayoutEffect(() => {
    dataRef.current = data
    const p = pendingRef.current
    if (p?.timer !== undefined && listJson(data) !== p.seen) done(p)
  })

  /** Sends one edit; `false` when another one is pending, and nothing goes. */
  const start = useCallback(
    (action: WorkspaceEdit, run: (live: Live, machine: string) => Promise<EditAnswer>, order?: readonly string[]) => {
      const machine = dataRef.current.liveMachine
      if (machine === undefined) return false
      if (pendingRef.current !== undefined) {
        setLine(`${lead[action]} — wait for the last change`)
        return false
      }
      const entry: Pending = { action, seen: listJson(dataRef.current), ...(order === undefined ? {} : { order }) }
      pendingRef.current = entry
      setPending(entry)
      setLine(undefined)
      void viaLive((m) => run(m, machine)).then((answer) => {
        if (!aliveRef.current || pendingRef.current !== entry) return
        if (answer.kind === 'done') {
          // The event may have come before the 204: a list that changed since the edit started is its answer.
          if (listJson(dataRef.current) !== entry.seen) done(entry)
          else
            entry.timer = setTimeout(() => {
              readList()
              done(entry)
            }, listEventWaitMs)
          return
        }
        done(entry)
        if (answer.kind === 'stale' || answer.kind === 'gone') readList()
        setLine(answer.line)
      })
      return true
    },
    [done],
  )
  /** The name to send, or a line: trimmed, never empty, as the contract's `Label` takes it. */
  const named = useCallback((action: WorkspaceEdit, name: string, was: string) => {
    const trimmed = name.trim()
    if (trimmed === '' || trimmed === was) return undefined
    if (!Label.safeParse(trimmed).success) {
      setLine(`${lead[action]} — a name has 1 to ${String(maxLabel)} characters and no control character`)
      return undefined
    }
    return trimmed
  }, [])

  const edits = useMemo<WorkspaceEdits>(
    () => ({
      pending: pending !== undefined,
      held: pending?.order,
      line,
      dismiss: () => {
        setLine(undefined)
      },
      renameWorkspace: (workspace, name, was) => {
        const next = named('renameWorkspace', name, was)
        if (next === undefined) return
        start('renameWorkspace', (m, machine) => m.renameWorkspace(`${machine}/${workspace}`, next))
      },
      renameChat: (chat, name, was) => {
        const next = named('renameChat', name, was)
        if (next === undefined) return
        start('renameChat', (m, machine) => m.renameChat(`${machine}/${chat}`, next))
      },
      order: (workspaces) => {
        const now = dataRef.current.workspaces.map((w) => w.id)
        if (workspaces.join('\n') === now.join('\n')) return
        start('order', (m, machine) => m.orderWorkspaces(workspaces.map((w) => `${machine}/${w}`)), workspaces)
      },
    }),
    [pending, line, named, start],
  )
  return live ? edits : undefined
}
