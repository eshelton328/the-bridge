// Every Figma state of the Inbox page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { filterOpen } from './filterOpen.ts'
import { nextStep } from './nextStep.ts'
import { promptEditing } from './promptEditing.ts'
import { question } from './question.ts'
import { running } from './running.ts'

export const inboxStates = {
  filterOpen,
  nextStep,
  promptEditing,
  question,
  running,
}
