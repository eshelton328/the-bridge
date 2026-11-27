// A chat composer's Send and Stop (W1), for ChatPane: one send and one stop in
// flight at a time, the box emptied as a send starts and its text put back
// when the send missed (the pending send, the page shows the text in the
// transcript meanwhile), and
// the one quiet line under the composer that says why a send or a stop
// missed, with Retry when it may work later. A text over the server's
// `maxPromptChars` is not sent and the line says by how much. The line holds
// only the page's own words, never the message text. A send that found text in
// the chat's terminal input (409 inputNotEmpty) can carry `clearInput`: the
// line then offers "Clear the terminal input", and once the owner confirms
// it, a clear that went through sends the kept draft again; one clear is in
// flight at a time, and a clear that missed shows its own line, with Retry
// when it may work later (R28 part B). With no miss of its own, the line is
// the caller's `notice` (a send before a reload that did not reach the chat),
// whose Retry sends the box's text. Props only: the caller passes what
// sends, stops and clears.
import { maxPromptChars } from '@bridge/contract'
import { useLayoutEffect, useRef, useState } from 'react'
import type { ComposerAnswer } from '../../../lib/chatSend.ts'

export type { ComposerAnswer }

type Problem = {
  readonly line: string
  readonly retry: boolean
  readonly action: 'send' | 'stop' | 'clear'
  readonly clearInput?: (() => Promise<ComposerAnswer>) | undefined
}

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
  /** Empties the box when it still holds `submitted`: called as a send starts. */
  readonly clear: (submitted: string) => void
  /**
   * Puts `submitted` back in the box after its send missed, before any text the owner typed meanwhile; not set, the box
   * keeps the text until the send went through.
   */
  readonly restore?: ((submitted: string) => void) | undefined
  /**
   * The chat's draft now, read when a clear of its terminal input answers: the chat may have opened again in another
   * pane, where the owner changed or emptied it. The text this pane last held when not set.
   */
  readonly draftNow?: (() => string) | undefined
  /** The composer has files ready to send (W1b): a send with no text goes. */
  readonly withFiles?: boolean | undefined
  /**
   * A file of the composer is uploading or failed (W1b): every send waits, a Retry and the send after a clear too, so
   * none goes without it.
   */
  readonly filesHeld?: boolean | undefined
  /** The line to show when this composer has none of its own, as a send's miss: one found after a reload. */
  readonly notice?: { readonly line: string; readonly retry: boolean } | undefined
}

export function useComposerActions({
  text,
  onSend,
  onStop,
  clear,
  restore,
  draftNow,
  withFiles = false,
  filesHeld = false,
  notice,
}: ComposerActionsOptions) {
  const [own, setOwn] = useState<Problem>()
  const problem: Problem | undefined = own ?? (notice === undefined ? undefined : { ...notice, action: 'send' })
  // Shown as state too, so Send is off while a send of files with no text is pending (the library's own pending
  // state covers only the sends it starts).
  const [sending, setSending] = useState(false)
  // Refs, not state: a second tap or Enter in the same frame must see the first one's send.
  const sendingRef = useRef(false)
  const stoppingRef = useRef(false)
  const clearingRef = useRef(false)
  // The text now, for a clear that ends after the owner typed on, when the caller gives no `draftNow`.
  const textRef = useRef(text)
  useLayoutEffect(() => {
    textRef.current = text
  })
  const over = text.length - maxPromptChars
  /** The library composer's `onSend`: `false` keeps the draft. */
  const send = (submitted: string): boolean | Promise<boolean> => {
    // While a clear of the terminal input is pending, its answer sends the draft: a Send meanwhile keeps it.
    if (submitted.length > maxPromptChars || sendingRef.current || clearingRef.current) return false
    if (!/\S/.test(submitted) && !withFiles) return false
    if (filesHeld) return false
    if (onSend === undefined) {
      clear(submitted)
      return true
    }
    sendingRef.current = true
    setSending(true)
    setOwn(undefined)
    // The box empties as the send starts, and a miss puts the text back.
    if (restore !== undefined) clear(submitted)
    return onSend(submitted).then(
      (answer) => {
        sendingRef.current = false
        setSending(false)
        if (answer === true) {
          if (restore === undefined) clear(submitted)
        } else {
          restore?.(submitted)
          if (answer !== false) setOwn({ ...answer, action: 'send' })
        }
        return answer === true
      },
      () => {
        sendingRef.current = false
        setSending(false)
        restore?.(submitted)
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
          setOwn((shown) => (shown?.action === 'stop' ? undefined : shown))
          void onStop().then(
            (answer) => {
              stoppingRef.current = false
              if (typeof answer === 'object') setOwn({ ...answer, action: 'stop' })
            },
            () => {
              stoppingRef.current = false
            },
          )
        }
  /** Clears the terminal input with `clearInput`, then sends the box's text again; a second tap meanwhile does nothing. */
  const runClear = (clearInput: () => Promise<ComposerAnswer>) => {
    if (clearingRef.current) return
    clearingRef.current = true
    setOwn(undefined)
    void clearInput().then(
      (answer) => {
        clearingRef.current = false
        if (answer === true) {
          const kept = draftNow?.() ?? textRef.current
          if (/\S/.test(kept) || withFiles) void send(kept)
        } else if (answer !== false) setOwn({ line: answer.line, retry: answer.retry, action: 'clear', clearInput })
      },
      () => {
        clearingRef.current = false
      },
    )
  }
  const clearAgain = problem?.action === 'clear' ? problem.clearInput : undefined
  const retry =
    problem?.retry !== true
      ? undefined
      : problem.action === 'stop'
        ? stop
        : clearAgain !== undefined
          ? () => {
              runClear(clearAgain)
            }
          : () => {
              if (/\S/.test(text) || withFiles) void send(text)
            }
  const offered = problem?.action === 'send' ? problem.clearInput : undefined
  return {
    send,
    stop,
    /** A send is pending. */
    sending,
    /** The text is over the server's limit: Send is off. */
    tooLong: over > 0,
    /** The line under the composer: the text's length over the limit first, else the last miss; none when not set. */
    line: over > 0 ? tooLongLine(over) : problem?.line,
    /** Retry of the line; none for the too-long line or a miss that will not work again. */
    retry: over > 0 ? undefined : retry,
    /** The line's "Clear the terminal input", once the owner confirmed it; none when the line does not offer it. */
    clearInput:
      over > 0 || offered === undefined
        ? undefined
        : () => {
            runClear(offered)
          },
  }
}
