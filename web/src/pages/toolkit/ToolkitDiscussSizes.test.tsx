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

type PageState = 'skillDiscussTablet' | 'skillDiscussPhone'

/** Renders the discussion's page on a tablet or the phone and returns the item's card. */
async function renderPage(state: PageState, viewport: 'tablet' | 'phone') {
  const { data, ui } = toolkitStates[state]
  view = await testRender(<ToolkitScreen data={data} ui={ui} viewport={viewport} />)
  const ready = '[data-figma="task · discussing"]'
  await expect.poll(() => document.querySelector(ready)).not.toBeNull()
  await document.fonts.ready
  const found = [...document.querySelectorAll<HTMLElement>(ready)].at(-1)
  if (found === undefined) throw new Error(`no ${ready}`)
  return found
}

const box = (el: Element) => el.getBoundingClientRect()

describe('the item’s card on the discussion page (T5, M7)', () => {
  // T5 464:334 is 96 high: the meta line's middle 43 under its top (464:343, 14 high at 107) and the guard's first
  // line's middle 62.5 under it (464:348, 15 px lines at 126).
  it('keeps Figma’s height and text places on a tablet (T5)', async () => {
    await page.viewport(756, 1158)
    const card = await renderPage('skillDiscussTablet', 'tablet')
    const top = box(card).top
    expect(Math.abs(box(card).height - 96)).toBeLessThanOrEqual(1)
    const [meta, guard] = [...card.querySelectorAll('p')]
    if (meta === undefined || guard === undefined) throw new Error('no meta or guard')
    expect(Math.abs(box(meta).top + box(meta).height / 2 - top - 43)).toBeLessThanOrEqual(1)
    const lineHeight = Number.parseFloat(getComputedStyle(guard).lineHeight)
    expect(Math.abs(box(guard).top + lineHeight / 2 - top - 62.5)).toBeLessThanOrEqual(2)
  })

  // M7 464:150 is 138 high, and the discussion area (464:184) starts 8 under it.
  it('keeps Figma’s height on the phone, with the area 8 under it (M7)', async () => {
    await page.viewport(390, 844)
    const card = await renderPage('skillDiscussPhone', 'phone')
    expect(Math.abs(box(card).height - 138)).toBeLessThanOrEqual(2)
    const area = [...document.querySelectorAll('[data-figma="discussion"]')].at(-1)
    if (area === undefined) throw new Error('no discussion area')
    expect(box(area).top - box(card).bottom).toBe(8)
  })
})
