// Figma Toolkit D25 "D25 · A rule’s evals": the rule skills open beside the
// list, as in D4 (ruleOpen), on its Evals tab. A rule has no eval cases, so
// the status panel says so, and the panel under it lists the four skill
// ledgers that cite the rule; a tap on a ledger's skill opens it on its Evals
// tab (writer opens D20). The list is D37's (ruleHowItWorks: D4's data with
// the Rules, Workflows and Hooks groups), so the skills come from
// `evalTargets`. Copy word for word from references/toolkit/D25/frame.json
// (shared/evals.ts).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { ruleHowItWorks } from './ruleHowItWorks.ts'
import { ledgerSkills, withEvals } from './shared/evals.ts'

export const ruleEvals = {
  title: 'a rule open beside the list, on Evals',
  frames: [{ id: 'D25', node: '492:2', viewport: 'desktop' }],
  data: { ...ruleHowItWorks.data, details: withEvals(ruleHowItWorks.data.details), evalTargets: ledgerSkills },
  ui: { ...ruleHowItWorks.ui, itemTab: 'evals' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
