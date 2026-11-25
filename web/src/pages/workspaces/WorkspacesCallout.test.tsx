import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../../lib/testRender.ts'
import { chatWithReply } from './richTextData.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// A reply with GitHub alerts draws each as the library's Callout, on the owner's path: a tap on the chat in the phone
// list, and the chat on a tablet. A quote with no alert tag stays a quote. The text is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const reply = [
  '> [!WARNING]',
  '> Back up the brain before the move.',
  '',
  '> [!TIP]',
  '> Run **ncc check** after it.',
  '',
  '> A plain quote.',
].join('\n')

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await unmountRendered()
  await page.viewport(1512, 982)
})

async function expectCallouts() {
  const warning = page.getByRole('note', { name: 'Warning' })
  await expect.element(warning).toBeVisible()
  expect(warning.element().textContent).toContain('Back up the brain before the move.')
  expect(warning.element().textContent).not.toContain('[!WARNING]')
  const tip = page.getByRole('note', { name: 'Tip' })
  await expect.element(tip).toBeVisible()
  await expect.element(tip.getByText('ncc check')).toBeVisible()
  expect(tip.element().querySelector('strong')?.textContent).toBe('ncc check')
  // The quote with no tag stays a blockquote, outside any callout.
  const plain = [...document.querySelectorAll('blockquote')].find((quote) =>
    quote.textContent.includes('A plain quote.'),
  )
  expect(plain?.closest('[role=note]')).toBeNull()
  expect(document.querySelectorAll('[role=note]')).toHaveLength(2)
}

describe('GitHub alerts in a reply', () => {
  it('draw as callouts after a tap on the chat in the phone list', async () => {
    await page.viewport(390, 806)
    const { ui } = workspacesStates.phoneTapChat
    view = await testRender(<WorkspacesScreen data={chatWithReply(reply)} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expectCallouts()
  })
  it('draw as callouts in the chat on a tablet', async () => {
    await page.viewport(1024, 1366)
    const { ui } = workspacesStates.phoneTapChat
    view = await testRender(<WorkspacesScreen data={chatWithReply(reply)} ui={ui} viewport="tablet" />)
    const row = page.getByRole('button', { name: 'bridge themes', exact: true })
    if (row.elements().length > 0) await userEvent.click(row)
    await expectCallouts()
  })
})
