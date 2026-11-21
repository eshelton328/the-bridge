import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { clickNow, holdTimers } from '../lib/holdTimers.ts'
import { queryClient } from '../lib/queryClient.ts'
import { afterRendering, renderedUntil, setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// A sample reply's Copy on the Workspaces home (audit P-4): the home's sample
// data (?source=fixtures in development, the home a build shows), a tap on a
// chat row on the phone and the tablet, the chat alone and the workbench on
// the desktop. Copy writes the reply's text through copyText and the button
// reads Copied; a clipboard that refuses makes it read Copy failed and
// reports the clipboard's error, never the reply's text (d-115). Live replies
// take the same path (WorkspacesLiveTranscript.test.tsx).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

// The page reads no live source here, but a stray read must never reach this machine's server.
stubLiveServer()

const reply =
  'Three directions: a tiled home, a star map of agents, and a split-pane workbench. The workbench suits long sessions on the desktop.'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

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

/** Swaps the clipboard's writeText for one that rejects with `error` for this test. */
function rejectingClipboard(error: Error): void {
  const { clipboard } = navigator
  const writeText = clipboard.writeText.bind(clipboard)
  clipboard.writeText = () => Promise.reject(error)
  onTestFinished(() => {
    clipboard.writeText = writeText
  })
}

/** Opens the Workspaces home with its sample data at `width` × `height`, with the dev ErrorTray beside it. */
async function openHome(width: number, height: number) {
  await setViewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/workspaces?source=fixtures'] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(
    <>
      <RouterProvider router={router} />
      <ErrorTray />
    </>,
    rootErrorOptions,
  )
}

/** Taps the chat row `title` in the phone's or tablet's list and waits for the chat. */
async function tapChat(title: string) {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** The Copy button of the sample reply, in the chat that shows it. */
async function replyCopy(name = 'Copy') {
  await expect.element(page.getByText(reply).first()).toBeVisible()
  return replyButton(name)
}

/** The reply's button named `name`, with no wait: a step that moves no held clock (lib/holdTimers.ts). */
function replyButton(name: string) {
  const text = page.getByText(reply).first()
  // The reply's message: the nearest box around its text that holds a button, its Copy.
  let entry: Element | null = text.element()
  while (entry !== null && entry.querySelector('button') === null) entry = entry.parentElement
  if (!(entry instanceof HTMLElement)) throw new Error('the reply has no Copy')
  return page.elementLocator(entry).getByRole('button', { name, exact: true })
}

/** The text of every polite live region on the page. */
const liveText = () =>
  [...document.querySelectorAll('[aria-live="polite"]')].map((region) => region.textContent).join('\n')

const layouts = [
  { name: 'the phone', size: [390, 844], open: () => tapChat('bridge themes') },
  { name: 'the tablet', size: [756, 1129], open: () => tapChat('bridge themes') },
  { name: 'the desktop chat', size: [1512, 982], open: () => Promise.resolve() },
  {
    name: 'the desktop workbench',
    size: [1512, 982],
    open: () => userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' })),
  },
] as const

describe("a sample reply's Copy on the Workspaces home", () => {
  for (const layout of layouts)
    it(`copies the reply's text and reads Copied, on ${layout.name}`, async () => {
      const copied = fakeClipboard()
      await openHome(layout.size[0], layout.size[1])
      await layout.open()
      const button = (await replyCopy()).element()
      // "Copied" waits for the test's clock, not the runner's (lib/holdTimers.ts). Until the test moves that clock, no
      // step is a Vitest action or poll, which would move it too: the press is a DOM click and each wait counts
      // rendering steps (lib/rendering.ts).
      const release = holdTimers()
      clickNow(button)
      await renderedUntil(() => copied.length > 0)
      expect(copied).toEqual([reply])
      await renderedUntil(() => replyButton('Copied').query() !== null)
      expect(replyButton('Copied').element()).toBeVisible()
      // The polite live region beside the button says it too.
      await renderedUntil(() => liveText().includes('Copied'))
      // The label's 2 s starts in an effect after the render that shows it: wait for that timer before the clock moves.
      await renderedUntil(() => vi.getTimerCount() > 0)
      // It reads Copy again 2 s after the press, and not before.
      vi.advanceTimersByTime(1999)
      await afterRendering()
      expect(replyButton('Copied').query()).not.toBeNull()
      vi.advanceTimersByTime(1)
      await renderedUntil(() => replyButton('Copy').query() !== null)
      expect(replyButton('Copy').element()).toBeVisible()
      release()
      expect(getReports()).toEqual([])
    })

  for (const layout of layouts)
    it(`reads Copy failed and reports without the reply's text when the clipboard refuses, on ${layout.name}`, async () => {
      const broken = new Error('the clipboard broke')
      rejectingClipboard(broken)
      await openHome(layout.size[0], layout.size[1])
      await layout.open()
      const button = (await replyCopy()).element()
      // "Copy failed" waits for the test's clock, as "Copied" does above.
      const release = holdTimers()
      clickNow(button)
      await renderedUntil(() => replyButton('Copy failed').query() !== null)
      expect(replyButton('Copy failed').element()).toBeVisible()
      // The polite live region beside the button says it too.
      await renderedUntil(() => liveText().includes('Copy failed'))
      release()
      expect(getReports().map((r) => r.error)).toEqual([broken])
      // Neither the report nor the ErrorTray holds the reply's text.
      expect(JSON.stringify(getReports().map((r) => [r.error.message, r.error.stack, r.componentStack]))).not.toContain(
        'Three directions',
      )
      // The tray shows the report it got, with the clipboard's error alone.
      const trays = () => [...document.querySelectorAll('aside[aria-label="Error reports"]')]
      await userEvent.click(page.getByRole('button', { name: '1 error' }))
      await expect
        .poll(() =>
          trays()
            .map((t) => t.textContent)
            .join('\n'),
        )
        .toContain('the clipboard broke')
      expect(
        trays()
          .map((t) => t.textContent)
          .join('\n'),
      ).not.toContain('Three directions')
    })

  it('reads Copy failed and reports nothing on a page with no Clipboard API, on the phone', async () => {
    const { clipboard } = navigator
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    onTestFinished(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard })
    })
    await openHome(390, 844)
    await tapChat('bridge themes')
    const button = (await replyCopy()).element()
    // "Copy failed" waits for the test's clock, as "Copied" does above.
    const release = holdTimers()
    clickNow(button)
    await renderedUntil(() => replyButton('Copy failed').query() !== null)
    expect(replyButton('Copy failed').element()).toBeVisible()
    release()
    expect(getReports()).toEqual([])
  })
})
