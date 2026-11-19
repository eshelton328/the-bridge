// Figma Workbench M3 (105:2723), "M3 · Chat": bridge themes opened on the
// phone. The header has the back button, the kind mark, the title over
// omni-brain, Working and the ⋯, then Opus 5.5 and 42% of the context. Under
// it the owner's message, the Read line and Claude's reply with Copy; the owner has
// typed "/" after attaching requirements.md, so the skills are listed over
// the composer with /writer highlighted, and Stop shows while the chat works.
// The composer has no model chip, and there is no tab bar. At a desktop width
// the state draws M1's sidebar with bridge themes alone and its skills open.
// Starts from M1 (phoneHome), with D1's bridge themes pane (workbench).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { phoneHome } from './phoneHome.ts'
import { workbench } from './workbench.ts'

const [first] = workbench.data.panes
// D1's pane with "/" typed and requirements.md attached; Figma's phone composer has no model chip (105:2831).
const bridgeThemes: WorkbenchPane[] =
  first?.type === 'chat'
    ? [
        {
          ...first,
          composer: {
            placeholder: first.composer.placeholder,
            text: first.composer.text,
            attachments: first.composer.attachments,
            running: first.composer.running,
          },
        },
      ]
    : []

export const phoneChat = {
  title: 'A chat on the phone, with the skills listed after "/"',
  frames: [{ id: 'M3', node: '105:2723', viewport: 'phone' }],
  data: {
    ...phoneHome.data,
    panes: bridgeThemes,
    phone: { ...phoneHome.data.phone, back: 'Back to Workspaces' },
    layers: {
      ...phoneHome.data.layers,
      phoneBack: '105:2750',
      chatHead: '105:2748',
      chatActions: '105:2765',
      entries: ['105:2785', undefined, '105:2790'],
      skills: '105:2805',
      composer: '105:2820',
    },
  },
  ui: {
    ...phoneHome.ui,
    phoneView: 'chat',
    skillsFor: 'bridge-themes',
    skill: '/writer',
  },
} satisfies ScreenState<WorkspacesData, WorkspacesUi>
