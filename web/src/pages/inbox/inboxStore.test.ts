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
