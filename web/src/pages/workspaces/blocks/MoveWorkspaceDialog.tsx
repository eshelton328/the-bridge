// The dialog that asks before a live chat moves to another workspace when it
// is the last chat of its own (backend #435): the move closes that
// workspace, so the dialog names the chat, the target and the workspace that
// closes, and Move sends the move. No Figma frame draws it; it is the
// library's confirm dialog (`Dialog role="alertdialog"`) with Cancel as the
// easy target, as the close dialogs are. Props only.
import { Button, Dialog, DialogClose } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// Cancel and Move share the row's width, as in the close dialogs (M13 208:769, 208:771).
const half = css({ flex: '1' })
const buttons = css({ display: 'flex', flex: '1', gap: '10', pt: '8' })

export type MoveWorkspaceDialogProps = {
  /** The chat's name. */
  chat: string
  /** The name of the workspace it moves to. */
  to: string
  /** The name of its own workspace, which closes with the move. */
  from: string
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Move was pressed. */
  onMove?: (() => void) | undefined
}

export function MoveWorkspaceDialog({ chat, to, from, onOpenChange, onMove }: MoveWorkspaceDialogProps) {
  return (
    <Dialog
      role="alertdialog"
      title={`Move ${chat} to ${to}?`}
      description={`Moving it closes ${from}.`}
      open
      onOpenChange={onOpenChange}
      actions={
        <div className={buttons}>
          <DialogClose>
            <Button size="xl" className={half}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="primary" size="xl" className={half} onClick={onMove}>
            Move
          </Button>
        </div>
      }
    />
  )
}
