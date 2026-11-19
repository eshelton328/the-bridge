import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Library beta.68 (#213, screen review R19): while the on-screen keyboard is up, a touch tap in the shell that is not on
// a field and not inside `[data-keyboard-keep]` only closes the keyboard, and its click is swallowed. The page controls
// a user taps while typing carry the mark: the Workspaces composer (its model chip, folders and attachments), and the
// Inbox and Artifacts search rows (Sort and Filter). Through the real routes, with the keyboard raised as iOS Safari
// raises it, each tap does its own action. The app's styles and fonts load as in main.ts.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

// A stand-in for window.visualViewport that the test moves as iOS Safari does when its keyboard opens: the layout keeps
// its height, and only the visual viewport shrinks (as in WorkspacesChatDock.test.tsx).
class FakeViewport extends EventTarget {
  height = document.documentElement.clientHeight
  width = document.documentElement.clientWidth
  offsetTop = 0
  offsetLeft = 0
  scale = 1
  move(change: { height: number }) {
    this.height = change.height
    this.dispatchEvent(new Event('resize'))
  }
}

function replaceVisualViewport(value: FakeViewport) {
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value })
  onTestFinished(() => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  })
}

/** A finger's tap: a touch press and release, then the click the browser sends after it. */
function tap(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }))
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'touch' }))
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

/**
 * Renders `url` at `size`, focuses the field `field` and raises a keyboard that leaves `keyboardTop` px of the window.
 * Returns the field once the shell has docked on the keyboard.
 */
async function typing(url: string, size: readonly [number, number], field: string, keyboardTop: number) {
  await page.viewport(size[0], size[1])
  const viewport = new FakeViewport()
  replaceVisualViewport(viewport)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [url] }) })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  // The render's root fills the window, as `#root` does in index.css. Earlier tests leave their renders.
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  const shell = root.querySelector<HTMLElement>('.app-shell__root')
  await expect.poll(() => shell?.querySelector(field)).not.toBeNull()
  await document.fonts.ready
  const input = shell?.querySelector<HTMLElement>(field)
  if (!shell || !input) throw new Error('no shell or field')
  await userEvent.click(input)
  viewport.move({ height: keyboardTop })
  await expect.poll(() => shell.style.getPropertyValue('--app-shell-keyboard')).not.toBe('')
  return input
}

describe('a tap on a page control while the keyboard is up (R19)', () => {
  it('opens the model menu from the Workspaces composer on the tablet and keeps the message box focused (T6)', async () => {
    const field = await typing('/workspaces?state=tabletOneChat', [756, 1158], '.scroll-frame__footer textarea', 800)
    const chip = field.closest('.scroll-frame__footer')?.querySelector('button[aria-label="Model: Opus 5.5"]')
    if (!chip) throw new Error('no model chip')
    tap(chip)
    await expect.poll(() => chip.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(field)
  })

  it('keeps the message box focused when the Workspaces composer’s attachment is removed on the tablet (T6)', async () => {
    const field = await typing('/workspaces?state=tabletOneChat', [756, 1158], '.scroll-frame__footer textarea', 800)
    tap(page.getByRole('button', { name: 'Remove requirements.md' }).element())
    await new Promise((resolve) => {
      window.setTimeout(resolve, 200)
    })
    expect(document.activeElement).toBe(field)
  })

  it('keeps the message box focused on a tap in the Workspaces composer around the box on the phone (M10)', async () => {
    const field = await typing('/workspaces?state=phoneKeyboard', [390, 844], '.scroll-frame__footer textarea', 544)
    const box = field.closest('[role="combobox"]')
    if (box === null) throw new Error('no composer box')
    tap(box)
    await new Promise((resolve) => {
      window.setTimeout(resolve, 200)
    })
    expect(document.activeElement).toBe(field)
  })

  it('keeps the message box focused on a tap on a skill in the list after "/" on the phone (M10)', async () => {
    const field = await typing('/workspaces?state=phoneKeyboard', [390, 844], '.scroll-frame__footer textarea', 544)
    // The list is a popover outside the shell, so the shell's rule does not reach it.
    tap(page.getByText('/writer', { exact: true }).element())
    await new Promise((resolve) => {
      window.setTimeout(resolve, 200)
    })
    expect(document.activeElement).toBe(field)
  })

  it('opens the Inbox Sort sheet from the phone’s search row', async () => {
    await typing('/inbox?state=list', [390, 844], 'input[type="search"], input', 544)
    tap(page.getByRole('button', { name: 'Sort', exact: true }).element())
    await expect.element(page.getByRole('dialog', { name: 'Sort' })).toBeVisible()
  })

  it('opens the Inbox Filter sheet from the phone’s search row', async () => {
    await typing('/inbox?state=list', [390, 844], 'input[type="search"], input', 544)
    tap(page.getByRole('button', { name: 'Filter', exact: true }).element())
    await expect.element(page.getByRole('dialog', { name: 'Filter' })).toBeVisible()
  })

  it('opens the Artifacts Sort sheet from the phone’s search row', async () => {
    await typing('/artifacts', [390, 844], 'input', 544)
    tap(page.getByRole('button', { name: 'Sort: Newest' }).element())
    await expect.element(page.getByRole('dialog', { name: 'Sort by' })).toBeVisible()
  })

  it('opens the Artifacts Filter sheet from the phone’s search row', async () => {
    await typing('/artifacts', [390, 844], 'input', 544)
    tap(page.getByRole('button', { name: 'Filter', exact: true }).element())
    await expect.element(page.getByRole('dialog', { name: 'Filter' })).toBeVisible()
  })
})
