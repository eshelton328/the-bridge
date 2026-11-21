// The dialog of Close pane… on a live chat (slice W2): herdr's close ends the
// pane's agent or shell, with any command that runs in it, so the page asks
// first and names the chat. Close posts `/close` with the chat's ID as its
// confirm; the dialog then waits, with "Closing…", until the layout read
// after `layout.changed` drops the pane (or the page's 2.5 s wait ends), and
// closes. A chat that works says so and offers Stop (the W1 stop) beside
// Cancel; one that waits for an answer says it needs one first. No Figma
// frame draws it (D13 deviations), so it is the library's confirm dialog
// (`Dialog role="alertdialog"`) with the focus on Cancel. Props only.
import { Button, Dialog, DialogClose } from '@eshelton328/component-library-1701'
import { useEffect, useRef, useState } from 'react'
import type { CloseAnswer } from './layoutActions.ts'
import { ComposerLine } from './ComposerLine.tsx'
import type { ComposerAnswer } from './useComposerActions.ts'

export type CloseChatDialogProps = {
  /** The chat's name, in the title and under it. */
  chat: string
  /** The server took the close and the page waits for the pane to go. */
  closing: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => Promise<CloseAnswer>
  /** Stops the chat: offered while the close found it working; none for a shell or a Codex chat. */
  onStop?: (() => Promise<ComposerAnswer>) | undefined
}

export function CloseChatDialog({ chat, closing, onOpenChange, onClose, onStop }: CloseChatDialogProps) {
  const [line, setLine] = useState<string>()
  const [stoppable, setStoppable] = useState(false)
  const [posting, setPosting] = useState(false)
  // A ref, not state: a second tap in the same frame must see the first one's post.
  const postingRef = useRef(false)
  const [posted, setPosted] = useState(false)
  // The server closed the pane and the page has read the layout since: the dialog's work is done.
  useEffect(() => {
    if (posted && !closing) onOpenChange(false)
  }, [posted, closing, onOpenChange])
  const close = () => {
    if (postingRef.current) return
    postingRef.current = true
    setPosting(true)
    setLine(undefined)
    void onClose()
      .then((answer) => {
        if (answer === true) setPosted(true)
        else {
          setLine(answer.line)
          setStoppable(answer.stop)
        }
      })
      .finally(() => {
        postingRef.current = false
        setPosting(false)
      })
  }
  const stop =
    stoppable && onStop !== undefined
      ? () => {
          void onStop().then((answer) => {
            setStoppable(false)
            // `false`: no stop went (one is in flight, or the chat stopped already).
            if (answer === true) setLine('Stop sent. Close the pane once the chat is idle.')
            else if (answer !== false) setLine(answer.line)
          })
        }
      : undefined
  const busy = posting || (posted && closing)
  return (
    <Dialog
      role="alertdialog"
      title={`Close ${chat}?`}
      meta={chat}
      description="Closing the pane ends this chat's agent or shell in herdr, and any command that runs in it. It cannot be undone."
      open
      onOpenChange={onOpenChange}
      actions={
        <>
          <DialogClose>
            <Button size="sm" textSize="sm">
              Cancel
            </Button>
          </DialogClose>
          {stop === undefined ? null : (
            <Button size="sm" textSize="sm" onClick={stop}>
              Stop
            </Button>
          )}
          <Button size="sm" textSize="smStrong" variant="dangerSoft" disabled={busy} aria-busy={busy} onClick={close}>
            {busy ? 'Closing…' : 'Close'}
          </Button>
        </>
      }
    >
      <ComposerLine text={line} />
    </Dialog>
  )
}
