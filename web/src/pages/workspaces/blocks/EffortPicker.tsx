// A live Claude chat's model chip with its model and effort menu (W10): Figma's model chip in the chat header (D2
// 105:804, M3 105:2773) shows the model and the effort the list gives, and a tap opens one menu with the model
// families first (fable, opus, sonnet, haiku; the list's family checked) and then low, medium, high and xhigh effort
// (the list's level says "Current"). `max` shows as the current text when the chat is at max, but is not offered:
// Claude Code's effort keys stop below it. The library's `ModelChip` passes one radio list with one checked value to
// its `RadioMenu`, with no sections or headings (LIBRARY_GAPS.md: Effort menu), so both sit in that list.
//
// An effort pick posts at once (the page's `pick`); the menu stays open, every choice off and the picked one says
// "Setting…", until the answer. A model pick closes the menu and asks first under the chip's row (ModelConfirm);
// only Restart posts, and the chip says "Restarting…" until the restart ends. A miss shows its line beside the chip
// until the menu opens again. While the chat works, or restarts, every choice is off, and the line says why. Props
// only.
import type { ChatEffort, KeyEffort, ModelAlias } from '@bridge/contract'
import { Inline, ModelChip } from '@eshelton328/component-library-1701'
import { type ReactNode, useRef, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { modelChoices, modelFamilies } from './modelFamilies.ts'
import { ModelConfirm } from './ModelConfirm.tsx'

/** What an effort pick gives: `true` once the chat's screen shows the level, else the line to show. */
export type EffortAnswer = true | { line: string }

/** A live Claude chat's model, from the page (useLiveModel.ts). */
export type ModelControl = {
  /** The family to check; none for a model the contract does not name. */
  current: ModelAlias | undefined
  /** The chip's model after a restart, until the list shows it; none to show the list's. */
  label: string | undefined
  /** A restart of the chat runs. */
  restarting: boolean
  /** The line of the last restart, until the menu opens again. */
  said: string | undefined
  pick: (model: ModelAlias) => void
  clearSaid: () => void
}

/** A live Claude chat's chip, from the page: the effort to show (none when not known), the pick and the model. */
export type EffortControl = {
  level: ChatEffort | undefined
  pick: (level: KeyEffort) => Promise<EffortAnswer>
  model?: ModelControl | undefined
}

/** The levels the menu offers, as Claude Code's `/effort` names them. */
const effortChoices: readonly KeyEffort[] = ['low', 'medium', 'high', 'xhigh']

/** The hints while the server refuses a change: the chat works (409 working) or restarts (409 restarting). */
const workingHint = 'Wait until the chat is idle'
const restartingHint = 'The chat is restarting'

// Empty, the line takes no place in the header's row, so the row keeps its gaps.
const line = css({ textStyle: 'smallXs', color: 'fg.muted', minW: '[0]', _empty: { display: 'none' } })

export type EffortPickerProps = {
  model: string
  effort: EffortControl
  /** The chat works (the list's status): every choice is off. */
  working: boolean
  /** What follows the chip and its line in the row, such as the context meter. */
  after?: ReactNode
}

export function EffortPicker({ model, effort, working, after }: EffortPickerProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<KeyEffort | undefined>(undefined)
  const [said, setSaid] = useState<string | undefined>(undefined)
  const [asking, setAsking] = useState<ModelAlias | undefined>(undefined)
  // The menu closes itself in the same event as the pick, before a render shows `pending`.
  const waitingRef = useRef(false)
  const models = effort.model
  const restarting = models?.restarting === true
  const off = working || restarting || pending !== undefined
  const pick = (value: string) => {
    if (off) return
    const family = modelChoices.find((m) => `model:${m}` === value)
    if (family !== undefined) {
      if (family !== models?.current) setAsking(family)
      return
    }
    const level = effortChoices.find((c) => `effort:${c}` === value)
    if (level === undefined) return
    setPending(level)
    waitingRef.current = true
    void effort.pick(level).then((answer) => {
      waitingRef.current = false
      setPending(undefined)
      setOpen(false)
      setSaid(answer === true ? undefined : answer.line)
    })
  }
  const options = [
    ...(models === undefined
      ? []
      : modelChoices.map((m) => ({ value: `model:${m}`, label: modelFamilies[m], disabled: off }))),
    ...effortChoices.map((c) => ({
      value: `effort:${c}`,
      label: `${c} effort`,
      disabled: off,
      ...(pending === c ? { description: 'Setting…' } : effort.level === c ? { description: 'Current' } : {}),
    })),
  ]
  const hint = restarting ? restartingHint : working ? workingHint : undefined
  const shown = said ?? models?.said ?? (open || asking !== undefined ? hint : undefined)
  return (
    <>
      <Inline gap="8" align="center">
        <ModelChip
          model={restarting ? 'Restarting…' : (models?.label ?? model)}
          effort={restarting || effort.level === undefined ? undefined : `${effort.level} effort`}
          options={options}
          // The list's family is checked; with no model control, the effort is, as before W10's model half.
          value={models === undefined ? `effort:${effort.level ?? 'unknown'}` : `model:${models.current ?? 'unknown'}`}
          onValueChange={pick}
          // d-121: the chip sits in the chat header, which a finger taps on a phone or tablet.
          touch
          open={open}
          onOpenChange={(next) => {
            // The menu stays open while an effort pick waits for its answer.
            if (!next && waitingRef.current) return
            setOpen(next)
            if (next) {
              setSaid(undefined)
              setAsking(undefined)
              models?.clearSaid()
            }
          }}
        />
        <span role="status" className={line}>
          {shown}
        </span>
        {after}
      </Inline>
      {asking === undefined || models === undefined ? null : (
        <ModelConfirm
          model={modelFamilies[asking]}
          off={working || restarting}
          onRestart={() => {
            setAsking(undefined)
            models.pick(asking)
          }}
          onCancel={() => {
            setAsking(undefined)
          }}
        />
      )}
    </>
  )
}
