import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Screen review R29: iOS opens the file menu (Photo Library, Take Photo or Video, Choose Files) at the last touch,
// and opening it closes the keyboard, so a paperclip tap with the keyboard up left the menu mid-screen once the
// composer dropped. Now the paperclip's first tap with the keyboard up only closes the keyboard; the next tap, with
// the keyboard closed, opens the device's picker at once. Each test takes the owner's path: it opens the app with no
// URL parameters, taps Workspaces and a live chat (or finds its pane on the desktop). The keyboard is raised as iOS
// Safari raises it (a stand-in for window.visualViewport, as in KeyboardKeep.test.tsx), and the taps are touch taps.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const title = 'plan the slice'
const chats = [
  {
    id: plan,
    kind: 'claude',
    title,
    model: 'claude-opus-5-5',
    contextUsed: null,
    modelId: null,
    effort: null,
    pane: `${plan}-pane`,
    status: 'idle',
    parent: null,
  },
]
const layout = JSON.stringify({
  workspace,
  tabs: [
    {
      id: `${workspace}:t1`,
      label: 'main',
      active: true,
      root: { kind: 'pane', chat: plan },
      focusedChat: plan,
      zoomed: false,
      chats,
    },
  ],
})

const phone = [390, 844] as const
const desktop = [1512, 982] as const

/** The stubbed server: the workspace, its layout, the event stream and the fake's chat routes. */
function fakeServer() {
  const fake = fakeTranscriptServer({ uploads: { chunkSize: 4 } })
  fake.set(plan, [{ type: 'user', id: 'u1', text: 'Fix the build', cut: false }])
  vi.stubGlobal('XMLHttpRequest', fake.uploads.XMLHttpRequest)
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = fake.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      if (path === '/api/workspaces')
        return Promise.resolve(
          new Response(
            JSON.stringify({ machine: 'mac-mini', workspaces: [{ id: workspace, label: 'live work', chats }] }),
            { status: 200 },
          ),
        )
      if (path === `/api/workspaces/${encodeURIComponent(workspace)}/layout`)
        return Promise.resolve(new Response(layout, { status: 200 }))
      if (path === '/api/events') {
        const body = new ReadableStream<Uint8Array>({
          start: (control) => {
            control.enqueue(new TextEncoder().encode('event: open\nretry: 200\ndata: {}\n\n'))
          },
        })
        return Promise.resolve(new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } }))
      }
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
}

// A stand-in for window.visualViewport that the test moves as iOS Safari does when its keyboard opens: the layout keeps
// its height, and only the visual viewport shrinks.
class FakeViewport extends EventTarget {
  height = document.documentElement.clientHeight
  width = document.documentElement.clientWidth
  offsetTop = 0
  offsetLeft = 0
  scale = 1
  move(height: number) {
    this.height = height
    this.dispatchEvent(new Event('resize'))
  }
}

function replaceVisualViewport(value: FakeViewport) {
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value })
  onTestFinished(() => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  })
}

/** A finger's tap: a touch press and release, then the click the browser sends after it. */
function tap(el: Element) {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }))
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'touch' }))
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()

// A read that a page starts after its test ended gets no answer, not the real server (lib/lateServerReads.ts).
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetRetries()
  queryClient.clear()
  await setViewport(desktop[0], desktop[1])
})

const chatOf = () => page.getByRole('region', { name: title })
const box = () => chatOf().getByRole('textbox')
const paperclip = () => chatOf().getByRole('button', { name: 'Attach a file' }).element()

/** The hidden file input of the chat, which the paperclip opens. */
function fileInput(): HTMLInputElement {
  const input = chatOf().element().querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
  return input
}

/** AppShell's root, whose `--app-shell-keyboard` says the footer is docked on the keyboard. */
function shell(): HTMLElement {
  const root = document.querySelector('.app-shell__root')
  if (!(root instanceof HTMLElement)) throw new Error('no shell')
  return root
}

/**
 * Opens the app at `size` with no URL parameters, taps Workspaces and the live chat (on the desktop its pane shows),
 * with a stand-in visual viewport. Returns the viewport and a spy on the file input's click.
 */
async function openChat(size: readonly [number, number]) {
  fakeServer()
  await setViewport(size[0], size[1])
  const viewport = new FakeViewport()
  replaceVisualViewport(viewport)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(<RouterProvider router={router} />, rootErrorOptions)
  // The render's root fills the window, as `#root` does in index.css.
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  if (size === desktop) {
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
  } else {
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
  }
  await expect.element(box()).toBeVisible()
  await document.fonts.ready
  const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined)
  return { viewport, click }
}

/** Focuses the box and raises a keyboard that leaves 470 px of the phone's 844, until the shell docks on it. */
async function raiseKeyboard(viewport: FakeViewport) {
  await userEvent.click(box())
  viewport.move(470)
  await expect.poll(() => shell().style.getPropertyValue('--app-shell-keyboard')).not.toBe('')
}

/** Lets a click the page may still be waiting to send arrive. */
const settle = () =>
  new Promise((resolve) => {
    window.setTimeout(resolve, 200)
  })

describe('the paperclip with the phone keyboard up (R29)', () => {
  it('only closes the keyboard on the first tap, and opens the picker on the next tap once it has closed', async () => {
    const { viewport, click } = await openChat(phone)
    await raiseKeyboard(viewport)
    expect(document.activeElement).toBe(box().element())
    tap(paperclip())
    await settle()
    expect(click).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(box().element())
    // The keyboard closes, the visual viewport grows back and the shell drops the composer.
    viewport.move(phone[1])
    await expect.poll(() => shell().style.getPropertyValue('--app-shell-keyboard')).toBe('')
    tap(paperclip())
    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.contexts[0]).toBe(fileInput())
  })

  it('opens the picker with Enter after a touch on the paperclip that became a scroll', async () => {
    const { viewport, click } = await openChat(phone)
    await raiseKeyboard(viewport)
    const clip = paperclip()
    // The finger lands on the paperclip with the keyboard up, then the touch turns into a scroll: no click comes.
    clip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }))
    clip.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, cancelable: true, pointerType: 'touch' }))
    expect(click).not.toHaveBeenCalled()
    clip.focus()
    await userEvent.keyboard('{Enter}')
    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.contexts[0]).toBe(fileInput())
  })

  it('opens the picker on one tap with the keyboard closed', async () => {
    const { click } = await openChat(phone)
    expect(shell().style.getPropertyValue('--app-shell-keyboard')).toBe('')
    tap(paperclip())
    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.contexts[0]).toBe(fileInput())
  })

  it('opens the picker on one click on the desktop', async () => {
    const { click } = await openChat(desktop)
    await userEvent.click(box())
    await userEvent.click(paperclip())
    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.contexts[0]).toBe(fileInput())
  })

  it('keeps the picker open to every file type, with no capture, so the phone offers all three choices', async () => {
    await openChat(phone)
    const input = fileInput()
    expect([input.type, input.multiple, input.hasAttribute('accept'), input.hasAttribute('capture')]).toEqual([
      'file',
      true,
      false,
      false,
    ])
  })
})
