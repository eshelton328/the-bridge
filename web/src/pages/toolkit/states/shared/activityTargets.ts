// What a tap on the workflow's Activity rounds opens (D23 `row · readme ·
// cross-family x1`): shared, not a state. Each round names a skill, and a
// tap opens that skill on its Evals tab (writer, D20) or, for a skill with
// no Evals tab, on its Overview. D23's list (D9's) has no Skills group, so
// `roundSkills` gives the skills to `evalTargets` (the D4 list's items,
// ruleOpen, every group), and `roundDetails` gives writer's details with its
// results (skillOpen's), so the tap lands on writer's Evals as D20 draws it,
// and writing-reviewer's, which writer's D5 Reviewer badge opens.
import type { ToolkitData, ToolkitItemDetailView } from '../../types.ts'
import { ruleOpen } from '../ruleOpen.ts'
import { skillOpen } from '../skillOpen.ts'
import { workflowUsage } from './activity.ts'

const opens: readonly string[] = workflowUsage.list.rows.flatMap((r) => (r.open === undefined ? [] : [r.open]))

/** The skills the workflow's rounds name, from the D4 list (every group). */
export const roundSkills: NonNullable<ToolkitData['evalTargets']> = ruleOpen.data.groups
  .flatMap((g) => g.items)
  .filter((i) => opens.includes(i.path))

/**
 * The details a tap on a round needs: writer's, with its Evals and Activity tabs, and those of the agent
 * writing-reviewer, which writer's D5 Reviewer badge opens on its Evals tab (D26). skillOpen holds both.
 */
export const roundDetails: readonly ToolkitItemDetailView[] = skillOpen.data.details
