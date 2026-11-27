// Runs the play of each tablet and phone state at its own Figma frame size.
// A page's States stories run at Storybook's desktop width, where the screen
// lays out as the desktop, so a T or M play there checked the desktop layout.
// Each page's <Page>DevicePlays.test.tsx calls devicePlays(). A page whose
// screen map has a landscape screen passes the map too, so that screen's
// tablet state plays at the landscape iPad's size (frameSizeOf).
import { composeStories } from '@storybook/react-vite'
import { within } from 'storybook/test'
import { afterAll, describe, it } from 'vitest'
import { page } from 'vitest/browser'
import { frameSizeOf, frameSizes, type ScreenMap } from '../src/lib/screenMap.ts'
import preview from './preview.ts'

type Device = keyof typeof frameSizes
type States = Record<string, { frames: readonly { viewport: Device }[] }>
type Playable = { run: (context: { canvasElement: HTMLElement; canvas: ReturnType<typeof within> }) => Promise<void> }

const isPlayable = (value: unknown): value is Playable =>
  (typeof value === 'function' || (typeof value === 'object' && value !== null)) &&
  'run' in value &&
  typeof value.run === 'function'

export function devicePlays(
  stories: Parameters<typeof composeStories>[0],
  states: States,
  screens?: ScreenMap<string>,
): void {
  // The preview loads the app CSS and fonts, sets the theme and resets the
  // stores, as in Storybook. Without the CSS an accessible name can lose a space.
  const composed = new Map(Object.entries(composeStories(stories, preview)))
  // The frame size of `state` on `device`: its screen's (frameSizeOf), else the device's.
  const sizeOf = (state: string, device: Exclude<Device, 'desktop'>) => {
    const screen = Object.values(screens ?? {}).find((s) => s[device] === state)
    return screen === undefined ? frameSizes[device] : frameSizeOf(screen, device)
  }
  const runs = Object.entries(states).flatMap(([state, s]) =>
    [...new Set(s.frames.map((f) => f.viewport))].flatMap((device) =>
      device === 'desktop' ? [] : [{ state, device, size: sizeOf(state, device) }],
    ),
  )

  afterAll(async () => {
    await page.viewport(frameSizes.desktop.width, frameSizes.desktop.height)
  })

  describe('the play of each tablet and phone state, at its frame size', () => {
    for (const { state, device, size } of runs)
      it(`${device}, ${String(size.width)} px: ${state}`, async () => {
        await page.viewport(size.width, size.height)
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
