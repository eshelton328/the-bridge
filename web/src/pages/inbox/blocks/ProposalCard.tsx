// A change the discussion proposes, in the library's ProposalBlock: an
// update with its diff (Apply, Discard, Edit first; after Apply, a line
// that says so and Undo), new tasks with a checkbox each and "Also remove
// this task", or the removal of the task with its reason. data-figma names
// Figma's layer, such as "proposal · UPDATE THIS TASK". Props only.
import {
  CheckIcon,
  Checkbox,
  EditIcon,
  PlusIcon,
  ProposalBlock,
  type ProposalAction,
  ProposalDiff,
  ProposalSection,
  Stack,
  TrashIcon,
  UndoIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxProposal } from '../types.ts'

// A new task (D17 403:2435): a bordered box, 52 high, with the checkbox and title, and the meta line under
// the title, past the checkbox (16 px box and 8 px gap). A Panel pads 16 and would be 14 px taller.
const task = css({
  py: '8',
  px: '10',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'lg',
})
const meta = css({ textStyle: 'monoSm', color: 'fg.muted', pl: '24' })

const nothing = () => undefined

/** The Figma layer name: "proposal · " and what the label proposes, in capitals. */
const layerName = (label: string) => `proposal · ${(label.split(' · ')[1] ?? label).toUpperCase()}`

function Body({ proposal }: { proposal: InboxProposal }) {
  switch (proposal.kind) {
    case 'update':
      return <ProposalDiff label={proposal.section} lines={proposal.lines} />
    case 'create':
      return (
        <>
          {proposal.tasks.map((t) => (
            <Stack key={t.title} gap="0" className={task}>
              <Checkbox label={t.title} checked={t.checked} />
              <span className={meta}>{t.meta}</span>
            </Stack>
          ))}
          <Checkbox label={proposal.alsoRemove.label} checked={proposal.alsoRemove.checked} />
        </>
      )
    case 'remove':
      return <ProposalSection label={proposal.reasonLabel}>{proposal.reason}</ProposalSection>
  }
}

function actionsOf(proposal: InboxProposal, onRemove: (() => void) | undefined): ProposalAction[] {
  switch (proposal.kind) {
    case 'update':
      return proposal.applied === undefined
        ? [
            { label: 'Apply', variant: 'primary', icon: <CheckIcon />, onClick: nothing },
            { label: 'Discard', onClick: nothing },
            { label: 'Edit first', icon: <EditIcon />, onClick: nothing },
          ]
        : [{ label: 'Undo', icon: <UndoIcon />, onClick: nothing }]
    case 'create': {
      const count = proposal.tasks.filter((t) => t.checked).length
      return [
        { label: `Create ${String(count)} tasks`, variant: 'primary', icon: <PlusIcon />, onClick: nothing },
        { label: 'Discard', onClick: nothing },
      ]
    }
    case 'remove':
      return [
        { label: 'Remove…', variant: 'secondaryDanger', icon: <TrashIcon />, onClick: onRemove ?? nothing },
        { label: 'Keep it', onClick: nothing },
      ]
  }
}

export type ProposalCardProps = {
  proposal: InboxProposal
  /** Remove… was pressed: the caller opens the confirm dialog. */
  onRemove?: (() => void) | undefined
}

export function ProposalCard({ proposal, onRemove }: ProposalCardProps) {
  // Figma draws an applied update in green; ProposalBlock has no applied tone, so it keeps the update tone
  // (LIBRARY_GAPS.md).
  return (
    <div data-figma={layerName(proposal.label)}>
      <ProposalBlock
        tone={proposal.kind}
        label={proposal.label}
        title={proposal.kind === 'remove' ? proposal.title : undefined}
        note={proposal.kind === 'remove' ? proposal.note : proposal.kind === 'update' ? proposal.applied : undefined}
        actions={actionsOf(proposal, onRemove)}
      >
        <Body proposal={proposal} />
      </ProposalBlock>
    </div>
  )
}
