import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
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
