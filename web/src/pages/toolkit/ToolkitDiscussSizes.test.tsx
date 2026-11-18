import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ToolkitScreen } from './screens/ToolkitScreen.tsx'
import { toolkitStates } from './states/index.ts'

// Sizes of the discussion's parts that the blind review measured against Figma (D5, T5, M7). The app's styles and
// fonts load as in main.ts, so the test measures the real text. The fidelity check allows 4 px.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

type DiscussState = 'skillDiscuss'

async function renderDiscuss(state: DiscussState, viewport: 'desktop' | 'tablet' | 'phone', ready: string) {
  const { data, ui } = toolkitStates[state]
  view = await testRender(<ToolkitScreen data={data} ui={ui} viewport={viewport} />)
  await expect.poll(() => document.querySelector(ready)).not.toBeNull()
  await document.fonts.ready
  const found = [...document.querySelectorAll<HTMLElement>(ready)].at(-1)
  if (found === undefined) throw new Error(`no ${ready}`)
  return found
}

describe('the discussion panel’s context row (D5)', () => {
  // 438:19: "toolkit/skills/writer/ attached" is Geist Mono 12, 224 × 17.
  it('draws the attached path in mono 12, as wide as Figma’s', async () => {
    await page.viewport(1512, 982)
    const context = await renderDiscuss('skillDiscuss', 'desktop', '[data-figma="context"]')
    const path = [...context.querySelectorAll('span')].find((s) => s.textContent === 'toolkit/skills/writer/ attached')
    expect(path).toBeDefined()
    if (path === undefined) return
    const text = document.createRange()
    text.selectNodeContents(path)
    expect(getComputedStyle(path).fontSize).toBe('12px')
    expect(Math.abs(text.getBoundingClientRect().width - 224)).toBeLessThanOrEqual(4)
  })
})
