// The fields of the Add a link form, which the desktop's dialog (D5 403:7541)
// and the phone's sheet (M6 408:703) both hold: the link, the source read
// from it (Claude artifact or Codex site, changeable), the title from the
// page's <title> and an optional project. A field's line under it shows
// when the form has one. The link field gets the focus with the caret after
// the link: `linkRef` is the element whose input the dialog or sheet
// focuses first. Props only.
import { KindMark, Stack, TextField, ViewSwitch } from '@eshelton328/component-library-1701'
import { type RefObject, useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { AddLinkForm } from '../types.ts'
import { ProjectPicker } from './ProjectPicker.tsx'

// TextField's label and helper text: `small` in `fg.muted`, 6 from the control.
const label = css({ textStyle: 'small', color: 'fg.muted' })
const hint = css({ textStyle: 'small', color: 'fg.muted' })

export type AddLinkSource = AddLinkForm['source']['options'][number]['value']

export type AddLinkFieldsProps = {
  form: AddLinkForm
  /** The picked source. */
  source: AddLinkSource
  onSourceChange?: ((source: AddLinkSource) => void) | undefined
  /** The link field's box; the dialog or sheet focuses its input when it opens. */
  linkRef: RefObject<HTMLDivElement | null>
}

export function AddLinkFields({ form, source, onSourceChange, linkRef }: AddLinkFieldsProps) {
  // A focus trap selects the text of the field it focuses first. Figma draws the link focused with the caret after it
  // (D5 403:7552, M6 408:717), so the first focus puts the caret at the end instead.
  const caretPlacedRef = useRef(false)
  return (
    <>
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
          {form.source.hint === undefined ? null : <span className={hint}>{form.source.hint}</span>}
        </Stack>
      </div>
      <div data-figma="field · Title">
        <TextField size="xl" label={form.name.label} defaultValue={form.name.value} helperText={form.name.hint} />
      </div>
      <ProjectPicker field={form.project} />
    </>
  )
}
