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
    expect(inboxStore.getState().edits).toEqual({ state: 'promptRead', promptOpen: false, query: 'f-0' })
  })

  it('drops the edits of the last state when another state changes', () => {
    const { setPromptOpen, setQuery } = inboxStore.getState().actions
    setPromptOpen('promptRead', false)
    setQuery('search', 'f-005 x')
    expect(inboxStore.getState().edits).toEqual({ state: 'search', promptOpen: undefined, query: 'f-005 x' })
  })
})

describe('inboxStore showState', () => {
  it('keeps the edits of the shown state and drops them when another is shown', () => {
    const { setQuery, showState } = inboxStore.getState().actions
    setQuery('search', 'f-006')
    showState('search')
    expect(inboxStore.getState().edits.query).toBe('f-006')
    showState('nextStep')
    expect(inboxStore.getState().edits).toEqual({ state: 'nextStep', promptOpen: undefined, query: undefined })
  })
})
