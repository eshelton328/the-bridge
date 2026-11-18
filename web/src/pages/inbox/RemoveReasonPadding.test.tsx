import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { InboxScreen } from './screens/InboxScreen.tsx'
import { inboxStates } from './states/index.ts'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

// Figma's reason box in the remove sheet (M24 402:7846) is 78 px high, its label 11 under its border and 13 in from
// its side. The fidelity check allows 4 px.
describe('the reason box of the remove confirm', () => {
  it("keeps Figma's padding and height (M24)", async () => {
    await page.viewport(390, 806)
    const { data, ui } = inboxStates.removeConfirmPage
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="phone" />)
    const box = document.querySelector('[data-figma="402:7846"] .panel__root')
    expect(box).not.toBeNull()
    if (box === null) return
    const style = getComputedStyle(box)
    expect([style.paddingTop, style.paddingBottom, style.paddingLeft, style.paddingRight]).toEqual([
      '10px',
      '10px',
      '12px',
      '12px',
    ])
    expect(Math.abs(box.getBoundingClientRect().height - 78)).toBeLessThanOrEqual(4)
  })
})

// D20 403:3915: Figma puts the task's meta line 4 under the dialog's title, in one frame with it.
describe('the meta line of the remove confirm', () => {
  it('sits 4 px under the title (D20)', async () => {
    const { data, ui } = inboxStates.removeConfirm
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    const dialog = document.querySelector('[data-figma="dialog · Remove this task"]')
    expect(dialog).not.toBeNull()
    if (dialog === null) return
    const title = dialog.querySelector('h2')
    const meta = [...dialog.querySelectorAll('p')].find(
      (p) => p.textContent === 'ncc-1701 · f-005 · NCC-28 · Next step',
    )
    expect(title).not.toBeNull()
    expect(meta).toBeDefined()
    if (title === null || meta === undefined) return
    expect(meta.getBoundingClientRect().top - title.getBoundingClientRect().bottom).toBe(4)
  })
})
