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
})

const box = (selector: string) => {
  const el = document.querySelector(selector)
  if (el === null) throw new Error(`no ${selector}`)
  return el
}

// The fidelity check allows 4 px.
describe('the discussion beside a task (desktop)', () => {
  it("sets the owner's message and the reply in Figma's 13 px text (D15)", async () => {
    await page.viewport(1512, 982)
    const { data, ui } = inboxStates.changeProposed
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    // Figma's message · you (403:1442) is 39 high: one line of Regular 13/19 in its bubble.
    expect(Math.abs(box('[data-figma="message · you"]').getBoundingClientRect().height - 39)).toBeLessThanOrEqual(4)
    const reply = box('[data-figma="message · discussion"] p')
    expect(getComputedStyle(reply).fontSize).toBe('13px')
    // message · discussion (403:1444) is 41 high.
    expect(
      Math.abs(box('[data-figma="message · discussion"]').getBoundingClientRect().height - 41),
    ).toBeLessThanOrEqual(4)
  })

  it("keeps the applied prompt's box at Figma's 128 px (D16)", async () => {
    await page.viewport(1512, 982)
    const { data, ui } = inboxStates.changeApplied
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    // Figma's prompt box (403:1854) stays 128 high for the shorter, applied prompt.
    const prompt = box('[data-figma="section · SUGGESTED PROMPT"] .panel__root')
    expect(Math.abs(prompt.getBoundingClientRect().height - 128)).toBeLessThanOrEqual(4)
  })
})
