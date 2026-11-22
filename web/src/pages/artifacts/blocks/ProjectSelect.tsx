// The Project field of the Add a link dialog (D5 403:7578): its label and the
// library's `SelectField` with the folder and the project in mono, which opens the menu
// of projects, and the line under it when the form has one. The phone's sheet
// (M6) keeps `ProjectPicker`. Props only.
import { FolderIcon, SelectField, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { type AddLinkForm, projectChoices } from '../types.ts'

// D5 403:7579: the label as `TextField labelStyle="label"` draws it, Medium 14/20 in `fg.default`, 6 above the control.
// `SelectField` draws its label in `small` (`fg.muted`) only, so it hides its own (still the field's name) and this one
// shows (LIBRARY_GAPS.md "Select field label style").
const label = css({ textStyle: 'label', color: 'fg.default' })
// TextField's helper text: `small` in `fg.muted`, 6 under the control.
const hint = css({ textStyle: 'small', color: 'fg.muted' })

export type ProjectSelectProps = {
  field: AddLinkForm['project']
  /** The picked project. */
  value: string
  onValueChange?: ((project: string) => void) | undefined
}

export function ProjectSelect({ field, value, onValueChange }: ProjectSelectProps) {
  return (
    <div data-figma="field · Project">
      <Stack gap="6">
        <span className={label} aria-hidden="true">
          {field.label}
        </span>
        <SelectField
          size="lg"
          mono
          labelHidden
          label={field.label}
          icon={<FolderIcon />}
          options={projectChoices(field)}
          value={value}
          onValueChange={onValueChange}
        />
        {field.hint === undefined ? null : <span className={hint}>{field.hint}</span>}
      </Stack>
    </div>
  )
}
