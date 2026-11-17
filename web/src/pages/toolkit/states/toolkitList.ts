// Figma Toolkit D1 "D1 · Toolkit": the list of every item in toolkit/, as
// cards in a group per kind, with All selected and no search. Copy word for
// word from references/toolkit/D01/frame.json. The frame shows the Skills
// and Agents groups; the Rules, Workflows and Hooks items lie below it, and
// only their chip counts are in the frame, so their groups wait for the
// frame that shows them.
import type { ScreenState } from '../../../lib/screenState.ts'
import type {
  ToolkitData,
  ToolkitItemView,
  ToolkitKind,
  ToolkitMapLink,
  ToolkitMapNode,
  ToolkitMapView,
  ToolkitUi,
} from '../types.ts'

const skill = (
  name: string,
  description: string,
  linksTo: number,
  linkedFrom: number,
  files: number,
): ToolkitItemView => ({ kind: 'skill', name, path: `skills/${name}/`, description, linksTo, linkedFrom, files })

const agent = (name: string, description: string, linksTo: number, linkedFrom: number): ToolkitItemView => ({
  kind: 'agent',
  name,
  path: `agents/${name}.md`,
  description,
  linksTo,
  linkedFrom,
  files: 1,
})

// The map of the toolkit (Figma D2 424:1166), which the Map view shows from
// every state: one column for each kind and a line where one file links to
// another. Copy word for word from references/toolkit/D02/frame.json; each
// node's column and row and each link (`link · <from> → <to>`) come from
// that frame's layers.
const paths: Record<ToolkitKind, (name: string) => string> = {
  skill: (name) => `skills/${name}/`,
  agent: (name) => `agents/${name}.md`,
  rule: (name) => `rules/${name}.md`,
  workflow: (name) => `workflows/${name}/`,
  hook: (name) => `hooks/${name}/`,
}
const skillPath = paths.skill
const agentPath = paths.agent
const rulePath = paths.rule
const workflowPath = paths.workflow
const hookPath = paths.hook

const node = (kind: ToolkitKind, column: number) => (name: string, row: number, meta?: string) => {
  const placed: ToolkitMapNode = { path: paths[kind](name), name, kind, column, row }
  return meta === undefined ? placed : { ...placed, meta }
}
const ruleNode = node('rule', 0)
const hookNode = node('hook', 0)
const skillNode = node('skill', 1)
const agentNode = node('agent', 2)
const workflowNode = node('workflow', 3)

const link = (from: string, to: string): ToolkitMapLink => ({ from, to })

const map: ToolkitMapView = {
  columns: ['Rules and hooks', 'Skills', 'Agents', 'Workflows'],
  nodes: [
    ruleNode('writing', 0, 'every session'),
    ruleNode('ste100', 1),
    ruleNode('readmes', 2),
    ruleNode('commits-and-prs', 3),
    ruleNode('diagrams', 4),
    ruleNode('skills', 5),
    ruleNode('linear', 6),
    ruleNode('releases', 7),
    // 426:507: the hook sits one row under the rules, after a free row.
    hookNode('commit-msg', 9),
    skillNode('writer', 0),
    skillNode('audit-slop', 1),
    skillNode('pr-description', 2),
    skillNode('readme', 3),
    skillNode('mermaid-diagrams', 4),
    skillNode('eval-cases', 5),
    skillNode('project-setup', 6),
    skillNode('agents-md', 7),
    skillNode('ambitious', 8),
    agentNode('writing-reviewer', 0),
    agentNode('writer', 1),
    agentNode('pr-description-checker', 2),
    agentNode('readme-cold-reader', 3),
    agentNode('diagram-reviewer', 4),
    agentNode('eval-case-writer', 5),
    agentNode('eval-grader', 6),
    workflowNode('skill-eval-cases', 0),
    workflowNode('skill-eval-round', 1),
  ],
  links: [
    link(agentPath('diagram-reviewer'), skillPath('mermaid-diagrams')),
    link(agentPath('diagram-reviewer'), rulePath('diagrams')),
    link(agentPath('eval-case-writer'), skillPath('eval-cases')),
    link(agentPath('pr-description-checker'), skillPath('pr-description')),
    link(agentPath('pr-description-checker'), rulePath('commits-and-prs')),
    link(agentPath('readme-cold-reader'), skillPath('readme')),
    link(agentPath('writer'), skillPath('writer')),
    link(agentPath('writer'), agentPath('writing-reviewer')),
    link(agentPath('writing-reviewer'), skillPath('writer')),
    link(agentPath('writing-reviewer'), rulePath('writing')),
    link(agentPath('writing-reviewer'), rulePath('ste100')),
    link(hookPath('commit-msg'), rulePath('commits-and-prs')),
    link(rulePath('commits-and-prs'), hookPath('commit-msg')),
    link(rulePath('diagrams'), skillPath('mermaid-diagrams')),
    link(rulePath('diagrams'), agentPath('diagram-reviewer')),
    link(rulePath('readmes'), skillPath('readme')),
    link(rulePath('skills'), skillPath('eval-cases')),
    link(rulePath('ste100'), skillPath('writer')),
    link(rulePath('ste100'), agentPath('writing-reviewer')),
    link(rulePath('writing'), skillPath('writer')),
    link(rulePath('writing'), skillPath('audit-slop')),
    link(rulePath('writing'), agentPath('writer')),
    link(rulePath('writing'), agentPath('writing-reviewer')),
    link(rulePath('writing'), rulePath('readmes')),
    link(rulePath('writing'), rulePath('commits-and-prs')),
    link(skillPath('audit-slop'), rulePath('writing')),
    link(skillPath('eval-cases'), agentPath('eval-case-writer')),
    link(skillPath('eval-cases'), workflowPath('skill-eval-round')),
    link(skillPath('eval-cases'), rulePath('readmes')),
    link(skillPath('mermaid-diagrams'), agentPath('diagram-reviewer')),
    link(skillPath('mermaid-diagrams'), rulePath('diagrams')),
    link(skillPath('pr-description'), agentPath('pr-description-checker')),
    link(skillPath('pr-description'), rulePath('commits-and-prs')),
    link(skillPath('project-setup'), skillPath('agents-md')),
    link(skillPath('readme'), agentPath('readme-cold-reader')),
    link(skillPath('readme'), rulePath('readmes')),
    link(skillPath('writer'), skillPath('pr-description')),
    link(skillPath('writer'), skillPath('audit-slop')),
    link(skillPath('writer'), agentPath('writing-reviewer')),
    link(skillPath('writer'), rulePath('readmes')),
    link(skillPath('writer'), rulePath('writing')),
    link(skillPath('writer'), rulePath('ste100')),
    link(skillPath('writer'), rulePath('commits-and-prs')),
    link(workflowPath('skill-eval-cases'), skillPath('eval-cases')),
    link(workflowPath('skill-eval-cases'), agentPath('eval-grader')),
    link(workflowPath('skill-eval-cases'), agentPath('eval-case-writer')),
    link(workflowPath('skill-eval-round'), agentPath('eval-grader')),
  ],
}

export const toolkitList = {
  title: 'the list of every toolkit item',
  frames: [{ id: 'D1', node: '424:6', viewport: 'desktop' }],
  data: {
    count: 27,
    railBadge: 4,
    chips: [
      { value: 'all', label: 'All', count: 27 },
      { value: 'skill', label: 'Skills', count: 9 },
      { value: 'agent', label: 'Agents', count: 7 },
      { value: 'rule', label: 'Rules', count: 8 },
      { value: 'workflow', label: 'Workflows', count: 2 },
      { value: 'hook', label: 'Hooks', count: 1 },
    ],
    groups: [
      {
        kind: 'skill',
        label: 'Skills',
        items: [
          skill('agents-md', 'Writes and audits the AGENTS.md context file in each folder', 0, 1, 5),
          skill('ambitious', 'Rewrites a task into a more ambitious prompt before work starts', 0, 0, 1),
          skill('audit-slop', 'Grades prose for AI-writing tells with Jev, then rewrites it', 1, 2, 2),
          skill('eval-cases', 'Writes eval cases, fixtures and trigger sets for a skill', 3, 3, 2),
          skill('mermaid-diagrams', 'Creates, repairs and renders Mermaid diagrams, then gets a review', 2, 2, 7),
          skill('pr-description', 'Writes a PR title and description from the final diff', 2, 2, 3),
          skill('project-setup', 'Creates or extends a project starter in the brain', 1, 0, 17),
          skill('readme', 'Writes and checks READMEs, then runs the quick start in a sandbox', 2, 2, 9),
          skill('writer', 'Sources every claim, fits the form, then lints and reviews a draft', 7, 4, 11),
        ],
      },
      {
        kind: 'agent',
        label: 'Agents',
        items: [
          agent('diagram-reviewer', 'Reviews a Mermaid diagram against the diagram rubric', 2, 2),
          agent('eval-case-writer', 'Writes held-out eval cases from a skill name and description', 1, 2),
          agent('eval-grader', 'Grades eval runs blind, with quoted evidence for each verdict', 0, 2),
          agent('pr-description-checker', 'Grades a PR title and description against the final diff', 2, 1),
          agent('readme-cold-reader', 'Reads a README as a stranger and runs its quick start', 1, 1),
          agent('writer', 'Drafts one doc, ticket or PRD in its own context', 2, 2),
          agent('writing-reviewer', 'Grades a draft against the writing rules and its sources', 4, 4),
        ],
      },
    ],
    map,
  },
  ui: { view: 'list', filter: 'all', query: '', groupsOpen: {} },
} satisfies ScreenState<ToolkitData, ToolkitUi>
