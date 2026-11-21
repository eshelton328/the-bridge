// Each live Claude chat's model restart (W10, liveModel.ts): a pick posts the
// model to the chat, one at a time for each chat. While the restart runs the
// chip says "Restarting…" and the chat's composer is off with "The chat is
// restarting" (`withRestarting`), as the server refuses every other POST to
// the chat meanwhile (409 restarting).
//
// After a 200 the chip shows the new model at once, until the page reads the
// list again: the server lists the new model until the chat's next turn and
// sends `workspaces.changed`. A `starting` chat stays "Restarting…" until a
// list read after the answer shows it idle, done or needing the owner; the
// page reads no list for it, it waits for `workspaces.changed`. A 502 failed
// opens the page's dialog with `claude --resume <session>` (`failed`), as the
// old chat ended and its pane shows a shell from the next list on. Any other
// miss is a line beside the chip until its menu opens again.
import type { ModelAlias } from '@bridge/contract'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { report } from '../../errors/reporter.ts'
import type { ModelControl } from './blocks/EffortPicker.tsx'
import { modelFamilies } from './blocks/modelFamilies.ts'
import type { ModelAnswer } from './liveModel.ts'
import { chatPanesOf } from './paneFollow.ts'
import { modelLines } from './modelLines.ts'
import type { WorkspacesData } from './types.ts'

/**
 * A chat's restart: while it runs (`waitFor` is the list of a `starting` answer), its line and the model it set. `held`
 * is the chat's pane after an answer that left it running, until a list read lists the chat again: a list read
 * meanwhile may still show the shell of the restart on that pane.
 */
type ChatModel = {
  readonly restarting?: { readonly pane?: string | undefined; readonly waitFor?: WorkspacesData } | undefined
  readonly held?: string | undefined
  readonly said?: string | undefined
  readonly set?: { readonly model: ModelAlias; readonly list: WorkspacesData } | undefined
}

/** The text of a chat's composer while its restart runs. */
const restartingText = modelLines.restarting

/**
 * How the list `data` ends `chat`'s `starting` restart: the line to show (none for idle or done), "That chat is gone"
 * when it is not listed, or `undefined` while it works or starts.
 */
function endOf(data: WorkspacesData, chat: string): { said: string | undefined } | undefined {
  const pane = data.panes.find((p) => p.id === chat)
  if (pane === undefined) return { said: modelLines.gone }
  const tone = pane.type === 'chat' ? pane.head.status.tone : undefined
  if (tone === 'needsYou') return { said: modelLines.needsYou }
  return tone === 'idle' || tone === 'done' ? { said: undefined } : undefined
}

/** The chats whose `starting` restart the list `data` ends: idle, done or needing the owner, or gone. */
function settled(chats: ReadonlyMap<string, ChatModel>, data: WorkspacesData): ReadonlyMap<string, ChatModel> {
  let next: Map<string, ChatModel> | undefined
  const listed = chatPanesOf(data)
  for (const [chat, entry] of chats) {
    if (entry.held !== undefined && listed.has(chat)) {
      next ??= new Map(chats)
      next.set(chat, { ...entry, held: undefined })
      continue
    }
    const waitFor = entry.restarting?.waitFor
    if (waitFor === undefined || waitFor === data) continue
    const end = endOf(data, chat)
    if (end === undefined) continue
    next ??= new Map(chats)
    next.set(chat, { said: end.said, set: entry.set })
  }
  return next ?? chats
}

/**
 * Whether `list`, read after the restart began (`before` is the list then), already shows the restarted chat: it lists
 * `model` for it, which the server does only once the new chat runs, and the chat idle, done or needing the owner.
 */
function restartedIn(list: WorkspacesData, before: WorkspacesData, chat: string, model: ModelAlias) {
  if (list === before) return undefined
  const pane = list.panes.find((p) => p.id === chat)
  if (pane?.type !== 'chat' || pane.head.modelId !== model) return undefined
  return endOf(list, chat)
}

/** `data` with the composer of each chat whose restart runs off, saying so. */
export function withRestarting(data: WorkspacesData, restarting: (chat: string) => boolean): WorkspacesData {
  if (!data.panes.some((p) => p.type === 'chat' && restarting(p.id))) return data
  return {
    ...data,
    panes: data.panes.map((p) =>
      p.type === 'chat' && restarting(p.id) ? { ...p, composer: { ...p.composer, notLive: restartingText } } : p,
    ),
  }
}

/**
 * The chat panes to follow (`paneFollow.ts`) with each chat whose restart runs kept on its pane (`restarting`, chat to
 * pane): while the old chat has ended, the list may show another chat (a shell) on that pane, and following it would
 * move the open view and drop the chat's files before the same chat comes back.
 */
export function keptOnPane(
  now: ReadonlyMap<string, string>,
  restarting: ReadonlyMap<string, string>,
): ReadonlyMap<string, string> {
  let kept: Map<string, string> | undefined
  for (const [chat, pane] of restarting) {
    if (now.get(chat) === pane) continue
    kept ??= new Map(now)
    for (const [other, at] of kept) if (at === pane) kept.delete(other)
    kept.set(chat, pane)
  }
  return kept ?? now
}

/**
 * The model control of each live Claude chat: `of(chat, liveChat, listed)` for the pane `chat`, whose server ID is
 * `liveChat` and whose list gives the family `listed`. `data` is the loaded list. `onRestarted` gets the server ID of
 * each chat that restarted, so the page reads its transcript again.
 */
export function useLiveModel(on: boolean, data: WorkspacesData, onRestarted: (liveChat: string) => void) {
  const [chats, setChats] = useState<ReadonlyMap<string, ChatModel>>(() => new Map())
  const [failed, setFailed] = useState<string | undefined>(undefined)
  // A new list ends each `starting` restart it shows settled, in the render that draws it.
  const [seen, setSeen] = useState(data)
  let shown = chats
  if (seen !== data) {
    shown = settled(chats, data)
    setSeen(data)
    if (shown !== chats) setChats(shown)
  }
  const dataRef = useRef(data)
  const restartedRef = useRef(onRestarted)
  useLayoutEffect(() => {
    dataRef.current = data
    restartedRef.current = onRestarted
  })
  const inFlightRef = useRef(new Set<string>())
  const change = useCallback((chat: string, entry: ChatModel) => {
    setChats((prev) => new Map(prev).set(chat, entry))
  }, [])
  const pick = useCallback(
    (chat: string, liveChat: string, model: ModelAlias) => {
      if (inFlightRef.current.has(chat)) return
      inFlightRef.current.add(chat)
      const before = dataRef.current
      const pane = chatPanesOf(before).get(chat)
      change(chat, { restarting: { pane } })
      void import('./liveModel.ts')
        .then(
          (m) => m.restartModel(liveChat, model),
          (error: unknown): ModelAnswer => {
            report(error, 'handler')
            return { kind: 'miss', line: modelLines.failed }
          },
        )
        .then((answer) => {
          inFlightRef.current.delete(chat)
          const list = dataRef.current
          // The pane stays the chat's until a list read lists the chat again, unless this one does already.
          const held = chatPanesOf(list).has(chat) ? undefined : pane
          switch (answer.kind) {
            case 'restarted': {
              // The chat's transcript stream may have ended while the chat was gone from the list: read it again.
              restartedRef.current(liveChat)
              // A list read during the request may already show the new chat settled; no event may follow it.
              const shown = answer.state === 'starting' ? restartedIn(list, before, chat, model) : undefined
              const waits = answer.state === 'starting' && shown === undefined
              const said = answer.state === 'needsYou' ? modelLines.needsYou : shown?.said
              change(chat, {
                set: { model, list },
                ...(waits ? { restarting: { pane, waitFor: list } } : { held }),
                ...(said === undefined ? {} : { said }),
              })
              return
            }
            case 'failed':
              change(chat, {})
              setFailed(answer.session)
              return
            case 'same':
              change(chat, { held })
              return
            case 'miss':
              change(chat, { said: answer.line, held })
          }
        })
    },
    [change],
  )
  // Each chat whose restart runs, with the pane it had when the restart began.
  const restarting = useMemo(() => {
    const panes = new Map<string, string>()
    for (const [chat, entry] of shown) {
      const pane = entry.restarting?.pane ?? entry.held
      if (pane !== undefined) panes.set(chat, pane)
    }
    return panes
  }, [shown])
  const isRestarting = (chat: string) => shown.get(chat)?.restarting !== undefined
  const of = (chat: string, liveChat: string | undefined, listed: ModelAlias | undefined): ModelControl | undefined => {
    if (!on || liveChat === undefined) return undefined
    const entry = shown.get(chat)
    // The model a 200 set shows until the next list read, which lists it.
    const set = entry?.set?.list === data ? entry.set.model : undefined
    return {
      current: set ?? listed,
      label: set === undefined ? undefined : modelFamilies[set],
      restarting: entry?.restarting !== undefined,
      said: entry?.said,
      pick: (model) => {
        pick(chat, liveChat, model)
      },
      clearSaid: () => {
        setChats((prev) => {
          const now = prev.get(chat)
          return now?.said === undefined ? prev : new Map(prev).set(chat, { ...now, said: undefined })
        })
      },
    }
  }
  return {
    of,
    isRestarting,
    /** Each chat whose restart runs or just ended, with its pane, for pane follow (`keptOnPane`). */
    restarting,
    /** The session of a restart that ended the chat and started none, for the page's dialog. */
    failed,
    dismissFailed: () => {
      setFailed(undefined)
    },
  }
}
