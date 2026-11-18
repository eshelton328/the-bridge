// Figma Toolkit D33 "D33 · A rule’s files": the rule skills open beside the
// list, as in D4 (ruleOpen), on its Files tab. A rule is one file, so the tree
// has one row, skills.md with what it is, selected; the viewer shows its first
// lines as written, the paths frontmatter first, and the line on when it
// loads. Copy word for word from references/toolkit/D33/frame.json.
// The list beside it has D4's data. The frame draws only the Rules, Workflows
// and Hooks groups, as D37 does, so the Skills and Agents groups are left out;
// the chips keep every kind's count.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { ruleOpen } from './ruleOpen.ts'

/** The item's Files tab, which its Links states share (shared/linkFiles.ts). */
export const ruleFilesBrowser: ToolkitFileBrowser = {
  tree: [
    {
      path: 'skills.md',
      name: 'skills.md',
      count: 104,
      caption: 'The rule. Claude Code loads it by the paths in its frontmatter.',
    },
  ],
  expanded: [],
  selected: 'skills.md',
  views: [
    {
      path: 'skills.md',
      meta: 'Markdown · 104 lines · the rule',
      blocks: [],
      code: [
        [{ text: '---', kind: 'comment' }],
        [{ text: 'paths:' }],
        [{ text: '  - "toolkit/skills/**"' }],
        [{ text: '  - "skills/**"' }],
        [{ text: '---' }],
        [],
        [{ text: '# Skills' }],
        [],
        [{ text: 'How every skill in the toolkit is built. A skill is a procedure an agent' }],
        [{ text: 'loads only when a task needs it, so it can carry depth that a context file' }],
        [{ text: 'cannot afford. The bar below exists because a skill runs thousands of times' }],
        [{ text: 'on prompts nobody tested; what is not checked will drift.' }],
        [],
        [{ text: '## Layout' }],
      ],
      usedBy: { kind: 'skill', text: 'Loads when a file under toolkit/skills/** or skills/** changes.' },
    },
  ],
}

export const ruleFiles = {
  title: 'a rule open beside the list, on Files',
  frames: [{ id: 'D33', node: '494:2', viewport: 'desktop' }],
  data: {
    ...ruleOpen.data,
    groups: ruleOpen.data.groups.filter((g) => g.kind === 'rule' || g.kind === 'workflow' || g.kind === 'hook'),
    details: ruleOpen.data.details.map((d) => (d.path === 'rules/skills.md' ? { ...d, browser: ruleFilesBrowser } : d)),
  },
  ui: { ...ruleOpen.ui, itemTab: 'files' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
