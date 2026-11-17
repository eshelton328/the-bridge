// The dialog that confirms a removal the discussion proposed: the task's
// meta line, what happens, the reason, and Keep it or Remove task. On the
// phone it is a sheet from the bottom, its two buttons full width under
// the reason (M24). Props only.
import {
  BottomSheet,
  BottomSheetClose,
  Button,
  Dialog,
  DialogClose,
  Panel,
  Stack,
  TrashIcon,
} from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { InboxProposal } from '../types.ts'

const meta = css({ textStyle: 'monoSm', color: 'fg.muted', m: '0' })
// Figma 403:3918 and 403:3921: Geist Regular 13/19, the text #8a97b8 (fg.muted) and the reason #e6ecff.
const text = css({ textStyle: 'bodySm', color: 'fg.muted', m: '0' })
const label = css({ textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.subtle', m: '0' })
const reason = css({ textStyle: 'bodySm', color: 'fg.default', m: '0' })
// M24 402:7849 and 402:7853: the sheet's buttons span its width.
const wide = css({ w: '[100%]' })
// M24 402:7842 to 402:7853: the meta line, the text, the reason and the buttons start 17 from the sheet's edge, under
// the title. The sheet pads 12 and its title row 4 more (BottomSheet's header); the content takes the same 4.
const sheetBody = css({ px: '4' })

export type RemoveDialogProps = {
  proposal: Extract<InboxProposal, { kind: 'remove' }>
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** Remove task was pressed. */
  onConfirm?: (() => void) | undefined
  /** The screen's layout: a sheet on the phone, a dialog otherwise (T23 draws a dialog on the tablet). */
  layout?: Viewport | undefined
}

function Reason({ proposal }: { proposal: RemoveDialogProps['proposal'] }) {
  return (
    <Panel>
      {/* ProposalSection sets its text in `small` (12), the size of a proposal; the dialog's reason is 13 (403:3921). */}
      <Stack gap="4">
        <p className={label}>{proposal.reasonLabel}</p>
        <p className={reason}>{proposal.reason}</p>
      </Stack>
    </Panel>
  )
}

export function RemoveDialog({ proposal, open, onOpenChange, onConfirm, layout = 'desktop' }: RemoveDialogProps) {
  const { confirm } = proposal
  const keepRef = useRef<HTMLButtonElement>(null)
  if (layout === 'phone')
    // BottomSheet is a dialog; it has no alertdialog role, as the confirm dialog has (LIBRARY_GAPS.md). The focus
    // starts on Keep it, so Enter does not remove the task.
    return (
      <BottomSheet title={confirm.title} open={open} onOpenChange={onOpenChange} initialFocus={() => keepRef.current}>
        <Stack gap="12" className={sheetBody} data-figma="sheet · Remove this task">
          <p className={meta}>{confirm.meta}</p>
          <p className={text}>{confirm.text}</p>
          <div data-figma="402:7846">
            <Reason proposal={proposal} />
          </div>
          <Button variant="danger" size="xl" className={wide} onClick={onConfirm}>
            <TrashIcon />
            Remove task
          </Button>
          <BottomSheetClose>
            <Button ref={keepRef} size="xl" className={wide}>
              Keep it
            </Button>
          </BottomSheetClose>
        </Stack>
      </BottomSheet>
    )
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
            {/* Figma sets the dialog's Keep it in Medium 13 (D20 403:3924). */}
            <Button textSize="sm">Keep it</Button>
          </DialogClose>
          <Button variant="danger" textSize="smStrong" onClick={onConfirm}>
            <TrashIcon />
            Remove task
          </Button>
        </>
      }
    >
      <p className={meta}>{confirm.meta}</p>
      <p className={text}>{confirm.text}</p>
      <Reason proposal={proposal} />
    </Dialog>
  )
}
