// A chat's transcript entries in their BlockBoundary, so one bad entry shows
// an inline fallback and the header and the composer keep working (audit
// P-1). Memoised (review R28): the composer under it renders on each
// keystroke, and a long live chat's entries (each one Markdown) render again
// only when the entries, their Figma layers or the Copy change. Each entry is
// memoised too (ChatEntryView), so a transcript change renders only the
// entries it changed. A run of two or more live tool calls draws as one group
// row (R32, `toolGroups.ts`, `ToolGroup`); the newest run stays open while the
// chat works. A live entry is keyed by its ID. Props only.
import { memo, useMemo } from 'react'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import type { ChatEntry } from '../types.ts'
import { ChatEntryView, type CopyReply } from './ChatEntryView.tsx'
import { ToolGroup } from './ToolGroup.tsx'
import { transcriptItems } from './toolGroups.ts'

export type TranscriptEntriesProps = {
  /** The chat the entries belong to; a new id resets the boundary. */
  chatId: string
  entries: readonly ChatEntry[]
  /** The Figma layer of each entry, for the fidelity checks. */
  figma?: readonly (string | undefined)[] | undefined
  onCopy?: CopyReply | undefined
  /** The chat works now: its newest run of tool calls stays open. */
  working?: boolean | undefined
}

export const TranscriptEntries = memo(function TranscriptEntries({
  chatId,
  entries,
  figma,
  onCopy,
  working,
}: TranscriptEntriesProps) {
  const items = useMemo(() => transcriptItems(entries), [entries])
  return (
    <BlockBoundary contentKey={chatId}>
      {items.map((item, i) =>
        item.type === 'tools' ? (
          <ToolGroup
            // The first call's ID keys the group, so an older entry that drops off the front (the 500 cap) keeps an open
            // group open; its place is the key only when the call has no ID.
            key={`tools-${item.calls[0]?.id ?? String(item.index)}`}
            calls={item.calls}
            live={working === true && i === items.length - 1}
          />
        ) : (
          <ChatEntryView
            // A live entry's ID keys it, so a draft that folds away above it (R62) does not mount it again and the
            // reader's place holds; a fixture entry has no ID, and its place keys it.
            key={
              'id' in item.entry && item.entry.id !== undefined
                ? `id-${item.entry.id}`
                : `${item.entry.type}-${String(item.index)}`
            }
            entry={item.entry}
            figma={figma?.[item.index]}
            onCopy={onCopy}
          />
        ),
      )}
    </BlockBoundary>
  )
})
