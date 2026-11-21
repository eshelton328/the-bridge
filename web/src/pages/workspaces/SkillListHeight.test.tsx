import { composeStories } from '@storybook/react-vite'
import { within } from 'storybook/test'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import preview from '../../../.storybook/preview.ts'
import { placed } from '../../lib/popoverPlaced.ts'
import * as stories from './screens/WorkspacesScreen.stories.tsx'

// D1's skill list (105:406) is 173 high in Figma: 7 from its edge to the SKILLS row (21), then three 44 px rows 2
// apart, as T4's (105:2246) and M3's (105:2805) are. The pane's list drew the default spacing (26 px label row, 50 px
// rows), 200 high, so its top lay over the transcript line above it (105:214, "Read f-005-the-bridge/requirements.md"),
// which Figma leaves clear. The story runs in a canvas as tall as the window, as Storybook's is, so the screen lays out
// as in the fidelity check.
const { Workbench } = composeStories(stories, preview)

const figmaHeight = 173
// The position check's tolerance (references/workspaces/D01/frame.json).
const tolerance = 4

let canvasElement: HTMLElement | undefined

afterEach(() => {
  canvasElement?.remove()
  canvasElement = undefined
})

function box(el: Element | null | undefined) {
  if (!(el instanceof HTMLElement)) throw new Error('no element')
  return el.getBoundingClientRect()
}

describe('the skill list in a pane (D1)', () => {
  it("is Figma's 173 high at 1512 px and leaves the transcript line over it clear", async () => {
    await page.viewport(1512, 982)
    canvasElement = document.createElement('div')
    canvasElement.style.height = '100vh'
    document.body.append(canvasElement)
    await Workbench.run({ canvasElement, canvas: within(canvasElement) })
    await expect.element(page.getByRole('radiogroup', { name: 'SKILLS' })).toBeVisible()
    const list = () => document.querySelector('[data-figma="105:406"]')
    // Ark's positioner draws the list at translate(var(--x, 0), var(--y, -100vh)) until zag has computed its place a
    // frame or more after the open, so a list measured before that has its top 100vh above the window (-982 on a busy
    // runner). The test waits for the place before it measures.
    await expect.poll(() => placed(list())).toBe(true)
    // The popover opens with a scale animation, so its box is polled until it settles.
    await expect.poll(() => Math.abs(box(list()).height - figmaHeight)).toBeLessThanOrEqual(tolerance)
    const line = page.getByText('Read f-005-the-bridge/requirements.md').element()
    expect(box(list()).top).toBeGreaterThanOrEqual(box(line).bottom)
  })
})
