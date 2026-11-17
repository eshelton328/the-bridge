// The dialog that confirms a removal the discussion proposed: the task's
// meta line, what happens, the reason, and Keep it or Remove task. Props
// only.
import { Button, Dialog, DialogClose, Panel, Stack, TrashIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxProposal } from '../types.ts'

const meta = css({ textStyle: 'monoSm', color: 'fg.muted', m: '0' })
// Figma 403:3918 and 403:3921: Geist Regular 13/19, the text #8a97b8 (fg.muted) and the reason #e6ecff.
const text = css({ textStyle: 'bodySm', color: 'fg.muted', m: '0' })
const label = css({ textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.subtle', m: '0' })
const reason = css({ textStyle: 'bodySm', color: 'fg.default', m: '0' })

export type RemoveDialogProps = {
  proposal: Extract<InboxProposal, { kind: 'remove' }>
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
}

export function RemoveDialog({ proposal, open, onOpenChange }: RemoveDialogProps) {
  const { confirm } = proposal
  return (
    <Dialog
      role="alertdialog"
      title={confirm.title}
      open={open}
      onOpenChange={onOpenChange}
      data-figma="dialog · Remove this task"
      actions={
        <>
          <DialogClose>
            <Button>Keep it</Button>
          </DialogClose>
          <Button variant="danger">
            <TrashIcon />
            Remove task
          </Button>
        </>
      }
    >
      <p className={meta}>{confirm.meta}</p>
      <p className={text}>{confirm.text}</p>
      <Panel>
        {/* ProposalSection sets its text in `small` (12), the size of a proposal; the dialog's reason is 13 (403:3921). */}
        <Stack gap="4">
          <p className={label}>{proposal.reasonLabel}</p>
          <p className={reason}>{proposal.reason}</p>
        </Stack>
      </Panel>
    </Dialog>
  )
}
