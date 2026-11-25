// A message from another chat in a chat pane's transcript (R55): the
// library's `Message from="peer"`, with its Markdown text (`EntryText`) and
// the line under a cut message, never the owner's bubble. When the harness
// added its notice that the message may relay content other people wrote
// (`relayed`, taken out of the text by `liveTranscript.ts`), the message
// carries a short note instead of that paragraph: the library's small button
// as a disclosure toggle (`aria-expanded`) with the warning icon, whose tap
// shows the notice's full text under the message in `fg.muted`; a second tap
// hides it. The notice is a safety notice, so it is never dropped. The library
// has no quiet text toggle (LIBRARY_GAPS.md: Rewritten reply note). Props only.
import { Button, Message, WarningIcon } from '@eshelton328/component-library-1701'
import { useId, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ChatEntry } from '../types.ts'
import { EntryText } from './EntryText.tsx'

// The line under a cut message: quiet, as the transcript's earlier line.
const cutLine = css({ display: 'block', textStyle: 'small', color: 'fg.muted' })
// The notice's full text, as quiet as a harness note (NoteLine).
const noticeText = css({ m: '0', mt: '6', textStyle: 'small', color: 'fg.muted', overflowWrap: 'anywhere' })

export type PeerEntryProps = {
  entry: Extract<ChatEntry, { type: 'peer' }>
  /** The Figma layer the entry stands for, for the fidelity checks. */
  figma?: string | undefined
}

export function PeerEntry({ entry, figma }: PeerEntryProps) {
  const [open, setOpen] = useState(false)
  const noticeId = useId()
  const { relayed } = entry
  const note =
    relayed === undefined ? undefined : (
      <Button
        size="xs"
        textSize="xs"
        keepIconSize
        expandedBorder="default"
        aria-expanded={open}
        aria-controls={open ? noticeId : undefined}
        data-relayed-note=""
        onClick={() => {
          setOpen((now) => !now)
        }}
      >
        <WarningIcon size="12" />
        {relayed.label}
      </Button>
    )
  return (
    <div data-figma={figma}>
      <Message from="peer" name={entry.name} actions={note}>
        {entry.text === undefined ? null : <EntryText text={entry.text} />}
      </Message>
      {entry.cut === undefined ? null : <span className={cutLine}>{entry.cut}</span>}
      {relayed === undefined || !open ? null : (
        <p className={noticeText} id={noticeId} data-relayed-notice="">
          {relayed.text}
        </p>
      )}
    </div>
  )
}
