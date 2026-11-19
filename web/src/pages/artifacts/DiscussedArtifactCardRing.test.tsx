import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'

// The focus ring of the discussed artifact's chevron (T4), which covers the card: it uses the library's ring
// condition (`focusRing`, screen review R16), so it shows on a keyboard focus and hides on a focus after a pointer
// press, which the AppShell's tracker marks `data-focus-quiet`.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

function chevron(): HTMLElement {
  const found = document.querySelector('[data-figma="chevron · open artifact"]')
  if (!(found instanceof HTMLElement)) throw new Error('no chevron')
  return found
}

const ringStyle = (el: HTMLElement) => getComputedStyle(el, '::after').outlineStyle

describe("the discussed artifact card's focus ring", () => {
  it('shows on a keyboard focus and hides once the focus is marked quiet', async () => {
    await page.viewport(756, 1024)
    const { data, ui } = artifactsStates.discussTablet
    // No onUiChange: a press on the chevron changes nothing, so the card stays.
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="tablet" />)
    await expect.poll(() => document.querySelector('[data-figma="chevron · open artifact"]')).not.toBeNull()
    const button = chevron()
    // A key press makes the next focus a keyboard focus.
    await userEvent.keyboard('{Shift}')
    button.focus()
    await expect.poll(() => document.activeElement).toBe(button)
    expect(button.hasAttribute('data-focus-quiet')).toBe(false)
    await expect.poll(() => ringStyle(button)).toBe('solid')
    // A pointer press (a mouse pointerdown, then the focus it gives) marks the focus quiet.
    button.blur()
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }))
    button.focus()
    await expect.poll(() => button.hasAttribute('data-focus-quiet')).toBe(true)
    // The browser still matches :focus-visible (the last real input was a key), so only the mark hides the ring.
    expect(button.matches(':focus-visible')).toBe(true)
    await expect.poll(() => ringStyle(button)).toBe('none')
  })
})
