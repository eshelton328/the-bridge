import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../../errors/reporter.ts'
import { testRender } from '../../lib/testRender.ts'
import { resetAllStores } from '../../state/resetStores.ts'
import { InboxPage } from './InboxPage.tsx'
import { inboxStore } from './inboxStore.ts'
import { loadInboxState } from './loadInboxState.ts'
import { inboxSearch } from './search.ts'

// Audit L-3 (library beta.90 `onSend`): on the owner's path, the list > a task > Discuss, the discussion's reply box
// keeps the draft when the store's send rejects, and empties once a send succeeds. The page reports the failed send. The
// page entry, its loader and its store run as routes/inbox.tsx wires them; a page may not import the app's route tree.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderAt(path: string) {
  const root = createRootRoute()
  const inbox = createRoute({
    getParentRoute: () => root,
    path: 'inbox',
    validateSearch: inboxSearch,
    loaderDeps: ({ search }) => ({ state: search.state, source: search.source }),
    loader: ({ deps }) => loadInboxState(deps.state, deps.source),
    component: InboxPage,
  })
  const router = createRouter({
    routeTree: root.addChildren([inbox]),
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  return testRender(<RouterProvider router={router} />)
}
let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.restoreAllMocks()
  resetAllStores()
  clearReports()
  await page.viewport(1512, 982)
})

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the desktop', size: [1512, 982] },
] as const

const box = () => page.getByRole('textbox', { name: 'Ask about this task' })
const sendButton = () => page.getByRole('button', { name: 'Send', exact: true })

describe('the Inbox discussion keeps its draft until the send succeeds', () => {
  for (const device of devices) {
    it(`keeps the text after a failed send and empties the box after a sent one, on ${device.name}`, async () => {
      await page.viewport(device.size[0], device.size[1])
      const send = vi.spyOn(inboxStore.getState().actions, 'send')
      send.mockRejectedValueOnce(new Error('the chat server is down'))
      // The state with a discussion: on the phone Back shows the list, and a tap on the task opens it again.
      view = await renderAt('/inbox?state=discussTask')
      if (device.name === 'the phone') await page.getByRole('button', { name: 'Back to Inbox' }).click()
      await page.getByRole('button', { name: /^Write the tickets for increment one/ }).click()
      await page.getByRole('button', { name: 'Discuss' }).click()
      await expect.element(box()).toBeVisible()
      await userEvent.fill(box(), 'keep this question')
      await userEvent.click(sendButton())
      await expect.poll(() => send.mock.calls.length).toBe(1)
      expect(send.mock.calls[0]?.[1]).toBe('keep this question')
      await expect.poll(() => getReports().map((r) => r.error.message)).toEqual(['the chat server is down'])
      await expect.element(sendButton()).toBeEnabled()
      await expect.element(box()).toHaveValue('keep this question')
      // The message is not in the discussion: only the box holds its text.
      const shown = () => page.getByText('keep this question', { exact: true }).elements()
      expect(shown().filter((el) => el.tagName !== 'TEXTAREA')).toHaveLength(0)
      // The second send goes through the store's own send, which resolves.
      await userEvent.click(sendButton())
      await expect.poll(() => send.mock.calls.length).toBe(2)
      await expect.element(box()).toHaveValue('')
      await expect.poll(() => shown().filter((el) => el.tagName !== 'TEXTAREA').length).toBe(1)
    })
  }
})
