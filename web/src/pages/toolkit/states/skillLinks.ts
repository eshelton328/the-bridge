// Figma Toolkit D19 "D19 · A skill’s links": the skill writer open beside the
// list, as in D3 (skillOpen), on its Links tab: what names writer and what
// writer names, each with its file and line, drawn as a graph and listed in
// two panels. Copy word for word from references/toolkit/D19/frame.json; the
// list is D3's. The graph's columns keep Figma's order (493:84 to 493:142).
import type { ScreenState } from '../../../lib/screenState.ts'
import { linkTargets } from './shared/linkFiles.ts'
import type { ToolkitData, ToolkitLinks, ToolkitUi } from '../types.ts'
import { skillOpen } from './skillOpen.ts'

const rule = (name: string) => ({ path: `rules/${name}.md`, name, kind: 'rule' as const })
const agent = (name: string) => ({ path: `agents/${name}.md`, name, kind: 'agent' as const })
const skill = (name: string) => ({ path: `skills/${name}/`, name, kind: 'skill' as const })

const links: ToolkitLinks = {
  intro:
    'Only writer’s own links, with the line in the file that makes each one. Show on map shows the same links inside the whole toolkit map.',
  label: 'Links',
  hint: 'Tap an item to open it',
  from: {
    label: 'Linked from',
    caption: 'files that name writer',
    links: [
      {
        ...rule('writing'),
        at: 'rules/writing.md:77',
        text: 'Load the writer skill before drafting a doc, ticket…',
      },
      { ...rule('ste100'), at: 'rules/ste100.md:21', text: 'toolkit/skills/writer/scripts/ste-dict …' },
      { ...agent('writer'), at: 'agents/writer.md:11', text: 'Follow the writer skill’s steps.' },
      {
        ...agent('writing-reviewer'),
        at: 'agents/writing-reviewer.md:30',
        text: 'Run the lint. The script is in the writer skill',
      },
    ],
    graph: ['agents/writer.md', 'agents/writing-reviewer.md', 'rules/ste100.md', 'rules/writing.md'],
  },
  to: {
    label: 'Links to',
    caption: 'names in writer’s files',
    links: [
      {
        ...rule('writing'),
        at: 'SKILL.md:8',
        text: 'The writing rules in toolkit/rules/writing.md are loaded in every…',
      },
      { ...rule('readmes'), at: 'SKILL.md:31', text: 'a README: toolkit/rules/readmes.md' },
      { ...rule('commits-and-prs'), at: 'SKILL.md:32', text: 'a commit or PR: toolkit/rules/commits-and-prs.md' },
      { ...skill('pr-description'), at: 'SKILL.md:32', text: '…and the pr-description skill.' },
      { ...rule('ste100'), at: 'SKILL.md:36', text: 'read toolkit/rules/ste100.md and pass --ste to the lint' },
      { ...agent('writing-reviewer'), at: 'SKILL.md:107', text: 'Run the writing-reviewer agent (step 7)' },
      { ...skill('audit-slop'), at: 'SKILL.md:118', text: 'then the audit-slop skill’s deslop steps (step 8)' },
    ],
    graph: [
      'skills/pr-description/',
      'skills/audit-slop/',
      'agents/writing-reviewer.md',
      'rules/readmes.md',
      'rules/writing.md',
      'rules/ste100.md',
      'rules/commits-and-prs.md',
    ],
  },
  note: 'Tap an item to open its page, or a line to open the file there. A link is one toolkit file that names another.',
}

export const skillLinks = {
  title: 'a skill open beside the list, on Links',
  frames: [{ id: 'D19', node: '482:2', viewport: 'desktop' }],
  data: {
    ...skillOpen.data,
    details: skillOpen.data.details.map((d) => (d.path === 'skills/writer/' ? { ...d, links } : d)),
    linkTargets,
  },
  ui: { ...skillOpen.ui, itemTab: 'links' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
