import { describe, expect, it } from 'vitest'
import { screenMapProblems } from '../../../lib/screenMap.ts'
import { toolkitStates } from './index.ts'
import { toolkitScreens } from './screens.ts'

// Every Toolkit state is in exactly one screen, on a device its Figma frame is (screen review R10).
describe('the Toolkit screen map', () => {
  it('puts every state in one screen, on its own device', () => {
    expect(screenMapProblems(toolkitStates, toolkitScreens)).toEqual([])
  })
})
