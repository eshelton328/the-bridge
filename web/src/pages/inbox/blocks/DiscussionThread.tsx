// A discussion's entries (or, before the first message, the empty state)
// and its reply box under them: the part the desktop panel and the tablet
// page share. A suggestion puts its question in the reply box. The reply box keeps what Erik types in `drafts`, so closing
// and opening the discussion keeps it; send gives his message to `onSend`, which adds it to the discussion, and
// empties the box. The box has no attach button: no file flow is designed, and `Composer` cannot draw its attach
// button disabled (LIBRARY_GAPS.md, Waiting for a design). The reply box stays at the bottom and the `header` at the
// top of the panel or page, and only the entries (and `before`) between them scroll (d-107). Props only.
import { Composer, ScrollFrame, Stack } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'
import { draftProps, type InboxDiscussion, type InboxDrafts } from '../types.ts'
import { DiscussionEmpty } from './DiscussionEmpty.tsx'
import { DiscussionEntry } from './DiscussionEntry.tsx'
import type { ProposalControl } from './ProposalCard.tsx'

const entries = css({ display: 'flex', flexDirection: 'column', gap: '12', flex: '1' })
const middle = css({ justifyContent: 'center' })
// The space between the header, the content and the reply box, and between the content's parts. The list is the
// containing block of what a message positions absolutely (its hidden name), so that scrolls with the list and stays
// above the reply box (R22).
const bodyGap = {
  '8': css({ gap: '8', position: 'relative' }),
  '12': css({ gap: '12', position: 'relative' }),
} as const

export type DiscussionThreadProps = {
  discussion: InboxDiscussion
  /** What Erik did to the proposals, and where his presses go. */
  control?: ProposalControl | undefined
  /** A class for the entries' column, such as its top padding. */
  className?: string | undefined
  /** A class for the frame's root, such as the page's padding. */
  frameClassName?: string | undefined
  /** The empty state sits in the middle of the column (the desktop panel, D14) rather than at its top (T17). */
  centred?: boolean | undefined
  /** Keeps the reply Erik is typing; see `InboxDrafts` in types.ts. */
  drafts?: InboxDrafts | undefined
  /** The phone's empty state: the suggestions one under the other, under their label (M18). */
  stacked?: boolean | undefined
  /** Erik sent a message from the reply box. */
  onSend?: ((text: string) => void) | undefined
  /** Stays at the top while the entries scroll, such as the page's Back or the panel's title. */
  header?: ReactNode
  /** Scrolls above the entries, such as the page's task card. */
  before?: ReactNode
  /** The space between the header, the content and the reply box: 12 in the panel (D14), 8 on the page (T17). */
  gap?: keyof typeof bodyGap | undefined
}

export function DiscussionThread({
  discussion,
  control,
  className,
  frameClassName,
  centred = true,
  drafts,
  stacked = false,
  onSend,
  header,
  before,
  gap = '12',
}: DiscussionThreadProps) {
  const empty = discussion.entries.length === 0 ? discussion.empty : undefined
  return (
    <ScrollFrame
      className={frameClassName}
      gap={gap}
      bodyClassName={bodyGap[gap]}
      header={header}
      footer={
        // A long draft grows the reply box; the library Composer stops it at 30% of the nearest size container
        // (the desktop panel; on the tablet and phone page, the window) and scrolls inside, so Send stays in reach
        // and the entries keep room (d-107).
        <div data-figma="composer · discussion">
          <Composer
            label={discussion.placeholder}
            placeholder={discussion.placeholder}
            {...draftProps(drafts, 'discussion')}
            onSubmit={(text) => {
              onSend?.(text)
              drafts?.onChange('discussion', '')
            }}
          />
        </div>
      }
    >
      {before}
      <div
        className={cx(entries, centred && empty !== undefined ? middle : undefined, className)}
        data-figma="discussion"
      >
        {empty === undefined ? null : (
          <DiscussionEmpty
            empty={empty}
            stacked={stacked}
            onPick={(text) => {
              drafts?.onChange('discussion', text)
            }}
          />
        )}
        <Stack gap="12">
          {discussion.entries.map((entry, i) => (
            <DiscussionEntry key={`${String(i)}:${entry.type}`} entry={entry} control={control} />
          ))}
        </Stack>
      </div>
    </ScrollFrame>
  )
}
