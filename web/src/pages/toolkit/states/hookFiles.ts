// Figma Toolkit D36 "D36 · A hook’s files": the hook commit-msg open beside
// the list, as in D9 (hookOpen), on its Files tab. A hook is the script and
// its tests, so the tree has two script rows, each with what it is, and the
// tests selected; the viewer shows the tests' first lines as code and the
// line on their last run. Copy word for word from
// references/toolkit/D36/frame.json. The list beside it is D9's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { hookOpen } from './hookOpen.ts'

/** The item's Files tab, which its Links states share (shared/linkFiles.ts). */
export const hookFilesBrowser: ToolkitFileBrowser = {
  tree: [
    {
      path: 'commit-msg',
      name: 'commit-msg',
      type: 'code',
      count: 142,
      caption: 'The hook. Git runs it on every commit.',
    },
    {
      path: 'test-commit-msg',
      name: 'test-commit-msg',
      type: 'code',
      count: 97,
      caption: 'Its tests. Run them after a change to the hook or the rule.',
    },
  ],
  expanded: [],
  selected: 'test-commit-msg',
  views: [
    {
      path: 'test-commit-msg',
      meta: 'bash · 97 lines · run, not read',
      blocks: [],
      code: [
        [{ text: '#!/usr/bin/env bash', kind: 'comment' }],
        [{ text: '# test-commit-msg: runs the commit-msg hook against fixed cases and against' }],
        [{ text: '# the ✗ and ✓ headers in toolkit/rules/commits-and-prs.md, so the rule and' }],
        [{ text: '# the hook cannot drift apart. Run from anywhere; exits 1 on any failure.' }],
        [{ text: 'set -u' }],
        [{ text: 'HOOKS="$(cd "$(dirname "$0")" && pwd)"' }],
        [{ text: 'BRAIN="$(cd "$HOOKS/../.." && pwd)"' }],
        [{ text: 'RULE="$BRAIN/toolkit/rules/commits-and-prs.md"' }],
        [{ text: 'HOOK="$HOOKS/commit-msg"' }],
        [{ text: 'tmp="$(mktemp)"; trap \'rm -f "$tmp"\' EXIT' }],
        [{ text: 'failures=0 total=0' }],
        [],
        [{ text: '# check <pass|fail> <label> <message, with \\n for newlines>' }],
        [{ text: 'check() {' }],
      ],
      usedBy: { kind: 'skill', text: 'Last run on Nov 14: 43 of 43 pass.' },
    },
  ],
}

export const hookFiles = {
  title: 'a hook open beside the list, on Files',
  frames: [{ id: 'D36', node: '494:2061', viewport: 'desktop' }],
  data: {
    ...hookOpen.data,
    details: hookOpen.data.details.map((d) =>
      d.path === 'hooks/commit-msg' ? { ...d, browser: hookFilesBrowser } : d,
    ),
  },
  ui: { ...hookOpen.ui, itemTab: 'files' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
