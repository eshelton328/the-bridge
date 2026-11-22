import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { setViewport } from '../lib/rendering.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { installKeyboardProxy } from './keyboardProxy.ts'
import { readSample } from './keyboardTrace.ts'
import { routeTree } from './routeTree.gen.ts'

// The composer's proxy focus on the owner's path (screen reviews R27 and R37): the phone's Workspaces list, a tap on a
// chat, a tap on its composer. Desktop Chromium has no iOS keyboard and no iOS scroll into view, so this proves that the
// tap on the real composer is taken, focuses the composer after the proxy, expands it at the tap and leaves the
// document unscrolled; only the phone can show whether iOS still slides the page.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await setViewport(1512, 982)
})

/** A finger's tap on the composer as iOS sends it, then the click the browser would send if the touchend went on. */
function tap(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }))
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'touch' }))
  const end = new Event('touchend', { bubbles: true, cancelable: true })
  el.dispatchEvent(end)
  return end
}

/** A sample chat of the home (?source=fixtures), as the home reads the live source in development (d-117). */
async function openChatComposer(): Promise<HTMLTextAreaElement> {
  await setViewport(390, 844)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/workspaces?source=fixtures'] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  const chat = page.getByText('bridge themes', { exact: true })
  await expect.element(chat).toBeVisible()
  await userEvent.click(chat)
  await expect.poll(() => document.querySelector('.scroll-frame__footer textarea')).not.toBeNull()
  const field = document.querySelector('.scroll-frame__footer textarea')
  if (!(field instanceof HTMLTextAreaElement)) throw new Error('no composer')
  return field
}

describe('the proxy focus on the Workspaces chat, from the list', () => {
  it('a tap on the composer focuses it through the proxy with no document scroll', async () => {
    const field = await openChatComposer()
    onTestFinished(installKeyboardProxy({ proxyWaitMs: 30 }))
    const end = tap(field)
    expect(end.defaultPrevented).toBe(true)
    // Inside the tap's own handler the proxy already has the focus.
    expect(document.activeElement?.hasAttribute('data-keyboard-proxy')).toBe(true)
    await expect.poll(() => document.activeElement).toBe(field)
    expect(document.querySelector('[data-keyboard-proxy]')).toBeNull()
    expect(readSample('raf', null)).toMatchObject({ scrollY: 0, scrollTop: 0 })
    await userEvent.keyboard('ok')
    expect(field.value).toContain('ok')
  })

  it('a tap on the composer box, not on its one-line field, focuses the field with no document scroll', async () => {
    const field = await openChatComposer()
    const box = field.closest('[data-keyboard-keep]')
    if (box === null) throw new Error('no composer box')
    // The box the owner sees is far taller than the field's one line: most of a tap's area is the box.
    expect(box.getBoundingClientRect().height).toBeGreaterThan(field.getBoundingClientRect().height * 2)
    onTestFinished(installKeyboardProxy({ proxyWaitMs: 30 }))
    const end = tap(box)
    expect(end.defaultPrevented).toBe(true)
    await expect.poll(() => document.activeElement).toBe(field)
    expect(readSample('raf', null)).toMatchObject({ scrollY: 0, scrollTop: 0 })
  })
})
