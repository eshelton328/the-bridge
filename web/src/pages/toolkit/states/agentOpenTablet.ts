// Figma Toolkit T7 "T7 · An agent, from a link": the agent writing-reviewer
// open on the iPad mini, reached from the links of the skill writer, with the
// same Overview as D7 (agentOpen): its description, how it runs, its prompt
// file, the workflows that run it (none) and its one file. On a tablet the
// item replaces the list, under the back row; because the agent was opened
// from writer, the row shows the breadcrumb Toolkit › writer ›
// writing-reviewer, and writer's crumb goes back to it (`ui.from`). The data
// is D7's, which has writer in its Skills group.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentOpen } from './agentOpen.ts'

export const agentOpenTablet = {
  title: 'an agent open on a tablet, from the links of a skill',
  frames: [{ id: 'T7', node: '441:2', viewport: 'tablet' }],
  data: { ...agentOpen.data },
  ui: { ...agentOpen.ui, from: 'skills/writer/' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
