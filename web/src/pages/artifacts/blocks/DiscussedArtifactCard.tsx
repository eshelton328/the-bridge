// The artifact under discussion, at the top of the tablet's discussion page
// (Figma "artifact · discussing", T4 452:3778): its title with New and a
// chevron, its source, project and age, and what the discussion may do. A
// press anywhere on the card returns to the artifact (T2), as the Inbox's
// task card does (Inbox T17). On the phone's page (M9 452:4017) the model
// and context sit under the meta line, as the Inbox's (M18). Props only.
import { ChevronRightIcon, Inline, Panel, Stack, StatusPill } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactDetail } from '../types.ts'
import { DiscussionGuard } from './DiscussionGuard.tsx'

// The chevron's button covers the card, as the library Card's action does, so the whole card is one press.
const card = css({ position: 'relative' })
// The phone's model picker (M9) sits inside the card. Positioned, it paints after the chevron's overlay, so a press on
// it opens the model menu instead of returning to the artifact. It hugs the model and context's width, as Figma's
// 454:408 (220 wide), so the element marked as that layer is not the card's full width.
const above = css({ position: 'relative', alignSelf: 'flex-start' })
// 452:3780: SemiBold 15, as the Inbox's task card (T17 402:11176).
const title = css({ textStyle: 'paneTitle', color: 'fg.default', m: '0', flex: '1', minW: '[0]' })
const meta = css({ textStyle: 'monoSm', color: 'fg.muted', m: '0' })
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

export type DiscussedArtifactCardProps = {
  artifact: Pick<ArtifactDetail, 'title' | 'sourceLabel' | 'project' | 'updated'>
  /** The status pill, such as "New"; none without it. */
  badge?: string | undefined
  /** What the discussion may do. */
  guard: string
  /** The card was pressed: the artifact shows again. */
  onOpen?: (() => void) | undefined
  /** The model and context, under the meta line on the phone (M9); none on the tablet, whose nav has them. */
  model?: ReactNode
}

export function DiscussedArtifactCard({ artifact, badge, guard, onOpen, model }: DiscussedArtifactCardProps) {
  return (
    <div className={card} data-figma="artifact · discussing">
      {/* 452:3778 pads 11 above and below and 13 at the sides: `notice` pads 10 and 12. */}
      <Panel variant="notice">
        <Stack gap="4">
          <Inline gap="8" align="center">
            <h1 className={title}>{artifact.title}</h1>
            {badge === undefined ? null : (
              <span data-figma="pill · New">
                <StatusPill tone="working" label={badge} dot />
              </span>
            )}
            <button
              type="button"
              className={open}
              aria-label={`Back to ${artifact.title}`}
              onClick={onOpen}
              data-figma="chevron · open artifact"
            >
              <ChevronRightIcon size="16" />
            </button>
          </Inline>
          <p className={meta}>{[artifact.sourceLabel, artifact.project, artifact.updated].join(' · ')}</p>
          {model === undefined ? null : <div className={above}>{model}</div>}
          <DiscussionGuard text={guard} />
        </Stack>
      </Panel>
    </div>
  )
}
