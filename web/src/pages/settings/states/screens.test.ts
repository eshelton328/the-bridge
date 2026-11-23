import { describe, expect, it } from 'vitest'
import { screenMapProblems } from '../../../lib/screenMap.ts'
import { settingsStates } from './index.ts'
import { settingsScreens } from './screens.ts'

// Every Settings state is in exactly one screen, on a device its frame is (screen review R10).
describe('the Settings screen map', () => {
  it('puts every state in one screen, on its own device', () => {
    expect(screenMapProblems(settingsStates, settingsScreens)).toEqual([])
  })
})
