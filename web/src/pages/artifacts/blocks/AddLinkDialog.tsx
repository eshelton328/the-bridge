// The Add a link dialog (D5 403:7541), for an artifact the library did not
// find, such as a Codex site on its own domain: the link, the source read
// from it (Claude artifact or Codex site, changeable), the title from the
// page's <title> and an optional project, then Cancel and Add artifact. The
// link field has the focus when it opens. Props only.
import {
  Button,
  Dialog,
  DialogClose,
  KindMark,
  PlusIcon,
  Stack,
  TextField,
  ViewSwitch,
} from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { AddLinkForm } from '../types.ts'
import { ProjectPicker } from './ProjectPicker.tsx'

// TextField's label and helper text: `small` in `fg.muted`, 6 from the control.
const label = css({ textStyle: 'small', color: 'fg.muted' })
const hint = css({ textStyle: 'small', color: 'fg.muted' })

export type AddLinkDialogProps = {
  form: AddLinkForm
  open: boolean
  /** The picked source. */
  source: AddLinkForm['source']['options'][number]['value']
  onOpenChange?: ((open: boolean) => void) | undefined
  onSourceChange?: ((source: AddLinkForm['source']['options'][number]['value']) => void) | undefined
  /** Add artifact was pressed. */
  onSubmit?: (() => void) | undefined
}

export function AddLinkDialog({ form, open, source, onOpenChange, onSourceChange, onSubmit }: AddLinkDialogProps) {
  const linkRef = useRef<HTMLDivElement>(null)
  // The dialog's focus trap selects the text of the field it focuses first. Figma draws the link focused with the
  // caret after it (403:7552), so the first focus puts the caret at the end instead.
  const caretPlacedRef = useRef(false)
  return (
    <Dialog
      size="lg"
      title={form.title}
      description={form.description}
      closeButton
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={() => linkRef.current?.querySelector('input') ?? null}
      data-figma="dialog · Add a link"
      actions={
        <>
          <DialogClose>
            <Button data-figma="button · Cancel">{form.cancel}</Button>
          </DialogClose>
          <Button variant="primary" data-figma="button · Add artifact" onClick={onSubmit}>
            <PlusIcon />
            {form.submit}
          </Button>
        </>
      }
    >
      <div
        ref={linkRef}
        data-figma="field · Link"
        onFocus={(event) => {
          const input = event.target
          if (caretPlacedRef.current || !(input instanceof HTMLInputElement)) return
          caretPlacedRef.current = true
          queueMicrotask(() => {
            input.setSelectionRange(input.value.length, input.value.length)
          })
        }}
      >
        {/* A text field: the caret cannot be placed in a `url` input (no selection API). */}
        <TextField size="xl" label={form.link.label} defaultValue={form.link.value} helperText={form.link.hint} />
      </div>
      <div data-figma="field · Source">
        <Stack gap="6">
          <span className={label}>{form.source.label}</span>
          <div data-figma="segmented · Source">
            <ViewSwitch
              size="lg"
              label={form.source.label}
              items={form.source.options.map((option) => ({
                value: option.value,
                label: option.label,
                icon: <KindMark kind={option.value} size="12" />,
              }))}
              value={source}
              onValueChange={(value) => {
                const picked = form.source.options.find((option) => option.value === value)
                if (picked !== undefined) onSourceChange?.(picked.value)
              }}
            />
          </div>
          <span className={hint}>{form.source.hint}</span>
        </Stack>
      </div>
      <div data-figma="field · Title">
        <TextField size="xl" label={form.name.label} defaultValue={form.name.value} helperText={form.name.hint} />
      </div>
      <ProjectPicker field={form.project} />
    </Dialog>
  )
}
