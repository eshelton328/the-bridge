// Each tablet and phone state's play at its own Figma frame size. The
// Toolkit stories run at Storybook's desktop width, where the screen lays
// out as the desktop, so a T or M play there checked the desktop layout.
import { composeStories } from '@storybook/react-vite'
import { within } from 'storybook/test'
import { afterAll, describe, it } from 'vitest'
import { page } from 'vitest/browser'
import { frameSizes } from '../../lib/screenMap.ts'
import * as stories from './screens/ToolkitScreen.stories.tsx'
import { toolkitStates } from './states/index.ts'

const composed = new Map(Object.entries(composeStories(stories)))
const runs = Object.entries(toolkitStates).flatMap(([state, s]) =>
  [...new Set(s.frames.map((f) => f.viewport))].flatMap((device) => (device === 'desktop' ? [] : [{ state, device }])),
)

afterAll(async () => {
  await page.viewport(frameSizes.desktop.width, frameSizes.desktop.height)
})

describe('the play of each tablet and phone state, at its frame size', () => {
  for (const { state, device } of runs)
    it(`${device}, ${String(frameSizes[device].width)} px: ${state}`, async () => {
      await page.viewport(frameSizes[device].width, frameSizes[device].height)
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
