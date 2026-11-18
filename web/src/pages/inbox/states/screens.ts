// The Inbox page's screens (screen review R10): the states that draw each
// screen on the desktop, the tablet and the phone, for the side-by-side
// stories in screens/InboxScreens.stories.tsx. Every state is in exactly
// one screen (states/screens.test.ts). A state that draws a tablet and a
// phone frame (T1 and M1) names itself for both devices; the 390 px column
// lays it out as the phone.
import type { ScreenMap } from '../../../lib/screenMap.ts'
import type { inboxStates } from './index.ts'

export const inboxScreens = {
  list: { title: 'The list', tablet: 'list', phone: 'list' },
  nextStep: { title: 'A next step', desktop: 'nextStep', tablet: 'taskPage', phone: 'taskPage' },
  question: { title: 'A question that blocks a chat', desktop: 'question', phone: 'questionPhone' },
  promptEditing: {
    title: 'Edit the prompt',
    desktop: 'promptEditing',
    tablet: 'promptEditingPage',
    phone: 'promptKeyboard',
  },
  runIn: { title: 'Choose where it runs', phone: 'runInSheet' },
  filter: { title: 'The filter', desktop: 'filterOpen', tablet: 'filterList', phone: 'filterList' },
  started: {
    title: 'Started, the chat stays in the inbox',
    desktop: 'running',
    tablet: 'runningList',
    phone: 'runningList',
  },
  running: { title: 'A running task', desktop: 'runningTask', tablet: 'runningTaskPage', phone: 'runningTaskPage' },
  chat: { title: 'The started task’s chat', tablet: 'chat', phone: 'chat' },
  done: { title: 'Done', desktop: 'done', tablet: 'doneList', phone: 'doneList' },
  promptRead: { title: 'The whole prompt', desktop: 'promptRead', tablet: 'promptSheet', phone: 'promptSheet' },
  sort: { title: 'The sort', desktop: 'sortOpen', tablet: 'sortList', phone: 'sortList' },
  search: { title: 'A search', desktop: 'search', tablet: 'searchList', phone: 'searchList' },
  sortedByProject: {
    title: 'Sorted by project',
    desktop: 'sortedByProject',
    tablet: 'sortedList',
    phone: 'sortedList',
  },
  snooze: { title: 'Snooze or dismiss', desktop: 'snoozeOpen', tablet: 'snoozePage', phone: 'rowActions' },
  filtered: { title: 'Filtered', desktop: 'filtered', tablet: 'filteredList', phone: 'filteredList' },
  discussButton: { title: 'Discuss, on the task page', tablet: 'discussTask', phone: 'discussTask' },
  discussion: { title: 'The discussion', desktop: 'discussOpen', tablet: 'discussionPage', phone: 'discussionPage' },
  changeProposed: {
    title: 'A proposed update',
    desktop: 'changeProposed',
    tablet: 'changeProposedPage',
    phone: 'changeProposedPage',
  },
  changeApplied: {
    title: 'The update applied',
    desktop: 'changeApplied',
    tablet: 'changeAppliedPage',
    phone: 'changeAppliedPage',
  },
  tasksProposed: {
    title: 'Proposed new tasks',
    desktop: 'tasksProposed',
    tablet: 'tasksProposedPage',
    phone: 'tasksProposedPage',
  },
  tasksCreated: {
    title: 'The new tasks in the inbox',
    desktop: 'tasksCreated',
    tablet: 'tasksCreatedList',
    phone: 'tasksCreatedPhone',
  },
  removalProposed: {
    title: 'A proposed removal',
    desktop: 'removalProposed',
    tablet: 'removalProposedPage',
    phone: 'removalProposedPage',
  },
  removeConfirm: {
    title: 'Confirm the removal',
    desktop: 'removeConfirm',
    tablet: 'removeConfirmPage',
    phone: 'removeConfirmPage',
  },
  removed: { title: 'Removed, in Done', desktop: 'removed', tablet: 'removedList', phone: 'removedPhone' },
} as const satisfies ScreenMap<keyof typeof inboxStates>
