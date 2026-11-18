// Figma Toolkit M20 "M20 · An agent": the agent writing-reviewer open on the
// phone, with the same Overview as D7 and T7 (agentOpen): its description,
// how it runs, its prompt file, the workflows that run it (none) and its one
// file. On the phone the item replaces the list, under the back row to
// Toolkit with Discuss and Show on map as icon buttons, as M2 has it; the four
// How it runs cards sit in two columns. The data is D7's, as T7's is.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentOpen } from './agentOpen.ts'

export const agentOpenPhone = {
  title: 'an agent open on the phone, its facts in two columns',
  frames: [{ id: 'M20', node: '487:1429', viewport: 'phone' }],
  data: { ...agentOpen.data },
  ui: { ...agentOpen.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
