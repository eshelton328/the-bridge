// An agent's reply in a chat pane's transcript, with Copy (`ReplyCopyButton`)
// and the line under a cut reply. A reply that a Stop hook had written again
// (R62) carries a "Reply rewritten" note beside Copy: the library's small
// button as a disclosure toggle (`aria-expanded`), whose tap shows the drafts
// under the reply, oldest first, each as a library `Message`; a second tap
// hides them. The open state is the reply's own, so a tap renders no other
// entry. The library has no quiet text toggle (LIBRARY_GAPS.md: Rewritten
// reply note). Props only.
import { Button, HookIcon, Message, Stack } from '@eshelton328/component-library-1701'
import { useId, useState } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { CopyTextResult } from '../../../lib/copyText.ts'
import type { ChatEntry } from '../types.ts'
import { EntryText } from './EntryText.tsx'
import { ReplyCopyButton } from './ReplyCopyButton.tsx'

// The line under a cut reply: quiet, as the transcript's earlier line.
const cutLine = css({ display: 'block', textStyle: 'small', color: 'fg.muted' })

export type ReplyEntryProps = {
  entry: Extract<ChatEntry, { type: 'assistant' }>
  /** The Figma layer the entry stands for, for the fidelity checks. */
  figma?: string | undefined
  /** Writes the reply's text to the clipboard and says whether it did (ChatEntryView's `CopyReply`). */
  onCopy?: ((text: string) => Promise<CopyTextResult>) | undefined
}

export function ReplyEntry({ entry, figma, onCopy }: ReplyEntryProps) {
  const [open, setOpen] = useState(false)
  const draftsId = useId()
  const copy =
    entry.copy === undefined ? null : (
      <ReplyCopyButton label={entry.copy} onCopy={onCopy === undefined ? undefined : () => onCopy(entry.text)} />
    )
  const rewritten = entry.rewritten
  const note =
    rewritten === undefined ? null : (
      <Button
        size="xs"
        textSize="xs"
        keepIconSize
        expandedBorder="default"
        aria-expanded={open}
        aria-controls={open ? draftsId : undefined}
        data-rewritten-note=""
        onClick={() => {
          setOpen((now) => !now)
        }}
      >
        <HookIcon size="12" />
        {rewritten.label}
      </Button>
    )
  return (
    <div data-figma={figma}>
      <Message
        kind={entry.kind}
        name={entry.name}
        actions={
          copy === null && note === null ? undefined : (
            <>
              {copy}
              {note}
            </>
          )
        }
      >
        <EntryText text={entry.text} />
      </Message>
      {entry.cut === undefined ? null : <span className={cutLine}>{entry.cut}</span>}
      {rewritten === undefined || !open ? null : (
        <Stack gap="10" id={draftsId} role="group" aria-label={rewritten.label} data-drafts="">
          {rewritten.drafts.map((draft) => (
            <div key={draft.id}>
              <Message kind={entry.kind} name={draft.name}>
                <EntryText text={draft.text} />
              </Message>
              {draft.cut === undefined ? null : <span className={cutLine}>{draft.cut}</span>}
            </div>
          ))}
        </Stack>
      )}
    </div>
  )
}
