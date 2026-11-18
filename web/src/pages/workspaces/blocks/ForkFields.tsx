// The Fork form's fields (D15 417:305, M18 422:217): the copy's name, which
// Erik can change, the two-way start-from choice, the whole chat or up to a
// message he picks next, and the line on what the fork copies. The desktop
// `ForkDialog` and the phone's `PhoneFork` draw them. Props only.
import { Button, Grid, TextField } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ForkForm } from '../types.ts'
import { FormField } from './FormField.tsx'

const note = css({ textStyle: 'bodySm', color: 'fg.muted', m: '0' })

/** The Figma layers of the fields, for the fidelity checks. */
type ForkFieldsLayers = {
  name?: string | undefined
  startFrom?: string | undefined
  /** The start-from choices, in order. */
  choices?: readonly (string | undefined)[] | undefined
  note?: string | undefined
}

export type ForkFieldsProps = {
  form: ForkForm
  /** The title of the chat to fork; it fills `{chat}` in the name. */
  chat: string
  layers?: ForkFieldsLayers | undefined
  /**
   * `phone` draws the choices' labels in Geist Medium 13 (`labelSm`), as M18 does (422:238, 422:244); `desktop` (the
   * default) keeps the Button's `label` (Medium 14).
   */
  size?: 'desktop' | 'phone' | undefined
}

export function ForkFields({ form, chat, layers, size = 'desktop' }: ForkFieldsProps) {
  const { labels } = form
  const [chosen, setChosen] = useState(form.startFrom.value)
  return (
    <>
      <FormField label={labels.name} hint={form.name.hint} figma={layers?.name}>
        <TextField label={labels.name} labelHidden size="lg" defaultValue={form.name.value.replace('{chat}', chat)} />
      </FormField>
      <FormField label={labels.startFrom} figma={layers?.startFrom}>
        <Grid columns="2" gap="6" role="group" aria-label={labels.startFrom}>
          {form.startFrom.options.map((o, i) => (
            <Button
              key={o.value}
              size="lg"
              textSize={size === 'phone' ? 'sm' : 'md'}
              pressed={o.value === chosen}
              onClick={() => {
                setChosen(o.value)
              }}
              data-figma={layers?.choices?.[i]}
            >
              {o.label}
            </Button>
          ))}
        </Grid>
      </FormField>
      <p className={note} data-figma={layers?.note}>
        {form.note}
      </p>
    </>
  )
}
