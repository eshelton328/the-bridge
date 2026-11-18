// Figma Toolkit D37 "D37 · How a rule works": the rule skills open beside the
// list, as in D4 (ruleOpen), on its How it works tab: when the rule loads,
// the four steps from link.sh and its paths frontmatter to the agent that
// follows it, what each step runs, reads or loads, and what Codex does
// instead. Copy word for word from references/toolkit/D37/frame.json.
// The list beside it has D4's data. The frame draws only the Rules, Workflows
// and Hooks groups, as D9 does, so the Skills and Agents groups are left out;
// the chips keep every kind's count.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { ruleOpen } from './ruleOpen.ts'

const how: NonNullable<ToolkitItemDetailView['how']> = {
  label: 'How it works · from the paths frontmatter and link.sh',
  legend: [
    { type: 'reads', label: 'reads' },
    { type: 'runs', label: 'runs' },
    { type: 'starts', label: 'starts' },
    { type: 'repeats', label: 'repeats' },
  ],
  trigger: 'Loads when a file under toolkit/skills/** or skills/** changes.',
  steps: [
    {
      number: '1',
      title: 'link.sh links it',
      description: 'The rule has paths, so link.sh links it into .claude/rules/.',
      uses: [{ label: 'link.sh', kind: 'code' }],
    },
    {
      number: '2',
      title: 'A skill file changes',
      description: 'An agent reads or edits a file under skills/.',
      uses: [],
    },
    {
      number: '3',
      title: 'The rule loads',
      description: 'Claude Code matches the paths and loads the whole rule.',
      uses: [{ label: 'paths:', kind: 'file' }],
    },
    {
      number: '4',
      title: 'The agent follows it',
      description: 'Layout, description, evals and baselines apply to the skill.',
      uses: [{ label: 'eval-cases', kind: 'skill' }],
    },
  ],
  elsewhere: {
    label: 'In Codex',
    text: 'Codex has no scoped rules, so skills/AGENTS.md tells the agent to read this rule.',
  },
  note: 'Built from the frontmatter of toolkit/rules/skills.md and the scoped rules part of toolkit/link.sh.',
}

export const ruleHowItWorks = {
  title: 'a rule open beside the list, on How it works',
  frames: [{ id: 'D37', node: '495:2', viewport: 'desktop' }],
  data: {
    ...ruleOpen.data,
    groups: ruleOpen.data.groups.filter((g) => g.kind === 'rule' || g.kind === 'workflow' || g.kind === 'hook'),
    details: ruleOpen.data.details.map((d) => (d.path === 'rules/skills.md' ? { ...d, how } : d)),
  },
  ui: { ...ruleOpen.ui, itemTab: 'how' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
