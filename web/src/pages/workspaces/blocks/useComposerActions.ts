// A chat composer's Send and Stop (W1), for ChatPane: one send and one stop in
// flight at a time, the box emptied only by a send that went through, and
// the one quiet line under the composer that says why a send or a stop
// missed, with Retry when it may work later. A text over the server's
// `maxPromptChars` is not sent and the line says by how much. The line holds
// only the page's own words, never the message text. Props only: the caller
// passes what sends and what stops.
import { useRef, useState } from 'react'
import { maxPromptChars } from '../../../lib/promptContract.ts'

/**
 * What a send or a stop gives the composer: `true` once it went through; `false` when it missed and the caller
 * reported it or there is nothing to say; else the line to show under the composer, with Retry when `retry`.
 */
export type ComposerAnswer = boolean | { readonly line: string; readonly retry: boolean }

type Problem = { readonly line: string; readonly retry: boolean; readonly action: 'send' | 'stop' }

/** The line of a text `over` characters over the limit. */
const tooLongLine = (over: number) =>
  `Message too long — ${String(over)} ${over === 1 ? 'character' : 'characters'} over`

export type ComposerActionsOptions = {
  /** The box's text now. */
  readonly text: string
  /** Sends the text; not set, the message counts as sent at once (a side chat). */
  readonly onSend?: ((text: string) => Promise<ComposerAnswer>) | undefined
  /** Stops the chat; not set, Stop does nothing. */
  readonly onStop?: (() => Promise<ComposerAnswer>) | undefined
  /** Empties the box when it still holds `submitted`. */
  readonly clear: (submitted: string) => void
}

export function useComposerActions({ text, onSend, onStop, clear }: ComposerActionsOptions) {
  const [problem, setProblem] = useState<Problem>()
  // Refs, not state: a second tap or Enter in the same frame must see the first one's send.
  const sendingRef = useRef(false)
  const stoppingRef = useRef(false)
  const over = text.length - maxPromptChars
  /** The library composer's `onSend`: `false` keeps the draft. */
  const send = (submitted: string): boolean | Promise<boolean> => {
    if (submitted.length > maxPromptChars || sendingRef.current) return false
    if (onSend === undefined) {
      clear(submitted)
      return true
    }
    sendingRef.current = true
    setProblem(undefined)
    return onSend(submitted).then(
      (answer) => {
        sendingRef.current = false
        if (answer === true) clear(submitted)
        else if (answer !== false) setProblem({ ...answer, action: 'send' })
        return answer === true
      },
      () => {
        sendingRef.current = false
        return false
      },
    )
  }
  const stop =
    onStop === undefined
      ? undefined
      : () => {
          if (stoppingRef.current) return
          stoppingRef.current = true
          setProblem((shown) => (shown?.action === 'stop' ? undefined : shown))
          void onStop().then(
            (answer) => {
              stoppingRef.current = false
              if (typeof answer === 'object') setProblem({ ...answer, action: 'stop' })
            },
            () => {
              stoppingRef.current = false
            },
          )
        }
  const retry =
    problem?.retry !== true
      ? undefined
      : problem.action === 'stop'
        ? stop
        : () => {
            if (/\S/.test(text)) void send(text)
          }
  return {
    send,
    stop,
    /** The line under the composer: the text's length over the limit first, else the last miss; none when not set. */
    line: over > 0 ? tooLongLine(over) : problem?.line,
    /** Retry of the line; none for the too-long line or a miss that will not work again. */
    retry: over > 0 ? undefined : retry,
  }
}
