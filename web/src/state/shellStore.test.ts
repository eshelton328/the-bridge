import { afterEach, describe, expect, it } from 'vitest'
import { resetAllStores } from './resetStores.ts'
import { shellStore } from './shellStore.ts'

afterEach(() => {
  resetAllStores()
})

describe('shellStore', () => {
  it('starts with the sidebar open', () => {
    expect(shellStore.getState().sidebarOpen).toBe(true)
  })

  it('toggles the sidebar', () => {
    shellStore.getState().actions.toggleSidebar()
    expect(shellStore.getState().sidebarOpen).toBe(false)
    shellStore.getState().actions.toggleSidebar()
    expect(shellStore.getState().sidebarOpen).toBe(true)
  })

  it('sets the sidebar and keeps the actions object', () => {
    const { actions } = shellStore.getState()
    actions.setSidebarOpen(false)
    expect(shellStore.getState().sidebarOpen).toBe(false)
    expect(shellStore.getState().actions).toBe(actions)
  })

  it('goes back to its first state on resetAllStores', () => {
    shellStore.getState().actions.setSidebarOpen(false)
    resetAllStores()
    expect(shellStore.getState().sidebarOpen).toBe(true)
  })
})
