// Figma Toolkit T35 "T35 · A hook’s files": the hook commit-msg open on the
// iPad mini on its Files tab, with D36's files (hookFiles). On a tablet the
// item replaces the list, under the back row to Toolkit, and keeps its header
// (the kind badge, the name and the path row). A hook is the script and its
// tests: two script rows, each role line ending with the file's length, the
// tests selected; under the tree the viewer sums up the tests, their name and
// what they run, with no switch, as the tests are a script, and no line on
// their last run. Copy word for word from references/toolkit/T35/frame.json;
// the list Back returns to is D36's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { hookFiles } from './hookFiles.ts'

// T35 494:4249, 494:4326: each role line names the length, and the viewer sums up the tests.
const browser: ToolkitFileBrowser = {
  tree: [
    {
      path: 'commit-msg',
      name: 'commit-msg',
      type: 'code',
      caption: 'The hook. Git runs it on every commit. 142 lines.',
    },
    {
      path: 'test-commit-msg',
      name: 'test-commit-msg',
      type: 'code',
      caption: 'Its tests. Run them after a change to the hook or the rule. 97 lines.',
    },
  ],
  expanded: [],
  selected: 'test-commit-msg',
  views: [
    {
      path: 'test-commit-msg',
      meta: 'bash · 97 lines · run, not read',
      blocks: [
        { type: 'title', text: 'test-commit-msg' },
        {
          type: 'paragraph',
          text: 'Runs the commit-msg hook against fixed cases and against the ✗ and ✓ headers in toolkit/rules/commits-and-prs.md, so the rule and the hook cannot drift apart.',
        },
      ],
      summary: true,
    },
  ],
}

export const hookFilesTablet = {
  title: 'a hook’s files on a tablet, its tests summed up under the tree',
  frames: [{ id: 'T35', node: '494:3987', viewport: 'tablet' }],
  data: {
    ...hookFiles.data,
    details: hookFiles.data.details.map((d) => (d.path === 'hooks/commit-msg' ? { ...d, browser } : d)),
  },
  ui: { ...hookFiles.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
