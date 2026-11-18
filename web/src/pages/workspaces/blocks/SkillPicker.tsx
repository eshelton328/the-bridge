// The skills a composer lists after "/" (D1 105:406), above the composer,
// which is the popover's trigger: rows that show each /name in mono, the
// highlighted one filled, with no check. The list grows with the composer
// (R8, Erik's screen review of 2026-11-18): in a pane and on the tablet it
// is 40% of the composer's width, from 240 to 400 (`width="composer"`); on
// the phone (M3 105:2805) it is as wide as the composer (`width="trigger"`).
// The phone's and the tablet's lists are compact, with no rule after their
// label, and the focus stays in the message box. Props only.
import { OptionList, Popover, PopoverSection } from '@eshelton328/component-library-1701'
import type { ReactElement } from 'react'
import type { Skill } from '../types.ts'

// `pane`: the desktop's list (D1; Figma draws it 160 wide). `tablet`: T4's list (105:2246; Figma 360). `phone`:
// Figma's 358 × 173 box with 44 px rows (M3 105:2805), as wide as the composer. The compact spacing draws the label's
// 20 px row and the rows as Figma does; Figma's SKILLS spacer (105:2808) draws no line.
const layouts = {
  pane: { width: 'composer', compact: false },
  tablet: { width: 'composer', compact: true },
  phone: { width: 'trigger', compact: true },
} as const

export type SkillPickerProps = {
  label: string
  /** What Erik typed from the "/", drawn after the section's label in its own case (M10 147:72: "SKILLS MATCHING
   * /wri"); `label` is then the part before it. */
  query?: string | undefined
  skills: readonly Skill[]
  /** The highlighted skill. */
  value: string | null
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  onPick?: ((skill: string) => void) | undefined
  /** The focus enters the list, as the popover moves it there when it opens; not on the phone, whose popover leaves
   * the focus in the box, so a Tab into the list stays there. */
  onListFocus?: (() => void) | undefined
  /** `pane` (the default): a pane or the chat alone (D1); `tablet`: the chat on the tablet (T4); `phone`: the chat on
   * the phone (M3). */
  layout?: keyof typeof layouts | undefined
  /** The list's Figma layer, for the fidelity checks; D1's when not set. */
  figma?: string | undefined
  /** The composer the list opens over. */
  children: ReactElement
}

export function SkillPicker({
  label,
  query,
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
  // The phone's popover does not take the focus when it opens (M3), so nothing has to hand it back to the box.
  const autoFocus = !compact
  return (
    <Popover
      data-figma={open ? (figma ?? '105:406') : undefined}
      label={query === undefined ? label : `${label} ${query}`}
      open={open}
      onOpenChange={onOpenChange}
      placement="top-start"
      width={width}
      density={compact ? 'compact' : 'default'}
      autoFocus={autoFocus}
      flip={false}
      trigger={children}
    >
      <PopoverSection label={label} query={query}>
        <div onFocus={autoFocus ? onListFocus : undefined}>
          <OptionList
            label={query === undefined ? label : `${label} ${query}`}
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
