// The whole prompt, read-only, in a dialog over the inbox: Done closes it,
// Edit prompt opens the editor and Copy copies the text. Props only.
import { Button, CopyIcon, Dialog, DialogClose, EditIcon, Grid } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

const text = css({ textStyle: 'body', color: 'fg.default', m: '0' })
const hint = css({ textStyle: 'small', color: 'fg.subtle' })

export type PromptDialogProps = {
  title: string
  text: string
  open: boolean
  /** Called with false when Done, Escape or a click outside closes the dialog. */
  onOpenChange?: ((open: boolean) => void) | undefined
}

export function PromptDialog({ title, text: prompt, open, onOpenChange }: PromptDialogProps) {
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
