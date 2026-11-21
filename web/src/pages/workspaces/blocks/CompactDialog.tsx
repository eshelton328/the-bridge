// The dialog of a live Claude chat's /compact (W5): Claude Code summarises the
// chat's context, with the owner's instructions for the summary if he types
// any (one line, at most `maxCompactChars`). Compact posts, and Enter in the
// field does too; Cancel does nothing. A miss keeps the dialog open with its
// line (`useCommandRun`). No Figma frame draws it, so it is the library's
// `Dialog` with a `TextField`, the focus in the field. Props only.
import { ChatCommandRequest, maxCompactChars } from '@bridge/contract'
import { Button, Dialog, DialogClose, TextField } from '@eshelton328/component-library-1701'
import { useId, useRef, useState } from 'react'
import { ComposerLine } from './ComposerLine.tsx'
import { type RunCommand, useCommandRun } from './useCommandRun.ts'

export type CompactDialogProps = {
  /** The chat's name, under the title. */
  chat: string
  onOpenChange: (open: boolean) => void
  onRun?: RunCommand | undefined
}

/** The field's error for `text`: none when the contract takes it. */
function errorOf(text: string): string | undefined {
  const over = text.length - maxCompactChars
  if (over > 0) return `Too long — ${String(over)} ${over === 1 ? 'character' : 'characters'} over`
  return ChatCommandRequest.safeParse({ command: 'compact', instructions: text }).success ? undefined : 'One line only'
}

export function CompactDialog({ chat, onOpenChange, onRun }: CompactDialogProps) {
  const [instructions, setInstructions] = useState('')
  const { line, pending, start, clear } = useCommandRun(onRun, () => {
    onOpenChange(false)
  })
  const formId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const error = errorOf(instructions)
  const submit = () => {
    if (error !== undefined) return
    start(instructions.trim() === '' ? { command: 'compact' } : { command: 'compact', instructions })
  }
  return (
    <Dialog
      title="Compact the context"
      meta={chat}
      description="Claude Code summarises the chat's context so far and goes on from the summary."
      open
      onOpenChange={onOpenChange}
      initialFocus={() => formRef.current?.querySelector('input') ?? null}
      actions={
        <>
          <DialogClose>
            <Button size="sm" textSize="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form={formId}
            size="sm"
            textSize="smStrong"
            variant="primary"
            disabled={pending || error !== undefined}
          >
            Compact
          </Button>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <TextField
          label="Instructions (optional)"
          placeholder="What the summary should keep"
          value={instructions}
          onValueChange={setInstructions}
          error={error}
        />
      </form>
      <ComposerLine text={line} onClearInput={clear} clearThen="Then the page compacts the chat." />
    </Dialog>
  )
}
