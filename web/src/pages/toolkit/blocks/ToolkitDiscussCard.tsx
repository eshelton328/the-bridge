// The item under discussion, at the top of the discussion's page on a tablet
// or phone (Figma `task · discussing`, T5 464:334, M7 464:150): its name with
// its kind as a pill and a chevron, its folder and how many files it has, and
// what the chat may do, after a lock. On the phone the model and context sit
// under the meta line (M7 464:160). A press anywhere on the card returns to
// the item, as the Artifacts discussion's card does. Props only.
import { ChevronRightIcon, Inline, LockIcon, Panel, Stack, StatusPill } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'

// The chevron's button covers the card, as the library Card's action does, so the whole card is one press.
const card = css({ position: 'relative' })
// The phone's model picker sits inside the card. Positioned, it paints after the chevron's overlay, so a press on it
// opens the model menu instead of returning to the item.
const above = css({ position: 'relative', alignSelf: 'flex-start' })
// 464:336: SemiBold 15.
const title = css({ textStyle: 'paneTitle', color: 'fg.default', m: '0', flex: '1', minW: '[0]' })
const meta = css({ textStyle: 'monoSm', color: 'fg.muted', m: '0' })
// 464:344: the guard is mono 11/15 after a 12 px lock.
const guard = css({ display: 'flex', gap: '6', textStyle: 'monoSm', color: 'fg.muted', m: '0' })
const lock = css({ display: 'inline-flex', flexShrink: '0', pt: '2' })
const open = css({
  display: 'inline-flex',
  p: '0',
  bg: 'transparent',
  borderStyle: 'none',
  color: 'fg.muted',
  cursor: 'pointer',
  outline: 'none',
  _after: { content: '""', position: 'absolute', inset: '0', borderRadius: 'xl' },
  _focusVisible: { _after: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' } },
})

export type ToolkitDiscussCardProps = {
  name: string
  /** The kind's pill, such as "Skill". */
  kind: string
  meta: string
  guard: string
  /** The model and context, under the meta line on the phone (M7); none on the tablet, whose nav has them. */
  model?: ReactNode
  /** The card was pressed: the item shows again. */
  onOpen?: (() => void) | undefined
}

export function ToolkitDiscussCard({
  name,
  kind,
  meta: metaText,
  guard: guardText,
  model,
  onOpen,
}: ToolkitDiscussCardProps) {
  return (
    <div className={card} data-figma="task · discussing">
      {/* 464:334 pads 11 above and below and 13 at the sides: `notice` pads 10 and 12. Its rows are 5 apart, but the
          pill is 22 high against 20 and the mono lines 16 against 14 and 15, so the rows sit 2 apart and the card
          keeps Figma's 96 (T5) and its text Figma's places. */}
      <Panel variant="notice">
        <Stack gap="2">
          <Inline gap="8" align="center">
            <h1 className={title}>{name}</h1>
            <span data-figma={`pill · ${kind}`}>
              <StatusPill tone="working" label={kind} dot />
            </span>
            <button
              type="button"
              className={open}
              aria-label={`Back to ${name}`}
              onClick={onOpen}
              data-figma="chevron · open task"
            >
              <ChevronRightIcon size="16" />
            </button>
          </Inline>
          <p className={meta}>{metaText}</p>
          {model === undefined ? null : <div className={above}>{model}</div>}
          <p className={guard} data-figma="guard">
            <span className={lock}>
              <LockIcon size="12" />
            </span>
            {guardText}
          </p>
        </Stack>
      </Panel>
    </div>
  )
}
