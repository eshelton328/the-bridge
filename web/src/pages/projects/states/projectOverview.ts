// Projects D01 (references/projects/D01, a PNG reference of the saved design
// render ov-D01.dc.html, d-133): NCC-1701's page on the desktop, on its
// Overview tab: Back to Projects, the letter tile, the name, the purpose,
// Quick chat and the tabs Overview and Ideas, and the Inbox and Queue panels
// (R5, R6) with D01's rows. The other data is D10's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ProjectsData, ProjectsUi } from '../types.ts'
import { menuOpen } from './menuOpen.ts'

const ask = (kind: 'question' | 'action' | 'review', title: string, age: string) => ({
  kind,
  title,
  meta: 'ncc-1701',
  age,
})
const pr = (meta: string, title: string, status: 'draft' | 'ciFailed' | 'inReview') => ({ meta, title, status })

// D01's panels: the three requests that need the owner, 17 chats to review (closed, so only counted) and the PRs;
// the overview states share them.
export const overviewRows = {
  inbox: {
    needsYou: [
      ask('question', 'Context bar: another way to show context use?', '5d'),
      ask('action', 'Terminal output from herdr in the-bridge (slice 3c)', '6d'),
      ask('review', 'Review the Storybook after the fidelity loop', '8d'),
    ],
    toReview: Array.from({ length: 17 }, (_, n) => ask('review', `Chat ${String(n + 1)}`, '1h')),
  },
  queue: {
    inProgress: [
      pr('the-bridge#535', 'Move the-bridge to library 1.0.0-beta.133', 'inReview'),
      pr('component-library-1701#359', 'Keep a pinned body on track when its footer grows', 'ciFailed'),
      pr('component-library-1701#357', 'Fade a thread line under the composer in a dock move', 'draft'),
    ],
  },
}

export const projectOverview = {
  title: "NCC-1701's page on the desktop, on its Overview tab",
  frames: [{ id: 'D01', node: 'ov-D01.dc.html', viewport: 'desktop' }],
  data: { ...menuOpen.data, overview: overviewRows },
  ui: { open: 'ncc-1701' },
} satisfies ScreenState<ProjectsData, ProjectsUi>
