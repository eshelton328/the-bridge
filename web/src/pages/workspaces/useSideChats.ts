// The live side chats of the Workspaces page (backend #456, #460), for its
// entry: in development, while the page reads live, a live Claude chat's Side
// chat asks its questions through liveSide.ts (loaded when first used, so a
// build has no live code) and follows each answer's stream. The questions and
// answers stay in the page's memory by the chat's server ID, for as long as
// the page is open: each question goes as it is, with nothing of the ones
// before it, as a new copy of the chat's session answers each one. One
// question of a chat answers at a time; a second waits with a line, as the
// server would refuse it (409 sideBusy). A question over `maxSideQuestion`
// is not sent. The fixtures have none and keep their Figma side chats.
import { maxSideQuestion, type SideAnswer, type SideId } from '@bridge/contract'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { report } from '../../errors/reporter.ts'
import type { ComposerAnswer } from './blocks/useComposerActions.ts'
import type { SideEnd } from './liveSide.ts'
import type { ChatEntry, SideChat } from './types.ts'

/** One question and what came of it. */
type Turn = {
  readonly id: number
  readonly question: string
  readonly side?: SideId | undefined
  readonly answer?: SideAnswer | undefined
  readonly end?: SideEnd | undefined
}

/** The page's live side chats. */
export type SideChats = {
  /** The side chat of the live chat `liveChat` on `pane`, whose title is `title`. */
  readonly sideChatOf: (pane: string, liveChat: string, title: string) => SideChat
  /** Asks `question` about the live chat `liveChat`: `true` once the server took it, else the composer's line. */
  readonly ask: (liveChat: string, question: string) => Promise<ComposerAnswer>
}

/** The entries of a chat with no side question yet: one array, so its transcript keeps its memo. */
const noEntries: ChatEntry[] = []
const cutLine = 'Cut — the answer is longer than the page shows'
const endLines = {
  failed: 'No answer — the side question failed',
  timedOut: 'Stopped after 2 minutes',
  gone: 'This answer is gone — the server restarted',
  lost: 'Answer not live — the server did not answer',
}

/** A turn still waits for its answer: asked, or answering with its stream open. */
const waiting = (turn: Turn) =>
  turn.end === undefined && (turn.answer === undefined || turn.answer.state === 'answering')

/** The entries of one turn: the question, then the answer so far and how it ended. */
function entriesOf(turn: Turn): ChatEntry[] {
  const entries: ChatEntry[] = [{ type: 'user', text: turn.question }]
  const answer = turn.answer
  if (answer !== undefined && answer.text !== '')
    entries.push({
      type: 'assistant',
      kind: 'claude',
      name: 'Claude',
      text: answer.text,
      copy: 'Copy',
      ...(answer.cut ? { cut: cutLine } : {}),
    })
  if (answer?.state === 'failed' || answer?.state === 'timedOut')
    entries.push({ type: 'event', label: 'Error', text: endLines[answer.state] })
  else if (turn.end === 'gone' || turn.end === 'lost')
    entries.push({ type: 'event', label: 'Error', text: endLines[turn.end] })
  else if (waiting(turn) && (answer?.text ?? '') === '')
    entries.push({ type: 'progress', lines: [answer === undefined ? 'Asking…' : 'Answering…'] })
  return entries
}

/** The page's live side chats, or none when it shows fixtures. */
export function useSideChats(on: boolean): SideChats | undefined {
  const [turns, setTurns] = useState<ReadonlyMap<string, readonly Turn[]>>(() => new Map())
  const turnsRef = useRef(turns)
  const nextIdRef = useRef(0)
  const stopsRef = useRef(new Set<() => void>())
  useEffect(() => {
    const open = stopsRef.current
    return () => {
      for (const stop of open) stop()
      open.clear()
    }
  }, [])
  /** Changes the turn `id` of `chat`, or drops it when `change` gives undefined. */
  const update = useCallback((chat: string, id: number, change: (turn: Turn) => Turn | undefined) => {
    setTurns((prev) => {
      const list = prev.get(chat) ?? []
      const next = list.flatMap((t) => {
        if (t.id !== id) return [t]
        const changed = change(t)
        return changed === undefined ? [] : [changed]
      })
      const map = new Map(prev)
      map.set(chat, next)
      turnsRef.current = map
      return map
    })
  }, [])
  // The entries of each chat, made again only when its turns change, so the transcript keeps its memo (review R28).
  const entries = useMemo(
    () => new Map([...turns].map(([chat, list]) => [chat, list.flatMap(entriesOf)] as const)),
    [turns],
  )
  const ask = useCallback(
    async (chat: string, question: string): Promise<ComposerAnswer> => {
      const text = question.trim()
      if (text === '') return false
      if (text.length > maxSideQuestion) {
        const over = text.length - maxSideQuestion
        return {
          line: `Question too long — ${String(over)} ${over === 1 ? 'character' : 'characters'} over`,
          retry: false,
        }
      }
      if ((turnsRef.current.get(chat) ?? []).some(waiting))
        return { line: 'Not asked — a side question is still answering', retry: false }
      const id = nextIdRef.current
      nextIdRef.current += 1
      setTurns((prev) => {
        const map = new Map(prev)
        map.set(chat, [...(prev.get(chat) ?? []), { id, question: text }])
        turnsRef.current = map
        return map
      })
      const live = await import('./liveSide.ts').catch((error: unknown) => {
        report(error, 'handler')
        return undefined
      })
      const asked = live === undefined ? undefined : await live.askSide(chat, text)
      if (live === undefined || asked === undefined) {
        update(chat, id, () => undefined)
        return false
      }
      if (!asked.ok) {
        update(chat, id, () => undefined)
        return { line: asked.line, retry: asked.retry }
      }
      update(chat, id, (t) => ({ ...t, side: asked.side }))
      const stop = live.watchSide(chat, asked.side, {
        onAnswer: (answer) => {
          update(chat, id, (t) => ({ ...t, answer }))
        },
        onEnd: (end) => {
          stopsRef.current.delete(stop)
          update(chat, id, (t) => ({ ...t, end }))
        },
      })
      stopsRef.current.add(stop)
      return true
    },
    [update],
  )
  return useMemo(
    () =>
      on
        ? {
            ask,
            sideChatOf: (pane, liveChat, title) => ({
              id: `side:${pane}`,
              title: 'Side chat',
              command: '/btw',
              note: `Nothing here enters ${title}. Close it and the main chat carries on.`,
              closeLabel: 'Close the side chat',
              entries: entries.get(liveChat) ?? noEntries,
              composer: {
                placeholder: 'Ask a side question',
                text: '',
                attachments: [],
                running: false,
                noAttach: true,
              },
              pane,
            }),
          }
        : undefined,
    [on, ask, entries],
  )
}
