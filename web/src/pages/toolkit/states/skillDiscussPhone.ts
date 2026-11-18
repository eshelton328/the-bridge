// Figma Toolkit M7 "M7 · Discuss": the skill writer's discussion on the
// phone, opened from its Discuss icon button, as a full-screen chat with no
// tab bar: Back to writer, the Discussion pill and Workbench; writer's card
// with the model and context under its meta line and what the chat may do;
// before the first message, what to ask, what it can do and, under "Try",
// three questions to start with; and the reply box. Copy word for word from
// references/toolkit/M07/frame.json. The data is D3's, as M2's is.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillOpen } from './skillOpen.ts'

export const skillDiscussPhone = {
  title: 'a skill’s discussion on the phone, full screen',
  frames: [{ id: 'M7', node: '435:556', viewport: 'phone' }],
  data: { ...skillOpen.data },
  ui: { ...skillOpen.ui, discussOpen: true },
} satisfies ScreenState<ToolkitData, ToolkitUi>
