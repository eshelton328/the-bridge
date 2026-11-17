// The Project field of the Add a link dialog (D5 403:7578): its label, a
// button with the folder, the project and a chevron that opens the menu of
// projects, and the line under it. The library has no select field
// (LIBRARY_GAPS.md "Select field"), so it is a `RadioMenu` on a `Button`.
// Props only.
import { Button, ChevronDownIcon, FolderIcon, RadioMenu, Stack } from '@eshelton328/component-library-1701'
import { useId } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { AddLinkForm } from '../types.ts'

// TextField's label and helper text: `small` in `fg.muted`, 6 from the control.
const label = css({ textStyle: 'small', color: 'fg.muted' })
const hint = css({ textStyle: 'small', color: 'fg.muted' })
// D5 403:7580: the control spans the field, the folder and the project at the start and the chevron at the end.
const trigger = css({ w: '[100%]', justifyContent: 'flex-start' })
const value = css({ flex: '1', textAlign: 'start' })

export type ProjectPickerProps = {
  field: AddLinkForm['project']
  onValueChange?: ((project: string) => void) | undefined
}

export function ProjectPicker({ field, onValueChange }: ProjectPickerProps) {
  const labelId = useId()
  const valueId = useId()
  return (
    <div data-figma="field · Project">
      <Stack gap="6">
        <span id={labelId} className={label}>
          {field.label}
        </span>
        <RadioMenu
          label={field.label}
          options={field.projects.map((project) => ({ value: project, label: project }))}
          value={field.value}
          onValueChange={onValueChange}
          width="sm"
          trigger={
            <Button size="xl" className={trigger} aria-labelledby={`${labelId} ${valueId}`}>
              <FolderIcon />
              <span id={valueId} className={value}>
                {field.value}
              </span>
              <ChevronDownIcon />
            </Button>
          }
        />
        <span className={hint}>{field.hint}</span>
      </Stack>
    </div>
  )
}
