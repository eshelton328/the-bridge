// Figma Toolkit D20 "D20 · A skill’s evals": the skill writer open beside the
// list, as in D3 (skillOpen), on its Evals tab, from writer's ledger: the done
// criteria after the latest round, the Opus pass rate by round with and
// without the skill, the cases and the rounds. The Overview's Skill evals link
// opens it. A tap on D5 Reviewer opens the agent writing-reviewer on its Evals
// tab (D26), whose details `withEvals` adds. Copy word for word from
// references/toolkit/D20/frame.json (shared/evals.ts); the list is D3's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { withEvals } from './shared/evals.ts'
import { skillOpen } from './skillOpen.ts'

export const skillEvals = {
  title: 'a skill open beside the list, on Evals',
  frames: [{ id: 'D20', node: '482:1357', viewport: 'desktop' }],
  data: { ...skillOpen.data, details: withEvals(skillOpen.data.details) },
  ui: { ...skillOpen.ui, itemTab: 'evals' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
