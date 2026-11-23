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

// d-118, d-119: the Notifications switch, through the real route, on the owner's path: on the phone and the tablet he
// opens the tab bar's More, then Settings in the drawer; on the desktop he taps the rail's Settings gear. The switch is
// in the Settings page's Notifications section, its one place. On subscribes and saves, off ends the subscription and
// deletes it, a denied permission says so and stays off, Safari outside the home-screen app says to add it there, and
// a save that misses shows a line and stays off. "Show message preview" below it is on by default, goes with the
// subscription at turn on, and a tap while push is on saves the subscription again with the new choice. A fake browser and server (lib/fakePush.ts) stand in for the
// permission prompt, the push service and the-bridge server.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  await page.viewport(1512, 982)
})

/** More in the tab bar, then Settings in the More drawer. */
async function openFromMore() {
  await userEvent.click(page.getByRole('button', { name: 'More' }))
  const drawer = page.getByRole('dialog', { name: 'More' })
  await expect.element(drawer).toBeVisible()
  await userEvent.click(drawer.getByRole('button', { name: /Settings/ }))
}

const layouts = [
  { name: 'the phone, from More', size: [390, 844] as const, open: openFromMore },
  { name: 'the tablet, from More', size: [744, 1133] as const, open: openFromMore },
  {
    name: 'the desktop, from the rail',
    size: [1512, 982] as const,
    open: async () => {
      await userEvent.click(page.getByRole('button', { name: 'Settings' }))
    },
  },
]

async function show(layout: (typeof layouts)[number], options: FakePushOptions) {
  const push = fakePush(options)
  await page.viewport(layout.size[0], layout.size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/inbox?source=fixtures'] }),
  })
  await testRender(<RouterProvider router={router} />)
  await layout.open()
  await expect.poll(() => router.state.location.pathname).toBe('/settings')
  const toggle = page.getByRole('switch', { name: 'Notifications' })
  await expect.element(toggle).toBeInTheDocument()
  // The switch's input is hidden, as Ark draws it; the owner taps its row, which is the input's label. The section's
  // title says Notifications too, so the row is the switch's own label, not a text match.
  const row = toggle.element().closest('label')
  if (row === null) throw new Error('the Notifications switch has no label row')
  return { push, toggle, row }
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

  it('sends "Show message preview" on with the subscription by default', async () => {
    const { push, row } = await show(layout, { permission: 'default' })
    const preview = page.getByRole('switch', { name: 'Show message preview' })
    await expect.element(preview).toBeChecked()
    await userEvent.click(row)
    await expect.poll(() => push.requests.length).toBe(2)
    expect(push.requests[1]?.body).toMatchObject({ endpoint: fakeEndpoint, preview: true })
  })

  it('saves the subscription again with the preview off when the owner taps "Show message preview"', async () => {
    const { push, toggle } = await show(layout, { permission: 'granted', subscribed: true })
    await expect.element(toggle).toBeChecked()
    const preview = page.getByRole('switch', { name: 'Show message preview' })
    const previewRow = preview.element().closest('label')
    if (previewRow === null) throw new Error('the preview switch has no label row')
    await userEvent.click(previewRow)
    await expect.element(preview).not.toBeChecked()
    await expect.poll(() => push.requests.length).toBe(1)
    expect(push.requests[0]).toMatchObject({
      method: 'POST',
      path: '/api/push/subscriptions',
      body: { endpoint: fakeEndpoint, preview: false },
    })
    await expect.element(toggle).toBeChecked()
  })

  it('shows a line and stays off when the save misses', async () => {
    const { push, toggle, row } = await show(layout, { status: { save: 400 } })
    await userEvent.click(row)
    await expect.element(page.getByText('Not turned on. Try again.')).toBeVisible()
    await expect.element(toggle).not.toBeChecked()
    expect(push.isSubscribed()).toBe(false)
  })
})
