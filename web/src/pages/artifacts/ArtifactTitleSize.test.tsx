import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'

// The open artifact's title: Figma draws it SemiBold 26 on the desktop (D2 403:465, a 34 px box), which is the
// library's `headingSm` (26/36, beta.71), and 28 on the tablet (T2 405:433, Figma's heading, 28/41), `heading`.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

function titleType(): { size: string; weight: string; height: number } {
  const el = document.querySelector<HTMLElement>('[data-figma="title block"] h2')
  if (el === null) throw new Error('no title')
  const style = getComputedStyle(el)
  return { size: style.fontSize, weight: style.fontWeight, height: Math.round(el.getBoundingClientRect().height) }
}

describe('the open artifact title', () => {
  it('is headingSm, 26/36, on the desktop (D2)', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = artifactsStates.artifactOpen
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
    expect(titleType()).toEqual({ size: '26px', weight: '600', height: 36 })
  })

  it('stays heading, 28/40, on the tablet (T2)', async () => {
    await page.viewport(756, 1024)
    const { data, ui } = artifactsStates.artifactTablet
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="tablet" />)
    expect(titleType()).toEqual({ size: '28px', weight: '600', height: 40 })
  })
})
