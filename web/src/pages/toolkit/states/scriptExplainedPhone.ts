// Figma Toolkit M8 "M8 · A script explained": the skill writer's script check
// open on the phone on a page of its own, on Explain, its default view, as T6
// (scriptExplainedTablet) opens it on a tablet. Under the tabs the script's
// language, length and role, the Explain and Code switch, then D10's
// explanation with no box around it: the overview with what goes in and out
// and the exit codes, then each step with a link to its line. The data is
// M6's (scriptCodePhone); Code shows the source. Copy word for word from
// references/toolkit/M08/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ToolkitData, ToolkitUi } from '../types.ts'
import { scriptCodePhone } from './scriptCodePhone.ts'
import { skillFilesPhone } from './skillFilesPhone.ts'

export const scriptExplainedPhone = {
  title: 'a skill’s script explained on the phone, on a page of its own',
  frames: [{ id: 'M8', node: '440:1484', viewport: 'phone' }],
  data: { ...scriptCodePhone.data },
  // M8 440:1626: check on its page, on Explain, its default view.
  ui: { ...skillFilesPhone.ui, file: 'scripts/check', filePage: true },
} satisfies ScreenState<ToolkitData, ToolkitUi>
