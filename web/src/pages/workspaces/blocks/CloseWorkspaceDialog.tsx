// The dialog that asks before a workspace closes (M13 208:765): × on a
// workspace in the phone's edit mode opens it. It names the workspace and the
// chats that end with it, by its current name ("{workspace}" in its text), so
// a renamed workspace is asked about by the name the owner gave it; Close is red and Cancel is the easy target. The
// focus starts on the dialog's box, so Enter closes nothing. The library's
// confirm dialog (`Dialog role="alertdialog"`) is its box. Props only.
import { Button, Dialog, DialogClose } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { CloseWorkspaceText, Workspace } from '../types.ts'

// M13 208:769, 208:771: Cancel and Close share the row's width, each 44 high.
const half = css({ flex: '1' })
// M13 208:765: Figma puts the text 10 under the title (208:766, 208:767), where `Dialog size="md"` leaves 12.
const box = css({ gap: '10' })
// M13 208:768: the buttons' row pads 8 over the buttons, so they sit 18 under the text, and keeps them 10 apart.
const buttons = css({ display: 'flex', flex: '1', gap: '10', pt: '8' })

export type CloseWorkspaceDialogProps = {
  text: CloseWorkspaceText
  /** The workspace the dialog asks about, with its current name; no dialog when it has no text in `text.workspaces`. */
  workspace: Pick<Workspace, 'id' | 'label'> | null
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Close was pressed: the workspace and its chats end. */
  onConfirm?: ((workspace: string) => void) | undefined
  /** The Figma layers of the dialog and its two buttons, for the fidelity checks. */
  layers?: { dialog: string; cancel: string; close: string } | undefined
}

export function CloseWorkspaceDialog({ text, workspace, onOpenChange, onConfirm, layers }: CloseWorkspaceDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const asked = workspace === null ? undefined : text.workspaces[workspace.id]
  if (workspace === null || asked === undefined) return null
  const named = (line: string) => line.replaceAll('{workspace}', workspace.label)
  return (
    <Dialog
      role="alertdialog"
      title={named(asked.title)}
      description={named(asked.text)}
      open
      onOpenChange={onOpenChange}
      // The box itself takes the focus, so no button shows a focus ring as it opens, as Figma draws it (208:769);
      // Tab then reaches Cancel. Ark would otherwise focus Cancel.
      initialFocus={() => {
        const box = cancelRef.current?.closest('[role="alertdialog"]')
        return box instanceof HTMLElement ? box : null
      }}
      className={box}
      data-figma={layers?.dialog}
      actions={
        <div className={buttons}>
          <DialogClose>
            <Button ref={cancelRef} size="xl" className={half} data-figma={layers?.cancel}>
              {text.cancel}
            </Button>
          </DialogClose>
          <Button
            variant="dangerSoft"
            size="xl"
            className={half}
            data-figma={layers?.close}
            onClick={() => {
              onConfirm?.(workspace.id)
            }}
          >
            {text.close}
          </Button>
        </div>
      }
    />
  )
}
