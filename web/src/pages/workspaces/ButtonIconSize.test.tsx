import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The library's `Button` draws every icon at 16 unless it has `keepIconSize`. The page's buttons pass it, so each
// icon draws at its Figma size: the phone chat's back chevron at 20 (M3 105:2750), Copy under a reply at 12 (M3,
// D2 `icon/copy`) and the chat header's ⋯ at 12 (D2 400:7).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

// The rendered box of the one svg in a button.
function svgBox(button: Element) {
  const svgs = button.querySelectorAll('svg')
  expect(svgs).toHaveLength(1)
  const [svg] = svgs
  if (svg === undefined) throw new Error('the button has no svg')
  const { width, height } = svg.getBoundingClientRect()
  return { width, height }
}

describe('the icons in the page buttons', () => {
  it('draw the phone chat back chevron at 20 and Copy at 12 (M3)', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const back = page.getByRole('button', { name: 'Back to Workspaces' })
    await expect.element(back).toBeVisible()
    expect(svgBox(back.element())).toEqual({ width: 20, height: 20 })
    const copy = page.getByRole('button', { name: 'Copy' })
    await expect.element(copy).toBeVisible()
    expect(svgBox(copy.element())).toEqual({ width: 12, height: 12 })
  })

  it("draws the chat header's actions ⋯ at 12 (D2)", async () => {
    const { data, ui } = workspacesStates.sideChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    const actions = page.getByRole('button', { name: 'bridge themes actions' })
    await expect.element(actions).toBeVisible()
    expect(svgBox(actions.element())).toEqual({ width: 12, height: 12 })
  })
})
