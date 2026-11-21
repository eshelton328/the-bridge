// A chat command's run in its dialog (W5): one post at a time, the dialog
// closed by a command that went through, and the one quiet line that says
// why it missed, such as "Not compacted — chat is working". The line holds
// only the page's words, never the instructions. A command that found text
// in the chat's terminal input carries `clearInput`, as a send does (R28
// part B): `clear` empties the input, once the owner confirmed it, and then
// posts the command again. Props only: the caller passes what posts.
import type { ChatCommandRequest } from '@bridge/contract'
import { useRef, useState } from 'react'
import type { ComposerAnswer } from './useComposerActions.ts'

/** Posts a command; answers as a composer's send does (`ComposerAnswer`). */
export type RunCommand = (request: ChatCommandRequest) => Promise<ComposerAnswer>

type Miss = { readonly line: string; readonly clearInput: (() => Promise<ComposerAnswer>) | undefined }

export function useCommandRun(run: RunCommand | undefined, close: () => void) {
  const [miss, setMiss] = useState<Miss>()
  const [pending, setPending] = useState(false)
  // A ref, not state: a second tap or Enter in the same frame must see the first one's post.
  const runningRef = useRef(false)
  // The command the line belongs to, which a clear of the terminal input posts again.
  const [last, setLast] = useState<ChatCommandRequest>()
  /** Runs `step` alone, then shows its answer: `true` closes the dialog, `again` runs after a `true` instead. */
  const guarded = (step: () => Promise<ComposerAnswer>, again?: () => void) => {
    if (runningRef.current) return
    runningRef.current = true
    setPending(true)
    setMiss(undefined)
    void step()
      .then((answer) => {
        if (answer === true) {
          if (again === undefined) close()
        } else if (answer !== false) setMiss({ line: answer.line, clearInput: answer.clearInput })
        return answer === true
      })
      .finally(() => {
        runningRef.current = false
        setPending(false)
      })
      .then((done) => {
        if (done) again?.()
      })
  }
  const start = (request: ChatCommandRequest) => {
    if (run === undefined) return
    setLast(request)
    guarded(() => run(request))
  }
  const clearInput = miss?.clearInput
  const clear =
    clearInput === undefined || last === undefined
      ? undefined
      : () => {
          guarded(clearInput, () => {
            start(last)
          })
        }
  return { line: miss?.line, pending, start, clear }
}
