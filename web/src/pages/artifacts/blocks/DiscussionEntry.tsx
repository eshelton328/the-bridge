// One entry of the open artifact's discussion (D8): Erik's message, the
// discussion's reply or a proposed change (applied in D9), as the Inbox's discussion
// entries, which the Inbox page does not export. Props only.
import { BubbleIcon, Message, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactDiscussionEntry } from '../types.ts'
import { ArtifactProposal, type ArtifactProposalProps } from './ArtifactProposal.tsx'

const name = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6',
  textStyle: 'labelXsStrong',
  color: 'fg.default',
})
const bubble = css({ display: 'inline-flex', color: 'accent.discuss' })
// 452:3042 is Regular 13/19: `bodySm` (13/20), on the 4 px grid.
const body = css({ textStyle: 'bodySm', color: 'fg.default', m: '0' })

export type DiscussionEntryProps = {
  entry: ArtifactDiscussionEntry
  /** Erik applied the proposal (D9). */
  applied?: ArtifactProposalProps['applied']
  onAct?: ArtifactProposalProps['onAct']
}

export function DiscussionEntry({ entry, applied, onAct }: DiscussionEntryProps) {
  switch (entry.type) {
    case 'user':
      return (
        <div data-figma="message · you">
          <Message from="user">{entry.text}</Message>
        </div>
      )
    case 'reply':
      // Figma puts a violet bubble before the name; Message draws only an agent's kind mark there (LIBRARY_GAPS.md
      // "Message author icon and small text"), so the reply is composed here, as the Inbox's.
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
      return <ArtifactProposal proposal={entry.proposal} applied={applied} onAct={onAct} />
  }
}
