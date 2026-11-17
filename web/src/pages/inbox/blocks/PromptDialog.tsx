// The whole prompt, read-only: in a dialog over the inbox on the desktop
// (D8), in a sheet from the bottom on a tablet or phone (T8, M9). Done
// closes it, Edit prompt closes it and opens the editor (a prompt that can
// be edited only) and Copy copies the text. Props only.
import {
  BottomSheet,
  BottomSheetClose,
  Button,
  CopyIcon,
  Dialog,
  DialogClose,
  EditIcon,
  Grid,
  Stack,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'

// D08 346:3548: Regular 15 with 23 px lines; `bodyLg` is 15/24 (d-100, the 4 px grid).
const text = css({ textStyle: 'bodyLg', color: 'fg.default', m: '0' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })
// T8 346:7180: the hint's row is 38 high, the text 10 below its top.
const sheetHint = css({ textStyle: 'small', color: 'fg.subtle', py: '10' })
// T8 346:7176 and 346:7179: the title and the text share one left edge. BottomSheet pads its header 4 more than its
// content, so the content takes those 4 too.
const sheetBody = css({ px: '4' })
// The sheet's text is an unnamed layer: 346:7179 in T8, 346:10794 in M9.
const sheetText = { tablet: '346:7179', phone: '346:10794' } as const

export type PromptDialogProps = {
  title: string
  text: string
  open: boolean
  /** Called with false when Done, Escape or a click outside closes the dialog. */
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The screen's layout: a dialog on the desktop, a sheet on a tablet or phone. */
  layout?: Viewport | undefined
  /** Edit prompt; without it (a sent prompt) the dialog has only Copy. */
  onEdit?: (() => void) | undefined
}

function Actions({ prompt, onEdit, figma }: { prompt: string; onEdit: (() => void) | undefined; figma: boolean }) {
  return (
    <>
      {onEdit === undefined ? null : (
        <Button size="xl" data-figma={figma ? 'button · Edit prompt' : undefined} onClick={onEdit}>
          <EditIcon />
          Edit prompt
        </Button>
      )}
      <Button
        size="xl"
        data-figma={figma ? 'button · Copy' : undefined}
        onClick={() => {
          void navigator.clipboard.writeText(prompt)
        }}
      >
        <CopyIcon />
        Copy
      </Button>
    </>
  )
}

export function PromptDialog({
  title,
  text: prompt,
  open,
  onOpenChange,
  layout = 'desktop',
  onEdit,
}: PromptDialogProps) {
  if (layout !== 'desktop')
    return (
      <BottomSheet
        title={title}
        open={open}
        onOpenChange={onOpenChange}
        actions={
          <BottomSheetClose>
            <Button variant="text">Done</Button>
          </BottomSheetClose>
        }
      >
        <Stack gap="4" className={sheetBody}>
          <p className={text} data-figma={sheetText[layout]}>
            {prompt}
          </p>
          <span className={sheetHint}>Read only. Edit opens the prompt for changes.</span>
          <div data-figma="sheet actions">
            <Grid columns="2" gap="10">
              <Actions prompt={prompt} onEdit={onEdit} figma />
            </Grid>
          </div>
        </Stack>
      </BottomSheet>
    )
  return (
    <Dialog
      size="wide"
      title={title}
      open={open}
      onOpenChange={onOpenChange}
      data-figma="dialog · Suggested prompt"
      headerAction={
        <DialogClose>
          <Button variant="text">Done</Button>
        </DialogClose>
      }
    >
      <p className={text} data-figma="346:3548">
        {prompt}
      </p>
      <span className={hint}>Read only. Edit opens the prompt for changes.</span>
      <Grid columns="2" gap="10">
        <Actions prompt={prompt} onEdit={onEdit} figma={false} />
      </Grid>
    </Dialog>
  )
}
