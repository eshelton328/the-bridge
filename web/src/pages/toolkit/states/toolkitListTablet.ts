// Figma Toolkit T1 "T1 · Toolkit": the list on the iPad mini, in two
// columns of rows, with All selected and no search; Toolkit opens from More.
// Copy word for word from references/toolkit/T01/frame.json. It starts from
// the D1 list (toolkitList) and differs from it in two places: the frame
// shows the Rules group, and writing-reviewer links to 3 files, not 4. The
// Workflows and Hooks items lie below the frame, and only their chip counts
// are in it, so their groups wait for the frame that shows them.
// Figma Toolkit M1 "M1 · Toolkit" shows the same data on the phone, as one
// column of rows (references/toolkit/M01/frame.json): writing-reviewer
// links to 3 files there too, and the Rules group lies below the frame.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitGroupView, ToolkitItemView, ToolkitUi } from '../types.ts'
import { toolkitList } from './toolkitList.ts'

const rule = (name: string, description: string, linksTo: number, linkedFrom: number): ToolkitItemView => ({
  kind: 'rule',
  name,
  path: `rules/${name}.md`,
  description,
  linksTo,
  linkedFrom,
  files: 1,
})

const rules: ToolkitGroupView = {
  kind: 'rule',
  label: 'Rules',
  items: [
    rule('commits-and-prs', 'Conventional Commits headers and the PR title and description', 1, 5),
    rule('diagrams', 'Mermaid for mechanisms, a chart tool for numbers', 2, 2),
    rule('linear', 'Where work goes in Linear and what each state means', 0, 0),
    rule('readmes', 'What a root README and a folder README say', 1, 4),
    rule('releases', 'SemVer, Conventional Commits and semantic-release', 0, 0),
    rule('skills', 'How a skill is laid out, named and tested', 1, 0),
    rule('ste100', 'Simplified Technical English for replies, tickets and how-to docs', 2, 2),
    rule('writing', 'Twelve patterns to cut from every piece of prose', 6, 3),
  ],
}

// T1 428:215: writing-reviewer links to 3 toolkit files (D1 shows 4).
const groups = toolkitList.data.groups.map((group) => ({
  ...group,
  items: group.items.map((item) => (item.path === 'agents/writing-reviewer.md' ? { ...item, linksTo: 3 } : item)),
}))

export const toolkitListTablet = {
  title: 'the list of every toolkit item, in two columns',
  frames: [
    { id: 'T1', node: '424:3567', viewport: 'tablet' },
    { id: 'M1', node: '424:4580', viewport: 'phone' },
  ],
  data: { ...toolkitList.data, groups: [...groups, rules] },
  ui: { ...toolkitList.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
