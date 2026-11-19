import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'
import type { WorkbenchPane } from './types.ts'

// A chat on the phone (M3): the header, the transcript, the skills after "/" and the composer, with no tab bar.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

// M3 with the skills closed and `text` as the draft in the message box.
function draftChat(text: string) {
  const { data, ui } = workspacesStates.phoneChat
  const panes: WorkbenchPane[] = data.panes.map((p) =>
    p.type === 'chat' ? { ...p, composer: { ...p.composer, text } } : p,
  )
  return <WorkspacesScreen data={{ ...data, panes }} ui={{ ...ui, skillsFor: null }} viewport="phone" />
}

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

describe('a chat on the phone', () => {
  it('fills the screen with no tab bar, lists the skills and keeps the focus in the message box', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Back to Workspaces' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('radio', { name: /\/writer/ })).toBeChecked()
    const box = page.getByRole('textbox')
    await expect.element(box).toHaveValue('/')
    await expect.element(box).toHaveFocus()
  })

  it('goes back to the list, and a tap on a chat opens it again', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces' }))
    await expect.element(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Home' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).not.toBeInTheDocument()
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByRole('radio', { name: /\/writer/ })).not.toBeInTheDocument()
  })

  it('keeps a typed draft after Back and a tap on the chat', async () => {
    await page.viewport(390, 844)
    view = await testRender(draftChat(''))
    await userEvent.click(page.getByRole('textbox'))
    await userEvent.keyboard('half a thought')
    await userEvent.click(page.getByRole('button', { name: 'Back to Workspaces' }))
    await userEvent.click(page.getByRole('button', { name: 'bridge themes', exact: true }))
    await expect.element(page.getByRole('textbox')).toHaveValue('half a thought')
  })

  it('keeps the caret where the owner put it when "/" at the start of a draft lists the skills', async () => {
    await page.viewport(390, 844)
    view = await testRender(draftChat('layouts'))
    const box = page.getByRole('textbox')
    await userEvent.click(box)
    const area = box.element()
    if (!(area instanceof HTMLTextAreaElement)) throw new Error('the message box is not a textarea')
    area.setSelectionRange(0, 0)
    await userEvent.keyboard('/')
    await expect.element(page.getByRole('radio', { name: /\/writer/ })).toBeVisible()
    await userEvent.keyboard('writer ')
    await expect.element(box).toHaveValue('/writer layouts')
    expect(area.selectionStart).toBe(8)
    expect(area.selectionEnd).toBe(8)
  })

  it('lets the owner tab from the composer into the skills after "/" and keeps the focus there', async () => {
    await page.viewport(390, 844)
    view = await testRender(draftChat(''))
    const box = page.getByRole('textbox')
    await userEvent.click(box)
    await userEvent.keyboard('/')
    const writer = page.getByRole('radio', { name: /\/writer/ })
    await expect.element(writer).toBeVisible()
    await expect.element(box).toHaveFocus()
    // The composer's buttons, then the list.
    await userEvent.keyboard('{Tab}{Tab}{Tab}{Tab}')
    const list = page.getByRole('radiogroup', { name: 'SKILLS' })
    await expect.poll(() => list.element().contains(document.activeElement)).toBe(true)
    await expect.element(box).not.toHaveFocus()
  })

  it('shrinks the header to one line while the keyboard is up (M10)', async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneKeyboard
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(page.getByRole('heading', { name: 'bridge themes' })).toBeVisible()
    await expect.element(page.getByText('Opus 5.5 · 42% · 2 folders')).toBeVisible()
    await expect.element(page.getByText('omni-brain', { exact: true })).not.toBeInTheDocument()
    await expect.element(page.getByText('context', { exact: true })).not.toBeInTheDocument()
    await expect.element(page.getByText('SKILLS MATCHING /wri')).toBeVisible()
    await expect.element(page.getByRole('radio', { name: /\/writer/ })).toBeChecked()
    const box = page.getByRole('textbox')
    await expect.element(box).toHaveValue('Turn the layout notes into a doc with /wri')
    await expect.element(box).toHaveFocus()
  })
})
