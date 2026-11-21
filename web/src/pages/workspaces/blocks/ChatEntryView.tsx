// One entry of a chat pane's transcript: the owner's message, a tool line, an
// agent's reply with Copy (`ReplyCopyButton`), progress lines or a command waiting for approval
// (D1 105:210 to 105:291), or a line that records an event, such as where a
// fork starts (D16 417:718). A live message or reply whose text the server cut
// shows a quiet line under it (`cut`, slice 3b). A message's and a reply's text
// is Markdown (`EntryText`). The caller names the entry's Figma layer. Memoised by
// the entry's identity (review R28), so a keystroke in the composer or another
// entry's change does not render it again. Props only.
import { Message, ProposalBlock, ProposalCommand, Stack, ToolLine } from '@eshelton328/component-library-1701'
import { memo } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { CopyTextResult } from '../../../lib/copyText.ts'
import type { ChatEntry } from '../types.ts'
import { EntryText } from './EntryText.tsx'
import { ReplyCopyButton } from './ReplyCopyButton.tsx'

// The progress lines keep their leading spaces, as a terminal does.
const progress = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'pre' })
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
    case 'user':
      return (
        <div data-figma={figma}>
          <Message from="user">
            <EntryText text={entry.text} />
          </Message>
          {entry.cut === undefined ? null : <span className={cutLine}>{entry.cut}</span>}
        </div>
      )
    case 'tool':
      return <ToolLine name={entry.name} target={entry.target} state={entry.running === true ? 'running' : 'done'} />
    case 'event':
      // Figma draws the event as a tool line: the done dot and the text in mono (D16 417:718).
      return (
        <div className={eventLine} data-figma={figma}>
          <ToolLine name={entry.text} state="done" stateLabel={entry.label} />
        </div>
      )
    case 'assistant':
      return (
        <div data-figma={figma}>
          <Message
            kind={entry.kind}
            name={entry.name}
            actions={
              entry.copy === undefined ? undefined : (
                <ReplyCopyButton
                  label={entry.copy}
                  onCopy={onCopy === undefined ? undefined : () => onCopy(entry.text)}
                />
              )
            }
          >
            <EntryText text={entry.text} />
          </Message>
          {entry.cut === undefined ? null : <span className={cutLine}>{entry.cut}</span>}
        </div>
      )
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
