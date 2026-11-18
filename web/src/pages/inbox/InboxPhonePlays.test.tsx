// The phone column of the Inbox screens (R10) shows a state's own story at 390 px, and Storybook runs its play
// there. A state with a tablet and a phone frame has one story, so its play must pass at both widths.
import { composeStories } from '@storybook/react-vite'
import { within } from 'storybook/test'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { page } from 'vitest/browser'
import { screenStates } from '../../lib/screenMap.ts'
import * as stories from './screens/InboxScreen.stories.tsx'
import { inboxScreens } from './states/screens.ts'

const composed = new Map(Object.entries(composeStories(stories)))
const shared = Object.values(inboxScreens).flatMap((screen) => {
  const devices = screenStates(screen)
  const phone = devices.find((d) => d.device === 'phone')
  return phone !== undefined && devices.some((d) => d.device === 'tablet' && d.state === phone.state)
    ? [phone.state]
    : []
})

beforeAll(async () => {
  await page.viewport(390, 844)
})

afterAll(async () => {
  await page.viewport(1512, 982)
})

describe('the play of a state that a phone column shows', () => {
  for (const state of shared)
    it(`passes at 390 px: ${state}`, async () => {
      const story = composed.get(state.charAt(0).toUpperCase() + state.slice(1))
      if (story === undefined) throw new Error(`no story for ${state}`)
      const canvasElement = document.createElement('div')
      document.body.append(canvasElement)
      try {
        await story.run({ canvasElement, canvas: within(canvasElement) })
      } finally {
        canvasElement.remove()
      }
    })
})
