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
