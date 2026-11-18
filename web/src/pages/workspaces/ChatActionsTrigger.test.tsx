import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { moveToWorkspace } from './states/moveToWorkspace.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'

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

describe('the chat header ⋯ while its menu is open (D19)', () => {
  it('draws the plain chip, not the cyan border, and keeps the keyboard focus ring', async () => {
    // The desktop frame's size, so that the backdrop fits the window.
    await page.viewport(1512, 982)
    view = await testRender(<WorkspacesScreen data={moveToWorkspace.data} ui={moveToWorkspace.ui} viewport="desktop" />)
    const trigger = page.getByRole('button', { name: 'bridge themes actions' })
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true')
    const open = getComputedStyle(trigger.element())
    expect(open.borderTopColor).toBe(tokenColor('border-default'))
    expect(open.backgroundColor).toBe(tokenColor('surface-raised'))
    // Escape closes the list, then the menu, and gives the focus back to the ⋯ from the keyboard.
    await userEvent.keyboard('{Escape}')
    await userEvent.keyboard('{Escape}')
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect.element(trigger).toHaveFocus()
    expect(getComputedStyle(trigger.element()).outlineStyle).toBe('solid')
  })
})
