// Figma Toolkit D29 "D29 · A rule’s links": the rule skills open beside the
// list, as in D4 (ruleOpen), on its Links tab. The rule links to one skill,
// eval-cases, and no item links to it, because Claude Code loads it by its
// paths: the graph's left column and the Linked from panel say so. Copy word
// for word from references/toolkit/D29/frame.json. The list is D37's
// (ruleHowItWorks): D4's data with the Rules, Workflows and Hooks groups.
import type { ScreenState } from '../../../lib/screenState.ts'
import { linkTargets } from './shared/linkFiles.ts'
import type { ToolkitData, ToolkitLinks, ToolkitUi } from '../types.ts'
import { ruleHowItWorks } from './ruleHowItWorks.ts'

const links: ToolkitLinks = {
  intro:
    'Only the skills rule’s own links, with the line in the file that makes each one. No item links to it: Claude Code loads it by the paths in its frontmatter.',
  label: 'Links',
  hint: 'Tap an item to open it',
  from: {
    label: 'Linked from',
    caption: 'files that name skills',
    links: [],
    graph: [],
    empty: {
      graph: 'No item links here.\nIt loads by its paths.',
      panel: 'No toolkit item names this rule. It loads when a file under toolkit/skills/** or skills/** changes.',
    },
  },
  to: {
    label: 'Links to',
    caption: 'names in skills’s files',
    links: [
      {
        path: 'skills/eval-cases/',
        name: 'eval-cases',
        kind: 'skill',
        at: 'skills.md:72',
        text: 'The eval-cases skill is the…',
      },
    ],
    graph: ['skills/eval-cases/'],
  },
  note: 'Tap an item to open its page, or a line to open the file there. A link is one toolkit file that names another.',
}

export const ruleLinks = {
  title: 'a rule open beside the list, on Links',
  frames: [{ id: 'D29', node: '493:294', viewport: 'desktop' }],
  data: {
    ...ruleHowItWorks.data,
    details: ruleHowItWorks.data.details.map((d) => (d.path === 'rules/skills.md' ? { ...d, links } : d)),
    linkTargets,
  },
  ui: { ...ruleHowItWorks.ui, itemTab: 'links' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
