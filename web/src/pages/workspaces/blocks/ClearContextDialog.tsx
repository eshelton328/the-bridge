// The dialog of a live Claude chat's /clear (W5): it says that the chat's
// context will be cleared, as Claude Code starts the chat over in a new
// session on the same pane. Clear posts; Cancel does nothing. A miss keeps
// the dialog open with its line (`useCommandRun`). No Figma frame draws it,
// so it is the library's confirm dialog (`Dialog role="alertdialog"`) as it
// comes, with the focus on Cancel, so Enter clears nothing. Props only.
import { Button, Dialog, DialogClose } from '@eshelton328/component-library-1701'
import { ComposerLine } from './ComposerLine.tsx'
import { type RunCommand, useCommandRun } from './useCommandRun.ts'

export type ClearContextDialogProps = {
  /** The chat's name, under the title. */
  chat: string
  onOpenChange: (open: boolean) => void
  onRun?: RunCommand | undefined
}

export function ClearContextDialog({ chat, onOpenChange, onRun }: ClearContextDialogProps) {
  const { line, pending, start, clear } = useCommandRun(onRun, () => {
    onOpenChange(false)
  })
  return (
    <Dialog
      role="alertdialog"
      title="Clear the context?"
      meta={chat}
      description="The chat's context will be cleared: Claude Code starts it over in a new session in the same pane, and its messages so far leave this page."
      open
      onOpenChange={onOpenChange}
      actions={
        <>
          <DialogClose>
            <Button size="sm" textSize="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            textSize="smStrong"
            variant="dangerSoft"
            disabled={pending}
            onClick={() => {
              start({ command: 'clear' })
            }}
          >
            Clear
          </Button>
        </>
      }
    >
      <ComposerLine text={line} onClearInput={clear} clearThen="Then the page clears the context." />
    </Dialog>
  )
}
