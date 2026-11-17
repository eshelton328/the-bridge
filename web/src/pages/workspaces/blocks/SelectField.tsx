// A closed choice of the New chat form (D3 105:1409, 105:1417): the value
// and a chevron in a field-high box that opens a `RadioMenu`. The library
// has no select field (LIBRARY_GAPS.md: Select field), so the box is a
// secondary `Button`. Props only.
import { Button, ChevronDownIcon, RadioMenu } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

const trigger = css({ w: '[100%]', justifyContent: 'space-between' })

export type SelectFieldProps = {
  /** The accessible name, such as "Workspace". */
  label: string
  options: readonly { value: string; label: string }[]
  value: string
  onValueChange?: ((value: string) => void) | undefined
  /** The Figma layer of the box, for the fidelity checks. */
  figma?: string | undefined
}

export function SelectField({ label, options, value, onValueChange, figma }: SelectFieldProps) {
  const chosen = options.find((o) => o.value === value)
  return (
    <RadioMenu
      label={label}
      options={options}
      value={value}
      onValueChange={onValueChange}
      width="sm"
      trigger={
        <Button size="lg" className={trigger} aria-label={`${label}: ${chosen?.label ?? value}`} data-figma={figma}>
          {chosen?.label ?? value}
          <ChevronDownIcon size="16" />
        </Button>
      }
    />
  )
}
