// Figma Inbox M3 "Edit the prompt": D3's edited prompt in its editor on the
// phone's task page, with the keyboard over the bottom of the screen: the
// title on one line over the prompt, Run in below it, no Start and no tab
// bar. The Run in picker is closed. Copy word for word from
// references/inbox/M03/frame.json; Figma draws the text caret as a "|"
// after the prompt, which the editor's own caret shows.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { InboxData, InboxUi } from '../types.ts'
import { promptEditing } from './promptEditing.ts'

export const promptKeyboard = {
  title: 'edit the prompt, with the keyboard',
  frames: [{ id: 'M3', node: '346:9392', viewport: 'phone' }],
  data: promptEditing.data,
  ui: { ...promptEditing.ui, pickerOpen: false },
} satisfies ScreenState<InboxData, InboxUi>
