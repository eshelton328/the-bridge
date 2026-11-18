import { describe, expect, it } from 'vitest'
import { screenMapProblems } from '../../../lib/screenMap.ts'
import { inboxStates } from './index.ts'
import { inboxScreens } from './screens.ts'

// Every Inbox state is in exactly one screen, on a device its Figma frame is (screen review R10).
describe('the Inbox screen map', () => {
  it('puts every state in one screen, on its own device', () => {
    expect(screenMapProblems(inboxStates, inboxScreens)).toEqual([])
  })
})
