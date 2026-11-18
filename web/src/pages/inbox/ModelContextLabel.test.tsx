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

// Figma's model and context group in D15 (454:21) is 223 px wide; its "context" label is Geist Regular 11, 38 px
// wide. In the mono style the label is 46 px and the group 229. The fidelity check allows 4 px.
describe('the discussion model and context', () => {
  it("keeps Figma's width (D15)", async () => {
    await page.viewport(1512, 982)
    const { data, ui } = inboxStates.changeProposed
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(page.getByText('context', { exact: true })).toBeVisible()
    const group = document.querySelector('[data-figma="model and context"]')
    expect(group).not.toBeNull()
    if (group === null) return
    expect(Math.abs(group.getBoundingClientRect().width - 223)).toBeLessThanOrEqual(4)
  })
})
