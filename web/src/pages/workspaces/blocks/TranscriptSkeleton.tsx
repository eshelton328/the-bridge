// The skeleton of a live chat whose transcript has not loaded yet. It fills the transcript from under the chat's header
// down to the composer with as many whole entries as fit, at every size, with no empty space above it (R64). It is
// calm and true to a chat (R65, the owner: "messy and not clean"). The owner's bubbles and the replies take turns, and
// each entry differs: a bubble has one or two lines of other lengths, and a reply 2 to 5 lines. The entries come from a
// fixed list, so each frame draws the same. A reply's author row is a mark-sized circle and a short bar, never a real
// name, so the loading chat does not read as empty replies. Its last whole entry ends at the composer, where the newest
// entry lands when the read answers, so the chat opens at its end with no jump. Library parts only; props only.
import { Message, Skeleton, SkeletonGroup, type SkeletonWidth } from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'

export type TranscriptSkeletonProps = {
  /** What loads, such as "Loading this chat"; a screen reader says it once, as a status. */
  label: string
  /** The space between the entries: the class of the transcript's own gap, so the skeleton spaces as the entries do. */
  gap: string
}

type Entry = { id: string; from: 'user' | 'assistant'; lines: readonly SkeletonWidth[] }

// Twelve pairs: more than the tallest pane holds (an iPad's full screen); the ones that do not fit are clipped. Each
// bubble ends short of the edge, and each reply's last line is shorter than its others, as text ends.
const entries: readonly Entry[] = [
  { id: 'u1', from: 'user', lines: ['half'] },
  { id: 'a1', from: 'assistant', lines: ['full', 'long', 'short'] },
  { id: 'u2', from: 'user', lines: ['full', 'short'] },
  { id: 'a2', from: 'assistant', lines: ['full', 'full', 'long', 'full', 'half'] },
  { id: 'u3', from: 'user', lines: ['long'] },
  { id: 'a3', from: 'assistant', lines: ['long', 'half'] },
  { id: 'u4', from: 'user', lines: ['short'] },
  { id: 'a4', from: 'assistant', lines: ['full', 'long', 'full', 'short'] },
  { id: 'u5', from: 'user', lines: ['full', 'half'] },
  { id: 'a5', from: 'assistant', lines: ['full', 'half'] },
  { id: 'u6', from: 'user', lines: ['half'] },
  { id: 'a6', from: 'assistant', lines: ['full', 'full', 'long'] },
  { id: 'u7', from: 'user', lines: ['long'] },
  { id: 'a7', from: 'assistant', lines: ['long', 'full', 'full', 'long', 'short'] },
  { id: 'u8', from: 'user', lines: ['short'] },
  { id: 'a8', from: 'assistant', lines: ['full', 'half'] },
  { id: 'u9', from: 'user', lines: ['full', 'long'] },
  { id: 'a9', from: 'assistant', lines: ['full', 'long', 'half'] },
  { id: 'u10', from: 'user', lines: ['half'] },
  { id: 'a10', from: 'assistant', lines: ['long', 'full', 'short'] },
  { id: 'u11', from: 'user', lines: ['long'] },
  { id: 'a11', from: 'assistant', lines: ['full', 'full', 'long', 'half'] },
  { id: 'u12', from: 'user', lines: ['short'] },
  { id: 'a12', from: 'assistant', lines: ['full', 'short'] },
]

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
// A reply as the library's Message lays one out: the author row, then the body, 6 apart; the row's mark and name 6
// apart in the name's text style, and the body in the body's.
const reply = css({ display: 'flex', flexDirection: 'column', gap: '6' })
const author = css({ display: 'flex', alignItems: 'center', gap: '6', textStyle: 'label' })
const body = css({ textStyle: 'body' })

function Lines({ lines }: { lines: readonly SkeletonWidth[] }) {
  return lines.map((width, i) => <Skeleton key={`${String(i)}:${width}`} width={width} />)
}

export function TranscriptSkeleton({ label, gap }: TranscriptSkeletonProps) {
  return (
    <div className={fill} data-loading="transcript">
      <SkeletonGroup label={label}>
        <div className={cx(column, gap)}>
          {entries.map((entry) => (
            <div key={entry.id} aria-hidden="true" data-skeleton-entry={entry.from}>
              {entry.from === 'user' ? (
                <Message from="user">
                  <Lines lines={entry.lines} />
                </Message>
              ) : (
                <div className={reply}>
                  <div className={author}>
                    <Skeleton shape="circle" size="icon12" />
                    <Skeleton width="word" />
                  </div>
                  <div className={body}>
                    <Lines lines={entry.lines} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SkeletonGroup>
    </div>
  )
}
