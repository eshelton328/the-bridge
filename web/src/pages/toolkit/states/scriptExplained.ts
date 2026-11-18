// Figma Toolkit D10 "D10 · A script explained": the skill writer open beside
// the list on its Files tab, as in D6 (skillFiles), with its script check
// selected. The viewer opens on Explain, the default view of a script with an
// explanation: an overview with what goes in and out and the exit codes, then
// each step in plain English with a link to its line, and who wrote it. Code
// (D6) shows the source. Copy word for word from
// references/toolkit/D10/frame.json; the list and the tree are D6's.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileView, ToolkitUi } from '../types.ts'
import { skillFiles } from './skillFiles.ts'

const explain = {
  summary:
    'Checks a draft against the writing rules in rules/writing.md. Step 6 of the writer skill runs it, and so does the Stop hook on each chat reply.',
  facts: [
    { key: 'In', value: 'one or more files, --form, --ste' },
    { key: 'Out', value: 'one JSON line for each file' },
    { key: 'Exit', value: '0 pass · 1 a rule fails · 2 bad input' },
  ],
  steps: [
    {
      text: 'Read the options: the files to check, the form (doc unless --form names another) and --ste, which adds the STE checks.',
      line: 406,
    },
    {
      text: 'For each file, read its text. If a file cannot be read, print the error and stop with exit code 2.',
      line: 416,
    },
    {
      text: 'Give the text to check(). It splits the text into headings, paragraphs, list items, tables and quotes, and skips frontmatter and code.',
      line: 420,
    },
    {
      text: 'In each block, look for the patterns in the writing rules. Each match is a finding: a fail to rewrite, or a lead to read and judge.',
      line: 233,
    },
    { text: 'If --ste is on, also check each sentence against the STE rules.', line: 421 },
    { text: 'Drop the findings inside quotes. Print one JSON line with the counts and the findings.', line: 425 },
    { text: 'Exit 1 if any file has a fail. Otherwise exit 0.', line: 433 },
  ],
  note: 'Written by Claude from this version of the file, and written again when the file changes. Tap a line to see it in Code.',
}

// D10 440:1362: the bar names the script's length only.
const explained = (view: ToolkitFileView): ToolkitFileView =>
  view.path === 'scripts/check' ? { ...view, meta: '437 lines', explain } : view

export const scriptExplained = {
  title: 'a skill’s script explained, on Files',
  frames: [{ id: 'D10', node: '440:827', viewport: 'desktop' }],
  data: {
    ...skillFiles.data,
    details: skillFiles.data.details.map((d) =>
      d.browser === undefined ? d : { ...d, browser: { ...d.browser, views: d.browser.views.map(explained) } },
    ),
  },
  ui: { ...skillFiles.ui },
} satisfies ScreenState<ToolkitData, ToolkitUi>
