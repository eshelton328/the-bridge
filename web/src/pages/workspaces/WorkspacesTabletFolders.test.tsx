import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// The chat's folders on the tablet (T5): the folders sheet with the picker open under the folders.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('The folders sheet on the tablet', () => {
  it("draws each listed folder's chevron grey, under the folder's name in the text colour", async () => {
    await page.viewport(756, 1129)
    const { data, ui } = workspacesStates.tabletFolders
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="tablet" />)
    const row = page.getByRole('button', { name: 'Open Documents' })
    await expect.element(row).toBeVisible()
    const button = row.element()
    const chevron = [...button.querySelectorAll('svg')].at(-1)?.parentElement
    const name = button.querySelector('svg + span')
    if (!(chevron instanceof HTMLElement) || !(name instanceof HTMLElement)) throw new Error('The row has no chevron')
    // T5 128:610 (as D4 128:372) is #8A97B8, fg.muted, the grey of the picker's Close; the name (128:608) is fg.default.
    const close = page.getByRole('button', { name: data.folderPicker.closeLabel }).element()
    expect(getComputedStyle(chevron).color).toBe(getComputedStyle(close).color)
    expect(getComputedStyle(chevron).color).not.toBe(getComputedStyle(name).color)
  })
})
