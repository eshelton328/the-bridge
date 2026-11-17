// The dialog that confirms a removal the discussion proposed: the task's
// meta line, what happens, the reason, and Keep it or Remove task. Props
// only.
import { Button, Dialog, DialogClose, Panel, ProposalSection, TrashIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxProposal } from '../types.ts'

const meta = css({ textStyle: 'monoSm', color: 'fg.muted', m: '0' })
const text = css({ textStyle: 'body', color: 'fg.default', m: '0' })

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
        <ProposalSection label={proposal.reasonLabel}>{proposal.reason}</ProposalSection>
      </Panel>
    </Dialog>
  )
}
