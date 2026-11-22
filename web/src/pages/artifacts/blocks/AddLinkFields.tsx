// The fields of the Add a link form, which the desktop's dialog (D5 403:7541)
// and the phone's sheet (M6 408:703) both hold: the link, the source read
// from it (Claude artifact or Codex site, changeable), the title from the
// page's <title> and an optional project. A field's line under it shows
// when the form has one. The link field gets the focus with the caret after
// the link: `linkRef` is the element whose input the dialog or sheet
// focuses first. `layout="dialog"` draws D5's form parts (40 px fields with
// `label` labels, the link icon and mono value, a full-width Source switch
// and a `SelectField` for the project); `sheet` keeps M6's stand-ins
// (LIBRARY_GAPS.md). Props only.
import {
  KindMark,
  LinkIcon,
  Stack,
  TextField,
  type TextFieldProps,
  ViewSwitch,
} from '@eshelton328/component-library-1701'
import { type RefObject, useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { AddLinkForm } from '../types.ts'
import { ProjectPicker } from './ProjectPicker.tsx'
import { ProjectSelect } from './ProjectSelect.tsx'

// The Source label as TextField draws its label: `small` in `fg.muted` (sheet) or `label` in `fg.default` (dialog,
// `labelStyle="label"`), 6 from the control.
const label = {
  sheet: css({ textStyle: 'small', color: 'fg.muted' }),
  dialog: css({ textStyle: 'label', color: 'fg.default' }),
}
const hint = css({ textStyle: 'small', color: 'fg.muted' })
// D5 403:7552, 403:7571: 40 px fields padded 12 (Figma 13), Medium 14 labels. M6 keeps `xl` (44).
const field = {
  dialog: { size: 'form', padding: 'form', labelStyle: 'label' },
  sheet: { size: 'xl' },
} satisfies Record<'dialog' | 'sheet', Partial<TextFieldProps>>
// D5 403:7548, 403:7553: the link icon before the link, in mono.
const linkDialog = { icon: <LinkIcon />, valueStyle: 'mono' } satisfies Partial<TextFieldProps>

export type AddLinkSource = AddLinkForm['source']['options'][number]['value']

/** The typed link and title, where they go, and the line of a miss under the link (the live library). */
export type AddLinkEntry = {
  link: string
  title: string
  onLinkChange?: ((link: string) => void) | undefined
  onTitleChange?: ((title: string) => void) | undefined
  /** Why the last Add missed, such as "Not added — the server answered 500"; the link field shows it. */
  error?: string | undefined
}

export type AddLinkFieldsProps = {
  form: AddLinkForm
  /** `dialog` for D5, `sheet` for M6. */
  layout: 'dialog' | 'sheet'
  /** The picked source. */
  source: AddLinkSource
  onSourceChange?: ((source: AddLinkSource) => void) | undefined
  /** The picked project; the form's `project.value` when not set. */
  project?: string | undefined
  onProjectChange?: ((project: string) => void) | undefined
  /** The link field's box; the dialog or sheet focuses its input when it opens. */
  linkRef: RefObject<HTMLDivElement | null>
  /** The typed link and title; without it the fields start from the form's values and keep what is typed. */
  entry?: AddLinkEntry | undefined
}

export function AddLinkFields({
  form,
  layout,
  source,
  onSourceChange,
  project,
  onProjectChange,
  linkRef,
  entry,
}: AddLinkFieldsProps) {
  // A focus trap selects the text of the field it focuses first. Figma draws the link focused with the caret after it
  // (D5 403:7552, M6 408:717), so the first focus puts the caret at the end instead.
  const caretPlacedRef = useRef(false)
  const dialog = layout === 'dialog'
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
        <TextField
          {...field[layout]}
          {...(dialog ? linkDialog : {})}
          label={form.link.label}
          {...(entry === undefined
            ? { defaultValue: form.link.value }
            : { value: entry.link, onValueChange: entry.onLinkChange, error: entry.error })}
          helperText={form.link.hint}
        />
      </div>
      <div data-figma="field · Source">
        <Stack gap="6">
          <span className={label[layout]}>{form.source.label}</span>
          <div data-figma="segmented · Source">
            <ViewSwitch
              size="lg"
              fullWidth={dialog}
              label={form.source.label}
              items={form.source.options.map((option) => ({
                value: option.value,
                label: option.label,
                // D5 403:7559: 14 px marks; `fullWidth` draws every icon at 16 (14 on the 4 px grid).
                icon: <KindMark kind={option.value} size={dialog ? '16' : '12'} />,
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
        <TextField
          {...field[layout]}
          label={form.name.label}
          {...(entry === undefined
            ? { defaultValue: form.name.value }
            : { value: entry.title, onValueChange: entry.onTitleChange })}
          helperText={form.name.hint}
        />
      </div>
      {dialog ? (
        <ProjectSelect field={form.project} value={project ?? form.project.value} onValueChange={onProjectChange} />
      ) : (
        <ProjectPicker field={form.project} />
      )}
    </>
  )
}
