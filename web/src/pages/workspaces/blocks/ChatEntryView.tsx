// One entry of a chat pane's transcript: the owner's message, a tool line (a live
// call with its kind as a `ToolRow`, R32), an
// agent's reply with Copy (`ReplyEntry`, with the drafts of a rewritten reply, R62), progress lines or a command waiting for approval
// (D1 105:210 to 105:291), or a line that records an event, such as where a
// fork starts (D16 417:718), a harness note (`NoteLine`, R46), or a message
// from another chat (`Message from="peer"`, R55: an amber bar and "From
// <name>", never the owner's bubble). A live message or reply whose text the server cut
// shows a quiet line under it (`cut`, slice 3b). A message's and a reply's text
// is Markdown (`EntryText`). The files sent with a message show as chips above
// it, as the composer showed them, and a message of files alone shows only the
// chips (`SentFileChip`). The caller names the entry's Figma layer. Memoised by
// the entry's identity (review R28), so a keystroke in the composer or another
// entry's change does not render it again. Props only.
import { Inline, Message, ProposalBlock, ProposalCommand, Stack } from '@eshelton328/component-library-1701'
import { memo } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { CopyTextResult } from '../../../lib/copyText.ts'
import type { ChatEntry } from '../types.ts'
import { CutToolLine } from './CutToolLine.tsx'
import { EntryText } from './EntryText.tsx'
import { NoteLine } from './NoteLine.tsx'
import { PeerEntry } from './PeerEntry.tsx'
import { ReplyEntry } from './ReplyEntry.tsx'
import { SentFileChip } from './SentFileChip.tsx'
import { ToolRow } from './ToolRow.tsx'

// The progress lines keep their leading spaces, as a terminal does. At Default and Large (d-122) a line that no longer
// fits wraps (break-spaces, so a space at the wrap does not hang past the edge); Small keeps one line per line.
const progress = css({
  textStyle: 'mono',
  color: 'fg.muted',
  whiteSpace: 'pre',
  _textDefault: { whiteSpace: 'break-spaces' },
  _textLarge: { whiteSpace: 'break-spaces' },
})
// The event line is as wide as its text, as Figma's layer is (T9 420:769),
// but never wider than the transcript, so a long event truncates on a narrow phone.
// The one grid column can shrink below the text, so the line never pushes the transcript wider.
const eventLine = css({ display: 'grid', gridTemplateColumns: 'minmax(0, auto)', w: 'fit-content', maxW: '[100%]' })
// The line under a cut message: quiet, as the transcript's earlier line.
const cutLine = css({ display: 'block', textStyle: 'small', color: 'fg.muted' })

/** Writes a reply's text to the clipboard and says whether it did (the page's copyText). */
export type CopyReply = (text: string) => Promise<CopyTextResult>

export type ChatEntryViewProps = {
  entry: ChatEntry
  /** The Figma layer the entry stands for, for the fidelity checks. */
  figma?: string | undefined
  onAct?: ((action: string) => void) | undefined
  /** A reply's Copy: writes its text to the clipboard and says whether it did, which the button shows (audit P-4). */
  onCopy?: CopyReply | undefined
}

export const ChatEntryView = memo(function ChatEntryView({ entry, figma, onAct, onCopy }: ChatEntryViewProps) {
  switch (entry.type) {
    case 'user': {
      const bubble =
        entry.text === '' && entry.files !== undefined ? null : (
          <Message from="user">
            <EntryText text={entry.text} onCopyCode={onCopy} />
          </Message>
        )
      const cut = entry.cut === undefined ? null : <span className={cutLine}>{entry.cut}</span>
      if (entry.files === undefined)
        return (
          <div data-figma={figma}>
            {bubble}
            {cut}
          </div>
        )
      // The chips, then the message under them, 6 apart as the composer's chips and its text.
      return (
        <Stack gap="6" data-figma={figma}>
          <Inline gap="6" wrap role="group" aria-label="Files sent">
            {entry.files.map((name, i) => (
              // The same name may be sent twice; the order is fixed, so its place keys it.
              <SentFileChip key={`${String(i)}:${name}`} name={name} />
            ))}
          </Inline>
          {bubble}
          {cut}
        </Stack>
      )
    }
    case 'tool':
      // A live call with its kind draws its icon, title and label (R32); one without draws as Figma's tool line,
      // which opens its full text on a tap when it is cut (NCC-147).
      return entry.kind === undefined ? (
        <CutToolLine name={entry.name} target={entry.target} state={entry.running === true ? 'running' : 'done'} />
      ) : (
        <ToolRow
          kind={entry.kind}
          title={entry.title ?? entry.name}
          label={entry.label ?? ''}
          name={entry.name}
          running={entry.running}
        />
      )
    case 'event':
      // Figma draws the event as a tool line: the done dot and the text in mono (D16 417:718). A cut one opens its
      // full text on a tap (NCC-147).
      return (
        <div className={eventLine} data-figma={figma}>
          <CutToolLine name={entry.text} state="done" stateLabel={entry.label} />
        </div>
      )
    case 'note':
      // A harness note (R46): a muted line with its kind's icon, never the owner's bubble.
      return <NoteLine kind={entry.kind} label={entry.label} text={entry.text} figma={figma} />
    case 'peer':
      // A message from another chat (R55): the library's peer message with its Markdown text, or its label alone
      // when the server sent no text, and the relayed-content note; never the owner's bubble.
      return <PeerEntry entry={entry} figma={figma} onCopy={onCopy} />
    case 'assistant':
      // A reply, with its Copy and, when a Stop hook had it written again, its note and drafts (R62).
      return <ReplyEntry entry={entry} figma={figma} onCopy={onCopy} />
    case 'progress':
      return (
        <Stack gap="10">
          {entry.lines.map((line) => (
            <span key={line} className={progress}>
              {line}
            </span>
          ))}
        </Stack>
      )
    case 'approval':
      return (
        <div data-figma={figma}>
          <ProposalBlock
            tone="approval"
            label={entry.label}
            title={entry.title}
            actions={entry.actions.map((label, i) => ({
              label,
              // Figma draws Deny as a filled button with red text, like Always allow (D5 158:310).
              variant: i === 0 ? 'primary' : i === entry.actions.length - 1 ? 'secondaryDanger' : 'secondary',
              onClick: () => onAct?.(label),
            }))}
          >
            <ProposalCommand>{entry.command}</ProposalCommand>
          </ProposalBlock>
        </div>
      )
  }
})
