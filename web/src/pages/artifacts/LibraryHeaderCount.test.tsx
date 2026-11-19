import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'

// The library's count beside the page title: Figma's desktop count (D1 402:15373, D2's list) is Regular 16/20, the
// library's `PageHeader countSize="lg"` (`pageCount`), and so are the tablet's (T1 405:108) and the phone's (M1 406:72).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

async function countStyle() {
  await expect.poll(() => document.querySelector('.page-header__count')).not.toBeNull()
  const count = document.querySelector('.page-header__count')
  if (count === null) throw new Error('no count')
  const style = getComputedStyle(count)
  return { size: style.fontSize, line: style.lineHeight, weight: style.fontWeight }
}

describe("the Artifacts header's count", () => {
  for (const id of ['library', 'artifactOpen'] as const) {
    it(`is Regular 16/20 on the desktop (${id})`, async () => {
      await page.viewport(1512, 982)
      const { data, ui } = artifactsStates[id]
      view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
      expect(await countStyle()).toEqual({ size: '16px', line: '20px', weight: '400' })
    })
  }

  it('is Regular 16/20 on the tablet (libraryTablet)', async () => {
    await page.viewport(756, 1024)
    const { data, ui } = artifactsStates.libraryTablet
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="tablet" />)
    expect(await countStyle()).toEqual({ size: '16px', line: '20px', weight: '400' })
  })

  it('is Regular 16/20 on the phone (libraryPhone)', async () => {
    await page.viewport(390, 844)
    const { data, ui } = artifactsStates.libraryPhone
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="phone" />)
    expect(await countStyle()).toEqual({ size: '16px', line: '20px', weight: '400' })
  })
})
