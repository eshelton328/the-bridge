// Figma Toolkit M12 "M12 · How a skill works": the skill writer open on the
// phone, on its How it works tab, with T10's data (skillHowItWorksTablet, D14's
// data with the shorter trigger and step lines): the steps stand in one column
// under the back row Toolkit › writer, and the chat path follows. Copy word for
// word from references/toolkit/M12/frame.json; it has T10's text.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { skillHowItWorksTablet } from './skillHowItWorksTablet.ts'

export const skillHowItWorksPhone = {
  title: 'a skill open on the phone, on How it works',
  frames: [{ id: 'M12', node: '461:378', viewport: 'phone' }],
  data: { ...skillHowItWorksTablet.data },
  ui: { ...skillHowItWorksTablet.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
