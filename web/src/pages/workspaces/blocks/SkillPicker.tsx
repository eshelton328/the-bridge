// The skills a composer lists after "/" (D1 105:406), above the composer,
// which is the popover's trigger: a 160 px popover (`width="xs"`) whose rows
// show each /name in mono, the highlighted one filled, with no check. On the
// phone (M3 105:2805) the list is as wide as the composer and compact, with
// no rule after its label, and the focus stays in the message box. Props only.
import { OptionList, Popover, PopoverSection } from '@eshelton328/component-library-1701'
import type { ReactElement } from 'react'
import type { Skill } from '../types.ts'

// `pane`: the desktop's list (D1). `phone`: Figma's 358 × 173 box with 44 px rows (M3 105:2805); `lg` (360) is the
// nearest width, and the compact spacing draws the label's 20 px row and the rows as Figma does. Figma's SKILLS spacer
// (105:2808) draws no line.
const layouts = {
  pane: { width: 'xs', compact: false },
  phone: { width: 'lg', compact: true },
} as const

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
  /** `pane` (the default): a pane or the chat alone (D1); `phone`: the chat on the phone (M3). */
  layout?: keyof typeof layouts | undefined
  /** The list's Figma layer, for the fidelity checks; D1's when not set. */
  figma?: string | undefined
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
  layout = 'pane',
  figma,
  children,
}: SkillPickerProps) {
  const { width, compact } = layouts[layout]
  return (
    <Popover
      data-figma={open ? (figma ?? '105:406') : undefined}
      label={label}
      open={open}
      onOpenChange={onOpenChange}
      placement="top-start"
      width={width}
      density={compact ? 'compact' : 'default'}
      autoFocus={!compact}
      flip={false}
      trigger={children}
    >
      <PopoverSection label={label}>
        <div onFocus={onListFocus}>
          <OptionList
            label={label}
            size="sm"
            labelStyle="mono"
            check={false}
            selectedFill
            density={compact ? 'compact' : 'default'}
            value={value}
            onItemSelect={onPick}
            items={skills.map((s) => ({ value: s.name, label: s.name, description: s.description }))}
          />
        </div>
      </PopoverSection>
    </Popover>
  )
}
