import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'

// Figma draws the search focused while Erik types (D4 403:7799, M5 408:50), so those states open with the focus in
// the search field; the library without a search leaves the focus where it is.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

function searchbox() {
  return document.querySelector('input[type="search"]')
}

describe('the Artifacts search focus', () => {
  it('opens D4 (searchList) with the focus in the search', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = artifactsStates.searchList
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
    await expect.poll(() => searchbox() !== null && document.activeElement === searchbox()).toBe(true)
  })

  it('opens M5 (searchPhone) with the focus in the search', async () => {
    await page.viewport(390, 844)
    const { data, ui } = artifactsStates.searchPhone
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="phone" />)
    await expect.poll(() => searchbox() !== null && document.activeElement === searchbox()).toBe(true)
  })

  it('leaves the focus out of the search in M1 (libraryPhone)', async () => {
    await page.viewport(390, 844)
    const { data, ui } = artifactsStates.libraryPhone
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="phone" />)
    await expect.poll(() => searchbox()).not.toBeNull()
    expect(document.activeElement).not.toBe(searchbox())
  })
})
