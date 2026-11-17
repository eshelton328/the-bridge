// Figma Toolkit D7 "D7 · An agent open": the agent writing-reviewer opens
// beside the list, on its Overview tab: its kind, name and path badge (a
// file), when it changed, its tabs, its description, how it runs (from its
// frontmatter: the Claude model, the Codex settings, its tools and its own
// context, four cards of one size), its prompt file rendered read-only, the
// workflows that run it (none) and its one file. Copy word for word from
// references/toolkit/D07/frame.json.
// The list beside it has T1's data (toolkitListTablet: writing-reviewer links
// to 3 files, 433:352) with the Skills group closed (433:192). The frame
// draws only the Skills and Agents groups, as D1 does, so the Rules group of
// T1 is left out.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'

const writingReviewer: ToolkitItemDetailView = {
  path: 'agents/writing-reviewer.md',
  location: 'toolkit/agents/writing-reviewer.md',
  changed: 'changed 6 days ago',
  description:
    'Grades a draft doc, ticket, PRD, artifact text or chat answer against the writing rules, checks every factual claim against the source files it is given, and quotes the sentence behind each failure.',
  runs: {
    label: 'How it runs',
    facts: [
      { icon: 'model', label: 'Claude', value: 'opus', caption: 'model' },
      { icon: 'model', label: 'Codex', value: 'effort high', caption: 'codex_effort; default model' },
      { icon: 'tools', label: 'Tools', value: 'Bash, Read, Grep, Glob', caption: 'no Write or Edit' },
      { icon: 'context', label: 'Context', value: 'Its own', caption: 'gets only what the task hands it' },
    ],
  },
  tabs: [
    { value: 'overview', label: 'Overview' },
    { value: 'how', label: 'How it works' },
    { value: 'files', label: 'Files' },
    { value: 'links', label: 'Links' },
    { value: 'evals', label: 'Evals' },
    { value: 'activity', label: 'Activity' },
  ],
  preview: {
    file: 'writing-reviewer.md',
    meta: '137 lines · the prompt',
    blocks: [
      { type: 'title', text: 'Prompt' },
      {
        type: 'paragraph',
        text: 'You review one draft for a reader who has none of its author’s context. You see what that reader will see: the draft, and the sources a careful reader could open to check it.',
      },
      { type: 'heading', text: 'Inputs' },
      {
        type: 'paragraph',
        text: 'A path to the draft; its form: doc, ticket, prd, artifact, chat or note; zero or more source paths the claims came from.',
      },
    ],
  },
  usedIn: { label: 'Used in workflows', items: [] },
  files: { count: 1, lines: [{ type: 'file', names: ['writing-reviewer.md'], meta: '137 lines' }] },
}

export const agentOpen = {
  title: 'an agent open beside the list',
  frames: [{ id: 'D7', node: '433:6', viewport: 'desktop' }],
  data: {
    ...toolkitListTablet.data,
    groups: toolkitListTablet.data.groups.filter((group) => group.kind === 'skill' || group.kind === 'agent'),
    details: [writingReviewer],
  },
  ui: { ...toolkitListTablet.ui, groupsOpen: { skill: false }, open: 'agents/writing-reviewer.md' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
