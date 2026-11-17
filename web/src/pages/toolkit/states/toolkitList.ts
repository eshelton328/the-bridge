// Figma Toolkit D1 "D1 · Toolkit": the list of every item in toolkit/, as
// cards in a group per kind, with All selected and no search. Copy word for
// word from references/toolkit/D01/frame.json. The frame shows the Skills
// and Agents groups; the Rules, Workflows and Hooks items lie below it, and
// only their chip counts are in the frame, so their groups wait for the
// frame that shows them.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitItemView, ToolkitUi } from '../types.ts'

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
  },
  ui: { view: 'list', filter: 'all', query: '', groupsOpen: {} },
} satisfies ScreenState<ToolkitData, ToolkitUi>
