import { afterEach, describe, expect, it } from 'vitest'
import { resetAllStores } from '../../state/resetStores.ts'
import { toolkitStore } from './toolkitStore.ts'

afterEach(() => {
  resetAllStores()
})

describe('toolkitStore', () => {
  it('merges the changes made while the route loads and empties them once taken', () => {
    const { actions } = toolkitStore.getState()
    actions.changePending({ query: 'wri' })
    actions.changePending({ query: 'writer', groupsOpen: {} })
    expect(toolkitStore.getState().pendingUi).toEqual({ query: 'writer', groupsOpen: {} })
    actions.clearPending()
    expect(toolkitStore.getState().pendingUi).toEqual({})
  })

  it('starts empty after a reset', () => {
    toolkitStore.getState().actions.changePending({ query: 'x' })
    resetAllStores()
    expect(toolkitStore.getState().pendingUi).toEqual({})
  })
})
