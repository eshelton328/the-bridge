// The skeleton of a live chat whose transcript has not loaded yet (bridge-coord's decision of 2026-11-24 on the owner's
// R64, "they should be at the top of the page and not the bottom"): it fills the transcript from under the chat's
// header down to the composer with as many prompt and reply pairs as fit, at every size, with no empty space above it.
// The owner's bubble on the right and a reply's lines on the left take turns, from the library's
// TranscriptEntrySkeleton, with no spinner. Its last whole entry ends at the composer, where the newest entry lands when
// the read answers, so the chat opens at its end with no jump. Props only.
import { SkeletonGroup, TranscriptEntrySkeleton } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { AgentKind } from '../types.ts'

export type TranscriptSkeletonProps = {
  /** What loads, such as "Loading this chat"; a screen reader says it once, as a status. */
  label: string
  /** The chat's kind, whose mark heads each reply. */
  kind: AgentKind
  /** The space between the entries: the class of the transcript's own gap, so the skeleton spaces as the entries do. */
  gap: string
}

// More pairs than the tallest pane holds (an iPad's full screen); the ones that do not fit are clipped.
const pairs = 12
const rows = Array.from(
  { length: pairs },
  (_, i) =>
    [
      { id: `prompt-${String(i)}`, from: 'user' },
      { id: `reply-${String(i)}`, from: 'assistant' },
    ] as const,
).flat()

// The skeleton takes the transcript's height. Its entries run down one column that wraps: an entry that does not fit
// goes to a second column past the right edge, which the overflow clips, so only whole entries show. The column's
// spare space (less than one entry) goes between the entries, so the first starts at the top and the last whole one
// ends at the bottom.
// The skeleton and the library's SkeletonGroup root in it (a status, with no class of its own) take the transcript's
// height, as columns, so the entries' column gets a height to wrap at.
const fill = css({
  flex: '1',
  minH: '[0]',
  display: 'flex',
  flexDirection: 'column',
  '& > [role=status]': { flex: '1', minH: '[0]', display: 'flex', flexDirection: 'column' },
})
const column = css({
  flex: '1',
  minH: '[0]',
  display: 'flex',
  flexDirection: 'column',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  overflow: 'hidden',
  '& > *': { w: '[100%]', flexShrink: '0' },
})

export function TranscriptSkeleton({ label, kind, gap }: TranscriptSkeletonProps) {
  return (
    <div className={fill} data-loading="transcript">
      <SkeletonGroup label={label}>
        <div className={cx(column, gap)}>
          {rows.map((row) => (
            <TranscriptEntrySkeleton key={row.id} from={row.from} kind={kind} />
          ))}
        </div>
      </SkeletonGroup>
    </div>
  )
}
