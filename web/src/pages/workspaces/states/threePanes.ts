// Figma Workbench D11 (402:3665), "D11 · Three panes": the screen of D10
// after brain git is dropped below drift check. The vertical and the
// horizontal split combine: bridge themes, focused, on the left at the full
// height, and drift check over brain git on the right, each at half the
// height. Each gap has its own resize handle: one between the columns and
// one between the right column's rows. Starts from D9 (twoPanes), with D1's
// (workbench) brain git shell pane.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { twoPanes } from './twoPanes.ts'
import { workbench } from './workbench.ts'

const [bridgeThemes, driftCheck, , brainGit] = workbench.data.panes

export const threePanes = {
  title: 'Three panes: one on the left, two stacked on the right',
  frames: [{ id: 'D11', node: '402:3665', viewport: 'desktop' }],
  data: {
    ...twoPanes.data,
    panes: [bridgeThemes, driftCheck, brainGit].filter((pane) => pane !== undefined),
    status: { ...workbench.data.status, summary: 'omni-brain · 3 panes' },
    layers: {
      sidebar: '402:3806',
      toggle: '402:3809',
      newWorkspace: '402:3814',
      newChat: '402:4133',
      headers: {
        'omni-brain': '402:3818',
        'the-bridge': '402:3892',
        omni: '402:3935',
        'skill-evals': '402:3970',
      },
      rows: {
        'bridge-themes': '402:3836',
        'theme-tokens': '402:3850',
        'drift-check': '402:3865',
        'brain-git': '402:3881',
        'hono-server': '402:3910',
        'dev-server': '402:3924',
        'release-notes': '402:3954',
      },
      panes: ['402:4148', '402:4220', '402:4274'],
      paneChats: [
        { composer: '402:4191', entries: ['402:4173', '402:4175', '402:4178'] },
        { composer: '402:4262', entries: [undefined, '402:4249'] },
      ],
      shell: '402:4295',
    },
  },
  ui: { ...twoPanes.ui },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
