import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'
import { sideChat } from './states/sideChat.ts'
import { subagents } from './states/subagents.ts'
import { workbench } from './states/workbench.ts'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

// The colour a token resolves to, as the browser computes it.
function tokenColor(token: string): string {
  const probe = document.createElement('div')
  probe.style.color = `var(--colors-${token})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

// The border rule: a trigger draws border.active while its menu is open, and a disclosure toggle keeps its own border
// while expanded. A selected toggle draws border.selected (below).
describe('the borders of open controls', () => {
  it('draws the bare pane ⋯ with border.active while its menu is open (D1)', async () => {
    await page.viewport(1512, 982)
    view = await testRender(<WorkspacesScreen data={workbench.data} ui={workbench.ui} viewport="desktop" />)
    const trigger = page.getByRole('button', { name: 'bridge themes actions', expanded: true })
    await expect.element(trigger).toBeInTheDocument()
    expect(getComputedStyle(trigger.element()).borderTopColor).toBe(tokenColor('border-active'))
  })

  it('keeps the default border on Hide transcript while the transcript is open (D3)', async () => {
    await page.viewport(1512, 982)
    // D3's New chat form is closed here: its modal dialog hides the panel from the accessibility tree.
    const ui = { ...subagents.ui, newChatOpen: false }
    view = await testRender(<WorkspacesScreen data={subagents.data} ui={ui} viewport="desktop" />)
    const toggle = page.getByRole('button', { name: 'Hide transcript' })
    await expect.element(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(getComputedStyle(toggle.element()).borderTopColor).toBe(tokenColor('border-default'))
  })
})

// A selected toggle (aria-pressed, not a trigger) follows its Figma frame where that is a token: the open sidebar's
// toggle (D2 158:6, #5ee1ff at about 0.6), the workspace's own folder chip (M7 128:30, at 0.6) and the sheet's
// chosen recent folder (M8 128:766, at 0.5) draw border.selected (`pressedBorder="selected"`), not the pressed
// border.active, in both modes. In light mode the two tokens are the same colour, so only dark mode tells them apart.
describe.each(['dark', 'light'] as const)('the borders of selected toggles (%s)', (mode) => {
  beforeEach(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
  })

  afterEach(() => {
    document.documentElement.classList.add('dark')
  })

  it('draws the open sidebar toggle with border.selected (D2)', async () => {
    await page.viewport(1512, 982)
    view = await testRender(<WorkspacesScreen data={sideChat.data} ui={sideChat.ui} viewport="desktop" />)
    const toggle = page.getByRole('button', { name: 'Hide the workspace sidebar' })
    await expect.element(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(getComputedStyle(toggle.element()).borderTopColor).toBe(tokenColor('border-selected'))
  })

  it("draws New chat's own folder chip with border.selected (M7)", async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneNewChat
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const chip = page.getByRole('button', { name: '~/the-bridge', exact: true })
    await expect.element(chip).toHaveAttribute('aria-pressed', 'true')
    expect(getComputedStyle(chip.element()).borderTopColor).toBe(tokenColor('border-selected'))
  })

  it("draws the folders sheet's chosen recent folder with border.selected (M8)", async () => {
    await page.viewport(390, 806)
    const { data, ui } = workspacesStates.phoneFolders
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    const sheet = page.getByRole('dialog', { name: 'Folders' })
    const row = sheet.getByRole('button', { name: /^~\/the-bridge/, pressed: true })
    await expect.element(row).toBeVisible()
    expect(getComputedStyle(row.element()).borderTopColor).toBe(tokenColor('border-selected'))
  })
})
