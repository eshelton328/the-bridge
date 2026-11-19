import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The icon sizes that library beta.70 (#220) lets the page draw as Figma does, measured on the rendered svg, as the
// fidelity check's `iconSize` measures it: D4's add button (137:6, Figma 13 px, 12 here as no icon size is 13), the Send
// arrow of D5's side chat in a pane (158:549, 12 px) and M6's back row chevron (105:3178, 16 px). The other composers
// keep the paperclip and the 16 px arrow, and the tablet's back row (T3) keeps its 20 px chevron.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

/** The width and height of the one svg in a button, as drawn. */
function svgSize(button: Element | null): { w: number; h: number } {
  const svgs = button?.querySelectorAll('svg') ?? []
  const svg = svgs[0]
  if (svgs.length !== 1 || svg === undefined) throw new Error(`expected one svg, found ${String(svgs.length)}`)
  const r = svg.getBoundingClientRect()
  return { w: Math.round(r.width), h: Math.round(r.height) }
}

/** The button with this accessible name inside the element with this Figma layer. */
function buttonIn(layer: string, name: string): Element | null {
  return document.querySelector(`[data-figma="${layer}"] button[aria-label="${name}"]`)
}

describe('the icon sizes of library beta.70 (#220)', () => {
  it("draws D4's composer add button as a 12 px plus named Add", async () => {
    const { data, ui } = workspacesStates.folders
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await expect.poll(() => buttonIn('137:2', 'Add')).not.toBeNull()
    expect(buttonIn('137:2', 'Attach a file')).toBeNull()
    expect(svgSize(buttonIn('137:2', 'Add'))).toEqual({ w: 12, h: 12 })
  })

  it("keeps the paperclip in a composer without the folders control (D1's panes)", async () => {
    const { data, ui } = workspacesStates.workbench
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await expect.poll(() => document.querySelector('button[aria-label="Attach a file"]')).not.toBeNull()
    expect(document.querySelector('button[aria-label="Add"]')).toBeNull()
    expect(svgSize(document.querySelector('button[aria-label="Attach a file"]'))).toEqual({ w: 16, h: 16 })
  })

  it("draws the Send arrow of D5's side chat in a pane at 12 px, and the chat's own at 16", async () => {
    const { data, ui } = workspacesStates.sideChatInPane
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await expect.poll(() => buttonIn('158:545', 'Send')).not.toBeNull()
    expect(svgSize(buttonIn('158:545', 'Send'))).toEqual({ w: 12, h: 12 })
    const others = [...document.querySelectorAll('button[aria-label="Send"]')].filter(
      (b) => b.closest('[data-figma="158:545"]') === null,
    )
    expect(others.length).toBeGreaterThan(0)
    for (const send of others) expect(svgSize(send)).toEqual({ w: 16, h: 16 })
  })

  it("draws M6's back row chevron at 16 px on the phone and keeps T3's at 20 px", async () => {
    await page.viewport(390, 806)
    const phone = workspacesStates.phoneSubagents
    view = await testRender(<WorkspacesScreen data={phone.data} ui={phone.ui} viewport="phone" />)
    const back = page.getByRole('button', { name: 'Back to bridge themes' })
    await expect.element(back).toBeVisible()
    expect(svgSize(back.element())).toEqual({ w: 16, h: 16 })
    await view.unmount()
    await page.viewport(834, 1194)
    const tablet = workspacesStates.tabletSubagents
    view = await testRender(<WorkspacesScreen data={tablet.data} ui={tablet.ui} viewport="tablet" />)
    const tabletBack = page.getByRole('button', { name: /^Back to/ })
    await expect.element(tabletBack).toBeVisible()
    expect(svgSize(tabletBack.element())).toEqual({ w: 20, h: 20 })
  })
})
