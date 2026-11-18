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

// Figma's task card on the discussion page (T17 task · discussing) has its title 10 px under the card's 1 px border
// and 12 px in from its side, and is 96 px high. The fidelity check allows 4 px.
describe('the task card on the discussion page', () => {
  it("keeps Figma's padding and height (T17)", async () => {
    await page.viewport(756, 1158)
    const { data, ui } = inboxStates.discussionPage
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="tablet" />)
    const card = document.querySelector('[data-figma="task · discussing"] .panel__root')
    expect(card).not.toBeNull()
    if (card === null) return
    const style = getComputedStyle(card)
    expect([style.paddingTop, style.paddingBottom, style.paddingLeft, style.paddingRight]).toEqual([
      '10px',
      '10px',
      '12px',
      '12px',
    ])
    expect(Math.abs(card.getBoundingClientRect().height - 96)).toBeLessThanOrEqual(4)
  })
})
