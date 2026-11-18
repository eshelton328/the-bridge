// The Evals states' details (D20, D25 to D28, and their tablet and phone
// states): shared, not a state. writer's D5 Reviewer badge opens the agent
// writing-reviewer on its Evals tab (D26, and T25 under the breadcrumb Toolkit
// › writer › writing-reviewer), and the agent's breadcrumb and the rule's
// first ledger open writer on its own (D20), so `withEvals` adds both items'
// details, each with its `results` (shared/evalResults.ts), to a state that
// has neither. The rule's ledgers are skills that D25's list does not show:
// `ledgerSkills` gives them to `evalTargets`.
import type { ToolkitData, ToolkitItemDetailView } from '../../types.ts'
import { agentOpen } from '../agentOpen.ts'
import { ruleOpen } from '../ruleOpen.ts'
import { skillOpen } from '../skillOpen.ts'
import { ruleResults } from './evalResults.ts'

const linked: readonly ToolkitItemDetailView[] = [...skillOpen.data.details, ...agentOpen.data.details]

/** A state's details, with writer and writing-reviewer added when the state has no details for them. */
export function withEvals(details: readonly ToolkitItemDetailView[]): ToolkitItemDetailView[] {
  return [...details, ...linked.filter((l) => !details.some((d) => d.path === l.path))]
}

/**
 * The skills the rule's ledgers name (D25 `round · writer` 492:506), which D25's list does not show: the D4 list's
 * items (ruleOpen, every group).
 */
export const ledgerSkills: NonNullable<ToolkitData['evalTargets']> = ruleOpen.data.groups
  .flatMap((g) => g.items)
  .filter((i) => (ruleResults.rounds?.items ?? []).some((r) => r.open === i.path))
