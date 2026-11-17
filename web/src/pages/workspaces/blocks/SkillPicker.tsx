// The skills a composer lists after "/" (D1 105:406), above the composer,
// which is the popover's trigger. Props only.
import { OptionList, Popover, PopoverSection } from '@eshelton328/component-library-1701'
import type { ReactElement } from 'react'
import type { Skill } from '../types.ts'

export type SkillPickerProps = {
  label: string
  skills: readonly Skill[]
  /** The highlighted skill. */
  value: string | null
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  onPick?: ((skill: string) => void) | undefined
  /** The focus enters the list, as the popover moves it there when it opens. */
  onListFocus?: (() => void) | undefined
  /** The composer the list opens over. */
  children: ReactElement
}

export function SkillPicker({
  label,
  skills,
  value,
  open,
  onOpenChange,
  onPick,
  onListFocus,
  children,
}: SkillPickerProps) {
  return (
    <Popover
      data-figma={open ? '105:406' : undefined}
      label={label}
      open={open}
      onOpenChange={onOpenChange}
      placement="top-start"
      width="sm"
      flip={false}
      trigger={children}
    >
      <PopoverSection label={label}>
        <div onFocus={onListFocus}>
          <OptionList
            label={label}
            size="sm"
            selectedFill
            value={value}
            onItemSelect={onPick}
            items={skills.map((s) => ({ value: s.name, label: s.name, description: s.description }))}
          />
        </div>
      </PopoverSection>
    </Popover>
  )
}
