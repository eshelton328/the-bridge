import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { subagents } from './states/subagents.ts'
import { workbench } from './states/workbench.ts'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
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
// while expanded.
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
