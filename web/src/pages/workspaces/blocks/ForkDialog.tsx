// The Fork form over the screen (D15 417:305): the copy's name, which Erik
// can change, and where it starts, the whole chat or up to a message he
// picks next, then a line on what the fork copies, Cancel and Fork. Fork
// starts nothing; the copy waits for Erik's next message. The library's
// `Dialog size="lg"` is the form's box. Props only.
import { ArrowUpIcon, Button, Dialog, DialogClose, Grid, TextField } from '@eshelton328/component-library-1701'
import { useRef, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ForkForm } from '../types.ts'
import { FormField } from './FormField.tsx'

// D15's Figma layers of the start-from choices, in order.
const startFromLayers = ['417:323', '417:327']

const note = css({ textStyle: 'bodySm', color: 'fg.muted', m: '0' })

export type ForkDialogProps = {
  form: ForkForm
  /** The title of the chat to fork; it fills `{chat}` in the form's title and name. */
  chat: string
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
}

export function ForkDialog({ form, chat, open, onOpenChange }: ForkDialogProps) {
  const { labels } = form
  const [chosen, setChosen] = useState(form.startFrom.value)
  const submitRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog
      size="lg"
      title={form.title.replace('{chat}', chat)}
      closeButton
      open={open}
      onOpenChange={onOpenChange}
      // The dialog box itself takes the focus, so no control shows a focus ring when it opens, as Figma draws it;
      // Tab then reaches the name. Ark would otherwise focus the close button.
      initialFocus={() => {
        const box = submitRef.current?.closest('[role="dialog"]')
        return box instanceof HTMLElement ? box : null
      }}
      data-figma="417:305"
      actions={
        <>
          <DialogClose>
            <Button size="sm" textSize="sm" data-figma="417:386">
              {form.cancel}
            </Button>
          </DialogClose>
          <Button ref={submitRef} size="sm" textSize="smStrong" variant="primary" data-figma="417:388">
            <ArrowUpIcon size="12" />
            {form.submit}
          </Button>
        </>
      }
    >
      <FormField label={labels.name} hint={form.name.hint} figma="417:312">
        <TextField label={labels.name} labelHidden size="lg" defaultValue={form.name.value.replace('{chat}', chat)} />
      </FormField>
      <FormField label={labels.startFrom} figma="417:319">
        <Grid columns="2" gap="6" role="group" aria-label={labels.startFrom}>
          {form.startFrom.options.map((o, i) => (
            <Button
              key={o.value}
              size="lg"
              pressed={o.value === chosen}
              onClick={() => {
                setChosen(o.value)
              }}
              data-figma={startFromLayers[i]}
            >
              {o.label}
            </Button>
          ))}
        </Grid>
      </FormField>
      <p className={note} data-figma="417:393">
        {form.note}
      </p>
    </Dialog>
  )
}
