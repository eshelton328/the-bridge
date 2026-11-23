import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { type Locator, page, userEvent } from 'vitest/browser'
import { type DeviceSettings, settingsKey } from '../lib/deviceSettings.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { settingsStore, startSettingsStorage } from '../state/settingsStore.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// d-119: the Settings page through the real route, on the owner's path. The phone's and the tablet's More open the
// More drawer, whose Settings row opens the page; on the desktop the rail's Settings gear opens it. A change on the page
// goes to the settings store, which saves it on this device and applies it at once, and the nav rules refuse to hide
// the last page besides Home, with a line that says why.
stubLiveServer()
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let router = createRouter({ routeTree, history: createMemoryHistory() })

function renderAt(path: string) {
  router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  return testRender(<RouterProvider router={router} />)
}

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The row of an Ark switch or radio: its input is hidden, so the owner taps the label around it. */
function rowOf(control: Locator): Element {
  const row = control.element().closest('label')
  if (row === null) throw new Error('the control has no label row')
  return row
}

describe('the Settings page on the owner path', () => {
  for (const [width, height] of [
    [390, 844],
    [744, 1133],
  ] as const) {
    it(`opens from More, then Settings, at ${String(width)} px`, async () => {
      await page.viewport(width, height)
      const view = await renderAt('/inbox?source=fixtures')
      onTestFinished(view.unmount)
      await userEvent.click(page.getByRole('button', { name: 'More' }))
      const drawer = page.getByRole('dialog', { name: 'More' })
      await expect.element(drawer.getByText('Appearance, navigation and chat defaults')).toBeVisible()
      await userEvent.click(drawer.getByRole('button', { name: /Settings/ }))
      await expect.poll(() => router.state.location.pathname).toBe('/settings')
      await expect.element(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
      // Settings is not a tab: More stays selected, as it holds Settings.
      await expect.element(page.getByRole('button', { name: 'More' })).toHaveAttribute('aria-current', 'page')
    })
  }

  it('opens from the rail gear on the desktop, with the gear selected', async () => {
    const view = await renderAt('/inbox?source=fixtures')
    onTestFinished(view.unmount)
    await userEvent.click(page.getByRole('button', { name: 'Settings' }))
    await expect.poll(() => router.state.location.pathname).toBe('/settings')
    await expect.element(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('a change on the Settings page', () => {
  it('applies the mode at once and saves it on this device', async () => {
    const data = new Map<string, string>()
    const changes: DeviceSettings[] = []
    const stop = startSettingsStorage({
      storage: () => ({ getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }),
      report: vi.fn(),
      onChange: (s) => changes.push(s),
    })
    onTestFinished(stop)
    const view = await renderAt('/settings')
    onTestFinished(view.unmount)
    const light = page.getByRole('radio', { name: 'Light' })
    await expect.element(light).not.toBeChecked()
    await userEvent.click(rowOf(light))
    await expect.element(light).toBeChecked()
    expect(changes.at(-1)?.mode).toBe('light')
    expect(JSON.parse(data.get(settingsKey) ?? '{}')).toMatchObject({ mode: 'light' })
  })

  it('hides a page from the rail, and keeps the Settings gear', async () => {
    const view = await renderAt('/settings')
    onTestFinished(view.unmount)
    await expect.poll(() => document.querySelector('[data-figma="rail · Projects"]')).not.toBeNull()
    await userEvent.click(rowOf(page.getByRole('switch', { name: 'Projects' })))
    await expect.poll(() => document.querySelector('[data-figma="rail · Projects"]')).toBeNull()
    expect(document.querySelector('[data-figma="rail · Settings"]')).not.toBeNull()
    expect(settingsStore.getState().nav.find((e) => e.page === 'projects')?.visible).toBe(false)
  })

  it('refuses to hide the last page besides Home, with the line that says why', async () => {
    const { actions } = settingsStore.getState()
    for (const p of ['inbox', 'workspaces', 'projects', 'artifacts'] as const)
      expect(actions.setNavPageVisible(p, false, undefined)).toBeUndefined()
    const view = await renderAt('/settings')
    onTestFinished(view.unmount)
    const toolkit = page.getByRole('switch', { name: 'Toolkit' })
    await expect.element(toolkit).toBeChecked()
    await userEvent.click(rowOf(toolkit))
    await expect.element(page.getByText('Keep one page besides Home shown.')).toBeVisible()
    await expect.element(toolkit).toBeChecked()
    expect(settingsStore.getState().nav.find((e) => e.page === 'toolkit')?.visible).toBe(true)
  })
})
