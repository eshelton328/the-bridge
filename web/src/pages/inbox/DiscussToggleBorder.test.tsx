import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { InboxScreen } from './screens/InboxScreen.tsx'
import { inboxStates } from './states/index.ts'

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

// Figma draws an open Discuss violet; the library's pressed Discuss border is accent.discuss (library #138), not the
// cyan border.active of every other pressed button.
describe('the Discuss toggle', () => {
  it("draws accent.discuss while the task's discussion is open (D14)", async () => {
    await page.viewport(1512, 982)
    const { data, ui } = inboxStates.discussOpen
    view = await testRender(<InboxScreen data={data} ui={ui} viewport="desktop" />)
    const discuss = page.getByRole('button', { name: 'Discuss', exact: true, pressed: true })
    await expect.element(discuss).toBeVisible()
    expect(getComputedStyle(discuss.element()).borderTopColor).toBe(tokenColor('accent-discuss'))
  })
})
