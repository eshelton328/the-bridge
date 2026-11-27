import { describe, expect, it } from 'vitest'
import { frameSizeOf, screenMapProblems } from '../../../lib/screenMap.ts'
import { projectsStates } from './index.ts'
import { projectsScreens } from './screens.ts'

// Every Projects state is in exactly one screen, on a device its Figma frame is (screen review R10).
describe('the Projects screen map', () => {
  it('puts every state in one screen, on its own device', () => {
    expect(screenMapProblems(projectsStates, projectsScreens)).toEqual([])
  })
  it('draws the wide screen in the landscape iPad frame (T10b, 1133×744)', () => {
    expect(frameSizeOf(projectsScreens.wide, 'tablet')).toEqual({ width: 1133, height: 744 })
  })
})
