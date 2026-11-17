// Every Figma state of the Inbox page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { changeApplied } from './changeApplied.ts'
import { changeProposed } from './changeProposed.ts'
import { chat } from './chat.ts'
import { discussOpen } from './discussOpen.ts'
import { done } from './done.ts'
import { doneList } from './doneList.ts'
import { filterOpen } from './filterOpen.ts'
import { filtered } from './filtered.ts'
import { list } from './list.ts'
import { nextStep } from './nextStep.ts'
import { promptEditing } from './promptEditing.ts'
import { promptRead } from './promptRead.ts'
import { promptSheet } from './promptSheet.ts'
import { question } from './question.ts'
import { removalProposed } from './removalProposed.ts'
import { removeConfirm } from './removeConfirm.ts'
import { removed } from './removed.ts'
import { running } from './running.ts'
import { runningList } from './runningList.ts'
import { runningTask } from './runningTask.ts'
import { runningTaskPage } from './runningTaskPage.ts'
import { search } from './search.ts'
import { snoozeOpen } from './snoozeOpen.ts'
import { sortOpen } from './sortOpen.ts'
import { sortedByProject } from './sortedByProject.ts'
import { taskPage } from './taskPage.ts'
import { tasksCreated } from './tasksCreated.ts'
import { tasksProposed } from './tasksProposed.ts'

export const inboxStates = {
  changeApplied,
  changeProposed,
  chat,
  discussOpen,
  done,
  doneList,
  filterOpen,
  filtered,
  list,
  nextStep,
  promptEditing,
  promptRead,
  promptSheet,
  question,
  removalProposed,
  removeConfirm,
  removed,
  running,
  runningList,
  runningTask,
  runningTaskPage,
  search,
  snoozeOpen,
  sortOpen,
  sortedByProject,
  taskPage,
  tasksCreated,
  tasksProposed,
}
