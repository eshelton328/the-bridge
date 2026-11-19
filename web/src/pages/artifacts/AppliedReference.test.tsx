import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'

// After Apply, D9's chart draws a dashed line at the median pass rate with its label "median 71%" (452:3705,
// 452:3706), through the library's `Thumbnail reference`. Before Apply (D8) the chart has no line.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

// No other text on D8 or D9 holds "median 71%": the proposal's line says "the median pass rate, 71%".
const text = () => document.body.textContent

describe("the open artifact's chart reference line", () => {
  it('shows "median 71%" after Apply (changeApplied, D9)', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = artifactsStates.changeApplied
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
    await expect.poll(text).toContain('median 71%')
  })

  it('shows no line before Apply (changeProposed, D8)', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = artifactsStates.changeProposed
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
    await expect.poll(text).toContain('the median pass rate, 71%')
    expect(text()).not.toContain('median 71%')
  })
})
