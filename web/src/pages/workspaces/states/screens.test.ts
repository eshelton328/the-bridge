import { describe, expect, it } from 'vitest'
import { screenMapProblems } from '../../../lib/screenMap.ts'
import { workspacesStates } from './index.ts'
import { workspacesScreens } from './screens.ts'

// Every Workspaces state is in exactly one screen, on a device its Figma frame is (screen review R10).
describe('the Workspaces screen map', () => {
  it('puts every state in one screen, on its own device', () => {
    expect(screenMapProblems(workspacesStates, workspacesScreens)).toEqual([])
  })
})
