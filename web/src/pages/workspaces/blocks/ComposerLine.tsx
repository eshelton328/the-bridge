// The quiet line under a chat's composer when a send, a stop or a clear of
// the terminal input missed, or the text is over the limit (W1,
// `useComposerActions`), with Retry when it may work later. A send that found
// text in the chat's terminal input adds "Clear the terminal input", which
// asks first in `ClearInputDialog` (R28 part B). The dialog belongs to this
// chat's pane: when the owner opens another chat, the pane and the dialog go,
// and nothing is cleared. A /compact or /clear dialog draws the same line for
// its own miss (W5, `clearThen`). Props only.
import { useState } from 'react'
import { ClearInputDialog } from './ClearInputDialog.tsx'
import { TranscriptProblem } from './TranscriptProblem.tsx'

export type ComposerLineProps = {
  /** The line's words, with no message or terminal text; no line when not set. */
  text: string | undefined
  onRetry?: (() => void) | undefined
  /** Empties the chat's terminal input and sends the draft again; no "Clear the terminal input" when not set. */
  onClearInput?: (() => void) | undefined
  /** What the page does once the input is empty, for the dialog that asks first (`ClearInputDialog` `then`). */
  clearThen?: string | undefined
}

export function ComposerLine({ text, onRetry, onClearInput, clearThen }: ComposerLineProps) {
  const [asking, setAsking] = useState(false)
  if (text === undefined) return null
  return (
    <>
      <TranscriptProblem
        text={text}
        onRetry={onRetry}
        action={
          onClearInput === undefined
            ? undefined
            : {
                label: 'Clear the terminal input',
                onClick: () => {
                  setAsking(true)
                },
              }
        }
      />
      <ClearInputDialog
        open={asking && onClearInput !== undefined}
        onOpenChange={setAsking}
        onConfirm={() => onClearInput?.()}
        then={clearThen}
      />
    </>
  )
}
