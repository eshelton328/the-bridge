import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { afterRendering } from '../lib/rendering.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { renderInbox, searchbox } from './inboxRouteHelpers.ts'

// The owner's phone review (bridge-shell): with the keyboard up, the Inbox reply box sits on the keyboard's top, with
// no band of page under it (it sat 12 px over it on the phone, 6 on a tablet). The page's foot under the reply box is
// only for the box off the keyboard.
let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  await page.viewport(1512, 982)
})

const keyboard = 300
const sizes = [
  ['phone', 390, 844],
  ['tablet', 756, 1024],
] as const

/**
 * The reply box's bottom off the keyboard, and with a keyboard `keyboard` px tall up: the gap between the box's bottom
 * and the keyboard's top. The frame reaches the detail's bottom on the keyboard, so the keyboard's top is that far
 * over the frame's bottom (library ScrollFrame).
 */
async function measure(field: Element) {
  const box = field.closest('.scroll-frame__footer > *')
  const frame = box?.closest('.scroll-frame__root')
  const shell = frame?.closest('.app-shell__root')
  if (!(box instanceof HTMLElement) || !(frame instanceof HTMLElement) || !(shell instanceof HTMLElement))
    throw new Error('no reply box in a docked frame')
  /** The bottom of the box's content: its padding is the page's foot, not the box. */
  const boxBottom = () => box.getBoundingClientRect().bottom - Number.parseFloat(getComputedStyle(box).paddingBottom)
  const foot = () => frame.getBoundingClientRect().bottom - boxBottom()
  const off = foot()
  shell.style.setProperty('--app-shell-keyboard', `${String(keyboard)}px`)
  await afterRendering()
  const gap = frame.getBoundingClientRect().bottom - keyboard - boxBottom()
  shell.style.removeProperty('--app-shell-keyboard')
  await afterRendering()
  return { gap, off, offAgain: foot() }
}

describe('the Inbox reply box on the keyboard', () => {
  for (const [name, width, height] of sizes) {
    it(`sits on the keyboard in a running task's chat, opened from the list, on the ${name}`, async () => {
      await page.viewport(width, height)
      view = await renderInbox('runningList').rendered
      await expect.element(searchbox()).toBeVisible()
      await page.getByRole('button', { name: /^Write the tickets for increment one/ }).click()
      await page.getByRole('button', { name: 'Reply here' }).click()
      const field = page.getByRole('textbox', { name: 'Reply' })
      await expect.element(field).toBeVisible()
      const m = await measure(field.element())
      expect(m.gap).toBeCloseTo(0, 0)
      // Off the keyboard the box keeps the page's foot, as before.
      expect(m.off).toBeCloseTo(name === 'phone' ? 12 : 6, 0)
      expect(m.offAgain).toBeCloseTo(m.off, 0)
    })

    it(`sits on the keyboard in a task's discussion, opened from the list, on the ${name}`, async () => {
      await page.viewport(width, height)
      view = await renderInbox('discussTask').rendered
      await page.getByRole('button', { name: 'Back to Inbox' }).click()
      await page.getByRole('button', { name: /^Write the tickets for increment one/ }).click()
      await page.getByRole('button', { name: 'Discuss' }).click()
      const field = page.getByRole('textbox', { name: 'Ask about this task' })
      await expect.element(field).toBeVisible()
      const m = await measure(field.element())
      expect(m.gap).toBeCloseTo(0, 0)
      // Off the keyboard the box keeps the page's foot, as before.
      expect(m.off).toBeCloseTo(name === 'phone' ? 12 : 6, 0)
      expect(m.offAgain).toBeCloseTo(m.off, 0)
    })
  }
})
