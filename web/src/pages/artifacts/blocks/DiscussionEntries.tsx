// The entries of the open artifact's discussion (D8): the owner's messages,
// the replies and the proposal, 12 apart, on the desktop panel and the
// tablet's and phone's page. Each entry sits in its own BlockBoundary
// (d-084), so one entry that fails to render shows its fallback and the
// others stay. A discussion belongs to one artifact and its entries have no
// id of their own, so each boundary is keyed by the artifact's id and the
// entry's place: another artifact's discussion resets it. Props only.
import { Stack } from '@eshelton328/component-library-1701'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import type { ArtifactDiscussionEntry } from '../types.ts'
import type { ArtifactProposalProps } from './ArtifactProposal.tsx'
import { DiscussionEntry } from './DiscussionEntry.tsx'

export type DiscussionEntriesProps = {
  /** The id of the artifact the discussion is about. */
  artifactId: string
  entries: readonly ArtifactDiscussionEntry[]
  /** The owner applied the proposal (D9). */
  applied?: ArtifactProposalProps['applied']
  onAct?: ArtifactProposalProps['onAct']
}

export function DiscussionEntries({ artifactId, entries, applied, onAct }: DiscussionEntriesProps) {
  return (
    <Stack gap="12">
      {entries.map((entry, i) => {
        const key = `${String(i)}:${entry.type}`
        return (
          <BlockBoundary key={key} contentKey={`${artifactId}:${key}`}>
            <DiscussionEntry entry={entry} applied={applied} onAct={onAct} />
          </BlockBoundary>
        )
      })}
    </Stack>
  )
}
