import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { type Locator, page, userEvent } from 'vitest/browser'
import indexHtml from '../../index.html?raw'
import { settingsKey, type TextSize } from '../lib/deviceSettings.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { startSettingsStorage } from '../state/settingsStore.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'
import { applyTextSize } from './textSize.ts'

// d-122: Settings → Appearance → Text size on the owner's path: the app with no URL, then Settings (the rail's gear on
// the desktop, More then Settings on the phone and the iPad), a pick, then the chat "plan the slice" in Workspaces.
// The store saves the pick and main.ts's onChange applies it, as this file wires it. Small is the designs' type (body
// 14/20), Default one step up (16/24) and Large two (18/28); the layout does not change with it.
stubLiveServer()
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  applyTextSize('small')
  localStorage.removeItem(settingsKey)
  await page.viewport(1512, 982)
})

/** The row of an Ark radio: its input is hidden, so the owner taps the label around it. */
function rowOf(control: Locator): Element {
  const row = control.element().closest('label')
  if (row === null) throw new Error('the control has no label row')
  return row
}

type Device = { name: string; width: number; height: number }
const devices: Device[] = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'iPad', width: 744, height: 1133 },
  { name: 'desktop', width: 1512, height: 982 },
]
const body: Record<TextSize, [number, number]> = { small: [14, 20], default: [16, 24], large: [18, 28] }

/** Starts the settings storage as main.ts does, opens the app, then Settings, and picks `choice`. */
async function pick(device: Device, choice: string) {
  await page.viewport(device.width, device.height)
  const stop = startSettingsStorage({
    storage: () => localStorage,
    report: (error) => {
      throw error
    },
    onChange: (settings) => {
      applyTextSize(settings.textSize)
    },
  })
  onTestFinished(stop)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  if (device.name === 'desktop') await userEvent.click(page.getByRole('button', { name: 'Settings', exact: true }))
  else {
    await userEvent.click(page.getByRole('button', { name: 'More', exact: true }))
    await userEvent.click(page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: /Settings/ }))
  }
  await expect.poll(() => router.state.location.pathname).toBe('/settings')
  const radio = page.getByRole('radio', { name: choice, exact: true })
  await expect.element(radio).toBeInTheDocument()
  await userEvent.click(rowOf(radio))
  await expect.element(radio).toBeChecked()
  return router
}

/** Opens the chat in Workspaces and returns the font size and line height in px of its message box. */
async function messageType(router: Awaited<ReturnType<typeof pick>>, device: Device): Promise<[number, number]> {
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  if (device.name !== 'desktop')
    await userEvent.click(page.getByRole('button', { name: 'plan the slice', exact: true }))
  await expect.poll(() => document.querySelector('[data-keyboard-keep] textarea')).not.toBeNull()
  const field = document.querySelector('[data-keyboard-keep] textarea')
  if (!(field instanceof HTMLElement)) throw new Error('no composer')
  const style = getComputedStyle(field)
  // The library's line heights are ratios, so the browser computes 28.0008 for 18 × 1.5556; 0.01 px is not a change.
  const px = (value: string) => Math.round(Number.parseFloat(value) * 100) / 100
  return [px(style.fontSize), px(style.lineHeight)]
}

describe('Text size on the owner path', () => {
  for (const device of devices)
    for (const [choice, size] of [
      ['Large', 'large'],
      ['Small', 'small'],
      ['Default', 'default'],
    ] as const) {
      it(`${choice} at ${String(device.width)} px sets the class, saves it and scales the chat's type`, async () => {
        // Start from the other end, saved and applied, so each pick is a change the store saves.
        const other = size === 'large' ? 'small' : 'large'
        localStorage.setItem(settingsKey, JSON.stringify({ textSize: other }))
        applyTextSize(other)
        const router = await pick(device, choice)
        expect(document.documentElement.classList.contains('text-default')).toBe(size === 'default')
        expect(document.documentElement.classList.contains('text-large')).toBe(size === 'large')
        expect(JSON.parse(localStorage.getItem(settingsKey) ?? '{}')).toMatchObject({ textSize: size })
        // The composer's message box uses the body style.
        expect(await messageType(router, device)).toEqual(body[size])
      })
    }

  it('keeps page zoom off at the iPhone width, so a focused field at Small does not zoom iOS', async () => {
    // iOS zooms into a field under 16 px unless the viewport allows no zoom (the owner's decision of 2026-11-18).
    const meta = new DOMParser().parseFromString(indexHtml, 'text/html').querySelector('meta[name="viewport"]')
    expect(meta?.getAttribute('content')).toContain('maximum-scale=1')
    const router = await pick(devices[0] ?? { name: 'phone', width: 390, height: 844 }, 'Small')
    expect(await messageType(router, { name: 'phone', width: 390, height: 844 })).toEqual(body.small)
    const field = document.querySelector('[data-keyboard-keep] textarea')
    if (!(field instanceof HTMLElement)) throw new Error('no composer')
    field.focus()
    expect(document.activeElement).toBe(field)
    expect(window.visualViewport?.scale ?? 1).toBe(1)
  })
})
