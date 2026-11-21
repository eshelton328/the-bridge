// A live Claude chat's model chip with its effort picker (W10): Figma's model
// chip in the chat header (D2 105:804, M3 105:2773) shows the model and the
// effort the list gives, and a tap opens its menu with low, medium, high and
// xhigh, the current one checked. `max` shows as the current text when the
// chat is at max, but is not offered: Claude Code's effort keys stop below
// it. The model stays text, with no model choice, until the restart route
// (references D02 and M03 `deviations.md`).
//
// A pick posts at once (the page's `pick`); the menu stays open, every choice
// off and the picked one says "Setting…", until the answer. A 204 closes it,
// and the chip shows the new level; a miss closes it and shows the answer's
// line beside the chip until the menu opens again. While the chat works every
// choice is off, and the line says why. The library's `ModelChip` takes no
// heading, note or busy row for its menu (LIBRARY_GAPS.md: Effort menu), so
// the line sits beside the chip and the busy row says so in its description.
// Props only.
import type { ChatEffort, KeyEffort } from '@bridge/contract'
import { ModelChip } from '@eshelton328/component-library-1701'
import { useRef, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'

/** What a pick gives: `true` once the chat's screen shows the level, else the line to show. */
export type EffortAnswer = true | { line: string }

/** A live Claude chat's effort, from the page: the level to show (none when not known) and the pick. */
export type EffortControl = {
  level: ChatEffort | undefined
  pick: (level: KeyEffort) => Promise<EffortAnswer>
}

/** The levels the menu offers, as Claude Code's `/effort` names them. */
const effortChoices: readonly KeyEffort[] = ['low', 'medium', 'high', 'xhigh']

/** The hint while the chat works: the server refuses an effort change then (409 working). */
const effortWorkingHint = 'Wait until the chat is idle'

// Empty, the line takes no place in the header's row, so the row keeps its gaps.
const line = css({ textStyle: 'smallXs', color: 'fg.muted', minW: '[0]', _empty: { display: 'none' } })

export type EffortPickerProps = {
  model: string
  effort: EffortControl
  /** The chat works (the list's status): every choice is off. */
  working: boolean
}

export function EffortPicker({ model, effort, working }: EffortPickerProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<KeyEffort | undefined>(undefined)
  const [said, setSaid] = useState<string | undefined>(undefined)
  // The menu closes itself in the same event as the pick, before a render shows `pending`.
  const waitingRef = useRef(false)
  const pick = (value: string) => {
    const level = effortChoices.find((c) => c === value)
    if (level === undefined || pending !== undefined || working) return
    setPending(level)
    waitingRef.current = true
    void effort.pick(level).then((answer) => {
      waitingRef.current = false
      setPending(undefined)
      setOpen(false)
      setSaid(answer === true ? undefined : answer.line)
    })
  }
  const options = effortChoices.map((c) => ({
    value: c,
    label: c,
    disabled: working || pending !== undefined,
    ...(pending === c ? { description: 'Setting…' } : {}),
  }))
  const shown = said ?? (open && working ? effortWorkingHint : undefined)
  return (
    <>
      <ModelChip
        model={model}
        effort={effort.level === undefined ? undefined : `${effort.level} effort`}
        options={options}
        // `max` and an unknown level check no choice.
        value={effort.level ?? 'unknown'}
        onValueChange={pick}
        open={open}
        onOpenChange={(next) => {
          // The menu stays open while the pick waits for its answer.
          if (!next && waitingRef.current) return
          setOpen(next)
          if (next) setSaid(undefined)
        }}
      />
      <span role="status" className={line}>
        {shown}
      </span>
    </>
  )
}
