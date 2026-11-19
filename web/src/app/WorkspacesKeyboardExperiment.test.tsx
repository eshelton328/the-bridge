import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { installKeyboardExperiment } from './keyboardExperiment.ts'
import { readSample } from './keyboardTrace.ts'
import { routeTree } from './routeTree.gen.ts'

// The keyboard experiments on the owner's path (screen review R27): the phone's Workspaces list, a tap on a chat, a
// tap on its composer. Desktop Chromium has no iOS keyboard and no iOS scroll into view, so this proves that the tap
// on the real composer is taken, focuses the composer (for 'proxy', after the proxy) and leaves the document
// unscrolled; only the phone can show whether iOS still slides the page.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
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

async function openChatComposer(): Promise<HTMLTextAreaElement> {
  await setViewport(390, 844)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/workspaces'] }) })
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

describe('the keyboard experiments on the Workspaces chat, from the list', () => {
  for (const experiment of ['prevent', 'proxy'] as const)
    it(`${experiment}: a tap on the composer focuses it with no document scroll`, async () => {
      const field = await openChatComposer()
      onTestFinished(installKeyboardExperiment({ current: () => experiment, proxyWaitMs: 30 }))
      const end = tap(field)
      expect(end.defaultPrevented).toBe(true)
      // Inside the tap's own handler: the composer (prevent) or the proxy (proxy) already has the focus.
      const first = document.activeElement
      if (experiment === 'prevent') expect(first).toBe(field)
      else expect(first?.hasAttribute('data-keyboard-experiment-proxy')).toBe(true)
      await expect.poll(() => document.activeElement).toBe(field)
      expect(document.querySelector('[data-keyboard-experiment-proxy]')).toBeNull()
      expect(readSample('raf', null)).toMatchObject({ scrollY: 0, scrollTop: 0 })
      await userEvent.keyboard('ok')
      expect(field.value).toContain('ok')
    })
})
