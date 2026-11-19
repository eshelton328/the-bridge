import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The Stop of a running chat's composer, as library beta.80 (#233, #247) lets the page draw it: Figma draws a 12 px
// stop icon beside a 25 × 14 Medium label (M17 402:10850 and 402:10852, D01 105:253 and 105:255). The icon is measured
// on the rendered svg, as the fidelity check's `iconSize` measures it, and the label by the text's computed size:
// `labelXs`, 12 px, the 4 px grid's size for Figma's 11 (d-100), in place of the 14 px `label`.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

/** The width and height of the one svg in a button, as drawn. */
function svgSize(button: Element): { w: number; h: number } {
  const svgs = button.querySelectorAll('svg')
  const svg = svgs[0]
  if (svgs.length !== 1 || svg === undefined) throw new Error(`expected one svg, found ${String(svgs.length)}`)
  const r = svg.getBoundingClientRect()
  return { w: Math.round(r.width), h: Math.round(r.height) }
}

/** The computed font size of the element that holds the button's own "Stop" text. */
function labelSize(button: Element): string {
  const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if (node.textContent?.trim() === 'Stop' && node.parentElement !== null) {
      return getComputedStyle(node.parentElement).fontSize
    }
  }
  throw new Error('no Stop label in the button')
}

describe('the Stop of a running composer (library beta.80)', () => {
  it("draws M17's Stop with a 12 px icon and a 12 px label on the phone", async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneChatFull
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const stop = page.getByRole('button', { name: 'Stop' })
    await expect.element(stop).toBeVisible()
    expect(svgSize(stop.element())).toEqual({ w: 12, h: 12 })
    expect(labelSize(stop.element())).toBe('12px')
  })
})
