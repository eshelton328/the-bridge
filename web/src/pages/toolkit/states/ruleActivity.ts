// Figma Toolkit D21 "D21 · A rule’s activity": the rule skills open beside
// the list, on its Activity tab. Claude Code does not log a rule load, so
// the tab counts the sessions that opened a skill file. The data is D37's
// (ruleHowItWorks: D4's rule with D9's groups), as D25's is. Copy word for
// word from references/toolkit/D21/frame.json (shared/activity.ts).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleHowItWorks } from './ruleHowItWorks.ts'

export const ruleActivity = {
  title: 'a rule open beside the list, on Activity',
  frames: [{ id: 'D21', node: '491:4235', viewport: 'desktop' }],
  data: { ...ruleHowItWorks.data },
  ui: { ...ruleHowItWorks.ui, itemTab: 'activity' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
