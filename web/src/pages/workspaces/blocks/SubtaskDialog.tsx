// The Subtask form over the screen (D17 417:1026): the model that runs the
// subagent and what it should do, then a line on what the subtask gets and
// where its result goes, Cancel and Start subtask. Start subtask starts
// nothing here; the chat keeps working while a subtask runs. The library's
// `Dialog size="lg"` is the form's box, and the task is a `Composer` with
// its attach button, as the New chat form's first message (LIBRARY_GAPS.md:
// Composer in a form). Props only.
import { ArrowUpIcon, Button, Composer, Dialog, DialogClose } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SubtaskForm } from '../types.ts'
import { FormField } from './FormField.tsx'
import { SelectField } from './SelectField.tsx'

const wide = css({ w: '[100%]' })
const note = css({ textStyle: 'bodySm', color: 'fg.muted', m: '0' })

export type SubtaskDialogProps = {
  form: SubtaskForm
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
}

export function SubtaskDialog({ form, open, onOpenChange }: SubtaskDialogProps) {
  const { labels } = form
  const taskRef = useRef<HTMLDivElement>(null)
  return (
    <Dialog
      size="lg"
      title={form.title}
      closeButton
      open={open}
      onOpenChange={onOpenChange}
      // The task has the focus, as Figma draws its cyan border (417:1098).
      initialFocus={() => taskRef.current?.querySelector('textarea') ?? null}
      data-figma="417:1026"
      actions={
        <>
          <DialogClose>
            <Button size="sm" textSize="sm" data-figma="417:1107">
              {form.cancel}
            </Button>
          </DialogClose>
          <Button size="sm" textSize="smStrong" variant="primary" data-figma="417:1109">
            <ArrowUpIcon size="12" />
            {form.submit}
          </Button>
        </>
      }
    >
      <FormField label={labels.model} figma="417:1087">
        <SelectField label={labels.model} options={form.model.options} value={form.model.value} figma="417:1090" />
      </FormField>
      <FormField label={labels.task} figma="417:1095">
        <div ref={taskRef} data-figma="417:1098" className={wide}>
          <Composer
            label={labels.task}
            placeholder={form.task.placeholder}
            defaultValue={form.task.value}
            onAttach={() => undefined}
          />
        </div>
      </FormField>
      <p className={note} data-figma="417:1114">
        {form.note}
      </p>
    </Dialog>
  )
}
