// The Inbox after what Erik did to the open task's discussion
// (InboxUi.proposals and proposalChecks): an applied update puts its prompt
// in the task with the change line; created tasks join Next steps with a
// New pill and a toast that offers Undo; a discarded proposal leaves the
// discussion; the boxes Erik checked or cleared replace the proposal's.
// The effects say what each press in the discussion changes. Pure
// functions, no React.
import { InboxItemId } from '@bridge/shared'
import type { ProposalAct } from '../blocks/ProposalCard.tsx'
import {
  type InboxData,
  type InboxDecision,
  type InboxDiscussionEntry,
  type InboxGroupView,
  type InboxNextStep,
  type InboxProposal,
  type InboxRowView,
  type InboxUi,
  ProposalKind,
} from '../types.ts'

type Decisions = Pick<InboxUi, 'proposals' | 'proposalChecks'>

/** The discussion's proposal of `kind`, if it has one. */
export function proposalOf<K extends ProposalKind>(
  data: Pick<InboxData, 'discussion'>,
  kind: K,
): Extract<InboxProposal, { kind: K }> | undefined {
  const is = (p: InboxProposal): p is Extract<InboxProposal, { kind: K }> => p.kind === kind
  for (const entry of data.discussion?.entries ?? [])
    if (entry.type === 'proposal' && is(entry.proposal)) return entry.proposal
  return undefined
}

/** A proposal with the boxes Erik checked or cleared. */
function checked(proposal: InboxProposal, checks: InboxUi['proposalChecks']): InboxProposal {
  if (proposal.kind !== 'create') return proposal
  const box = <T extends { checked: boolean }>(item: T, label: string): T => ({
    ...item,
    checked: checks[label] ?? item.checked,
  })
  return {
    ...proposal,
    tasks: proposal.tasks.map((t) => box(t, t.title)),
    alsoRemove: box(proposal.alsoRemove, proposal.alsoRemove.label),
  }
}

/** The new tasks Create makes: the checked ones, as rows with a New pill. */
function createdRows(proposal: Extract<InboxProposal, { kind: 'create' }>): InboxRowView[] {
  return proposal.tasks
    .filter((t) => t.checked)
    .map((t, i) => ({
      id: InboxItemId.parse(`new-task-${String(i + 1)}`),
      kind: 'next',
      title: t.title,
      meta: t.meta,
      age: 'now',
      blocks: null,
      approval: false,
      pill: { tone: 'running', label: 'New', dot: true },
    }))
}

/** The groups with the created rows after the first next step, as D18 shows them. */
function withCreated(groups: readonly InboxGroupView[], rows: readonly InboxRowView[]): InboxGroupView[] {
  return groups.map((group) => {
    if (group.id !== 'nextSteps') return group
    const [first, ...rest] = group.rows
    return {
      ...group,
      count: group.count + rows.length,
      rows: [...(first === undefined ? [] : [first]), ...rows, ...rest],
    }
  })
}

type Removed = Extract<InboxProposal, { kind: 'remove' }>['removed']

/**
 * The task after Remove task (D21): its page says it was removed, has no Snooze or Dismiss and offers Open discussion
 * and Restore; its prompt never ran. Its row says why, for when it shows in Done.
 */
function removedView(data: InboxData, task: InboxNextStep, removed: Removed): InboxData {
  const outcome = { line: removed.line, result: 'removed' } as const
  return {
    ...data,
    groups: data.groups.map((group) => ({
      ...group,
      rows: group.rows.map((row) => (row.id === task.id ? { ...row, age: removed.age, outcome } : row)),
    })),
    detail: {
      ...task,
      status: removed.status,
      origin: removed.origin,
      actions: false,
      prompt: { ...task.prompt, state: 'notRun' },
      launch: { stage: 'started', run: removed.run },
    },
  }
}

/** Whether the open task was removed in its discussion: its page then offers Restore. */
export const isRemoved = (data: Pick<InboxData, 'discussion'>, ui: Pick<InboxUi, 'proposals'>): boolean =>
  proposalOf(data, 'remove') !== undefined && ui.proposals.remove === 'applied'

export function discussionView(data: InboxData, ui: Decisions): InboxData {
  const { discussion } = data
  if (discussion === undefined) return data
  const entries = discussion.entries.flatMap((entry): InboxDiscussionEntry[] => {
    if (entry.type !== 'proposal') return [entry]
    if (ui.proposals[entry.proposal.kind] === 'discarded') return []
    return [{ ...entry, proposal: checked(entry.proposal, ui.proposalChecks) }]
  })
  let view: InboxData = { ...data, discussion: { ...discussion, entries } }
  const update = proposalOf(view, 'update')
  if (update !== undefined && ui.proposals.update === 'applied' && view.detail?.kind === 'next') {
    const { apply } = update
    view = {
      ...view,
      detail: {
        ...view.detail,
        origin: apply.origin,
        prompt: { ...view.detail.prompt, text: apply.prompt, change: apply.change },
      },
    }
  }
  const remove = proposalOf(view, 'remove')
  if (remove !== undefined && ui.proposals.remove === 'applied' && view.detail?.kind === 'next') {
    view = removedView(view, view.detail, remove.removed)
  }
  const create = proposalOf(view, 'create')
  if (create !== undefined && ui.proposals.create === 'applied') {
    const rows = createdRows(create)
    const n = rows.length
    view = {
      ...view,
      count: view.count + n,
      filters: view.filters.map((f) => (f.value === 'all' || f.value === 'next' ? { ...f, count: f.count + n } : f)),
      groups: withCreated(view.groups, rows),
      toast: { text: `Created ${String(n)} tasks from a discussion`, action: 'Undo' },
    }
  }
  return view
}

/**
 * What a press in the discussion does: the change to `ui`, and whether the
 * remove dialog opens or closes, the list shows again on a tablet or phone (`back`),
 * or the prompt (and its editor) gets a text.
 */
export type DiscussionEffect = { ui: Partial<InboxUi>; removeOpen?: boolean; back?: true; prompt?: string }

type EffectUi = Pick<InboxUi, 'proposals' | 'finished' | 'snoozed' | 'promptBeforeApply'>
/** The data an effect reads: the discussion and the task it discusses, which carries its item's id. */
type EffectData = Pick<InboxData, 'discussion' | 'detail'>

/** The proposals with `kind` decided, or waiting again when `decision` is undefined (Undo). */
function decide(proposals: InboxUi['proposals'], kind: ProposalKind, decision?: InboxDecision): InboxUi['proposals'] {
  const next: InboxUi['proposals'] = {}
  for (const k of ProposalKind.options) {
    const d = k === kind ? decision : proposals[k]
    if (d !== undefined) next[k] = d
  }
  return next
}

/**
 * The discussed task taken out of the list, by the id its detail carries, as Mark done does: it is finished once,
 * removed, and no longer snoozed.
 */
function removeTask(data: EffectData, ui: EffectUi): Pick<InboxUi, 'finished' | 'snoozed'> {
  const id = data.detail?.id
  if (id === undefined) return { finished: ui.finished, snoozed: ui.snoozed }
  return {
    finished: [...ui.finished.filter((f) => f.id !== id), { id, result: 'removed' }],
    snoozed: ui.snoozed.filter((s) => s.id !== id),
  }
}

/**
 * What a proposal's button does; `desktop` keeps the discussion open after Apply (D16), a tablet shows the task (T19).
 * `typed` is the prompt Erik has typed in the task, if any: Apply replaces it with the proposed prompt and keeps it
 * for Undo.
 */
export function proposalEffect(
  data: EffectData,
  ui: EffectUi,
  kind: ProposalKind,
  act: ProposalAct,
  desktop: boolean,
  typed?: string,
): DiscussionEffect {
  if (act === 'discard') return { ui: { proposals: decide(ui.proposals, kind, 'discarded') } }
  if (act === 'undo')
    return kind === 'update' ? undoUpdateEffect(ui) : { ui: { proposals: decide(ui.proposals, kind) } }
  if (kind === 'remove') return { ui: {}, removeOpen: true }
  if (kind === 'update') {
    // Edit first opens the task's prompt editor with the change filled in (T18 note).
    const update = proposalOf(data, 'update')
    if (act === 'edit')
      return {
        ui: { discussOpen: false, editingPrompt: true },
        ...(update === undefined ? {} : { prompt: update.apply.prompt }),
      }
    const shown = typed ?? (data.detail?.kind === 'next' ? data.detail.prompt.text : undefined)
    return {
      ui: {
        proposals: decide(ui.proposals, 'update', 'applied'),
        discussOpen: desktop,
        promptBeforeApply: shown ?? null,
      },
      ...(update === undefined ? {} : { prompt: update.apply.prompt }),
    }
  }
  // The new tasks show in the list (D18, T21); "Also remove this task" removes this one too.
  const alsoRemove = proposalOf(data, 'create')?.alsoRemove.checked === true
  return {
    ui: {
      proposals: decide(ui.proposals, 'create', 'applied'),
      discussOpen: false,
      ...(alsoRemove ? removeTask(data, ui) : {}),
    },
    back: true,
  }
}

/** Remove task in the confirm dialog: the task leaves the list (it moves to Done, T24 note) and the list shows again. */
export function removeEffect(data: EffectData, ui: EffectUi): DiscussionEffect {
  return {
    ui: { proposals: decide(ui.proposals, 'remove', 'applied'), discussOpen: false, ...removeTask(data, ui) },
    removeOpen: false,
    back: true,
  }
}

/**
 * Restore on a removed task's page (D21, M25 notes): the removal waits again and the task leaves Done for the group it
 * came from. The page stays open and shows the task as it was.
 */
export function restoreEffect(data: EffectData, ui: EffectUi): DiscussionEffect {
  const id = data.detail?.id
  return { ui: { proposals: decide(ui.proposals, 'remove'), finished: ui.finished.filter((f) => f.id !== id) } }
}

/** Undo on the line under a changed prompt: the update waits again, and the prompt is as Erik left it before Apply. */
export function undoUpdateEffect(ui: EffectUi): DiscussionEffect {
  return {
    ui: { proposals: decide(ui.proposals, 'update'), promptBeforeApply: null },
    ...(ui.promptBeforeApply === null ? {} : { prompt: ui.promptBeforeApply }),
  }
}

/** Undo in the toast: the created tasks go, and the task they replaced comes back. */
export function undoCreateEffect(data: EffectData, ui: EffectUi): DiscussionEffect {
  const alsoRemove = proposalOf(data, 'create')?.alsoRemove.checked === true
  const id = data.detail?.id
  return {
    ui: {
      proposals: decide(ui.proposals, 'create'),
      finished: alsoRemove ? ui.finished.filter((f) => f.id !== id) : ui.finished,
    },
  }
}
