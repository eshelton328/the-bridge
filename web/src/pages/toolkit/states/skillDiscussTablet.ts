// Figma Toolkit T5 "T5 · Discuss": the skill writer's discussion on the iPad
// mini, opened from its Discuss button, as a page of its own in the item's
// place with no tab bar: Back to writer, the model and context, the
// Discussion pill and Open in Workbench; writer's card with what the chat
// may do; before the first message, what to ask, what it can do and three
// questions to start with; and the reply box. Copy word for word from
// references/toolkit/T05/frame.json. The data is D3's, as T3's is.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillOpen } from './skillOpen.ts'

export const skillDiscussTablet = {
  title: 'a skill’s discussion on a tablet, in place of the item',
  frames: [{ id: 'T5', node: '438:64', viewport: 'tablet' }],
  data: { ...skillOpen.data },
  ui: { ...skillOpen.ui, discussOpen: true },
} satisfies ScreenState<ToolkitData, ToolkitUi>
