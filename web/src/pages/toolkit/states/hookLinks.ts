// Figma Toolkit D32 "D32 · A hook’s links": the hook commit-msg open beside
// the list, as in D9 (hookOpen), on its Links tab. The hook and the rule it
// enforces, commits-and-prs, name each other, so the rule stands on both
// sides. Copy word for word from references/toolkit/D32/frame.json; the list
// is D9's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitLinks, ToolkitUi } from '../types.ts'
import { hookOpen } from './hookOpen.ts'

const rule = { path: 'rules/commits-and-prs.md', name: 'commits-and-prs', kind: 'rule' as const }

const links: ToolkitLinks = {
  intro:
    'Only commit-msg’s own links, with the line in the file that makes each one. link.sh turns the hook on: it sets core.hooksPath to toolkit/hooks.',
  label: 'Links',
  hint: 'Tap an item to open it',
  from: {
    label: 'Linked from',
    caption: 'files that name commit-msg',
    links: [
      {
        ...rule,
        at: 'rules/commits-and-prs.md:182',
        text: 'In the brain, toolkit/hooks/commit-msg blocks a commit whose message…',
      },
    ],
    graph: [rule.path],
  },
  to: {
    label: 'Links to',
    caption: 'names in commit-msg’s files',
    links: [{ ...rule, at: 'commit-msg:3', text: 'Checks a commit message against toolkit/rules/commits-and-prs.md' }],
    graph: [rule.path],
  },
  note: 'Tap an item to open its page, or a line to open the file there. A link is one toolkit file that names another.',
}

export const hookLinks = {
  title: 'a hook open beside the list, on Links',
  frames: [{ id: 'D32', node: '493:2462', viewport: 'desktop' }],
  data: {
    ...hookOpen.data,
    details: hookOpen.data.details.map((d) => (d.path === 'hooks/commit-msg' ? { ...d, links } : d)),
  },
  ui: { ...hookOpen.ui, itemTab: 'links' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
