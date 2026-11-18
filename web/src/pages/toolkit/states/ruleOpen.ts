// Figma Toolkit D4 "D4 · A rule open": the rule skills opens beside the
// list, on its Overview tab: its kind, name and path badge (a file, so the
// file icon), when it changed, its tabs, its description, when it loads (from
// its paths frontmatter), and rules/skills.md rendered read-only. Nothing
// links to it (←0), and the side column beside the file is empty. Copy word
// for word from references/toolkit/D04/frame.json.
// The list beside it has T1's data (toolkitListTablet) and adds the Workflows
// and Hooks groups, which this frame shows; their paths are the list's text
// (427:576, 427:602). Figma draws the list scrolled to the Rules group under
// a pinned header, chips and search; the pane starts at the Skills group
// until the library's ScrollFrame (beta.15, d-107).
import { ruleResults } from './shared/evalResults.ts'
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitGroupView, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'

const workflows: ToolkitGroupView = {
  kind: 'workflow',
  label: 'Workflows',
  items: [
    {
      kind: 'workflow',
      name: 'skill-eval-cases',
      path: 'workflows/skill-eval-cases.md',
      description: 'Builds a skill’s eval cases and ends at the pre-registration',
      linksTo: 3,
      linkedFrom: 1,
      files: 1,
    },
    {
      kind: 'workflow',
      name: 'skill-eval-round',
      path: 'workflows/skill-eval-round.md',
      description: 'Runs, grades and decides one eval round of a skill',
      linksTo: 2,
      linkedFrom: 2,
      files: 1,
    },
  ],
}

const hooks: ToolkitGroupView = {
  kind: 'hook',
  label: 'Hooks',
  items: [
    {
      kind: 'hook',
      name: 'commit-msg',
      path: 'hooks/commit-msg',
      description: 'Blocks a commit whose message does not follow the commit rules',
      linksTo: 1,
      linkedFrom: 1,
      files: 1,
    },
  ],
}

const skills: ToolkitItemDetailView = {
  path: 'rules/skills.md',
  location: 'toolkit/rules/skills.md',
  changed: 'changed 6 days ago',
  description:
    'How every skill in the toolkit is built. A skill is a procedure an agent loads only when a task needs it, so it can carry depth that a context file cannot afford.',
  loads: { label: 'Loads when', when: 'a file under toolkit/skills/** or skills/** changes' },
  // The Evals tab (D20, D25 to D28).
  results: ruleResults,
  tabs: [
    { value: 'overview', label: 'Overview' },
    { value: 'how', label: 'How it works' },
    { value: 'files', label: 'Files' },
    { value: 'links', label: 'Links' },
    { value: 'evals', label: 'Evals' },
    { value: 'activity', label: 'Activity' },
  ],
  preview: {
    file: 'rules/skills.md',
    blocks: [
      { type: 'title', text: 'Skills' },
      {
        type: 'paragraph',
        text: 'The bar below exists because a skill runs thousands of times on prompts nobody tested; what is not checked will drift.',
      },
      { type: 'heading', text: 'Layout' },
      { type: 'pre', text: '<skill>/\n├── SKILL.md\n├── references/\n├── scripts/\n├── assets/\n└── evals/' },
      { type: 'paragraph', text: 'Only SKILL.md is required, but a skill is not done until it has evals.' },
    ],
  },
}

export const ruleOpen = {
  title: 'a rule open beside the list',
  frames: [{ id: 'D4', node: '424:2558', viewport: 'desktop' }],
  data: {
    ...toolkitListTablet.data,
    groups: [...toolkitListTablet.data.groups, workflows, hooks],
    details: [skills],
  },
  ui: { ...toolkitListTablet.ui, open: 'rules/skills.md' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
