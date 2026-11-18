// Figma Toolkit D38 "D38 · How an agent works": the agent writing-reviewer
// open beside the list, as in D7 (agentOpen), on its How it works tab: when it
// starts, the four steps in its prompt, what each step runs or reads, the only
// inputs it gets and where the steps come from. Copy word for word from
// references/toolkit/D38/frame.json; the list is D7's.
// The header shows the file in capitals ("WRITING-REVIEWER.MD", 495:949), so
// the file is part of the label (no `file`, which keeps its own case). The
// inputs line (495:1075) takes the chat path's place, as a rule's In Codex line
// does in D37 (`elsewhere`).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { agentOpen } from './agentOpen.ts'

const how: NonNullable<ToolkitItemDetailView['how']> = {
  label: 'How it works · from the 4 steps in writing-reviewer.md',
  legend: [
    { type: 'reads', label: 'reads' },
    { type: 'runs', label: 'runs' },
    { type: 'starts', label: 'starts' },
    { type: 'repeats', label: 'repeats' },
  ],
  trigger: 'Starts when step 7 of the writer skill runs it, or when a task asks to review a draft.',
  steps: [
    {
      number: '1',
      title: 'Run the lint',
      description: 'Each fail is a lead for W1. Read the sentence to confirm it.',
      uses: [{ label: 'writer/scripts/check', kind: 'code' }],
    },
    {
      number: '2',
      title: 'Read the form',
      description: 'The reference for the form, in the writer skill.',
      uses: [{ label: 'references/<form>.md', kind: 'file' }],
    },
    {
      number: '3',
      title: 'Check each claim',
      description: 'Find each claim in a source or in the repo.',
      uses: [{ label: 'ls, grep, git ls-files', kind: 'code' }],
    },
    {
      number: '4',
      title: 'Grade W1 to W7',
      description: 'PASS, FAIL or NA for each, returned as JSON.',
      uses: [],
    },
  ],
  elsewhere: {
    label: 'It gets only',
    text: 'the draft path, its form and the source paths. Never the author’s notes or the request.',
  },
  note: 'Built from the Steps section of toolkit/agents/writing-reviewer.md.',
}

export const agentHowItWorks = {
  title: 'an agent open beside the list, on How it works',
  frames: [{ id: 'D38', node: '495:561', viewport: 'desktop' }],
  data: {
    ...agentOpen.data,
    details: agentOpen.data.details.map((d) => (d.path === 'agents/writing-reviewer.md' ? { ...d, how } : d)),
  },
  ui: { ...agentOpen.ui, itemTab: 'how' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
