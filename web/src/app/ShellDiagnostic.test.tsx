import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { ShellDiagnosticError } from '../errors/shellDiagnostic.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Audit L-8 (library beta.91 `onDiagnostic`): every AppShell sends its diagnostics to report(). On the owner's path,
// /workspaces > a chat on the phone, the test moves the chat's ScrollFrame into a wrapper, so its field cannot dock on
// the keyboard as a page mistake would leave it, and the reporter gets one `undocked-field`. A normal open of each
// page reports nothing. The app's styles and fonts load as in main.ts. The chat is one of the home's sample chats
// (?source=fixtures), as the home reads the live source in development (d-117).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const chatName = 'bridge themes'
const keyboardTop = 544

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  clearReports()
  await setViewport(1512, 982)
})

async function renderAt(path: string) {
  await view?.unmount()
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) })
  view = await testRender(<RouterProvider router={router} />)
  // The render's root fills the window, as `#root` does in index.css.
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
}

// A stand-in for window.visualViewport that the test moves as iOS Safari does when its keyboard opens: the layout keeps
// its height, and only the visual viewport shrinks (as in WorkspacesChatDock.test.tsx).
class FakeViewport extends EventTarget {
  height = document.documentElement.clientHeight
  width = document.documentElement.clientWidth
  offsetTop = 0
  offsetLeft = 0
  scale = 1
  move(change: { height: number }) {
    this.height = change.height
    this.dispatchEvent(new Event('resize'))
  }
}

/** Puts a FakeViewport in place of window.visualViewport until the test ends. Call it before the render. */
function fakeKeyboard(): FakeViewport {
  const value = new FakeViewport()
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value })
  onTestFinished(() => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  })
  return value
}

/** The shell's reports: the source `shell`, with their codes. */
const shellCodes = () =>
  getReports()
    .filter((r) => r.source === 'shell')
    .map((r) => (r.error instanceof ShellDiagnosticError ? r.error.code : 'not a diagnostic'))

/** Taps the chat in the Workspaces list, as the owner does, and returns its ScrollFrame in the AppShell detail. */
async function openChat(): Promise<HTMLElement> {
  await userEvent.click(page.getByText(chatName, { exact: true }).first())
  await expect.element(page.getByRole('region', { name: chatName, exact: true })).toBeVisible()
  const frame = document.querySelector<HTMLElement>('.app-shell__detail > .scroll-frame__root')
  if (frame === null) throw new Error('no chat frame in the detail')
  return frame
}

/**
 * Test only: moves the frame into a wrapper inside the detail, the mistake the shell names (a ScrollFrame that is not
 * the detail's direct child), and puts it back when the test ends so React unmounts the tree it drew.
 */
function undock(frame: HTMLElement) {
  const detail = frame.parentElement
  if (detail === null) throw new Error('no detail')
  const wrapper = document.createElement('div')
  detail.insertBefore(wrapper, frame)
  wrapper.append(frame)
  onTestFinished(() => {
    detail.insertBefore(frame, wrapper)
    wrapper.remove()
  })
}

/** The chat's composer field. */
function field(frame: HTMLElement): HTMLElement {
  const el = frame.querySelector<HTMLElement>('.scroll-frame__footer textarea')
  if (el === null) throw new Error('no composer field')
  return el
}

describe('AppShell reports an undocked field to the app (audit L-8)', () => {
  it('sends one undocked-field report on the owner path: /workspaces > a chat, on the phone', async () => {
    await setViewport(390, 844)
    const viewport = fakeKeyboard()
    await renderAt('/workspaces?source=fixtures')
    const frame = await openChat()
    undock(frame)
    await userEvent.click(field(frame))
    viewport.move({ height: keyboardTop })
    await expect.poll(shellCodes).toEqual(['undocked-field'])
    // The keyboard moves again: the shell reports the field once.
    viewport.move({ height: keyboardTop + 1 })
    viewport.move({ height: keyboardTop })
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(shellCodes()).toEqual(['undocked-field'])
    expect(getReports()).toHaveLength(1)
  })

  it('sends exactly one report when the page renders twice and re-renders as the owner types', async () => {
    await setViewport(390, 844)
    const viewport = fakeKeyboard()
    await renderAt('/workspaces?source=fixtures')
    await openChat()
    await renderAt('/workspaces?source=fixtures')
    const frame = await openChat()
    undock(frame)
    await userEvent.click(field(frame))
    await userEvent.type(field(frame), 'one report')
    viewport.move({ height: keyboardTop })
    await expect.poll(shellCodes).toEqual(['undocked-field'])
    await userEvent.type(field(frame), ' only')
    viewport.move({ height: keyboardTop + 1 })
    viewport.move({ height: keyboardTop })
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(getReports()).toHaveLength(1)
  })

  it('reports nothing for a docked chat with the keyboard open', async () => {
    await setViewport(390, 844)
    const viewport = fakeKeyboard()
    await renderAt('/workspaces?source=fixtures')
    const frame = await openChat()
    await userEvent.click(field(frame))
    viewport.move({ height: keyboardTop })
    const shell = document.querySelector<HTMLElement>('.app-shell__root')
    await expect.poll(() => shell?.style.getPropertyValue('--app-shell-keyboard')).not.toBe('')
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(getReports()).toEqual([])
  })

  // The Workspaces home reads the live source in development (d-117); its sample data needs no server.
  for (const path of ['/inbox', '/workspaces?source=fixtures', '/artifacts', '/toolkit'])
    for (const [width, height] of [
      [390, 844],
      [1512, 982],
    ] as const)
      it(`reports nothing on a normal open of ${path} at ${String(width)} × ${String(height)}`, async () => {
        await setViewport(width, height)
        await renderAt(path)
        await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
        await new Promise((resolve) => requestAnimationFrame(resolve))
        expect(getReports()).toEqual([])
      })
})
