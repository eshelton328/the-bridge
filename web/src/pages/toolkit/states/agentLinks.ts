// Figma Toolkit D30 "D30 · An agent’s links": the agent writing-reviewer
// open beside the list, as in D7 (agentOpen), on its Links tab. Four items
// start it or name it (the skill writer, the agent writer and the rules
// writing and ste100), and it names three (writer, writing and ste100).
// Copy word for word from references/toolkit/D30/frame.json; the list is
// D7's, with Skills closed.
import type { ScreenState } from '../../../lib/screenState.ts'
import { linkTargets } from './shared/linkFiles.ts'
import type { ToolkitData, ToolkitLinks, ToolkitUi } from '../types.ts'
import { agentOpen } from './agentOpen.ts'

const writerSkill = { path: 'skills/writer/', name: 'writer', kind: 'skill' as const }
const writerAgent = { path: 'agents/writer.md', name: 'writer', kind: 'agent' as const }
const writing = { path: 'rules/writing.md', name: 'writing', kind: 'rule' as const }
const ste100 = { path: 'rules/ste100.md', name: 'ste100', kind: 'rule' as const }

const links: ToolkitLinks = {
  intro:
    'Only writing-reviewer’s own links, with the line in the file that makes each one. Show on map shows the same links inside the whole toolkit map.',
  label: 'Links',
  hint: 'Tap an item to open it',
  from: {
    label: 'Linked from',
    caption: 'files that name writing-reviewer',
    links: [
      { ...writerSkill, at: 'skills/writer/SKILL.md:107', text: '…Run the writing-reviewer agent' },
      { ...writerAgent, at: 'agents/writer.md:35', text: 'runs writing-reviewer on your draft.' },
      {
        ...writing,
        at: 'rules/writing.md:83',
        text: 'scripts/check lints these patterns, the writing-reviewer agent grades…',
      },
      {
        ...ste100,
        at: 'rules/ste100.md:70',
        text: 'The writing-reviewer agent grades the rules that a script cannot check',
      },
    ],
    graph: [writerSkill.path, writerAgent.path, writing.path, ste100.path],
  },
  to: {
    label: 'Links to',
    caption: 'names in writing-reviewer’s files',
    links: [
      { ...writerSkill, at: 'writing-reviewer.md:30', text: 'Run the lint. The script is in the writer skill' },
      {
        ...writing,
        at: 'writing-reviewer.md:58',
        text: 'No instance of the ten patterns in toolkit/rules/writing.md',
      },
      { ...ste100, at: 'writing-reviewer.md:102', text: 'toolkit/rules/ste100.md and run the lint with --ste' },
    ],
    graph: [writerSkill.path, writing.path, ste100.path],
  },
  note: 'Tap an item to open its page, or a line to open the file there. A link is one toolkit file that names another.',
}

export const agentLinks = {
  title: 'an agent open beside the list, on Links',
  frames: [{ id: 'D30', node: '493:916', viewport: 'desktop' }],
  data: {
    ...agentOpen.data,
    details: agentOpen.data.details.map((d) => (d.path === 'agents/writing-reviewer.md' ? { ...d, links } : d)),
    linkTargets,
  },
  ui: { ...agentOpen.ui, itemTab: 'links' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
