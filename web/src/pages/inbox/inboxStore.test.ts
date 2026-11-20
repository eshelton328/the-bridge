import { afterEach, describe, expect, it } from 'vitest'
import { resetAllStores } from '../../state/resetStores.ts'
import { inboxStore } from './inboxStore.ts'

afterEach(() => {
  resetAllStores()
})

describe('inboxStore', () => {
  it('starts with no changes to the groups', () => {
    expect(inboxStore.getState().groupsOpen).toEqual({})
  })

  it('records a group opened or closed', () => {
    inboxStore.getState().actions.setGroupOpen('snoozed', true)
    inboxStore.getState().actions.setGroupOpen('needsYou', false)
    expect(inboxStore.getState().groupsOpen).toEqual({ snoozed: true, needsYou: false })
  })
})

describe('inboxStore edits', () => {
  it('records the prompt dialog and the search text for one state', () => {
    const { setPromptOpen, setQuery } = inboxStore.getState().actions
    setPromptOpen('promptRead', false)
    setQuery('promptRead', 'f-0')
    expect(inboxStore.getState().edits).toEqual({
      state: 'promptRead',
      itemOpen: undefined,
      promptOpen: false,
      removeOpen: undefined,
      query: 'f-0',
    })
  })

  it('drops the edits of the last state when another state changes', () => {
    const { setPromptOpen, setQuery } = inboxStore.getState().actions
    setPromptOpen('promptRead', false)
    setQuery('search', 'f-005 x')
    expect(inboxStore.getState().edits).toEqual({
      state: 'search',
      itemOpen: undefined,
      promptOpen: undefined,
      removeOpen: undefined,
      query: 'f-005 x',
    })
  })
})

describe('inboxStore remove dialog', () => {
  it('records the remove dialog closed for one state only', () => {
    const { setRemoveOpen, showState } = inboxStore.getState().actions
    setRemoveOpen('removeConfirm', false)
    expect(inboxStore.getState().edits.removeOpen).toBe(false)
    showState('nextStep')
    expect(inboxStore.getState().edits.removeOpen).toBeUndefined()
  })
})

describe('inboxStore showState', () => {
  it('keeps the edits of the shown state and drops them when another is shown', () => {
    const { setQuery, showState } = inboxStore.getState().actions
    setQuery('search', 'f-006')
    showState('search')
    expect(inboxStore.getState().edits.query).toBe('f-006')
    showState('nextStep')
    expect(inboxStore.getState().edits).toEqual({
      state: 'nextStep',
      itemOpen: undefined,
      promptOpen: undefined,
      removeOpen: undefined,
      query: undefined,
    })
  })
})

describe('inboxStore open item', () => {
  it('records the open item closed with Back for one state only', () => {
    const { setItemOpen, showState } = inboxStore.getState().actions
    setItemOpen('taskPage', false)
    expect(inboxStore.getState().edits.itemOpen).toBe(false)
    showState('taskPage')
    expect(inboxStore.getState().edits.itemOpen).toBe(false)
    showState('list')
    expect(inboxStore.getState().edits.itemOpen).toBeUndefined()
  })
})

describe('inboxStore ui edits', () => {
  it('merges changes to the ui of one state and drops them when another is shown', () => {
    const { setUi, showState } = inboxStore.getState().actions
    setUi('list', { sortOpen: true })
    setUi('list', { sort: 'oldest', sortOpen: false })
    expect(inboxStore.getState().uiEdits).toEqual({ state: 'list', ui: { sort: 'oldest', sortOpen: false } })
    showState('list')
    expect(inboxStore.getState().uiEdits.ui).toEqual({ sort: 'oldest', sortOpen: false })
    showState('nextStep')
    expect(inboxStore.getState().uiEdits).toEqual({ state: 'nextStep', ui: {} })
  })

  it('starts a new state from no changes', () => {
    const { setUi } = inboxStore.getState().actions
    setUi('list', { filterOpen: true })
    setUi('search', { sort: 'kind' })
    expect(inboxStore.getState().uiEdits).toEqual({ state: 'search', ui: { sort: 'kind' } })
  })
})

// Audit L-3: a send can end after the owner typed on, or opened another item. The sent message joins the state's
// messages, and the draft empties only while it is the sent item's and holds the sent text.
describe('inboxStore markSent', () => {
  it("adds the message over the state's own and empties the draft that holds it", () => {
    const { setDraft, markSent } = inboxStore.getState().actions
    setDraft('t1', 'discussion', 'why now?')
    markSent('discussOpen', ['earlier'], 't1', 'why now?')
    expect(inboxStore.getState().uiEdits).toEqual({ state: 'discussOpen', ui: { sent: ['earlier', 'why now?'] } })
    expect(inboxStore.getState().typed).toEqual({ item: 't1', values: { discussion: '' } })
  })

  it('keeps a draft the owner changed after the send', () => {
    const { setDraft, markSent } = inboxStore.getState().actions
    setDraft('t1', 'discussion', 'why now? and who')
    markSent('discussOpen', [], 't1', 'why now?')
    expect(inboxStore.getState().typed).toEqual({ item: 't1', values: { discussion: 'why now? and who' } })
  })

  it('keeps the draft of the item the owner opened after the send', () => {
    const { setDraft, markSent } = inboxStore.getState().actions
    setDraft('t2', 'discussion', 'why now?')
    markSent('discussOpen', [], 't1', 'why now?')
    expect(inboxStore.getState().typed).toEqual({ item: 't2', values: { discussion: 'why now?' } })
  })

  it('adds a second message after the first', () => {
    const { markSent } = inboxStore.getState().actions
    markSent('discussOpen', [], 't1', 'one')
    markSent('discussOpen', [], 't1', 'two')
    expect(inboxStore.getState().uiEdits.ui.sent).toEqual(['one', 'two'])
  })
})
