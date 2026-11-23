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

// Settings → Appearance → Chat width (settings-page.md, "Chat width") on the owner's path: the app with no URL, then
// Settings (the rail's gear on the desktop, More then Settings on the iPad), a pick, then Workspaces and a chat. Wide
// and Narrow centre the chat's transcript and composer in one column of the library's `shell.threadWide` (1040) or
// `shell.thread` (768); Full keeps today's width. The phone is always full.
stubLiveServer()
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The row of an Ark radio: its input is hidden, so the owner taps the label around it. */
function rowOf(control: Locator): Element {
  const row = control.element().closest('label')
  if (row === null) throw new Error('the control has no label row')
  return row
}

/** A size token in px, read through a probe element's width. */
function px(token: string): number {
  const probe = document.createElement('div')
  probe.style.width = `var(--${token.replaceAll('.', '-').replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)})`
  document.body.append(probe)
  const width = probe.getBoundingClientRect().width
  probe.remove()
  return width
}

// `side`: the chat's own space at each side with Full (T2: 24 on the tablet; none in the desktop's chat body).
type Device = { name: string; width: number; height: number; side: string | undefined }
const desktop: Device = { name: 'desktop', width: 1512, height: 982, side: undefined }
const ipad: Device = { name: 'iPad', width: 744, height: 1133, side: 'spacing.24' }
const ipadWide: Device = { name: 'iPad in landscape', width: 1180, height: 820, side: 'spacing.24' }

/** Opens the app, then Settings, picks `choice` and opens the chat "plan the slice" in Workspaces. */
async function pickAndOpenChat(device: Device, choice: string | undefined) {
  await page.viewport(device.width, device.height)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  if (choice !== undefined) {
    if (device === desktop) await userEvent.click(page.getByRole('button', { name: 'Settings', exact: true }))
    else {
      await userEvent.click(page.getByRole('button', { name: 'More', exact: true }))
      await userEvent.click(page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: /Settings/ }))
    }
    await expect.poll(() => router.state.location.pathname).toBe('/settings')
    const radio = page.getByRole('radio', { name: choice, exact: true })
    await userEvent.click(rowOf(radio))
    await expect.element(radio).toBeChecked()
  }
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  if (device !== desktop) await userEvent.click(page.getByRole('button', { name: 'plan the slice', exact: true }))
  await expect.poll(() => document.querySelector('[data-keyboard-keep] textarea')).not.toBeNull()
}

/** The chat's composer box, the transcript's scrolling body and the frame both sit in. */
function chatParts() {
  const composer = document.querySelector('[data-keyboard-keep]')
  const body = composer?.closest('.scroll-frame__root')?.querySelector(':scope > .scroll-frame__body')
  if (!(composer instanceof HTMLElement) || !(body instanceof HTMLElement)) throw new Error('no chat')
  const frame = body.getBoundingClientRect()
  const style = getComputedStyle(body)
  const content = {
    left: frame.left + parseFloat(style.paddingLeft),
    right: frame.right - parseFloat(style.paddingRight),
  }
  return { composer: composer.getBoundingClientRect(), frame, content }
}

describe('the chat width on the owner path', () => {
  // At 744 the iPad's chat is narrower than either column, so the column changes nothing there; in landscape it does.
  for (const device of [desktop, ipad, ipadWide])
    for (const [choice, token] of [
      ['Wide', 'sizes.shell.threadWide'],
      ['Narrow', 'sizes.shell.thread'],
    ] as const)
      it(`centres the transcript and the composer in the ${choice} column on the ${device.name}`, async () => {
        await pickAndOpenChat(device, choice)
        const { frame } = chatParts()
        const side = device.side === undefined ? 0 : px(device.side)
        const column = Math.min(px(token), frame.width - 2 * side)
        await expect.poll(() => Math.round(chatParts().composer.width)).toBe(Math.round(column))
        const { composer, content } = chatParts()
        // The composer and the transcript's content share one column, centred in the chat.
        expect(Math.abs(composer.left - content.left)).toBeLessThanOrEqual(1)
        expect(Math.abs(composer.right - content.right)).toBeLessThanOrEqual(1)
        expect(Math.abs(content.left - frame.left - (frame.right - content.right))).toBeLessThanOrEqual(1)
        expect(settingsStore.getState().chatWidth).toBe(choice.toLowerCase())
      })

  for (const device of [desktop, ipad, ipadWide])
    it(`keeps today's width with Full on the ${device.name}`, async () => {
      await pickAndOpenChat(device, undefined)
      const today = chatParts().composer.width
      await unmountRendered()
      resetAllStores()
      await pickAndOpenChat(device, 'Full')
      expect(chatParts().composer.width).toBe(today)
    })

  it('says the phone is always full, with the choice off', async () => {
    await page.viewport(390, 844)
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/settings'] }) })
    const view = await testRender(<RouterProvider router={router} />)
    onTestFinished(view.unmount)
    await expect.element(page.getByText('Phone: always full')).toBeVisible()
    await expect.element(page.getByRole('radio', { name: 'Wide', exact: true })).toBeDisabled()
  })
})
