import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { type FakeSideServer, fakeSideServer } from '../lib/fakeSideServer.ts'
import { fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Screen review R71, on the iPad: "Side chat closes when we try to enter the chat". The side chat's sheet stayed behind
// the keyboard, the page jumped at the focus, and the next tap on the chat above the sheet closed it. With library
// #347 the sheet docks on the keyboard (`keyboardDock`) and closes only on an explicit close (`closeOn`): ×, a swipe
// from the grabber, Escape, and on the phone a tap on the scrim. A close keeps the unsent question in the page's
// drafts. Each test takes the owner's path: the app with no URL, Workspaces, a tap on the chat's row, its actions and
// Side chat, with the contract-checked fakes as the server and a fake keyboard (window.visualViewport shrinks, as in
// WorkspacesKeyboardGap.test.tsx).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const sketch = 'test-box/c1'
const summary = (id: string, title: string) => ({
  id,
  kind: 'claude' as const,
  title,
  model: 'claude-opus-5-5',
  contextUsed: null,
  modelId: 'opus' as const,
  effort: null,
  pane: `${id}-pane`,
  status: 'idle' as const,
  parent: null,
})
const list = {
  machine: 'test-box',
  workspaces: [
    {
      id: 'test-box/w-orchard',
      label: 'orchard',
      chats: [summary(sketch, 'sketch the plan'), summary('test-box/c2', 'tidy the notes')],
    },
  ],
}

/** The stubbed server: the fakes' routes, and a rejection for anything else. */
function withChats(): FakeSideServer {
  const chats = fakeTranscriptServer()
  for (const c of list.workspaces.flatMap((w) => w.chats)) chats.set(c.id, [])
  const workspaces = fakeWorkspacesServer(chats, list)
  const side = fakeSideServer()
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = side.handle(path, init) ?? chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return side
}

// A stand-in for window.visualViewport that the test moves as iOS Safari does when its keyboard opens: the layout keeps
// its height, and only the visual viewport shrinks.
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

/** Puts a fake visual viewport in place of window.visualViewport until the test ends. */
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

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  queryClient.clear()
  resetAllStores()
  await setViewport(1512, 982)
})

type Size = 'phone' | 'tablet'
const viewports = { phone: [390, 844], tablet: [744, 1133] } as const

/** The render's root, made to fill the window as `#root` does in index.css. */
function appRoot(): HTMLElement {
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  return root
}

/** Opens the app at `size` with no URL, taps Workspaces in the tab bar and the chat's row. */
async function openChat(size: Size) {
  const [w, h] = viewports[size]
  await setViewport(w, h)
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
  view = await testRender(<RouterProvider router={router} />)
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
  await userEvent.click(page.getByText('sketch the plan', { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: 'sketch the plan' })).toBeVisible()
  appRoot()
}

const sideChat = () => page.getByRole('dialog', { name: 'Side chat' })
const questionBox = () => sideChat().getByRole('textbox', { name: 'Ask a side question' })

/** Opens the chat's side chat from its actions: the phone's sheet, or the tablet's menu. */
async function openSide(size: Size) {
  await userEvent.click(page.getByRole('button', { name: 'sketch the plan actions' }).first())
  await userEvent.click(
    size === 'phone'
      ? page.getByText('Side chat', { exact: true })
      : page.getByRole('menuitem', { name: 'Side chat (/btw)', exact: true }),
  )
  await expect.element(questionBox()).toHaveFocus()
  // The sheet has slid up: a press before then can come before it listens for presses outside it.
  await Promise.all(document.getAnimations().map((animation) => animation.finished))
}

/** Waits the time of the sheet's exit motion, so a close that started would have ended. */
const motionTime = () => new Promise((resolve) => setTimeout(resolve, 600))

describe('the side chat docks on the keyboard and closes only on an explicit close (R71)', () => {
  it('stays open over the keyboard through a tap on the chat above it, typing and Send, on the tablet', async () => {
    const keyboard = fakeKeyboard()
    const side = withChats()
    await openChat('tablet')
    await openSide('tablet')
    const shell = document.querySelector<HTMLElement>('.app-shell__root')
    const positioner = sideChat().element().closest<HTMLElement>('[data-keyboard-dock]')
    const mainComposer = document.querySelector<HTMLElement>('.app-shell__detail .scroll-frame__footer .composer__root')
    if (!shell || !positioner || !mainComposer) throw new Error('no shell, docking sheet or main composer')
    // The sheet sets no body scroll lock, which made WebKit jump the page at the focus.
    expect(document.body.hasAttribute('data-scroll-lock')).toBe(false)
    const composerBottom = mainComposer.getBoundingClientRect().bottom
    // A tap on the message box, and the keyboard opens over the screen's foot.
    await userEvent.click(questionBox())
    keyboard.move({ height: 786 })
    await expect.poll(() => positioner.style.getPropertyValue('--keyboard-dock')).not.toBe('')
    await Promise.all(document.getAnimations().map((animation) => animation.finished))
    const sheetBottom = () => sideChat().element().getBoundingClientRect().bottom
    await expect.poll(sheetBottom).toBeLessThanOrEqual(786.5)
    // Only the sheet docks: the main chat's composer does not move.
    expect(shell.style.getPropertyValue('--app-shell-keyboard')).toBe('')
    expect(mainComposer.getBoundingClientRect().bottom).toBe(composerBottom)
    // A tap on the chat's transcript above the sheet keeps it open; the open sheet blocks the page's pointer events,
    // so the press needs `force`.
    await userEvent.click(page.getByRole('heading', { name: 'sketch the plan', includeHidden: true }), { force: true })
    await motionTime()
    await expect.element(sideChat()).toBeVisible()
    expect(sideChat().element().getAttribute('data-state')).toBe('open')
    // Typing and Send keep it open and docked.
    await userEvent.fill(questionBox(), 'Why did the build fail?')
    await userEvent.click(sideChat().getByRole('button', { name: 'Send', exact: true }))
    await expect.poll(() => side.asks).toEqual([{ chat: sketch, body: { question: 'Why did the build fail?' } }])
    await expect.element(sideChat().getByText('Why did the build fail?', { exact: true })).toBeVisible()
    await motionTime()
    expect(sideChat().element().getAttribute('data-state')).toBe('open')
    expect(sheetBottom()).toBeLessThanOrEqual(786.5)
    expect(shell.style.getPropertyValue('--app-shell-keyboard')).toBe('')
    expect(mainComposer.getBoundingClientRect().bottom).toBe(composerBottom)
  })

  it('closes on a tap on the scrim, and the next open shows the unsent question, on the phone', async () => {
    const side = withChats()
    await openChat('phone')
    await openSide('phone')
    await userEvent.fill(questionBox(), 'Half a question')
    // A tap on the scrim over the dimmed chat above the sheet: the sheet's layer is what the tap meets there.
    expect(document.querySelector('[data-scope="dialog"][data-part="backdrop"]')).not.toBeNull()
    const top = sideChat().element().getBoundingClientRect().top
    const above = document.elementFromPoint(195, top / 2)
    if (!(above instanceof HTMLElement)) throw new Error('nothing above the sheet')
    expect(sideChat().element().contains(above)).toBe(false)
    await userEvent.click(page.elementLocator(above), { position: { x: 195, y: top / 2 } })
    await expect.element(sideChat()).not.toBeInTheDocument()
    await openSide('phone')
    await expect.element(questionBox()).toHaveValue('Half a question')
    expect(side.asks).toEqual([])
  })

  it('closes with × and keeps the unsent question for the next open, on the tablet', async () => {
    const side = withChats()
    await openChat('tablet')
    await openSide('tablet')
    await userEvent.fill(questionBox(), 'Half a question')
    await userEvent.click(sideChat().getByRole('button', { name: 'Close the side chat' }))
    await expect.element(sideChat()).not.toBeInTheDocument()
    await openSide('tablet')
    await expect.element(questionBox()).toHaveValue('Half a question')
    expect(side.asks).toEqual([])
  })
})
