// Figma Toolkit D3 "D3 · A skill open": the skill writer opens beside the
// list, on its Overview tab: its kind, name and path badge, when it changed,
// its tabs, its description, its SKILL.md rendered read-only, the workflows
// that use it (none), its files and the link to its evals. Copy word for word
// from references/toolkit/D03/frame.json. The list beside it has T1's data
// (toolkitListTablet): writing-reviewer links to 3 files there, as in this
// frame (427:249), and the Rules group lies below the frame.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'

const writer: ToolkitItemDetailView = {
  path: 'skills/writer/',
  location: 'toolkit/skills/writer/',
  changed: 'changed 6 days ago',
  description:
    'Use before writing, rewriting or editing any doc, ticket, issue, PRD, spec, report, explainer, note, the text of an artifact or HTML page, or a chat answer that explains from records or logs why something happened.',
  tabs: [
    { value: 'overview', label: 'Overview' },
    { value: 'how', label: 'How it works' },
    { value: 'files', label: 'Files' },
    { value: 'links', label: 'Links' },
    { value: 'evals', label: 'Evals' },
    { value: 'activity', label: 'Activity' },
  ],
  preview: {
    file: 'SKILL.md',
    blocks: [
      { type: 'title', text: 'writer' },
      {
        type: 'paragraph',
        text: 'The writing rules in toolkit/rules/writing.md are loaded in every session, and with them both Haiku and Opus already avoid most stock phrases. The failures that remain are not phrases.',
      },
      { type: 'heading', text: 'Steps' },
      { type: 'paragraph', text: '1. Name the reader and what they do next.' },
      {
        type: 'paragraph',
        text: '2. Read the form’s reference and follow its shape: doc, ticket, PRD, artifact or chat.',
      },
      { type: 'code', items: ['references/doc.md', 'references/ticket.md', 'references/prd.md'] },
    ],
  },
  usedIn: { label: 'Used in workflows', items: [] },
  files: {
    count: 11,
    lines: [
      { type: 'file', names: ['SKILL.md'] },
      { type: 'folder', names: ['references/'], count: 6 },
      { type: 'file', names: ['artifact.md', 'chat.md', 'doc.md'] },
      { type: 'file', names: ['examples.md', 'prd.md', 'ticket.md'] },
      { type: 'folder', names: ['scripts/'], count: 4 },
      { type: 'file', names: ['check', 'ste-dict', 'ste-stop-hook', 'test-check'] },
    ],
  },
  evals: { title: 'Skill evals', caption: '5 cases · open the Evals tab', tab: 'evals' },
}

export const skillOpen = {
  title: 'a skill open beside the list',
  frames: [{ id: 'D3', node: '424:618', viewport: 'desktop' }],
  data: { ...toolkitListTablet.data, details: [writer] },
  ui: { ...toolkitListTablet.ui, open: 'skills/writer/' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
