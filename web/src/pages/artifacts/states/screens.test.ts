import { describe, expect, it } from 'vitest'
import { screenMapProblems } from '../../../lib/screenMap.ts'
import { artifactsStates } from './index.ts'
import { artifactsScreens } from './screens.ts'

// Every Artifacts state is in exactly one screen, on a device its Figma frame is (screen review R10).
describe('the Artifacts screen map', () => {
  it('puts every state in one screen, on its own device', () => {
    expect(screenMapProblems(artifactsStates, artifactsScreens)).toEqual([])
  })
})
