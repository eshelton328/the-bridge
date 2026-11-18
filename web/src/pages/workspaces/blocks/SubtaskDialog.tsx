// The Subtask form over the screen (D17 417:1026): the model that runs the
// subagent and what it should do, then a line on what the subtask gets and
// where its result goes, Cancel and Start subtask. Start subtask starts
// nothing here; the chat keeps working while a subtask runs. The library's
// `Dialog size="lg"` is the form's box, with `SubtaskFields` in it; at a
// tablet's width it opens over the chat with T10's layers. Props only.
import { ArrowUpIcon, Button, Dialog, DialogClose } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import type { SubtaskDialogLayers, SubtaskForm } from '../types.ts'
import { SubtaskFields } from './SubtaskFields.tsx'

// D17's Figma layers, which a frame with its own layers (T10) replaces.
const d17Layers: SubtaskDialogLayers = {
  dialog: '417:1026',
  model: '417:1087',
  modelBox: '417:1090',
  task: '417:1095',
  taskBox: '417:1098',
  note: '417:1114',
  cancel: '417:1107',
  submit: '417:1109',
}

export type SubtaskDialogProps = {
  form: SubtaskForm
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The frame's Figma layers; D17's when not set. */
  layers?: SubtaskDialogLayers | undefined
}

export function SubtaskDialog({ form, open, onOpenChange, layers = d17Layers }: SubtaskDialogProps) {
  const taskRef = useRef<HTMLDivElement>(null)
  return (
    <Dialog
      size="lg"
      title={form.title}
      closeButton
      open={open}
      onOpenChange={onOpenChange}
      // The task has the focus, as Figma draws its cyan border (D17 417:1098, T10 420:979).
      initialFocus={() => taskRef.current?.querySelector('textarea') ?? null}
      data-figma={layers.dialog}
      actions={
        <>
          <DialogClose>
            <Button size="sm" textSize="sm" data-figma={layers.cancel}>
              {form.cancel}
            </Button>
          </DialogClose>
          <Button size="sm" textSize="smStrong" variant="primary" data-figma={layers.submit}>
            <ArrowUpIcon size="12" />
            {form.submit}
          </Button>
        </>
      }
    >
      <SubtaskFields form={form} taskRef={taskRef} layers={layers} />
    </Dialog>
  )
}
