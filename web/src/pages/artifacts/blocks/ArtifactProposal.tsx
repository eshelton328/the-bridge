// A change to the artifact the discussion proposes (Figma "proposal · UPDATE
// THIS ARTIFACT", D8 452:3043), in the library's ProposalBlock with its
// diff: Apply, Discard and Edit first, as the Inbox's proposed update
// (Inbox D15). Each button reports to the caller, which makes the change.
// After Apply (Figma "proposal · applied", D9 452:3665) the block shows its
// applied eyebrow, the lines it put in and the line that says it is applied,
// with no buttons, as the Inbox's applied update (Inbox D16). Figma puts a
// spark icon before the eyebrow and draws the applied block green; the
// block has no icon slot or applied tone (LIBRARY_GAPS.md "Proposal block
// icon and diff rows"). Props only.
import { CheckIcon, EditIcon, ProposalBlock, ProposalDiff } from '@eshelton328/component-library-1701'
import type { ArtifactProposal as Proposal } from '../types.ts'

/** A button of the proposal: Apply, Discard or Edit first. */
export type ProposalAct = 'apply' | 'discard' | 'edit'

/** The Figma layer name: "proposal · " and what the label proposes, in capitals. */
const layerName = (label: string) => `proposal · ${(label.split(' · ')[1] ?? label).toUpperCase()}`

export type ArtifactProposalProps = {
  proposal: Proposal
  /** The owner applied it (D9): the applied form, when the proposal has one. */
  applied?: boolean | undefined
  onAct?: ((act: ProposalAct) => void) | undefined
}

export function ArtifactProposal({ proposal, applied = false, onAct }: ArtifactProposalProps) {
  const on = (act: ProposalAct) => () => {
    onAct?.(act)
  }
  const apply = applied ? proposal.apply : undefined
  if (apply !== undefined)
    return (
      <div data-figma="proposal · applied">
        <ProposalBlock tone="update" label={apply.label} note={apply.note} actions={[]}>
          <div data-figma={`diff · ${proposal.section.toUpperCase()}`}>
            {/* The applied block shows what changed: the lines it put in. */}
            <ProposalDiff label={proposal.section} lines={proposal.lines.filter((l) => l.change === 'added')} />
          </div>
        </ProposalBlock>
      </div>
    )
  return (
    <div data-figma={layerName(proposal.label)}>
      <ProposalBlock
        tone="update"
        label={proposal.label}
        actions={[
          { label: 'Apply', variant: 'primary', icon: <CheckIcon />, onClick: on('apply') },
          { label: 'Discard', onClick: on('discard') },
          { label: 'Edit first', icon: <EditIcon />, onClick: on('edit') },
        ]}
      >
        <div data-figma={`diff · ${proposal.section.toUpperCase()}`}>
          <ProposalDiff label={proposal.section} lines={proposal.lines} />
        </div>
      </ProposalBlock>
    </div>
  )
}
