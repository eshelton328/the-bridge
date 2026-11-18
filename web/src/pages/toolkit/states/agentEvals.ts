// Figma Toolkit D26 "D26 · An agent’s evals": the agent writing-reviewer open
// beside the list, as in D7 (agentOpen), on its Evals tab: its results from
// the writer ledger's D5 criterion, the nine drafts with what it should fail
// and what it failed, and the round. writer's D5 Reviewer badge (D20) opens
// this tab. Copy word for word from references/toolkit/D26/frame.json
// (shared/evals.ts); the list is D7's, with the Skills group closed.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { agentOpen } from './agentOpen.ts'
import { withEvals } from './shared/evals.ts'

export const agentEvals = {
  title: 'an agent open beside the list, on Evals',
  frames: [{ id: 'D26', node: '492:526', viewport: 'desktop' }],
  data: { ...agentOpen.data, details: withEvals(agentOpen.data.details) },
  ui: { ...agentOpen.ui, itemTab: 'evals' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
