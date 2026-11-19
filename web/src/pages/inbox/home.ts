// The Inbox as the app opens it, with no ?state= (lib/dataSource.ts): the
// base data of D1 (nextStep) with nothing selected and every menu, sheet and
// dialog closed, so the screen lays out by the window's width. The desktop
// shows the list beside D1's task, as it always shows the state's item; a
// tablet or a phone shows the list (T1, M1) until a row opens. It is not a
// Figma state: it lives outside states/, so it has no frame, story, board or
// fidelity check.
import type { ScreenState } from '../../lib/screenState.ts'
import { nextStep } from './states/nextStep.ts'
import type { InboxData, InboxUi } from './types.ts'

export const inboxHome = {
  title: 'The Inbox as the app opens',
  frames: [],
  data: nextStep.data,
  ui: { ...nextStep.ui, selectedId: null },
} satisfies ScreenState<InboxData, InboxUi>
