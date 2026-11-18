// Figma Toolkit D14 "D14 · How a skill works": the skill writer open beside
// the list, as in D3 (skillOpen), on its How it works tab: the steps from its
// SKILL.md, what each step reads, runs or starts, the steps that repeat, when
// the skill loads and the shorter path a chat answer takes. Copy word for word
// from references/toolkit/D14/frame.json; the list is D3's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { skillOpen } from './skillOpen.ts'

const how: NonNullable<ToolkitItemDetailView['how']> = {
  label: 'How it works · from the 8 steps in',
  file: 'SKILL.md',
  legend: [
    { type: 'reads', label: 'reads' },
    { type: 'runs', label: 'runs' },
    { type: 'starts', label: 'starts' },
    { type: 'repeats', label: 'repeats' },
  ],
  trigger: 'Loads when a task writes a doc, ticket, PRD, artifact text or chat answer that another person reads',
  steps: [
    {
      number: '1',
      title: 'Name the reader',
      description: 'One line: who reads it and what they do next. Ask if you cannot write it.',
      uses: [],
    },
    {
      number: '2',
      title: 'Read the reference',
      description: 'Follow the shape of the form.',
      uses: [
        { label: 'references/<form>.md', kind: 'file' },
        { label: 'ste100', kind: 'rule' },
      ],
    },
    {
      number: '3',
      title: 'List the claims',
      description: 'Each claim gets a source read in this session: a file and line, or a command and its output.',
      uses: [],
    },
    {
      number: '4',
      title: 'Draft the point first',
      description: 'The first sentence gives the reader what step 1 says they need.',
      uses: [],
    },
    {
      number: '5',
      title: 'Cut to the reader',
      description: 'Delete each paragraph the reader would not act on.',
      uses: [],
    },
    {
      number: '6',
      title: 'Run the lint',
      description: 'Fix every fail. An edit after the lint means a new run.',
      uses: [{ label: 'scripts/check', kind: 'code' }],
      repeats: 'until no fail',
    },
    {
      number: '7',
      title: 'Have it reviewed',
      description: 'Give the agent only the draft, the form and the source paths.',
      uses: [{ label: 'writing-reviewer', kind: 'agent' }],
      repeats: 'until pass',
    },
    {
      number: '8',
      title: 'Run the prose audit',
      description: 'For text that is committed or published.',
      uses: [
        { label: 'omni audit', kind: 'code' },
        { label: 'audit-slop', kind: 'skill' },
      ],
    },
  ],
  shortPath: {
    title: 'A chat answer takes a shorter path',
    description:
      'A chat answer uses 5 of the 8 steps, then goes straight to the chat. It skips step 2 (Read the reference), step 7 (Have it reviewed) and step 8 (Run the prose audit).',
    steps: [
      { number: '1', label: 'Name the reader' },
      { number: '3', label: 'List the claims' },
      { number: '4', label: 'Draft the point first' },
      { number: '5', label: 'Cut to the reader' },
      { number: '6', label: 'Run the lint', note: '--form chat --ste' },
      { number: '→', label: 'Send the text', note: 'unchanged' },
    ],
  },
  note: 'Built from the Steps section of skills/writer/SKILL.md and the files each step names. Built again when the file changes (proposal).',
}

export const skillHowItWorks = {
  title: 'a skill open beside the list, on How it works',
  frames: [{ id: 'D14', node: '459:2', viewport: 'desktop' }],
  data: {
    ...skillOpen.data,
    details: skillOpen.data.details.map((d) => (d.path === 'skills/writer/' ? { ...d, how } : d)),
  },
  ui: { ...skillOpen.ui, itemTab: 'how' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
