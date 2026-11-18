// Figma Toolkit D31 "D31 · A workflow’s links": the workflow skill-eval-round
// open beside the list, as in D8 (workflowOpen), on its Links tab: the stage
// before it (the workflow skill-eval-cases) and the skill eval-cases name it,
// and it names skill-eval-cases and the agent it runs, eval-grader. Copy
// word for word from references/toolkit/D31/frame.json; the list is D8's.
import type { ScreenState } from '../../../lib/screenState.ts'
import { linkTargets } from './shared/linkFiles.ts'
import type { ToolkitData, ToolkitLinks, ToolkitUi } from '../types.ts'
import { workflowOpen } from './workflowOpen.ts'

const cases = { path: 'workflows/skill-eval-cases.md', name: 'skill-eval-cases', kind: 'workflow' as const }
const evalCases = { path: 'skills/eval-cases/', name: 'eval-cases', kind: 'skill' as const }
const grader = { path: 'agents/eval-grader.md', name: 'eval-grader', kind: 'agent' as const }

const links: ToolkitLinks = {
  intro:
    'Only skill-eval-round’s own links, with the line in the file that makes each one. Show on map shows the same links inside the whole toolkit map.',
  label: 'Links',
  hint: 'Tap an item to open it',
  from: {
    label: 'Linked from',
    caption: 'files that name skill-eval-round',
    links: [
      { ...cases, at: 'workflows/skill-eval-cases.md:5', text: 'skill-eval-round runs the round once the…' },
      { ...evalCases, at: 'skills/eval-cases/SKILL.md:97', text: 'is the skill-eval-round workflow.' },
    ],
    graph: [cases.path, evalCases.path],
  },
  to: {
    label: 'Links to',
    caption: 'names in skill-eval-round’s files',
    links: [
      { ...cases, at: 'skill-eval-round.md:5', text: 'It is the second of two stages; skill-eval-cases…' },
      {
        ...grader,
        at: 'skill-eval-round.md:46',
        text: '4. Primary grades: grade.py <round> <skill> primary, eval-grader',
      },
    ],
    graph: [cases.path, grader.path],
  },
  note: 'Tap an item to open its page, or a line to open the file there. A link is one toolkit file that names another.',
}

export const workflowLinks = {
  title: 'a workflow open beside the list, on Links',
  frames: [{ id: 'D31', node: '493:1651', viewport: 'desktop' }],
  data: {
    ...workflowOpen.data,
    details: workflowOpen.data.details.map((d) => (d.path === 'workflows/skill-eval-round.md' ? { ...d, links } : d)),
    linkTargets,
  },
  ui: { ...workflowOpen.ui, itemTab: 'links' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
