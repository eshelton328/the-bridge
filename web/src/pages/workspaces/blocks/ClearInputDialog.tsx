// The dialog that asks before the page empties a chat's terminal input (R28
// part B): "Clear the terminal input" on the composer's line opens it after a
// send found text there (409 inputNotEmpty). It says that text will be lost;
// Clear empties it and Cancel does nothing. No Figma frame draws it, so it is
// the library's confirm dialog (`Dialog role="alertdialog"`) as it comes,
// with the focus on Cancel, so Enter clears nothing. Props only.
import { Button, Dialog, DialogClose } from '@eshelton328/component-library-1701'

export type ClearInputDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Clear was pressed: the dialog has closed and the caller empties the terminal input. */
  onConfirm: () => void
}

export function ClearInputDialog({ open, onOpenChange, onConfirm }: ClearInputDialogProps) {
  if (!open) return null
  return (
    <Dialog
      role="alertdialog"
      title="Clear the terminal input?"
      description="The text in the chat's terminal input will be lost. Then the page sends your message."
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
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
          >
            Clear
          </Button>
        </>
      }
    />
  )
}
