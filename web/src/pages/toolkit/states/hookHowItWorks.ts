// Figma Toolkit D39 "D39 · How a hook works": the hook commit-msg open beside
// the list, as in D9 (hookOpen), on its How it works tab: when it runs, the
// five checks it makes on each commit, what a check enforces or lets through,
// its tests and where the steps come from. Copy word for word from
// references/toolkit/D39/frame.json; the list is D9's.
// The header names the script's comments in capitals ("COMMIT-MSG", 495:1575),
// so the source is part of the label (no `file`). The fifth step starts a
// second row, under the first. The tests line (495:1701) takes the chat path's
// place, as a rule's In Codex line does in D37 (`elsewhere`).
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemDetailView, ToolkitUi } from '../types.ts'
import { hookOpen } from './hookOpen.ts'

const how: NonNullable<ToolkitItemDetailView['how']> = {
  label: 'How it works · from the comments in commit-msg',
  legend: [
    { type: 'reads', label: 'reads' },
    { type: 'runs', label: 'runs' },
    { type: 'starts', label: 'starts' },
    { type: 'repeats', label: 'repeats' },
  ],
  trigger: 'Runs on every git commit in the brain, because link.sh sets core.hooksPath to toolkit/hooks.',
  steps: [
    {
      number: '1',
      title: 'Read the message',
      description: 'Drop comment lines and all below the scissors line.',
      uses: [],
    },
    {
      number: '2',
      title: 'Skip merges',
      description: 'Messages that git writes for merges and fixups pass.',
      uses: [],
    },
    {
      number: '3',
      title: 'Check the header',
      description: 'Type, scope, a lowercase verb, 72 characters at most.',
      uses: [{ label: 'commits-and-prs', kind: 'rule' }],
    },
    {
      number: '4',
      title: 'Check the body',
      description: 'Lines wrap at 72. Footers go last.',
      uses: [],
    },
    {
      number: '5',
      title: 'Pass or block',
      description: 'Exit 0 commits. Exit 1 prints one line for each problem.',
      uses: [{ label: 'git commit', kind: 'code' }],
    },
  ],
  elsewhere: {
    label: 'Tests',
    text: 'test-commit-msg runs 43 cases through the hook. The last run passed all 43.',
  },
  note: 'Built from the comments in toolkit/hooks/commit-msg and toolkit/hooks/AGENTS.md.',
}

export const hookHowItWorks = {
  title: 'a hook open beside the list, on How it works',
  frames: [{ id: 'D39', node: '495:1111', viewport: 'desktop' }],
  data: {
    ...hookOpen.data,
    details: hookOpen.data.details.map((d) => (d.path === 'hooks/commit-msg' ? { ...d, how } : d)),
  },
  ui: { ...hookOpen.ui, itemTab: 'how' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
