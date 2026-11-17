// Every Figma state of the Inbox page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { changeApplied } from './changeApplied.ts'
import { changeAppliedPage } from './changeAppliedPage.ts'
import { changeProposed } from './changeProposed.ts'
import { changeProposedPage } from './changeProposedPage.ts'
import { chat } from './chat.ts'
import { discussOpen } from './discussOpen.ts'
import { discussTask } from './discussTask.ts'
import { discussionPage } from './discussionPage.ts'
import { done } from './done.ts'
import { doneList } from './doneList.ts'
import { filterList } from './filterList.ts'
import { filterOpen } from './filterOpen.ts'
import { filtered } from './filtered.ts'
import { filteredList } from './filteredList.ts'
import { list } from './list.ts'
import { nextStep } from './nextStep.ts'
import { promptEditing } from './promptEditing.ts'
import { promptEditingPage } from './promptEditingPage.ts'
import { promptKeyboard } from './promptKeyboard.ts'
import { promptRead } from './promptRead.ts'
import { promptSheet } from './promptSheet.ts'
import { question } from './question.ts'
import { questionPhone } from './questionPhone.ts'
import { removalProposed } from './removalProposed.ts'
import { removalProposedPage } from './removalProposedPage.ts'
import { removeConfirm } from './removeConfirm.ts'
import { removeConfirmPage } from './removeConfirmPage.ts'
import { removed } from './removed.ts'
import { removedList } from './removedList.ts'
import { rowActions } from './rowActions.ts'
import { runInSheet } from './runInSheet.ts'
import { running } from './running.ts'
import { runningList } from './runningList.ts'
import { runningTask } from './runningTask.ts'
import { runningTaskPage } from './runningTaskPage.ts'
import { search } from './search.ts'
import { searchList } from './searchList.ts'
import { snoozeOpen } from './snoozeOpen.ts'
import { snoozePage } from './snoozePage.ts'
import { sortList } from './sortList.ts'
import { sortOpen } from './sortOpen.ts'
import { sortedByProject } from './sortedByProject.ts'
import { sortedList } from './sortedList.ts'
import { taskPage } from './taskPage.ts'
import { tasksCreated } from './tasksCreated.ts'
import { tasksCreatedList } from './tasksCreatedList.ts'
import { tasksProposed } from './tasksProposed.ts'
import { tasksProposedPage } from './tasksProposedPage.ts'

export const inboxStates = {
  changeApplied,
  changeAppliedPage,
  changeProposed,
  changeProposedPage,
  chat,
  discussOpen,
  discussTask,
  discussionPage,
  done,
  doneList,
  filterList,
  filterOpen,
  filtered,
  filteredList,
  list,
  nextStep,
  promptEditing,
  promptEditingPage,
  promptKeyboard,
  promptRead,
  promptSheet,
  question,
  questionPhone,
  removalProposed,
  removalProposedPage,
  removeConfirm,
  removeConfirmPage,
  removed,
  removedList,
  rowActions,
  runInSheet,
  running,
  runningList,
  runningTask,
  runningTaskPage,
  search,
  searchList,
  snoozeOpen,
  snoozePage,
  sortList,
  sortOpen,
  sortedByProject,
  sortedList,
  taskPage,
  tasksCreated,
  tasksCreatedList,
  tasksProposed,
  tasksProposedPage,
}
