// The open artifact's discussion after what Erik did in it (D8): a discarded
// proposal leaves the discussion, and the messages he sent follow its
// entries. `proposalEffect` says what each button of the proposal changes
// in `ui`. Pure functions, no React.
import type { ProposalAct } from '../blocks/ArtifactProposal.tsx'
import type { ArtifactDiscussion, ArtifactDiscussionEntry, ArtifactsUi } from '../types.ts'

type Decisions = Pick<ArtifactsUi, 'discussProposal' | 'discussSent'>

/** The entries the discussion shows: without a discarded proposal, and with the messages Erik sent after them. */
export function discussionEntries(discussion: ArtifactDiscussion, ui: Decisions): ArtifactDiscussionEntry[] {
  const entries = discussion.entries.filter((e) => e.type !== 'proposal' || ui.discussProposal !== 'discarded')
  // Nothing answers the sent messages in this mock-up.
  for (const text of ui.discussSent ?? []) entries.push({ type: 'user', text })
  return entries
}

/**
 * What a press on the proposal changes. Discard drops it. Apply records the decision; the applied artifact is D9's
 * state, which comes later. Edit first puts the lines the proposal adds in the reply box, one a line, for Erik to
 * change and send; the proposal stays until he applies or discards it.
 */
export function proposalEffect(discussion: ArtifactDiscussion, act: ProposalAct): Partial<ArtifactsUi> {
  if (act === 'apply') return { discussProposal: 'applied' }
  if (act === 'discard') return { discussProposal: 'discarded' }
  const added = discussion.entries.flatMap((e) =>
    e.type === 'proposal' ? e.proposal.lines.filter((l) => l.change === 'added').map((l) => l.text) : [],
  )
  return { discussDraft: added.join('\n') }
}
