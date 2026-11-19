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
})
