// The open artifact's discussion, beside it on the desktop (Figma
// "discussion panel", D7 452:2410): `DiscussionHeader`, the empty state
// or the entries (D8: Erik's question, the reply and the proposed change,
// applied in D9, then the messages he sent), and the reply box. Built
// from the same library parts as the Inbox's DiscussionPanel (D14), which
// the Inbox page does not export. The reply box has no attach button, as
// the Inbox's: no file flow is designed. The header stays at the top and
// the reply box at the bottom; only the discussion between them scrolls
// (d-107, ScrollFrame). Props only.
import { Composer, ScrollFrame, Stack } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ArtifactDiscussion, ArtifactDiscussionEntry } from '../types.ts'
import type { ArtifactProposalProps } from './ArtifactProposal.tsx'
import { DiscussionEmpty } from './DiscussionEmpty.tsx'
import { DiscussionEntry } from './DiscussionEntry.tsx'
import { DiscussionHeader } from './DiscussionHeader.tsx'

// Figma's panel is 628 wide, what is left beside the 820 px artifact pane. The pane here is Container
// size="detail" (748 + 2 × 40), so the panel starts 8 px further right; its 12 px start padding keeps the content at
// Figma's x 905, as the Inbox's panel (LIBRARY_GAPS.md "Discussion panel width").
const panel = css({
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  // The panel fills the detail's height and no more, so its ScrollFrame scrolls the discussion (d-107).
  minH: '[0]',
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
const thread = css({ display: 'flex', flexDirection: 'column', gap: '12', flex: '1', pt: '6' })
// The empty state sits in the middle of the discussion area, as the Inbox's (D14). Figma puts it 120 below the
// area's top (452:2426 at y 264); no spacing token is that large (LIBRARY_GAPS.md "Empty state placement").
const middle = css({ justifyContent: 'center' })
// The space between the header, the discussion and the reply box, as the panel's 12 before (D7).
const bodyGap = css({ gap: '12' })
// A long draft grows the reply box; past half the window it scrolls inside, so Send stays in reach (d-107), as the
// Inbox's discussion.
const reply = css({ maxH: '[50vh]', overflowY: 'auto' })

export type DiscussionPanelProps = {
  discussion: ArtifactDiscussion
  /** What Erik has typed in the reply box. */
  draft?: string | undefined
  /** What the discussion shows; with none, the empty state. */
  entries?: readonly ArtifactDiscussionEntry[] | undefined
  /** Erik applied the proposal (D9): it shows its applied form. */
  applied?: ArtifactProposalProps['applied']
  /** A button of the proposal was pressed. */
  onAct?: ArtifactProposalProps['onAct']
  onDraftChange?: ((text: string) => void) | undefined
  onSend?: ((text: string) => void) | undefined
  onOpenInWorkspace?: (() => void) | undefined
  onClose?: (() => void) | undefined
}

export function DiscussionPanel({
  discussion,
  draft = '',
  entries = [],
  applied,
  onAct,
  onDraftChange,
  onSend,
  onOpenInWorkspace,
  onClose,
}: DiscussionPanelProps) {
  const empty = entries.length === 0
  return (
    <aside aria-label={discussion.title} className={panel} data-figma="discussion panel">
      <ScrollFrame
        gap="12"
        bodyClassName={bodyGap}
        header={<DiscussionHeader discussion={discussion} onOpenInWorkspace={onOpenInWorkspace} onClose={onClose} />}
        footer={
          <div className={reply} data-figma="composer · discussion">
            <Composer
              label={discussion.placeholder}
              placeholder={discussion.placeholder}
              // With no one to keep the draft, the box keeps it (a story or a canvas board).
              {...(onDraftChange === undefined
                ? { defaultValue: draft }
                : { value: draft, onValueChange: onDraftChange })}
              onSubmit={(text) => {
                onSend?.(text)
              }}
            />
          </div>
        }
      >
        <div className={cx(thread, empty ? middle : undefined)} data-figma="discussion">
          {empty ? (
            <DiscussionEmpty empty={discussion.empty} onPick={onDraftChange} />
          ) : (
            <Stack gap="12">
              {entries.map((entry, i) => (
                <DiscussionEntry key={`${String(i)}:${entry.type}`} entry={entry} applied={applied} onAct={onAct} />
              ))}
            </Stack>
          )}
        </div>
      </ScrollFrame>
    </aside>
  )
}
