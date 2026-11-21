import { afterEach, describe, expect, it } from 'vitest'
import { resetAllStores } from '../../state/resetStores.ts'
import { workspacesStore } from './workspacesStore.ts'

afterEach(() => {
  resetAllStores()
})

describe('workspacesStore', () => {
  it('starts with no changes', () => {
    expect(workspacesStore.getState().uiEdits).toEqual({ state: undefined, ui: {} })
  })

  it('merges the changes to the ui of one state', () => {
    const { setUi } = workspacesStore.getState().actions
    setUi('twoPanes', { focusedPane: 'drift-check', splitSizes: { columns: [60, 40] } })
    setUi('twoPanes', { menuFor: 'drift-check' })
    expect(workspacesStore.getState().uiEdits).toEqual({
      state: 'twoPanes',
      ui: { focusedPane: 'drift-check', splitSizes: { columns: [60, 40] }, menuFor: 'drift-check' },
    })
  })

  it('keeps the edits of the shown state and drops them when another is shown', () => {
    const { setUi, showState } = workspacesStore.getState().actions
    const { actions } = workspacesStore.getState()
    setUi('twoPanes', { focusedPane: 'drift-check' })
    showState('twoPanes')
    expect(workspacesStore.getState().uiEdits.ui).toEqual({ focusedPane: 'drift-check' })
    showState('resizedPanes')
    expect(workspacesStore.getState().uiEdits).toEqual({ state: 'resizedPanes', ui: {} })
    expect(workspacesStore.getState().actions).toBe(actions)
  })

  it('sends a message and changes no ui', async () => {
    const { send, setUi } = workspacesStore.getState().actions
    setUi('twoPanes', { drafts: { 'drift-check': 'ship it' } })
    await expect(send('drift-check', 'ship it')).resolves.toBeUndefined()
    expect(workspacesStore.getState().uiEdits).toEqual({
      state: 'twoPanes',
      ui: { drafts: { 'drift-check': 'ship it' } },
    })
  })

  it('moves the edits of a chat whose ID changed on its pane, and only after it saw the old ID there', () => {
    const { setUi, followPanes } = workspacesStore.getState().actions
    setUi(undefined, { focusedPane: 'c1', phoneView: 'chat', drafts: { c1: 'old' } })
    followPanes(undefined, new Map([['c1', 'p1']]))
    followPanes(undefined, new Map([['c1-c1', 'p1']]))
    expect(workspacesStore.getState().uiEdits.ui).toEqual({
      focusedPane: 'c1-c1',
      phoneView: 'chat',
      drafts: { c1: 'old' },
    })
    // Another state starts with no panes seen: its first list moves nothing.
    workspacesStore.getState().actions.showState('twoPanes')
    setUi('twoPanes', { focusedPane: 'c1-c1' })
    followPanes('twoPanes', new Map([['c2', 'p1']]))
    expect(workspacesStore.getState().uiEdits.ui).toEqual({ focusedPane: 'c1-c1' })
  })
})
