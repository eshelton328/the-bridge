// The skills a composer lists after "/" (D1 105:406), above the composer,
// which is the popover's trigger: rows that show each /name in mono, the
// highlighted one filled, with no check. The list grows with the composer
// (R8, the owner's screen review of 2026-11-18): in a pane and on the tablet it
// is 40% of the composer's width, from 240 to 400 (`width="composer"`); on
// the phone (M3 105:2805) it is as wide as the composer (`width="trigger"`).
// Every list is compact, as Figma draws each one 173 high (D1 105:406, T4
// 105:2246, M3 105:2805). On the phone and the tablet the focus stays in the
// message box. A press on a row leaves the focus in the box, so the phone's
// keyboard stays up while the owner picks a skill (`onPick`). A long list
// (a live chat's, review R34) scrolls inside the popover, which never grows
// past the room above the composer (the library's `--available-height`), and
// the highlighted row scrolls into view as the arrow keys move it. A
// project's or a plugin's skill names its source in a badge. A list with no
// rows says so in one muted line. Props only.
import { Badge, OptionList, Popover, PopoverSection } from '@eshelton328/component-library-1701'
import { type ReactElement, useEffect, useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SkillRow } from './skillLists.ts'

// The line in place of the rows, as quiet as the composer's hint: inset as a row's text is.
const emptyLine = css({ display: 'block', px: '8', py: '6', textStyle: 'small', color: 'fg.muted' })

// `pane`: the desktop's list (D1 105:406; Figma 160 × 173). `tablet`: T4's list (105:2246; Figma 360 × 173). `phone`:
// Figma's 358 × 173 box (M3 105:2805), as wide as the composer. Each draws the same box: 7 from its edge to the
// SKILLS row (21 high), then 44 px rows 2 apart. The compact spacing draws that (6 padding and a 1 px border, the
// label's 20 px row, 44 px rows); the default one draws 9, 26 and 50 px rows, 200 high in all, which covers the
// transcript line over D1's list. Figma's SKILLS spacer (105:409, 105:2808) draws no line. `keepFocus`: the popover
// leaves the focus in the message box.
const layouts = {
  pane: { width: 'composer', keepFocus: false },
  tablet: { width: 'composer', keepFocus: true },
  phone: { width: 'trigger', keepFocus: true },
} as const

export type SkillPickerProps = {
  label: string
  /** What the owner typed from the "/", drawn after the section's label in its own case (M10 147:72: "SKILLS MATCHING
   * /wri"); `label` is then the part before it. */
  query?: string | undefined
  skills: readonly SkillRow[]
  /** The line in place of the rows when there are none, such as "No match". */
  empty?: string | undefined
  /** The highlighted skill. */
  value: string | null
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The owner picks a skill: a click or tap on its row, or Enter on the row with the focus. */
  onPick?: ((skill: string) => void) | undefined
  /** The arrow keys move the highlight in the list to this skill. */
  onHighlight?: ((skill: string) => void) | undefined
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
  empty,
  value,
  open,
  onOpenChange,
  onPick,
  onHighlight,
  onListFocus,
  layout = 'pane',
  figma,
  children,
}: SkillPickerProps) {
  const { width, keepFocus } = layouts[layout]
  // The phone's popover does not take the focus when it opens (M3), so nothing has to hand it back to the box.
  // A list with no row to take the focus (no match, or only rows that are off) leaves it in the box too: the popover
  // would focus its own box, which hands nothing back to the message box, so the owner's typing would go nowhere.
  const autoFocus = !keepFocus && skills.some((s) => s.disabled !== true)
  const rowsRef = useRef<HTMLDivElement>(null)
  // The highlighted row stays in view as the arrow keys move it through a list that scrolls.
  useEffect(() => {
    if (!open || value === null) return
    rowsRef.current?.querySelector('[data-part="item"][data-state="checked"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, value])
  return (
    <Popover
      data-figma={open ? (figma ?? '105:406') : undefined}
      label={query === undefined ? label : `${label} ${query}`}
      open={open}
      onOpenChange={onOpenChange}
      placement="top-start"
      width={width}
      density="compact"
      autoFocus={autoFocus}
      flip={false}
      trigger={children}
    >
      <PopoverSection label={label} query={query}>
        {/* A press does not move the focus out of the message box: the click still picks the row. */}
        <div
          ref={rowsRef}
          onFocus={autoFocus ? onListFocus : undefined}
          onMouseDown={(event) => {
            event.preventDefault()
          }}
        >
          {skills.length === 0 && empty !== undefined ? <span className={emptyLine}>{empty}</span> : null}
          <OptionList
            label={query === undefined ? label : `${label} ${query}`}
            size="sm"
            labelStyle="mono"
            check={false}
            selectedFill
            density="compact"
            value={value}
            onItemSelect={onPick}
            onValueChange={onHighlight}
            items={skills.map((s) => ({
              value: s.name,
              label: s.name,
              description: s.description,
              ...(s.source === 'project' || s.source === 'plugin'
                ? { badge: <Badge label={s.source} size="xs" /> }
                : {}),
              ...(s.disabled === true ? { disabled: true } : {}),
            }))}
          />
        </div>
      </PopoverSection>
    </Popover>
  )
}
