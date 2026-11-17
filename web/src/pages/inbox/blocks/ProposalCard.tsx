// A change the discussion proposes, in the library's ProposalBlock: an
// update with its diff (Apply, Discard, Edit first; after Apply, a line
// that says so and Undo), new tasks with a checkbox each and "Also remove
// this task", or the removal of the task with its reason. Each button and
// box reports to the caller, which changes the task. data-figma names
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
import type { InboxProposal, InboxUi } from '../types.ts'

// A new task (D17 403:2435): a bordered box, 52 high, with the checkbox and title, and the meta line under
// the title, past the checkbox (16 px box and 8 px gap). In a Panel each box is 12 px taller.
const task = css({
  py: '8',
  px: '10',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'lg',
})
const meta = css({ textStyle: 'monoSm', color: 'fg.muted', pl: '24' })

/** A proposal's button: apply (Apply, Create, Remove…), discard (Discard, Keep it), undo or edit (Edit first). */
export type ProposalAct = 'apply' | 'discard' | 'undo' | 'edit'

/** What Erik did to the discussion's proposals, and where his presses and checks go. */
export type ProposalControl = {
  decisions: InboxUi['proposals']
  onAct?: ((kind: InboxProposal['kind'], act: ProposalAct) => void) | undefined
  /** A box of new tasks, by its label, was checked or cleared. */
  onCheck?: ((label: string, checked: boolean) => void) | undefined
}

/** The Figma layer name: "proposal · " and what the label proposes, in capitals. */
const layerName = (label: string) => `proposal · ${(label.split(' · ')[1] ?? label).toUpperCase()}`

/** The new tasks' boxes; after Create they show what was created and no longer change. */
type BodyProps = { proposal: InboxProposal; onCheck: ProposalControl['onCheck']; created: boolean }

function Body({ proposal, onCheck, created }: BodyProps) {
  switch (proposal.kind) {
    case 'update':
      return <ProposalDiff label={proposal.section} lines={proposal.lines} />
    case 'create':
      return (
        <>
          {proposal.tasks.map((t) => (
            <Stack key={t.title} gap="0" className={task}>
              <Checkbox
                tone="discuss"
                label={t.title}
                checked={t.checked}
                disabled={created}
                onCheckedChange={(checked) => {
                  onCheck?.(t.title, checked)
                }}
              />
              <span className={meta}>{t.meta}</span>
            </Stack>
          ))}
          {/* Figma sets "Also remove this task" in 12/16 (T20 402:11889): `size="sm"`. */}
          <Checkbox
            size="sm"
            label={proposal.alsoRemove.label}
            checked={proposal.alsoRemove.checked}
            disabled={created}
            onCheckedChange={(checked) => {
              onCheck?.(proposal.alsoRemove.label, checked)
            }}
          />
        </>
      )
    case 'remove':
      return <ProposalSection label={proposal.reasonLabel}>{proposal.reason}</ProposalSection>
  }
}

function actionsOf(proposal: InboxProposal, applied: boolean, act: (a: ProposalAct) => void): ProposalAction[] {
  const on = (a: ProposalAct) => () => {
    act(a)
  }
  switch (proposal.kind) {
    case 'update':
      return applied
        ? [{ label: proposal.apply.change.undo, icon: <UndoIcon />, onClick: on('undo') }]
        : [
            { label: 'Apply', variant: 'primary', icon: <CheckIcon />, onClick: on('apply') },
            { label: 'Discard', onClick: on('discard') },
            { label: 'Edit first', icon: <EditIcon />, onClick: on('edit') },
          ]
    case 'create': {
      const count = proposal.tasks.filter((t) => t.checked).length
      return [
        { label: `Create ${String(count)} tasks`, variant: 'primary', icon: <PlusIcon />, onClick: on('apply') },
        { label: 'Discard', onClick: on('discard') },
      ]
    }
    case 'remove':
      return [
        // Figma fills Remove… with the danger tint and a danger border (D19 403:3413, T22 402:12385): `dangerSoft`.
        // The app is dark; the library notes its label falls under 4.5:1 only in light mode.
        { label: 'Remove…', variant: 'dangerSoft', icon: <TrashIcon />, onClick: on('apply') },
        { label: 'Keep it', onClick: on('discard') },
      ]
  }
}

export type ProposalCardProps = {
  proposal: InboxProposal
  control?: ProposalControl | undefined
}

export function ProposalCard({ proposal, control }: ProposalCardProps) {
  const applied = proposal.kind === 'update' && control?.decisions.update === 'applied'
  const label = applied ? proposal.apply.label : proposal.label
  // Figma draws an applied update in green; ProposalBlock has no applied tone, so it keeps the update tone
  // (LIBRARY_GAPS.md).
  return (
    <div data-figma={layerName(label)}>
      <ProposalBlock
        tone={proposal.kind}
        label={label}
        title={proposal.kind === 'remove' ? proposal.title : undefined}
        note={proposal.kind === 'remove' ? proposal.note : applied ? proposal.apply.note : undefined}
        actions={actionsOf(proposal, applied, (a) => {
          control?.onAct?.(proposal.kind, a)
        })}
      >
        <Body proposal={proposal} onCheck={control?.onCheck} created={control?.decisions.create === 'applied'} />
      </ProposalBlock>
    </div>
  )
}
