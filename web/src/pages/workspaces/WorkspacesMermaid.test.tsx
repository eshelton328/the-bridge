import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { MarkdownText } from '../../blocks/MarkdownText.tsx'
import { testRender, unmountRendered } from '../../lib/testRender.ts'
import { chatWithReply } from './richTextData.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A reply that holds a mermaid fence draws a diagram, on the owner's path: a tap on the chat in the phone list, and the
// chat in its pane on a tablet. The text is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const reply = ['Here is the flow:', '', '```mermaid', 'flowchart LR', '  A[Prompt] --> B[Send]', '```'].join('\n')

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await unmountRendered()
  await page.viewport(1512, 982)
})

async function expectDiagram() {
  const figure = page.getByRole('figure', { name: 'Mermaid' })
  await expect.element(figure).toBeVisible()
  const img = figure.getByRole('img', { name: /Mermaid diagram/ })
  await expect.element(img, { timeout: 15000 }).toBeVisible()
  expect(img.element().getAttribute('src')).toMatch(/^blob:/)
  // No script or foreign content in the page from the diagram: it is an image.
  expect(document.querySelector('.diagram-frame__body svg')).toBeNull()
  await userEvent.click(figure.getByRole('button', { name: 'Show source' }))
  await expect.element(figure.getByText(/A\[Prompt\] --> B\[Send\]/)).toBeVisible()
}

describe('a mermaid block in a reply', () => {
  it('draws again when the colour mode changes', async () => {
    const root = document.documentElement
    root.classList.add('dark')
    try {
      view = await testRender(
        <MarkdownText text={['```mermaid', 'flowchart LR', '  A[Prompt] --> B[Send]', '```'].join('\n')} />,
      )
      const img = page.getByRole('figure', { name: 'Mermaid' }).getByRole('img')
      await expect.element(img, { timeout: 15000 }).toBeVisible()
      const darkUrl = img.element().getAttribute('src')
      root.classList.remove('dark')
      await expect.poll(() => img.element().getAttribute('src'), { timeout: 15000 }).not.toBe(darkUrl)
      await expect.element(img).toBeVisible()
    } finally {
      root.classList.add('dark')
    }
  })

  it('draws as a diagram after a tap on the chat in the phone list', async () => {
    await page.viewport(390, 806)
    const { ui } = workspacesStates.phoneTapChat
    view = await testRender(<WorkspacesScreen data={chatWithReply(reply)} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expectDiagram()
  })
  it('draws as a diagram in the chat pane on a tablet', async () => {
    await page.viewport(1024, 1366)
    const { ui } = workspacesStates.phoneTapChat
    view = await testRender(<WorkspacesScreen data={chatWithReply(reply)} ui={ui} viewport="tablet" />)
    // The tablet shows the list beside the open chat; the owner taps the chat's row.
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expectDiagram()
  })
})
