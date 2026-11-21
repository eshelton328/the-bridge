import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { clickNow, holdTimers } from '../lib/holdTimers.ts'
import { afterRendering, renderedUntil } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Copy link on an open artifact puts the artifact's address on the clipboard
// at every width: the bar's button beside the list (D2), the tablet's icon
// in the Back bar (T2) and the phone's button under Open artifact (M2). The
// clipboard is swapped for a fake, as the Inbox's and Toolkit's copy tests do.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(() => {
  resetAllStores()
})

// The address the artifact's link opens (artifactOpen.ts, `https://` before the link the page shows).
const link = 'https://claude.ai/artifact/8f3c2a91-skill-evals'

/** Swaps the clipboard's writeText for a fake for this test, and returns what it was given. */
function fakeClipboard(): string[] {
  const copied: string[] = []
  const { clipboard } = navigator
  const writeText = clipboard.writeText.bind(clipboard)
  clipboard.writeText = (text) => {
    copied.push(text)
    return Promise.resolve()
  }
  onTestFinished(() => {
    clipboard.writeText = writeText
  })
  return copied
}

/** The button whose accessible name is `name` now, or null. */
function buttonNamed(name: string): Element | null {
  return page.getByRole('button', { name, exact: true }).query()
}

/** Whether a status region says `text`. */
function statusSays(text: string): boolean {
  return page.getByRole('status').filter({ hasText: text }).query() !== null
}

/** Swaps the clipboard's writeText for one that rejects with `error` for this test. */
function rejectingClipboard(error: Error): void {
  const { clipboard } = navigator
  const writeText = clipboard.writeText.bind(clipboard)
  clipboard.writeText = () => Promise.reject(error)
  onTestFinished(() => {
    clipboard.writeText = writeText
  })
}

/** Renders the app at /artifacts, as it opens, and opens the artifact of the card (D1, T1) or row (M1) titled `title`. */
async function openFromLibrary(layout: 'desktop' | 'tablet' | 'phone', width: number, height: number, title: string) {
  await page.viewport(width, height)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/artifacts'] }) })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  const item = layout === 'phone' ? 'artifact row' : 'artifact card'
  const opener = () => document.querySelector(`[data-figma="${item} · ${title}"] button`)
  await expect.poll(opener).not.toBeNull()
  const button = opener()
  if (!(button instanceof HTMLElement)) throw new Error(`no ${item} for ${title}`)
  await userEvent.click(button)
  await expect.poll(() => document.querySelector('[data-figma="title block"] h2')?.textContent).toBe(title)
}

describe('Copy link on an open artifact', () => {
  it.each([
    ['D2', 'artifactOpen', 1512, 982],
    ['T2', 'artifactTablet', 756, 1158],
    ['M2', 'artifactPhone', 390, 844],
  ] as const)('%s copies the artifact’s link', async (_frame, state, width, height) => {
    const copied = fakeClipboard()
    await page.viewport(width, height)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [`/artifacts?state=${state}`] }),
    })
    const view = await testRender(<RouterProvider router={router} />)
    onTestFinished(view.unmount)
    await page.getByRole('button', { name: 'Copy link' }).click()
    await expect.poll(() => copied).toEqual([link])
  })
})

// The owner's path (the owner's report from the phone): /artifacts as the app opens
// it (home.ts, the library), a press on a card (D1, T1) or a row (M1), which
// opens the artifact beside the list (desktop) or as its own page (tablet,
// phone), then Copy link. Every artifact in the library is a link, so each
// card's artifact copies its own link.
describe('Copy link on an artifact opened from the library', () => {
  const cases = [
    ['desktop', 1512, 982, 'Skill eval pass rates', 'https://claude.ai/artifact/8f3c2a91-skill-evals'],
    ['tablet', 756, 1158, 'Skill eval pass rates', 'https://claude.ai/artifact/8f3c2a91-skill-evals'],
    ['phone', 390, 844, 'Skill eval pass rates', 'https://claude.ai/artifact/8f3c2a91-skill-evals'],
    ['desktop', 1512, 982, 'Hono server spike', 'https://hono-spike.example.com/rpc'],
    ['phone', 390, 844, 'Logo options', 'https://claude.ai/artifact/c2e57a14-logo-options'],
  ] as const

  it.each(cases)('on a %s (%i × %i), %s copies its link', async (layout, width, height, title, expected) => {
    const copied = fakeClipboard()
    await page.viewport(width, height)
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/artifacts'] }) })
    const view = await testRender(<RouterProvider router={router} />)
    onTestFinished(view.unmount)
    // A card on the desktop and tablet (D1, T1), a row on the phone (M1).
    const item = layout === 'phone' ? 'artifact row' : 'artifact card'
    const opener = () => document.querySelector(`[data-figma="${item} · ${title}"] button`)
    await expect.poll(opener).not.toBeNull()
    const button = opener()
    if (!(button instanceof HTMLElement)) throw new Error(`no ${item} for ${title}`)
    await userEvent.click(button)
    // The artifact opens: beside the list on the desktop, as its own page on a tablet or phone.
    await expect.poll(() => document.querySelector('[data-figma="title block"] h2')?.textContent).toBe(title)
    await page.getByRole('button', { name: 'Copy link' }).click()
    await expect.poll(() => copied).toEqual([expected])
  })
})

// Copy link says what happened, on the control itself (audit W-6): "Copied"
// or "Copy failed" for about 2 s, then "Copy link" again, at the same size,
// and a status region says it to a screen reader. The owner's path: /artifacts
// with no ?state=, a press on the card or row, then Copy link.
describe('Copy link says whether it copied', () => {
  const layouts = [
    ['desktop', 1512, 982],
    ['tablet', 756, 1158],
    ['phone', 390, 844],
  ] as const
  const title = 'Skill eval pass rates'

  it.each(layouts)('on a %s (%i × %i) it shows Copied, then Copy link again', async (layout, width, height) => {
    const copied = fakeClipboard()
    await openFromLibrary(layout, width, height, title)
    const control = page.getByRole('button', { name: 'Copy link' })
    const button = control.element()
    const before = button.getBoundingClientRect()
    // "Copied" waits for the test's clock, not the runner's (lib/holdTimers.ts). Until the test moves that clock, no
    // step is a Vitest action or poll, which would move it too: the press is a DOM click and each wait counts
    // rendering steps (lib/rendering.ts).
    const release = holdTimers()
    clickNow(button)
    await renderedUntil(() => copied.length > 0)
    expect(copied).toEqual(['https://claude.ai/artifact/8f3c2a91-skill-evals'])
    // The same control now reads Copied.
    await renderedUntil(() => buttonNamed('Copied') === button)
    await renderedUntil(() => statusSays('Copied'))
    // The label changes inside the button's own box, so the bar does not jump.
    const during = button.getBoundingClientRect()
    expect([during.width, during.height]).toEqual([before.width, before.height])
    // The label's 2 s starts in an effect after the render that shows it: wait for that timer before the clock moves.
    await renderedUntil(() => vi.getTimerCount() > 0)
    // It still reads Copied 1.5 s after the press, and Copy link again at 2 s.
    vi.advanceTimersByTime(1500)
    await afterRendering()
    expect(buttonNamed('Copied')).toBe(button)
    vi.advanceTimersByTime(500)
    await renderedUntil(() => buttonNamed('Copy link') === button)
    release()
  })

  it('on a phone with a clipboard that rejects, it shows Copy failed and reports the error', async () => {
    clearReports()
    onTestFinished(clearReports)
    const broken = new Error('the clipboard broke')
    rejectingClipboard(broken)
    await openFromLibrary('phone', 390, 844, title)
    const control = page.getByRole('button', { name: 'Copy link' })
    const button = control.element()
    const before = button.getBoundingClientRect()
    // "Copy failed" waits for the test's clock, as "Copied" does above.
    const release = holdTimers()
    clickNow(button)
    await renderedUntil(() => buttonNamed('Copy failed') === button)
    await renderedUntil(() => statusSays('Copy failed'))
    const during = button.getBoundingClientRect()
    expect([during.width, during.height]).toEqual([before.width, before.height])
    expect(getReports().map((r) => r.error)).toContain(broken)
    // The label's 2 s starts in an effect after the render that shows it: wait for that timer before the clock moves.
    await renderedUntil(() => vi.getTimerCount() > 0)
    vi.advanceTimersByTime(1500)
    await afterRendering()
    expect(buttonNamed('Copy failed')).toBe(button)
    vi.advanceTimersByTime(500)
    await renderedUntil(() => buttonNamed('Copy link') === button)
    release()
  })
})
