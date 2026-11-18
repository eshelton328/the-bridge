// Figma Toolkit M6 "M6 · A file": the skill writer's script check open on the
// phone on a page of its own, on Code, as every file with a view opens from
// M5's tree (skillFilesPhone). The back row goes back to Files and holds the
// copy button; the path badge names the script. Under the tabs the script's
// language, length and role, the Explain and Code switch, the line on what
// runs it, the source read-only with its long lines wrapped, and the line on
// how they wrap. Explain (M8, scriptExplainedPhone) shows D10's explanation.
// Copy word for word from references/toolkit/M06/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitFileBrowser, ToolkitFileView, ToolkitUi } from '../types.ts'
import { scriptExplained } from './scriptExplained.ts'
import { skillFilesPhone } from './skillFilesPhone.ts'

// D10's explanation of check, which the phone's Explain shows (M8).
const explain = scriptExplained.data.details
  .find((d) => d.path === 'skills/writer/')
  ?.browser?.views.find((v) => v.path === 'scripts/check')?.explain

// M6 435:504 to 435:552: the phone's source of check, as Figma numbers its lines.
const line = (text: string) => (text === '' ? [] : [{ text }])
const code = [
  [{ text: '#!/usr/bin/env python3', kind: 'comment' as const }],
  line('"""check: deterministic checks of a'),
  line('draft against toolkit/rules/writing.md.'),
  line(''),
  line('usage: check FILE... [--form doc|'),
  line('  ticket|prd|artifact|chat|note] [--ste]'),
  line(''),
  line('Prints one JSON object per file to'),
  line('stdout, one per line. Exit 0 when no'),
  line('file has a "fail" finding, 1 when any'),
  line('does, 2 on bad usage.'),
  line(''),
  line('Each finding has a kind:'),
  line('  fail  a phrase or shape the writing'),
  line('        rules name; rewrite it.'),
  line('  lead  something a script can find but'),
  line('        not judge; read it and decide.'),
]

// M6 435:497, 435:502, 435:555: the script's meta line, what runs it after Read-only, and the line under the code.
const phone = (view: ToolkitFileView): ToolkitFileView =>
  view.path === 'scripts/check'
    ? {
        path: view.path,
        meta: 'Python · 437 lines · run, not read',
        blocks: [],
        code,
        usedBy: { kind: 'skill', text: 'Step 6 of SKILL.md runs this script.' },
        ...(explain === undefined ? {} : { explain }),
        footnote: 'Long lines wrap on the phone; the line numbers follow the file.',
      }
    : view

const browser = (b: ToolkitFileBrowser): ToolkitFileBrowser => ({ ...b, views: b.views.map(phone) })

export const scriptCodePhone = {
  title: 'a skill’s script on the phone, on a page of its own, on Code',
  frames: [{ id: 'M6', node: '435:290', viewport: 'phone' }],
  data: {
    ...skillFilesPhone.data,
    details: skillFilesPhone.data.details.map((d) =>
      d.browser === undefined ? d : { ...d, browser: browser(d.browser) },
    ),
  },
  ui: { ...skillFilesPhone.ui, file: 'scripts/check', filePage: true, fileView: 'code' },
} satisfies ScreenState<ToolkitData, ToolkitUi>
