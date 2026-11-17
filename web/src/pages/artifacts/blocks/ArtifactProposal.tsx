// A change to the artifact the discussion proposes (Figma "proposal · UPDATE
// THIS ARTIFACT", D8 452:3043), in the library's ProposalBlock with its
// diff: Apply, Discard and Edit first, as the Inbox's proposed update
// (Inbox D15). Each button reports to the caller, which makes the change.
// Figma puts a spark icon before the eyebrow; the block has no icon slot
// (LIBRARY_GAPS.md "Proposal block icon"). Props only.
import { CheckIcon, EditIcon, ProposalBlock, ProposalDiff } from '@eshelton328/component-library-1701'
import type { ArtifactProposal as Proposal } from '../types.ts'

/** A button of the proposal: Apply, Discard or Edit first. */
export type ProposalAct = 'apply' | 'discard' | 'edit'

/** The Figma layer name: "proposal · " and what the label proposes, in capitals. */
const layerName = (label: string) => `proposal · ${(label.split(' · ')[1] ?? label).toUpperCase()}`

export type ArtifactProposalProps = {
  proposal: Proposal
  onAct?: ((act: ProposalAct) => void) | undefined
}

export function ArtifactProposal({ proposal, onAct }: ArtifactProposalProps) {
  const on = (act: ProposalAct) => () => {
    onAct?.(act)
  }
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
