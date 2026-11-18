// Figma Workbench M17 (402:10748), "M17 · The chat fills the screen": bridge
// themes open full screen on the phone, as in M3, with no tab bar: the header
// with the back button, Erik's message, the Read line and Claude's reply with
// Copy, and the composer with requirements.md attached and "/" typed, in focus,
// with no skill list open. Back returns to the list, where the other chats
// keep running. At a desktop width the state draws M1's sidebar with bridge
// themes alone.
// Starts from M3 (phoneChat), without the skills, with M17's layers.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneChat } from './phoneChat.ts'

export const phoneChatFull = {
  title: 'A chat full screen on the phone, with no tab bar',
  frames: [{ id: 'M17', node: '402:10748', viewport: 'phone' }],
  data: {
    ...phoneChat.data,
    layers: {
      ...phoneChat.data.layers,
      phoneBack: '402:10775',
      chatHead: '402:10773',
      chatActions: '402:10786',
      entries: ['402:10802', undefined, '402:10807'],
      composer: '402:10833',
    },
  },
  ui: { ...phoneChat.ui, skillsFor: null, skill: null, messageFocus: true },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
