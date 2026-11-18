// The Inbox page's screens (screen review R10): the states that draw each
// screen on the desktop, the tablet and the phone, for the side-by-side
// stories in screens/InboxScreens.stories.tsx. Every state is in exactly
// one screen (states/screens.test.ts). A state that draws a tablet and a
// phone frame (T1 and M1) has one story, at the tablet, so it shows on the
// tablet only.
import type { ScreenMap } from '../../../lib/screenMap.ts'
import type { inboxStates } from './index.ts'

export const inboxScreens = {
  list: { title: 'The list', tablet: 'list' },
  nextStep: { title: 'A next step', desktop: 'nextStep', tablet: 'taskPage' },
  question: { title: 'A question that blocks a chat', desktop: 'question', phone: 'questionPhone' },
  promptEditing: {
    title: 'Edit the prompt',
    desktop: 'promptEditing',
    tablet: 'promptEditingPage',
    phone: 'promptKeyboard',
  },
  runIn: { title: 'Choose where it runs', phone: 'runInSheet' },
  filter: { title: 'The filter', desktop: 'filterOpen', tablet: 'filterList' },
  started: { title: 'Started, the chat stays in the inbox', desktop: 'running', tablet: 'runningList' },
  running: { title: 'A running task', desktop: 'runningTask', tablet: 'runningTaskPage' },
  chat: { title: 'The started task’s chat', tablet: 'chat' },
  done: { title: 'Done', desktop: 'done', tablet: 'doneList' },
  promptRead: { title: 'The whole prompt', desktop: 'promptRead', tablet: 'promptSheet' },
  sort: { title: 'The sort', desktop: 'sortOpen', tablet: 'sortList' },
  search: { title: 'A search', desktop: 'search', tablet: 'searchList' },
  sortedByProject: { title: 'Sorted by project', desktop: 'sortedByProject', tablet: 'sortedList' },
  snooze: { title: 'Snooze or dismiss', desktop: 'snoozeOpen', tablet: 'snoozePage', phone: 'rowActions' },
  filtered: { title: 'Filtered', desktop: 'filtered', tablet: 'filteredList' },
  discussButton: { title: 'Discuss, on the task page', tablet: 'discussTask' },
  discussion: { title: 'The discussion', desktop: 'discussOpen', tablet: 'discussionPage' },
  changeProposed: { title: 'A proposed update', desktop: 'changeProposed', tablet: 'changeProposedPage' },
  changeApplied: { title: 'The update applied', desktop: 'changeApplied', tablet: 'changeAppliedPage' },
  tasksProposed: { title: 'Proposed new tasks', desktop: 'tasksProposed', tablet: 'tasksProposedPage' },
  tasksCreated: {
    title: 'The new tasks in the inbox',
    desktop: 'tasksCreated',
    tablet: 'tasksCreatedList',
    phone: 'tasksCreatedPhone',
  },
  removalProposed: { title: 'A proposed removal', desktop: 'removalProposed', tablet: 'removalProposedPage' },
  removeConfirm: { title: 'Confirm the removal', desktop: 'removeConfirm', tablet: 'removeConfirmPage' },
  removed: { title: 'Removed, in Done', desktop: 'removed', tablet: 'removedList', phone: 'removedPhone' },
} as const satisfies ScreenMap<keyof typeof inboxStates>
