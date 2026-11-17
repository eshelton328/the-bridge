// Every Figma state of the Inbox page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { changeApplied } from './changeApplied.ts'
import { changeProposed } from './changeProposed.ts'
import { discussOpen } from './discussOpen.ts'
import { done } from './done.ts'
import { filterOpen } from './filterOpen.ts'
import { filtered } from './filtered.ts'
import { nextStep } from './nextStep.ts'
import { promptEditing } from './promptEditing.ts'
import { promptRead } from './promptRead.ts'
import { question } from './question.ts'
import { removalProposed } from './removalProposed.ts'
import { removeConfirm } from './removeConfirm.ts'
import { removed } from './removed.ts'
import { running } from './running.ts'
import { runningTask } from './runningTask.ts'
import { search } from './search.ts'
import { snoozeOpen } from './snoozeOpen.ts'
import { sortOpen } from './sortOpen.ts'
import { sortedByProject } from './sortedByProject.ts'
import { tasksCreated } from './tasksCreated.ts'
import { tasksProposed } from './tasksProposed.ts'

export const inboxStates = {
  changeApplied,
  changeProposed,
  discussOpen,
  done,
  filterOpen,
  filtered,
  nextStep,
  promptEditing,
  promptRead,
  question,
  removalProposed,
  removeConfirm,
  removed,
  running,
  runningTask,
  search,
  snoozeOpen,
  sortOpen,
  sortedByProject,
  tasksCreated,
  tasksProposed,
}
