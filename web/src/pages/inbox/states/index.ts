// Every Figma state of the Inbox, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { nextStep } from './nextStep.ts'

export const inboxStates = {
  nextStep,
}
