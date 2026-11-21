// What the page shows when a model restart ended the chat and started none (W10, 502 `failed`): the old chat has
// ended and its pane is a shell, so the chat's header is gone from the next list on, and this is a library dialog
// over the page. It says what to run on the Mac in that pane, `claude --resume <session>`, in a read-only field with
// Copy; the page tries nothing again. Props only.
import { Button, Dialog, DialogClose, TextField } from '@eshelton328/component-library-1701'
import { useState } from 'react'

export type ModelRestartFailedProps = {
  /** The session of the chat that ended; none keeps the dialog closed. */
  session: string | undefined
  onClose: () => void
  /** Copies the command: `true` once the clipboard has it. */
  onCopy: (text: string) => Promise<boolean>
}

export function ModelRestartFailed({ session, onClose, onCopy }: ModelRestartFailedProps) {
  const [copied, setCopied] = useState<boolean | undefined>(undefined)
  if (session === undefined) return null
  const command = `claude --resume ${session}`
  return (
    <Dialog
      title="The chat did not restart"
      description="The chat stopped and did not restart. On the Mac, run this in its pane:"
      open
      onOpenChange={(open) => {
        if (!open) {
          setCopied(undefined)
          onClose()
        }
      }}
      actions={
        <>
          <Button
            size="sm"
            textSize="sm"
            onClick={() => {
              void onCopy(command).then(setCopied)
            }}
          >
            {copied === undefined ? 'Copy' : copied ? 'Copied' : 'Copy failed'}
          </Button>
          <DialogClose>
            <Button size="sm" textSize="smStrong" variant="primary">
              Close
            </Button>
          </DialogClose>
        </>
      }
    >
      <TextField label="Command" value={command} readOnly valueStyle="mono" />
    </Dialog>
  )
}
