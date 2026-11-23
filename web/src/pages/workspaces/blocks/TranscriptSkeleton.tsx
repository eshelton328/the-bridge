// The skeleton of a live chat whose transcript has not loaded yet (bridge-coord's decisions of 2026-11-23, on the
// owner's "How should we handle chats as they load"): it sits at the bottom of the transcript, over the composer, as a
// chat opens at its newest message. The owner's bubble on the right and a reply's lines on the left take turns, from
// the library's TranscriptEntrySkeleton, with no spinner. Its bottom is where the newest entry lands when the read
// answers, so the entries take its place with no jump. Props only.
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

// The newest entry is last, as in the transcript: a reply under the owner's prompt.
const rows = [
  { id: 'prompt', from: 'user' },
  { id: 'reply', from: 'assistant' },
  { id: 'next-prompt', from: 'user' },
  { id: 'next-reply', from: 'assistant' },
] as const

// The flex body of the ScrollFrame puts what comes after it at the bottom: the skeleton takes the room above it.
const bottom = css({ mt: 'auto' })
const stack = css({ display: 'flex', flexDirection: 'column' })

export function TranscriptSkeleton({ label, kind, gap }: TranscriptSkeletonProps) {
  return (
    <div className={bottom} data-loading="transcript">
      <SkeletonGroup label={label}>
        <div className={cx(stack, gap)}>
          {rows.map((row) => (
            <TranscriptEntrySkeleton key={row.id} from={row.from} kind={kind} />
          ))}
        </div>
      </SkeletonGroup>
    </div>
  )
}
