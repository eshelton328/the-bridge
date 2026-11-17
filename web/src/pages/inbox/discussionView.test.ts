import { describe, expect, it } from 'vitest'
import { discussionView, proposalEffect, removeEffect, undoCreateEffect } from './screens/discussionView.ts'
import { restoreEffect } from './screens/discussionView.ts'
import { startView } from './screens/startView.ts'
import { inboxStates } from './states/index.ts'

const { changeProposed, tasksProposed, removalProposed } = inboxStates
const { removed } = inboxStates
const selected = changeProposed.data.detail.id

describe('discussionView', () => {
  it('puts an applied update in the task, with its change line', () => {
    const view = discussionView(changeProposed.data, { ...changeProposed.ui, proposals: { update: 'applied' } })
    const detail = view.detail?.kind === 'next' ? view.detail : undefined
    expect(detail?.origin).toBe('changed just now in a discussion')
    expect(detail?.prompt.text).toContain('to its Figma frame from pages.md')
    expect(detail?.prompt.change?.undo).toBe('Undo')
  })

  it('leaves the task as it is while the update waits', () => {
    expect(discussionView(changeProposed.data, changeProposed.ui).detail).toEqual(changeProposed.data.detail)
  })

  it('takes a discarded proposal out of the discussion', () => {
    const view = discussionView(changeProposed.data, { ...changeProposed.ui, proposals: { update: 'discarded' } })
    expect(view.discussion?.entries.map((e) => e.type)).toEqual(['user', 'reply'])
  })

  it('adds the checked new tasks under the first next step, with the counts and a toast', () => {
    const view = discussionView(tasksProposed.data, {
      ...tasksProposed.ui,
      proposals: { create: 'applied' },
      proposalChecks: { 'Write the Inbox tickets': false },
    })
    const next = view.groups.find((g) => g.id === 'nextSteps')
    expect(next?.rows.map((r) => r.title).slice(0, 3)).toEqual([
      'Write the tickets for increment one',
      'Write the Workbench tickets',
      'Write the App frame tickets',
    ])
    expect(next?.count).toBe(5)
    expect(view.count).toBe(tasksProposed.data.count + 2)
    expect(view.filters.find((f) => f.value === 'next')?.count).toBe(5)
    expect(view.toast).toEqual({ text: 'Created 2 tasks from a discussion', action: 'Undo' })
  })
})

describe('the discussion effects', () => {
  it('keeps the discussion open after Apply on the desktop and shows the task on a tablet', () => {
    expect(proposalEffect(changeProposed.data, changeProposed.ui, 'update', 'apply', true).ui.discussOpen).toBe(true)
    expect(proposalEffect(changeProposed.data, changeProposed.ui, 'update', 'apply', false).ui.discussOpen).toBe(false)
  })

  it('opens the editor with the proposed prompt from Edit first', () => {
    const effect = proposalEffect(changeProposed.data, changeProposed.ui, 'update', 'edit', false)
    expect(effect.ui).toEqual({ discussOpen: false, editingPrompt: true })
    expect(effect.prompt).toContain('Before writing, check that each frame exists')
  })

  it('opens the confirm dialog from Remove…, and Remove task takes the task out of the list', () => {
    expect(proposalEffect(removalProposed.data, removalProposed.ui, 'remove', 'apply', false).removeOpen).toBe(true)
    const effect = removeEffect(removalProposed.data, removalProposed.ui)
    expect(effect.ui.finished).toEqual([{ id: selected, result: 'removed' }])
    expect(effect.ui.proposals).toEqual({ remove: 'applied' })
    expect(effect.back).toBe(true)
  })

  it('removes this task with the new ones when Also remove is checked, and Undo brings it back', () => {
    const data = discussionView(tasksProposed.data, {
      ...tasksProposed.ui,
      proposalChecks: { 'Also remove this task': true },
    })
    const created = proposalEffect(data, tasksProposed.ui, 'create', 'apply', false)
    expect(created.ui.finished).toEqual([{ id: selected, result: 'removed' }])
    const ui = { ...tasksProposed.ui, ...created.ui }
    expect(undoCreateEffect(data, ui).ui).toEqual({ proposals: {}, finished: [] })
  })

  it('shows a removed task as removed, with its reason on its row, and Restore takes the removal back', () => {
    const view = discussionView(removed.data, removed.ui)
    const detail = view.detail?.kind === 'next' ? view.detail : undefined
    expect(detail?.status).toEqual({ tone: 'danger', label: 'Removed' })
    expect(detail?.actions).toBe(false)
    expect(detail?.launch.stage === 'started' ? detail.launch.run.openElsewhere : undefined).toBe('Restore')
    const row = view.groups.flatMap((g) => g.rows).find((r) => r.id === selected)
    expect(row?.outcome).toEqual({ line: 'Removed in a discussion · split into 3', result: 'removed' })
    const restored = { ...removed.ui, ...restoreEffect(view, removed.ui).ui }
    expect(restored.finished).toEqual([])
    expect(restored.proposals).toEqual({})
    expect(discussionView(removed.data, restored).detail).toEqual(removed.data.detail)
  })

  it('adds the messages Erik sent after the entries', () => {
    const view = discussionView(tasksProposed.data, { ...tasksProposed.ui, sent: ['Keep the Inbox one.'] })
    expect(view.discussion?.entries.at(-1)).toEqual({ type: 'user', text: 'Keep the Inbox one.' })
  })

  it('takes the rows a state draws as created out after Undo, with the counts and the toast', () => {
    const { tasksCreated } = inboxStates
    const shown = discussionView(tasksCreated.data, tasksCreated.ui)
    expect(shown.toast).toBeDefined()
    const undone = discussionView(tasksCreated.data, {
      ...tasksCreated.ui,
      ...undoCreateEffect(tasksCreated.data, tasksCreated.ui).ui,
    })
    expect(undone.toast).toBeUndefined()
    expect(undone.count).toBe(tasksCreated.data.count - 3)
    const next = undone.groups.find((g) => g.id === 'nextSteps')
    expect(next?.rows.map((r) => r.pill?.label)).not.toContain('New')
    expect(next?.count).toBe(next?.rows.length)
  })
})

describe('startView', () => {
  it('shows a started next step with its run card, Running and its prompt sent', () => {
    const { nextStep } = inboxStates
    const view = startView(nextStep.data, { started: [nextStep.data.detail.id] })
    const detail = view.detail?.kind === 'next' ? view.detail : undefined
    expect(detail?.status.label).toBe('Running')
    expect(detail?.prompt.state).toBe('sent')
    expect(detail?.launch.stage === 'started' ? detail.launch.run.chat?.reply : undefined).toBe('Reply to quiet-nebula')
    expect(startView(nextStep.data, { started: [] })).toBe(nextStep.data)
  })
})
