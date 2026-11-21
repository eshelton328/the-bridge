import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { fakeEndpoint, fakePush, type FakePushOptions } from '../lib/fakePush.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// d-118: the Notifications switch, through the real route, on the owner's path: on the phone he opens the tab bar's
// More and finds it under the drawer's pages; on the desktop it sits at the rail's end. On subscribes and saves, off
// ends the subscription and deletes it, a denied permission says so and stays off, Safari outside the home-screen app
// says to add it there, and a save that misses shows a line and stays off. A fake browser and server (lib/fakePush.ts)
// stand in for the permission prompt, the push service and the-bridge server.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  await page.viewport(1512, 982)
})

const layouts = [
  {
    name: 'the phone More drawer',
    size: [390, 844] as const,
    open: async () => {
      await userEvent.click(page.getByRole('button', { name: 'More' }))
      await expect.element(page.getByRole('dialog')).toBeVisible()
    },
  },
  { name: 'the desktop rail', size: [1512, 982] as const, open: () => Promise.resolve() },
]

async function show(layout: (typeof layouts)[number], options: FakePushOptions) {
  const push = fakePush(options)
  await page.viewport(layout.size[0], layout.size[1])
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/inbox'] }) })
  await testRender(<RouterProvider router={router} />)
  await layout.open()
  // The switch's input is hidden, as Ark draws it; the owner taps its row, which is the input's label.
  return {
    push,
    toggle: page.getByRole('switch', { name: 'Notifications' }),
    row: page.getByText('Notifications', { exact: true }),
  }
}

describe.each(layouts)('the Notifications switch in $name', (layout) => {
  it('turns on: asks for the permission, subscribes and saves the subscription', async () => {
    const { push, toggle, row } = await show(layout, { permission: 'default' })
    await expect.element(toggle).not.toBeChecked()
    await expect.element(toggle).toBeEnabled()
    await userEvent.click(row)
    await expect.element(toggle).toBeChecked()
    expect(push.requestPermission).toHaveBeenCalledOnce()
    expect(push.requests.map((r) => `${r.method} ${r.path}`)).toEqual([
      'GET /api/push/key',
      'POST /api/push/subscriptions',
    ])
    // The drawer stays open: the switch is a setting, not a page.
    if (layout.size[0] < 500) await expect.element(page.getByRole('dialog')).toBeVisible()
  })

  it('turns off: ends the subscription and deletes it on the server', async () => {
    const { push, toggle, row } = await show(layout, { permission: 'granted', subscribed: true })
    await expect.element(toggle).toBeChecked()
    await userEvent.click(row)
    await expect.element(toggle).not.toBeChecked()
    expect(push.unsubscribe).toHaveBeenCalledOnce()
    expect(push.requests).toEqual([
      { method: 'DELETE', path: '/api/push/subscriptions', body: { endpoint: fakeEndpoint } },
    ])
  })

  it('says "Blocked in Settings" and stays off when the permission is denied', async () => {
    const { push, toggle } = await show(layout, { permission: 'denied' })
    await expect.element(page.getByText('Blocked in Settings')).toBeVisible()
    await expect.element(toggle).not.toBeChecked()
    await expect.element(toggle).toBeDisabled()
    expect(push.requests).toEqual([])
  })

  it('is off and disabled in Safari outside the home-screen app, with the line that says how to get it', async () => {
    const { push, toggle } = await show(layout, { env: { ios: true, standalone: false, pushManager: false } })
    await expect.element(page.getByText('Add The Bridge to the Home Screen to get notifications')).toBeVisible()
    await expect.element(toggle).not.toBeChecked()
    await expect.element(toggle).toBeDisabled()
    expect(push.requestPermission).not.toHaveBeenCalled()
  })

  it('shows a line and stays off when the save misses', async () => {
    const { push, toggle, row } = await show(layout, { status: { save: 400 } })
    await userEvent.click(row)
    await expect.element(page.getByText('Not turned on. Try again.')).toBeVisible()
    await expect.element(toggle).not.toBeChecked()
    expect(push.isSubscribed()).toBe(false)
  })
})
