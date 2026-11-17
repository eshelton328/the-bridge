// The whole prompt, read-only: in a dialog over the inbox on the desktop
// (D8), in a sheet from the bottom on a tablet or phone (T8). Done closes
// it, Edit prompt opens the editor and Copy copies the text. Props only.
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

const text = css({ textStyle: 'body', color: 'fg.default', m: '0' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })
// T8 346:7180: the hint's row is 38 high, the text 10 below its top.
const sheetHint = css({ textStyle: 'small', color: 'fg.subtle', py: '10' })
// T8 346:7176 and 346:7179: the title and the text share one left edge. BottomSheet pads its header 4 more than its
// content, so the content takes those 4 too.
const sheetBody = css({ px: '4' })

export type PromptDialogProps = {
  title: string
  text: string
  open: boolean
  /** Called with false when Done, Escape or a click outside closes the dialog. */
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The screen's layout: a dialog on the desktop, a sheet on a tablet or phone. */
  layout?: Viewport | undefined
}

function Actions() {
  return (
    <>
      <Button size="xl" data-figma="button · Edit prompt">
        <EditIcon />
        Edit prompt
      </Button>
      <Button size="xl" data-figma="button · Copy">
        <CopyIcon />
        Copy
      </Button>
    </>
  )
}

export function PromptDialog({ title, text: prompt, open, onOpenChange, layout = 'desktop' }: PromptDialogProps) {
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
          <p className={text} data-figma="346:7179">
            {prompt}
          </p>
          <span className={sheetHint}>Read only. Edit opens the prompt for changes.</span>
          <div data-figma="sheet actions">
            <Grid columns="2" gap="10">
              <Actions />
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
        <Button size="xl">
          <EditIcon />
          Edit prompt
        </Button>
        <Button size="xl">
          <CopyIcon />
          Copy
        </Button>
      </Grid>
    </Dialog>
  )
}
