// Figma Inbox D13 "Filtered": D6 with a project filter. Filter reads
// "Filter · 1" and is pressed, the filters that apply show under the tools
// with Clear, and a line under the list counts the hidden task. Copy word
// for word from references/inbox/D13/frame.json; its metadata gives the
// hidden-count text's layer name, and frame.png shows the text.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { projectValue } from '../types.ts'
import { noFilter } from './nextStep.ts'
import { runningTask } from './runningTask.ts'

/** Every kind, and the projects but skill-evals: the filter hides the skill-evals next step. */
export const projectFilter = noFilter.filter((value) => value !== projectValue('skill-evals'))

export const filtered = {
  title: 'filtered',
  frames: [{ id: 'D13', node: '359:557', viewport: 'desktop' }],
  data: runningTask.data,
  ui: { ...runningTask.ui, filterChecks: projectFilter, filters: projectFilter },
} satisfies ScreenState<InboxData, InboxUi>
