// A discussion's entries (or, before the first message, the empty state)
// and its reply box under them: the part the desktop panel and the tablet
// page share. Props only.
import { Composer, Stack } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { InboxDiscussion } from '../types.ts'
import { DiscussionEmpty } from './DiscussionEmpty.tsx'
import { DiscussionEntry } from './DiscussionEntry.tsx'
import type { ProposalControl } from './ProposalCard.tsx'

const entries = css({ display: 'flex', flexDirection: 'column', gap: '12', flex: '1' })
const middle = css({ justifyContent: 'center' })

export type DiscussionThreadProps = {
  discussion: InboxDiscussion
  /** What Erik did to the proposals, and where his presses go. */
  control?: ProposalControl | undefined
  /** A class for the entries' column, such as its top padding. */
  className?: string | undefined
  /** The empty state sits in the middle of the column (the desktop panel, D14) rather than at its top (T17). */
  centred?: boolean | undefined
}

export function DiscussionThread({ discussion, control, className, centred = true }: DiscussionThreadProps) {
  const empty = discussion.entries.length === 0 ? discussion.empty : undefined
  return (
    <>
      <div
        className={cx(entries, centred && empty !== undefined ? middle : undefined, className)}
        data-figma="discussion"
      >
        {empty === undefined ? null : <DiscussionEmpty empty={empty} />}
        <Stack gap="12">
          {discussion.entries.map((entry, i) => (
            <DiscussionEntry key={`${String(i)}:${entry.type}`} entry={entry} control={control} />
          ))}
        </Stack>
      </div>
      <div data-figma="composer · discussion">
        <Composer label={discussion.placeholder} placeholder={discussion.placeholder} onAttach={() => undefined} />
      </div>
    </>
  )
}
