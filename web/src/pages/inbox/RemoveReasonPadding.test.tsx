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
