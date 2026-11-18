// Figma Toolkit D5 "D5 · Discuss": the skill writer's discussion, opened from
// its Discuss button, as a side panel at the window's end. The item keeps its
// Overview, as in D3 (skillOpen), with no list beside it and no Used in
// workflows section; the panel holds the header (Discuss writer, Open in
// Workbench, close), what the chat is for, writer's folder attached
// read-only, one question with Claude's answer (sample messages, with the
// files it cites and Copy) and the reply box on Opus 5.5. Copy word for word
// from references/toolkit/D05/frame.json. The data is D3's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillOpen } from './skillOpen.ts'

export const skillDiscuss = {
  title: 'a skill with its discussion open beside it',
  frames: [{ id: 'D5', node: '432:1090', viewport: 'desktop' }],
  data: {
    ...skillOpen.data,
    // D5 432:1482: the side column has the files and the evals link, and no Used in workflows.
    details: skillOpen.data.details.map((d) => (d.path === 'skills/writer/' ? { ...d, usedIn: undefined } : d)),
  },
  ui: { ...skillOpen.ui, discussOpen: true },
} satisfies ScreenState<ToolkitData, ToolkitUi>
