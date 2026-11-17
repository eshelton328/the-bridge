// One entry of a task's discussion: an event line with a check, Erik's
// message, the discussion's reply or a proposed change. Props only.
import { BubbleIcon, CheckIcon, Inline, Message, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxDiscussionEntry } from '../types.ts'
import { ProposalCard } from './ProposalCard.tsx'

const event = css({ textStyle: 'monoSm', color: 'fg.muted', alignSelf: 'flex-start' })
const name = css({ display: 'inline-flex', alignItems: 'center', gap: '6', textStyle: 'label', color: 'fg.default' })
const bubble = css({ display: 'inline-flex', color: 'accent.discuss' })
const body = css({ textStyle: 'body', color: 'fg.default', m: '0' })
const check = css({ display: 'inline-flex', color: 'status.done.fg' })

export type DiscussionEntryProps = {
  entry: InboxDiscussionEntry
  onRemove?: (() => void) | undefined
}

export function DiscussionEntry({ entry, onRemove }: DiscussionEntryProps) {
  switch (entry.type) {
    case 'event':
      return (
        <Inline gap="6" align="center" className={event} data-figma="event">
          <span className={check}>
            <CheckIcon size="12" />
          </span>
          {entry.text}
        </Inline>
      )
    case 'user':
      return (
        <div data-figma="message · you">
          <Message from="user">{entry.text}</Message>
        </div>
      )
    case 'reply':
      // Figma puts a bubble before the name. Message draws an agent's kind mark there and takes no other
      // icon (LIBRARY_GAPS.md), so the reply is the message's author row and body, composed here.
      return (
        <Stack gap="6" data-figma="message · discussion">
          <span className={name}>
            <span className={bubble}>
              <BubbleIcon size="12" />
            </span>
            {entry.name}
          </span>
          <p className={body}>{entry.text}</p>
        </Stack>
      )
    case 'proposal':
      return <ProposalCard proposal={entry.proposal} onRemove={onRemove} />
  }
}
