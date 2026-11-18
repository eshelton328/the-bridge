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

// Figma's notes card in D1 (346:404) is 84 px high, with 10 px above the note and 10 below "Add a note…"
// inside its 1 px border. The fidelity check allows 4 px.
describe('the My notes card', () => {
  it("keeps Figma's height and padding (D1)", async () => {
    await page.viewport(1512, 982)
    const { data, ui } = inboxStates.nextStep
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    const section = page.getByRole('region', { name: 'My notes' })
    await expect.element(section).toBeVisible()
    const card = section.element().querySelector('.panel__root')
    expect(card).not.toBeNull()
    if (card === null) return
    expect(getComputedStyle(card).paddingTop).toBe('10px')
    expect(getComputedStyle(card).paddingBottom).toBe('10px')
    expect(Math.abs(card.getBoundingClientRect().height - 84)).toBeLessThanOrEqual(4)
  })
})
