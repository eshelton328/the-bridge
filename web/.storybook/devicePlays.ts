// Runs the play of each tablet and phone state at its own Figma frame size.
// A page's States stories run at Storybook's desktop width, where the screen
// lays out as the desktop, so a T or M play there checked the desktop layout.
// Each page's <Page>DevicePlays.test.tsx calls devicePlays().
import { composeStories } from '@storybook/react-vite'
import { within } from 'storybook/test'
import { afterAll, describe, it } from 'vitest'
import { page } from 'vitest/browser'
import { frameSizes } from '../src/lib/screenMap.ts'

type Device = keyof typeof frameSizes
type States = Record<string, { frames: readonly { viewport: Device }[] }>
type Playable = { run: (context: { canvasElement: HTMLElement; canvas: ReturnType<typeof within> }) => Promise<void> }

const isPlayable = (value: unknown): value is Playable =>
  (typeof value === 'function' || (typeof value === 'object' && value !== null)) &&
  'run' in value &&
  typeof value.run === 'function'

export function devicePlays(stories: Parameters<typeof composeStories>[0], states: States): void {
  const composed = new Map(Object.entries(composeStories(stories)))
  const runs = Object.entries(states).flatMap(([state, s]) =>
    [...new Set(s.frames.map((f) => f.viewport))].flatMap((device) =>
      device === 'desktop' ? [] : [{ state, device }],
    ),
  )

  afterAll(async () => {
    await page.viewport(frameSizes.desktop.width, frameSizes.desktop.height)
  })

  describe('the play of each tablet and phone state, at its frame size', () => {
    for (const { state, device } of runs)
      it(`${device}, ${String(frameSizes[device].width)} px: ${state}`, async () => {
        await page.viewport(frameSizes[device].width, frameSizes[device].height)
        const story = composed.get(state.charAt(0).toUpperCase() + state.slice(1))
        if (!isPlayable(story)) throw new Error(`no story for ${state}`)
        const canvasElement = document.createElement('div')
        document.body.append(canvasElement)
        try {
          await story.run({ canvasElement, canvas: within(canvasElement) })
        } finally {
          canvasElement.remove()
        }
      })
  })
}