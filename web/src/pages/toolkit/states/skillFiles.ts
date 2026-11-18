// Figma Toolkit D6 "D6 · A skill’s files": the skill writer open beside the
// list, as in D3 (skillOpen), on its Files tab: the skill's folders and files
// as a tree, each folder with what it is for, and its script check selected
// in the viewer beside the tree, with its first lines and the step that runs
// it. Copy word for word from references/toolkit/D06/frame.json; the list is
// D3's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitUi } from '../types.ts'
import { skillOpen } from './skillOpen.ts'

const file = (folder: string, name: string, count?: number) => ({
  path: `${folder}${name}`,
  name,
  ...(count === undefined ? {} : { count }),
})
const script = (name: string, count: number) => ({ ...file('scripts/', name, count), type: 'code' as const })
const evalCase = (name: string) => ({ ...file('evals/', name), type: 'folder' as const, children: [] })

const browser: ToolkitFileBrowser = {
  tree: [
    { path: 'SKILL.md', name: 'SKILL.md', caption: 'When to use, steps, rules. Loads when the skill triggers.' },
    {
      path: 'references/',
      name: 'references/',
      type: 'folder',
      count: 6,
      caption: 'Read on demand',
      children: [
        file('references/', 'artifact.md', 74),
        file('references/', 'chat.md', 60),
        file('references/', 'doc.md', 56),
        file('references/', 'examples.md', 93),
        file('references/', 'prd.md', 66),
        file('references/', 'ticket.md', 68),
      ],
    },
    {
      path: 'scripts/',
      name: 'scripts/',
      type: 'folder',
      count: 4,
      caption: 'Run, not read',
      children: [script('check', 437), script('ste-dict', 96), script('ste-stop-hook', 69), script('test-check', 133)],
    },
    {
      path: 'evals/',
      name: 'evals/',
      type: 'folder',
      count: '5 cases',
      caption: 'Test cases. Never loaded into a session.',
      children: [
        evalCase('artifact-defines-ids/'),
        evalCase('chat-sourced-first-person/'),
        evalCase('doc-headings-paths/'),
        evalCase('prd-state-claims/'),
        evalCase('ticket-scope/'),
        file('evals/', 'triggers.json'),
        file('evals/', 'outputs.json'),
        file('evals/', 'precheck.sh'),
      ],
    },
  ],
  expanded: ['references/', 'scripts/', 'evals/'],
  selected: 'scripts/check',
  views: [
    {
      path: 'scripts/check',
      meta: 'Python · 437 lines · run, not read',
      blocks: [],
      code: [
        [{ text: '#!/usr/bin/env python3', kind: 'comment' }],
        [{ text: '"""check: deterministic checks of a draft against toolkit/rules/writing.md.' }],
        [],
        [{ text: 'usage: check FILE... [--form doc|ticket|prd|artifact|chat|note] [--ste]' }],
        [{ text: "       (FILE may be '-' for stdin)" }],
        [],
        [{ text: 'Prints one JSON object per file to stdout, one per line. Exit 0 when no' }],
        [{ text: 'file has a "fail" finding, 1 when any does, 2 on bad usage.' }],
        [],
        [{ text: 'Each finding has a kind:' }],
        [{ text: '  fail   a phrase or shape the writing rules name; rewrite it.' }],
        [{ text: '  lead   something a script can find but not judge; read it and decide.' }],
        [{ text: 'Matches inside code, inline code, quotation marks and > blockquotes are reported with' }],
        [{ text: '"quoted": true and never fail, because a doc about writing quotes the' }],
      ],
      usedBy: { kind: 'skill', text: 'Step 6 of SKILL.md runs this script on the draft.' },
    },
  ],
}

export const skillFiles = {
  title: 'a skill open beside the list, on Files',
  frames: [{ id: 'D6', node: '432:1639', viewport: 'desktop' }],
  data: {
    ...skillOpen.data,
    details: skillOpen.data.details.map((d) => (d.path === 'skills/writer/' ? { ...d, browser } : d)),
  },
  ui: { ...skillOpen.ui, itemTab: 'files' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
