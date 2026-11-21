// A chat's transcript entries in their BlockBoundary, so one bad entry shows
// an inline fallback and the header and the composer keep working (audit
// P-1). Memoised (review R28): the composer under it renders on each
// keystroke, and a long live chat's entries (each one Markdown) render again
// only when the entries, their Figma layers or the Copy change. Each entry is
// memoised too (ChatEntryView), so a transcript change renders only the
// entries it changed. Props only.
import { memo } from 'react'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import type { ChatEntry } from '../types.ts'
import { ChatEntryView, type CopyReply } from './ChatEntryView.tsx'

export type TranscriptEntriesProps = {
  /** The chat the entries belong to; a new id resets the boundary. */
  chatId: string
  entries: readonly ChatEntry[]
  /** The Figma layer of each entry, for the fidelity checks. */
  figma?: readonly (string | undefined)[] | undefined
  onCopy?: CopyReply | undefined
}

export const TranscriptEntries = memo(function TranscriptEntries({
  chatId,
  entries,
  figma,
  onCopy,
}: TranscriptEntriesProps) {
  return (
    <BlockBoundary contentKey={chatId}>
      {entries.map((entry, i) => (
        <ChatEntryView key={`${entry.type}-${String(i)}`} entry={entry} figma={figma?.[i]} onCopy={onCopy} />
      ))}
    </BlockBoundary>
  )
})
