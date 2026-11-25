import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../../lib/testRender.ts'
import { chatWithReply } from './richTextData.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A reply with a brain image asks the image route for it, on the owner's path: a tap on the chat in the phone list,
// and the chat on a tablet. An outside image stays its alt text. The test server has no image route, so the picture
// says it did not load; the library's ImageFigure stories show a picture that loads. The text is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const reply = [
  'The weekly builds:',
  '',
  '![Build chart](images/chart.png)',
  '',
  'And ![a web picture](https://example.com/a.png).',
].join('\n')

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await unmountRendered()
  await page.viewport(1512, 982)
})

async function expectImage() {
  await expect.poll(() => document.querySelector('.image-figure__root'), { timeout: 10000 }).not.toBeNull()
  await expect.element(page.getByRole('status')).toHaveTextContent('This image did not load: Build chart')
  // Only the brain image was asked for, and only from the image route; the web picture is its alt text.
  const asked = performance
    .getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((name) => name.includes('chart.png') || name.includes('example.com'))
    .map((name) => {
      const url = new URL(name)
      return url.origin === window.location.origin ? url.pathname + url.search : name
    })
  expect(asked).toEqual(['/api/files/raw?root=brain&path=images%2Fchart.png'])
  await expect.element(page.getByText(/And a web picture\./)).toBeVisible()
  const column = document.querySelector('.image-figure__root')?.closest('.markdown-view')
  if (!(column instanceof HTMLElement)) throw new Error('no MarkdownView')
  expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth)
}

describe('a brain image in a reply', () => {
  it('asks the image route after a tap on the chat in the phone list', async () => {
    await page.viewport(390, 806)
    performance.clearResourceTimings()
    const { ui } = workspacesStates.phoneTapChat
    view = await testRender(<WorkspacesScreen data={chatWithReply(reply)} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expectImage()
  })
  it('asks the image route in the chat on a tablet', async () => {
    await page.viewport(1024, 1366)
    performance.clearResourceTimings()
    const { ui } = workspacesStates.phoneTapChat
    view = await testRender(<WorkspacesScreen data={chatWithReply(reply)} ui={ui} viewport="tablet" />)
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expectImage()
  })
})
