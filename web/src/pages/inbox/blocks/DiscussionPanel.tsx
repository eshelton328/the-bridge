// A task's discussion, beside the task on the desktop: the header with
// Close, the model and how much context it uses, what it may do, the
// entries (or, before the first message, the empty state) and the reply
// box. Props only.
import { BubbleIcon, Button, CloseIcon, Inline } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxDiscussion } from '../types.ts'
import { DiscussionGuard } from './DiscussionGuard.tsx'
import { DiscussionThread } from './DiscussionThread.tsx'
import { ModelContext } from './ModelContext.tsx'
import type { ProposalControl } from './ProposalCard.tsx'

// Figma's panel (403:947) is 628 wide: what is left of the pane beside an 820 px task. The task here is
// Container size="detail" (748 + 2 × 40), so the panel starts 8 px further right; its 12 px start padding
// keeps the content at Figma's x (LIBRARY_GAPS.md: no width token for the panel).
const panel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '12',
  flex: '1',
  // A flex item keeps its content's width unless it clips.
  overflow: 'hidden',
  pt: '16',
  pb: '16',
  ps: '12',
  pe: '20',
  bg: 'surface.pane',
  borderLeftWidth: 'default',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
})
const heading = css({ textStyle: 'paneTitle', color: 'fg.default', m: '0', flex: '1' })
const bubble = css({ display: 'inline-flex', color: 'accent.discuss' })
const entries = css({ pt: '6' })

export type DiscussionPanelProps = {
  discussion: InboxDiscussion
  /** What Erik did to the proposals, and where his presses go. */
  control?: ProposalControl | undefined
  /** Close was pressed. */
  onClose?: (() => void) | undefined
}

export function DiscussionPanel({ discussion, control, onClose }: DiscussionPanelProps) {
  return (
    <aside aria-label={discussion.title} className={panel} data-figma="discussion panel">
      <Inline gap="8" align="center">
        <span className={bubble}>
          <BubbleIcon size="16" />
        </span>
        <h2 className={heading}>{discussion.title}</h2>
        <Button size="sm" iconOnly aria-label="Close the discussion" onClick={onClose}>
          <CloseIcon />
        </Button>
      </Inline>
      <ModelContext discussion={discussion} />
      <DiscussionGuard text={discussion.guard} />
      <DiscussionThread discussion={discussion} control={control} className={entries} />
    </aside>
  )
}
