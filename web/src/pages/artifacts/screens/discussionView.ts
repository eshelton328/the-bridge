// The open artifact's discussion after what Erik did in it (D8): a discarded
// proposal leaves the discussion, and the messages he sent follow its
// entries. `proposalEffect` says what each button of the proposal changes
// in `ui`, and `appliedView` what the artifact and its discussion show
// after Apply (D9). Pure functions, no React.
import type { ProposalAct } from '../blocks/ArtifactProposal.tsx'
import type { ArtifactDetail, ArtifactDiscussion, ArtifactDiscussionEntry, ArtifactsUi } from '../types.ts'

type Decisions = Pick<ArtifactsUi, 'discussProposal' | 'discussSent'>

/** The entries the discussion shows: without a discarded proposal, and with the messages Erik sent after them. */
export function discussionEntries(discussion: ArtifactDiscussion, ui: Decisions): ArtifactDiscussionEntry[] {
  const entries = discussion.entries.filter((e) => e.type !== 'proposal' || ui.discussProposal !== 'discarded')
  // Nothing answers the sent messages in this mock-up.
  for (const text of ui.discussSent ?? []) entries.push({ type: 'user', text })
  return entries
}

/**
 * What a press on the proposal changes. Discard drops it. Apply records the decision, and `appliedView` shows the
 * artifact Updated and the proposal applied (D9). Edit first puts the lines the proposal adds in the reply box, one a line, for Erik to
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

/** What the open artifact and its discussion show: the artifact's pill, its bar and chip, and whether it is applied. */
export type AppliedView = {
  artifact: ArtifactDetail
  /** The bar's pill, such as "New" or, after Apply, "Updated"; none when it is neither. */
  badge: string | undefined
  discussion: ArtifactDiscussion | undefined
  /** Apply was pressed: the proposal shows its applied form. */
  applied: boolean
}

/**
 * The artifact and its discussion after Apply (D9): Apply republishes the artifact to the same link, so the link and
 * the library entry stay; the bar shows Updated and where the update came from, the updated chip says when, and the
 * discussion's context meter what it uses after it. Before Apply, or with nothing to apply, they show as they are.
 */
export function appliedView(
  artifact: ArtifactDetail,
  discussion: ArtifactDiscussion | undefined,
  ui: Pick<ArtifactsUi, 'discussProposal'>,
): AppliedView {
  const before: AppliedView = { artifact, badge: artifact.isNew ? 'New' : undefined, discussion, applied: false }
  const apply = discussion?.entries.find((e) => e.type === 'proposal')?.proposal.apply
  if (ui.discussProposal !== 'applied' || apply === undefined || artifact.applied === undefined) return before
  const { badge, found, updated } = artifact.applied
  return {
    artifact: { ...artifact, found, updated },
    badge,
    discussion: discussion === undefined ? undefined : { ...discussion, context: apply.context },
    applied: true,
  }
}
