// A discussion before the first message: what it is for, what it can do
// to the task, and questions to start with; a press puts the question in
// the reply box. Props only.
import {
  BubbleIcon,
  Button,
  EditIcon,
  Inline,
  Panel,
  PlusIcon,
  Stack,
  TrashIcon,
} from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxDiscussion } from '../types.ts'

// The library has no empty state with an icon tile (LIBRARY_GAPS.md); the tile is a round raised surface.
const tile = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  w: 'control.xl',
  h: 'control.xl',
  borderRadius: 'full',
  bg: 'surface.raised',
  color: 'accent.discuss',
})
const title = css({ textStyle: 'subtitle', color: 'fg.default', m: '0', textAlign: 'center' })
// Figma 403:967: Geist Regular 13/19 in a 420 px column, centred. 420 is the shell.widePane size.
const text = css({
  textStyle: 'bodySm',
  color: 'fg.muted',
  m: '0',
  textAlign: 'center',
  alignSelf: 'center',
  maxW: 'shell.widePane',
})
const can = css({ textStyle: 'small', color: 'fg.default' })
const canIcon = css({ display: 'inline-flex', color: 'fg.muted' })
// Figma 403:984: the suggestion labels are Geist Medium 12, not the Button's Medium 14. At 14 the row
// is about 80 px wider than Figma's 507 and fills the 587 px column, so it wraps where glyph widths
// round up (Linux).
const suggestion = css({ textStyle: 'small', fontWeight: 'text.label' })
// M18 402:2075: on the phone the suggestions stack under "Try", full width, their labels at the start.
const tryLabel = css({ textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.subtle', m: '0' })
const stackedSuggestion = css({ textStyle: 'small', fontWeight: 'text.label', justifyContent: 'flex-start' })

const icons = {
  edit: <EditIcon size="12" />,
  plus: <PlusIcon size="12" />,
  trash: <TrashIcon size="12" />,
} as const satisfies Record<NonNullable<InboxDiscussion['empty']>['can'][number]['icon'], ReactNode>

export type DiscussionEmptyProps = {
  empty: NonNullable<InboxDiscussion['empty']>
  /** The phone's layout: the suggestions one under the other, under their label (M18). */
  stacked?: boolean | undefined
  /** A suggestion was pressed: its question goes in the reply box. */
  onPick?: ((text: string) => void) | undefined
}

export function DiscussionEmpty({ empty, stacked = false, onPick }: DiscussionEmptyProps) {
  const pick = (s: string) => () => {
    onPick?.(s)
  }
  return (
    <Stack gap="10" data-figma="empty state">
      <span className={tile}>
        <BubbleIcon size="20" />
      </span>
      <h3 className={title}>{empty.title}</h3>
      <p className={text}>{empty.text}</p>
      <div data-figma="it can">
        <Panel title={empty.canLabel}>
          <Stack gap="8">
            {empty.can.map((c) => (
              <Inline key={c.text} gap="8" align="center" className={can}>
                <span className={canIcon}>{icons[c.icon]}</span>
                {c.text}
              </Inline>
            ))}
          </Stack>
        </Panel>
      </div>
      {stacked ? (
        <Stack gap="6" data-figma="suggestions">
          <p className={tryLabel}>{empty.tryLabel}</p>
          {empty.suggestions.map((s) => (
            <Button key={s} className={stackedSuggestion} onClick={pick(s)}>
              {s}
            </Button>
          ))}
        </Stack>
      ) : (
        // One row at 1512 (Figma 403:521); the buttons wrap in a narrower panel, which clips its overflow.
        <Inline gap="6" align="center" justify="center" wrap data-figma="suggestions">
          {empty.suggestions.map((s) => (
            <Button key={s} className={suggestion} onClick={pick(s)}>
              {s}
            </Button>
          ))}
        </Inline>
      )}
    </Stack>
  )
}
