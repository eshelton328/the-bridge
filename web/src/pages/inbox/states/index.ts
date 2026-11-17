// Every Figma state of the Inbox page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { done } from './done.ts'
import { filterOpen } from './filterOpen.ts'
import { nextStep } from './nextStep.ts'
import { promptEditing } from './promptEditing.ts'
import { promptRead } from './promptRead.ts'
import { question } from './question.ts'
import { running } from './running.ts'
import { runningTask } from './runningTask.ts'
import { search } from './search.ts'
import { snoozeOpen } from './snoozeOpen.ts'
import { sortOpen } from './sortOpen.ts'
import { sortedByProject } from './sortedByProject.ts'

export const inboxStates = {
  done,
  filterOpen,
  nextStep,
  promptEditing,
  promptRead,
  question,
  running,
  runningTask,
  search,
  snoozeOpen,
  sortOpen,
  sortedByProject,
}
