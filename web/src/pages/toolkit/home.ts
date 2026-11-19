// The Toolkit page as the app opens it, with no ?state= (lib/dataSource.ts):
// the list of every item with nothing open, laid out by the window's width
// (ToolkitScreen's ViewportFrame): D1's cards beside the rail on a desktop,
// T1's rows on a tablet and M1's on a phone, each over the tab bar. It is not
// a Figma state: it lives outside states/, so it has no frame, story, board or
// fidelity check (app/ToolkitHome.test.tsx).
//
// Its data is what the state files hold, put together, so an item opens from
// the home as complete as any state shows it: D4's list (every group, T1's
// counts), the More drawer's Artifacts count (M4), the map, the Activity view
// (D11), each item's details with every tab the desktop states fill (the
// Overview, How it works, Files with D10's explanation, Links, Evals,
// Activity, writer's discussion, the workflow's page), the browsers the links
// open and the skills the evals open. An item no state has details for opens
// with what the list and its link target know.
import type { ScreenState } from '../../lib/screenState.ts'
import { agentFiles } from './states/agentFiles.ts'
import { agentHowItWorks } from './states/agentHowItWorks.ts'
import { agentLinks } from './states/agentLinks.ts'
import { hookFiles } from './states/hookFiles.ts'
import { hookHowItWorks } from './states/hookHowItWorks.ts'
import { hookLinks } from './states/hookLinks.ts'
import { moreDrawer } from './states/moreDrawer.ts'
import { ruleEvals } from './states/ruleEvals.ts'
import { ruleFiles } from './states/ruleFiles.ts'
import { ruleLinks } from './states/ruleLinks.ts'
import { ruleOpen } from './states/ruleOpen.ts'
import { scriptExplained } from './states/scriptExplained.ts'
import { skillHowItWorks } from './states/skillHowItWorks.ts'
import { skillLinks } from './states/skillLinks.ts'
import { toolkitActivity } from './states/toolkitActivity.ts'
import { toolkitList } from './states/toolkitList.ts'
import { workflowLinks } from './states/workflowLinks.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitItemView, ToolkitUi } from './types.ts'

/**
 * Each item's details once, with the fields of every list that has it: a later list adds its fields (a tab's data)
 * to an earlier one's. The lists below agree on every field they share but writer's `browser`, where D10's, with the
 * script's explanation, comes last.
 */
function mergeDetails(lists: readonly (readonly ToolkitItemDetailView[])[]): ToolkitItemDetailView[] {
  const byPath = new Map<string, ToolkitItemDetailView>()
  for (const detail of lists.flat()) byPath.set(detail.path, { ...byPath.get(detail.path), ...detail })
  return [...byPath.values()]
}

/** Each item once, by path, in the order the lists give them. */
function uniqueItems(lists: readonly (readonly ToolkitItemView[])[]): ToolkitItemView[] {
  const byPath = new Map<string, ToolkitItemView>()
  for (const item of lists.flat()) if (!byPath.has(item.path)) byPath.set(item.path, item)
  return [...byPath.values()]
}

const details = mergeDetails([
  // The Overview and How it works of writer and writing-reviewer (D3, D7, D14, D38), the rule (D4, D37), the hook
  // (D9, D39) and the workflow (D8, with its page, D13): the How it works states hold their Overview states' details.
  skillHowItWorks.data.details,
  agentHowItWorks.data.details,
  ruleOpen.data.details,
  hookHowItWorks.data.details,
  // The Files tab (D10, D33 to D36).
  scriptExplained.data.details,
  ruleFiles.data.details,
  agentFiles.data.details,
  hookFiles.data.details,
  // The Links tab (D19, D29 to D32); workflowLinks holds the workflow's Overview, Files and page too (D8, D35, D13).
  skillLinks.data.details,
  ruleLinks.data.details,
  agentLinks.data.details,
  workflowLinks.data.details,
  hookLinks.data.details,
  // The rule's Evals (D25) and the skill's and agent's Evals results ride on the details above (D20, D26).
  ruleEvals.data.details,
])

export const toolkitHome = {
  title: 'the Toolkit as the app opens',
  frames: [],
  data: {
    ...ruleOpen.data,
    artifactsCount: moreDrawer.data.artifactsCount,
    activity: toolkitActivity.data.activity,
    details,
    linkTargets: skillLinks.data.linkTargets,
    // The skills the rule's ledgers (D25) and the workflow's rounds (D23) open, which the list may not show.
    evalTargets: uniqueItems([ruleEvals.data.evalTargets, workflowLinks.data.evalTargets]),
  },
  ui: { ...toolkitList.ui, view: 'list', open: null, mapSelected: null, moreOpen: false },
} satisfies ScreenState<ToolkitData, ToolkitUi>
