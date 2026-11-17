// The open artifact's discussion before the first message (Figma "empty
// state", D7 452:2425): what it is for, what it can do to the artifact, and
// questions to start with; a press puts the question in the reply box. The
// same library parts as the Inbox's empty discussion (D14), which the Inbox
// page does not export. Props only.
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
import type { ArtifactDiscussion } from '../types.ts'

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
// 452:2430: Regular 13/19 in a 420 px column, centred; 420 is the shell.widePane size.
const text = css({
  textStyle: 'bodySm',
  color: 'fg.muted',
  m: '0',
  textAlign: 'center',
  alignSelf: 'center',
  maxW: 'shell.widePane',
})
const can = css({ textStyle: 'small', color: 'fg.default' })
// Figma tints the three icons violet (452:2434 to 452:2442): `accent.discuss`.
const canIcon = css({ display: 'inline-flex', color: 'accent.discuss' })
// 452:2445: the suggestions' row hugs its buttons, centred in the column.
const suggestions = css({ alignSelf: 'center' })

const icons = {
  edit: <EditIcon size="12" />,
  plus: <PlusIcon size="12" />,
  trash: <TrashIcon size="12" />,
} as const satisfies Record<ArtifactDiscussion['empty']['can'][number]['icon'], ReactNode>

export type DiscussionEmptyProps = {
  empty: ArtifactDiscussion['empty']
  /** A suggestion was pressed: its question goes in the reply box. */
  onPick?: ((text: string) => void) | undefined
}

export function DiscussionEmpty({ empty, onPick }: DiscussionEmptyProps) {
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
      {/* Figma 452:2446 sets the labels in Medium 12 (`textSize="xs"`), so the three stay on one row. */}
      <Inline gap="6" align="center" justify="center" wrap className={suggestions} data-figma="suggestions">
        {empty.suggestions.map((s) => (
          <Button
            key={s}
            textSize="xs"
            onClick={() => {
              onPick?.(s)
            }}
          >
            {s}
          </Button>
        ))}
      </Inline>
    </Stack>
  )
}
