// Figma Toolkit D2 "D2 · Map": the map of the toolkit (R36), one column for
// each kind and a line where one file links to another. writer (the skill)
// is selected: its 11 lines light up, the items it does not touch go dim,
// and its card shows at the bottom right. Copy word for word from
// references/toolkit/D02/frame.json; each node's column and row and each
// link (`link · <from> → <to>`, with its end dot at `to`) come from the
// frame's layers. It starts from the T1 list (toolkitListTablet), which has
// the Rules items, so the selection card finds writer's description and
// counts there.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitKind, ToolkitMapLink, ToolkitMapNode, ToolkitUi } from '../types.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'

const paths: Record<ToolkitKind, (name: string) => string> = {
  skill: (name) => `skills/${name}/`,
  agent: (name) => `agents/${name}.md`,
  rule: (name) => `rules/${name}.md`,
  workflow: (name) => `workflows/${name}/`,
  hook: (name) => `hooks/${name}/`,
}
const skill = paths.skill
const agent = paths.agent
const rule = paths.rule
const workflow = paths.workflow
const hook = paths.hook

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

export const toolkitMap = {
  title: 'the map, with writer selected and its links lit',
  frames: [{ id: 'D2', node: '424:1166', viewport: 'desktop' }],
  data: {
    ...toolkitListTablet.data,
    map: {
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
        link(agent('diagram-reviewer'), skill('mermaid-diagrams')),
        link(agent('diagram-reviewer'), rule('diagrams')),
        link(agent('eval-case-writer'), skill('eval-cases')),
        link(agent('pr-description-checker'), skill('pr-description')),
        link(agent('pr-description-checker'), rule('commits-and-prs')),
        link(agent('readme-cold-reader'), skill('readme')),
        link(agent('writer'), skill('writer')),
        link(agent('writer'), agent('writing-reviewer')),
        link(agent('writing-reviewer'), skill('writer')),
        link(agent('writing-reviewer'), rule('writing')),
        link(agent('writing-reviewer'), rule('ste100')),
        link(hook('commit-msg'), rule('commits-and-prs')),
        link(rule('commits-and-prs'), hook('commit-msg')),
        link(rule('diagrams'), skill('mermaid-diagrams')),
        link(rule('diagrams'), agent('diagram-reviewer')),
        link(rule('readmes'), skill('readme')),
        link(rule('skills'), skill('eval-cases')),
        link(rule('ste100'), skill('writer')),
        link(rule('ste100'), agent('writing-reviewer')),
        link(rule('writing'), skill('writer')),
        link(rule('writing'), skill('audit-slop')),
        link(rule('writing'), agent('writer')),
        link(rule('writing'), agent('writing-reviewer')),
        link(rule('writing'), rule('readmes')),
        link(rule('writing'), rule('commits-and-prs')),
        link(skill('audit-slop'), rule('writing')),
        link(skill('eval-cases'), agent('eval-case-writer')),
        link(skill('eval-cases'), workflow('skill-eval-round')),
        link(skill('eval-cases'), rule('readmes')),
        link(skill('mermaid-diagrams'), agent('diagram-reviewer')),
        link(skill('mermaid-diagrams'), rule('diagrams')),
        link(skill('pr-description'), agent('pr-description-checker')),
        link(skill('pr-description'), rule('commits-and-prs')),
        link(skill('project-setup'), skill('agents-md')),
        link(skill('readme'), agent('readme-cold-reader')),
        link(skill('readme'), rule('readmes')),
        link(skill('writer'), skill('pr-description')),
        link(skill('writer'), skill('audit-slop')),
        link(skill('writer'), agent('writing-reviewer')),
        link(skill('writer'), rule('readmes')),
        link(skill('writer'), rule('writing')),
        link(skill('writer'), rule('ste100')),
        link(skill('writer'), rule('commits-and-prs')),
        link(workflow('skill-eval-cases'), skill('eval-cases')),
        link(workflow('skill-eval-cases'), agent('eval-grader')),
        link(workflow('skill-eval-cases'), agent('eval-case-writer')),
        link(workflow('skill-eval-round'), agent('eval-grader')),
      ],
    },
  },
  ui: { ...toolkitListTablet.ui, view: 'map', mapSelected: skill('writer') },
} satisfies ScreenState<ToolkitData, ToolkitUi>
