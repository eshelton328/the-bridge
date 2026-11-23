import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { type Locator, page, userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { settingsStore } from '../state/settingsStore.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// The bar limit and the Settings entry (settings-page.md, "Navigation: bar limit and Settings entry") on the owner's
// path: More, then Settings, then the Navigation list. The list draws a line after the last entry in this device's tab
// bar, "Under More on this device"; the tab bar shows every shown entry and no More when they all fit (5 on the phone, 6
// on the iPad); and Settings is an entry with no switch that moves into the bar.
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

/** The row of an Ark switch: its input is hidden, so the owner taps the label around it. */
function rowOf(control: Locator): Element {
  const row = control.element().closest('label')
  if (row === null) throw new Error('the control has no label row')
  return row
}

/** The Figma layer names of the tab bar's tabs, in order. */
const tabs = () =>
  [...document.querySelectorAll('[data-figma="tab bar"] [data-figma^="tab · "]')].map((el) =>
    el.getAttribute('data-figma'),
  )

/** The Navigation entry the cut line follows, or null when the list draws none. */
function cutAfter(): string | null {
  const line = document.querySelector('[role="separator"][aria-label="Under More on this device"]')
  return line?.parentElement?.querySelector('[data-nav-entry]')?.getAttribute('data-nav-entry') ?? null
}

/** Opens the Inbox, then More, then the drawer's Settings row, as the owner does. */
async function openSettings(width: number, height: number) {
  await page.viewport(width, height)
  const view = await renderAt('/inbox?source=fixtures')
  onTestFinished(view.unmount)
  await userEvent.click(page.getByRole('button', { name: 'More', exact: true }))
  const drawer = page.getByRole('dialog', { name: 'More' })
  await userEvent.click(drawer.getByRole('button', { name: /Settings/ }))
  await expect.poll(() => router.state.location.pathname).toBe('/settings')
  await expect.element(page.getByRole('heading', { name: 'Navigation' })).toBeVisible()
}

const hide = async (name: string) => {
  const control = page.getByRole('switch', { name, exact: true })
  await userEvent.click(rowOf(control))
  await expect.element(control).not.toBeChecked()
}

describe('the cut line of the Navigation list', () => {
  it('follows the last page in the phone tab bar and moves when a page is turned off or moved', async () => {
    await openSettings(390, 844)
    expect(cutAfter()).toBe('projects')
    await expect.element(page.getByText('Under More on this device')).toBeVisible()
    await hide('Workspaces')
    await expect.poll(cutAfter).toBe('artifacts')
    expect(tabs()).toEqual(['tab · Home', 'tab · Inbox', 'tab · Projects', 'tab · Artifacts', 'tab · More'])
    await userEvent.click(page.getByRole('button', { name: 'Move Artifacts up' }))
    await expect.poll(cutAfter).toBe('projects')
    expect(tabs()).toEqual(['tab · Home', 'tab · Inbox', 'tab · Artifacts', 'tab · Projects', 'tab · More'])
  })

  it('follows the last page in the iPad tab bar', async () => {
    await openSettings(744, 1133)
    expect(cutAfter()).toBe('artifacts')
    expect(tabs()).toEqual([
      'tab · Home',
      'tab · Inbox',
      'tab · Workspaces',
      'tab · Projects',
      'tab · Artifacts',
      'tab · More',
    ])
  })

  it('draws no line on the desktop, where the rail holds every page', async () => {
    const view = await renderAt('/settings')
    onTestFinished(view.unmount)
    await expect.element(page.getByRole('heading', { name: 'Navigation' })).toBeVisible()
    expect(cutAfter()).toBeNull()
  })
})

describe('a tab bar with no More', () => {
  it('shows all five shown entries on the phone, Settings selected, and no line', async () => {
    await openSettings(390, 844)
    await hide('Artifacts')
    await hide('Toolkit')
    await expect
      .poll(tabs)
      .toEqual(['tab · Home', 'tab · Inbox', 'tab · Workspaces', 'tab · Projects', 'tab · Settings'])
    expect(cutAfter()).toBeNull()
    await expect
      .element(page.getByRole('button', { name: 'Settings', exact: true }))
      .toHaveAttribute('aria-current', 'page')
  })

  it('shows all six shown entries on the iPad, and no line', async () => {
    await openSettings(744, 1133)
    await hide('Toolkit')
    await expect
      .poll(tabs)
      .toEqual(['tab · Home', 'tab · Inbox', 'tab · Workspaces', 'tab · Projects', 'tab · Artifacts', 'tab · Settings'])
    expect(cutAfter()).toBeNull()
  })
})

describe('Settings as an entry of the bar', () => {
  it('has no switch, so the owner cannot hide it', async () => {
    await openSettings(390, 844)
    expect(page.getByRole('switch', { name: 'Settings' }).elements()).toHaveLength(0)
    await expect.element(page.getByText('Always shown: in the bar or under More.')).toBeVisible()
  })

  for (const [width, height] of [
    [390, 844],
    [744, 1133],
  ] as const) {
    it(`moves into the tab bar and opens Settings from there at ${String(width)} px`, async () => {
      await openSettings(width, height)
      for (let i = 0; i < 3; i++) await userEvent.click(page.getByRole('button', { name: 'Move Settings up' }))
      await expect
        .poll(() =>
          settingsStore
            .getState()
            .nav.map((e) => e.page)
            .indexOf('settings'),
        )
        .toBe(3)
      await expect.poll(tabs).toContain('tab · Settings')
      expect(tabs().at(-1)).toBe('tab · More')
      expect(cutAfter()).toBe(width === 390 ? 'settings' : 'projects')
      const settingsTab = page.getByRole('button', { name: 'Settings', exact: true })
      await expect.element(settingsTab).toHaveAttribute('aria-current', 'page')
      await expect.element(page.getByRole('button', { name: 'More', exact: true })).not.toHaveAttribute('aria-current')
      await userEvent.click(page.getByRole('button', { name: 'Inbox', exact: true }))
      await expect.poll(() => router.state.location.pathname).toBe('/inbox')
      await userEvent.click(page.getByRole('button', { name: 'Settings', exact: true }))
      await expect.poll(() => router.state.location.pathname).toBe('/settings')
    })
  }
})
