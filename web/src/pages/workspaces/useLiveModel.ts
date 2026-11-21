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
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { report } from '../../errors/reporter.ts'
import type { ModelControl } from './blocks/EffortPicker.tsx'
import { modelFamilies } from './blocks/modelFamilies.ts'
import type { ModelAnswer } from './liveModel.ts'
import { modelLines } from './modelLines.ts'
import type { WorkspacesData } from './types.ts'

/** A chat's restart: while it runs (`waitFor` is the list of a `starting` answer), its line and the model it set. */
type ChatModel = {
  readonly restarting?: { readonly waitFor?: WorkspacesData } | undefined
  readonly said?: string | undefined
  readonly set?: { readonly model: ModelAlias; readonly list: WorkspacesData } | undefined
}

/** The text of a chat's composer while its restart runs. */
const restartingText = modelLines.restarting

/** The chats whose `starting` restart the list `data` ends: idle, done or needing the owner, or gone. */
function settled(chats: ReadonlyMap<string, ChatModel>, data: WorkspacesData): ReadonlyMap<string, ChatModel> {
  let next: Map<string, ChatModel> | undefined
  for (const [chat, entry] of chats) {
    const waitFor = entry.restarting?.waitFor
    if (waitFor === undefined || waitFor === data) continue
    const pane = data.panes.find((p) => p.id === chat)
    const tone = pane?.type === 'chat' ? pane.head.status.tone : undefined
    let said: string | undefined
    if (tone === 'needsYou') said = modelLines.needsYou
    else if (pane === undefined) said = modelLines.gone
    else if (tone !== 'idle' && tone !== 'done') continue
    next ??= new Map(chats)
    next.set(chat, { said, set: entry.set })
  }
  return next ?? chats
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
      change(chat, { restarting: {} })
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
          switch (answer.kind) {
            case 'restarted':
              // The chat's transcript stream may have ended while the chat was gone from the list: read it again.
              restartedRef.current(liveChat)
              change(chat, {
                set: { model, list },
                ...(answer.state === 'starting' ? { restarting: { waitFor: list } } : {}),
                ...(answer.state === 'needsYou' ? { said: modelLines.needsYou } : {}),
              })
              return
            case 'failed':
              change(chat, {})
              setFailed(answer.session)
              return
            case 'same':
              change(chat, {})
              return
            case 'miss':
              change(chat, { said: answer.line })
          }
        })
    },
    [change],
  )
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
    /** The session of a restart that ended the chat and started none, for the page's dialog. */
    failed,
    dismissFailed: () => {
      setFailed(undefined)
    },
  }
}
