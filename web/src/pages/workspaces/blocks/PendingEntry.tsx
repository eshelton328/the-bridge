// The owner's message while its send is pending (the pending send,
// livePending.ts): drawn as the transcript draws a sent message (ChatEntryView),
// its file chips above its text, with a quiet "Sending…" line under it until the
// server took it (204); after that it waits, with no line, for the entry. The library's Message has no pending state (LIBRARY_GAPS.md:
// Pending message), so the line is the sign. It is not a transcript entry: the
// pane draws it after the entries, and the entry that the stream brings takes
// its place. Props only.
import { Inline, Message, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { EntryText } from './EntryText.tsx'
import { SentFileChip } from './SentFileChip.tsx'

/** The line under the message while it is sent: picked by the chat that built the pending send (d-101). */
const sendingText = 'Sending…'

// Quiet, as the line under a cut message.
const sendingLine = css({ display: 'block', textStyle: 'small', color: 'fg.muted' })

export type PendingEntryProps = {
  text: string
  /** The names of the files sent with it, as their chips showed them. */
  files: readonly string[]
  /** "Sending…" shows under it. */
  sending: boolean
}

export function PendingEntry({ text, files, sending }: PendingEntryProps) {
  return (
    <Stack gap="6" data-pending-send="" aria-busy={sending}>
      {files.length === 0 ? null : (
        <Inline gap="6" wrap role="group" aria-label="Files sent">
          {files.map((name, i) => (
            // The same name may be sent twice; the order is fixed, so its place keys it.
            <SentFileChip key={`${String(i)}:${name}`} name={name} />
          ))}
        </Inline>
      )}
      {text.trim() === '' ? null : (
        <Message from="user">
          <EntryText text={text} />
        </Message>
      )}
      <span className={sendingLine} role="status">
        {sending ? sendingText : ''}
      </span>
    </Stack>
  )
}
