import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
import { installKeyboardProxy } from './keyboardProxy.ts'
import { routeTree } from './routeTree.gen.ts'

// Screen review R31: in the Claude iOS app the message box is one short row while the keyboard is closed and grows
// when it opens. On the phone and the tablet the live chat's composer now draws one row (paperclip, text, Send; about
// 50 px against 78) while its box is not focused and holds no text and no files (library beta.96 `collapsed`): focus
// expands it, a blur with the box empty collapses it again, and a draft or a file keeps it expanded. The desktop never
// collapses. Each test takes the owner's path: it opens the app with no URL parameters, taps Workspaces and the live
// chat (on the desktop its pane shows).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const title = 'plan the slice'
/** The chat's state: a working Claude chat's composer draws Stop, and a Codex chat's box is disabled. */
type Status = 'idle' | 'working' | 'codex'
/** The live chat, idle, working or a Codex chat. */
const chatsOf = (status: Status) => [
  {
    id: plan,
    kind: status === 'codex' ? 'codex' : 'claude',
    title,
    model: 'claude-opus-5-5',
    contextUsed: null,
    modelId: null,
    effort: null,
    pane: `${plan}-pane`,
    status: status === 'working' ? 'working' : 'idle',
    parent: null,
  },
]
const layoutOf = (chats: ReturnType<typeof chatsOf>) =>
  JSON.stringify({
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
const tablet = [756, 1129] as const
const desktop = [1512, 982] as const

/** The stubbed server: the workspace, its layout, the event stream and the fake's chat and upload routes. */
function fakeServer(status: Status) {
  const chats = chatsOf(status)
  const layout = layoutOf(chats)
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
  return fake
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
const paperclip = () => chatOf().getByRole('button', { name: 'Attach a file' })
const sendButton = () => chatOf().getByRole('button', { name: 'Send', exact: true })

/** The library composer's root: the parent of its controls row. */
function composer(): HTMLElement {
  const root = chatOf().element().querySelector('[data-composer-controls]')?.parentElement
  if (!(root instanceof HTMLElement)) throw new Error('no composer')
  return root
}

/** Whether the composer draws its one row, by the library's mark and its height. */
const collapsed = () => composer().hasAttribute('data-collapsed')
const height = () => Math.round(composer().getBoundingClientRect().height)

/** The hidden file input of the chat, which the paperclip opens. */
function fileInput(): HTMLInputElement {
  const input = chatOf().element().querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
  return input
}

/** Opens the app at `size` with no URL parameters, taps Workspaces and the live chat (on the desktop its pane shows). */
async function openChat(size: readonly [number, number], status: Status = 'idle') {
  const fake = fakeServer(status)
  await setViewport(size[0], size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(<RouterProvider router={router} />, rootErrorOptions)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  if (size === desktop) await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
  else await openFromList()
  await expect.element(box()).toBeVisible()
  await document.fonts.ready
  return fake
}

/** Taps the chat in the phone's or the tablet's list. */
async function openFromList() {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** Moves the focus out of the composer, as a tap on the transcript does, and lets the library report it. */
async function blurBox() {
  box().element().blur()
  await new Promise((resolve) => {
    window.setTimeout(resolve, 50)
  })
}

describe.each([
  ['phone', phone],
  ['tablet', tablet],
] as const)('the composer on the %s with the keyboard closed (R31)', (_, size) => {
  it('opens as one row, about 50 px high, with no model', async () => {
    await openChat(size)
    await expect.poll(collapsed).toBe(true)
    expect(height()).toBeGreaterThanOrEqual(46)
    expect(height()).toBeLessThanOrEqual(54)
    expect(
      chatOf()
        .getByRole('button', { name: /claude-opus-5-5/ })
        .elements(),
    ).toHaveLength(0)
    expect(box().element()).toHaveAttribute('placeholder')
  })

  it('focuses the box and expands on a tap on the row', async () => {
    await openChat(size)
    await expect.poll(collapsed).toBe(true)
    // The row itself, not its text or a button: the library focuses the box in the same tap.
    tap(composer())
    expect(document.activeElement).toBe(box().element())
    await expect.poll(collapsed).toBe(false)
    expect(height()).toBeGreaterThan(70)
    // The box keeps the focus as it grows.
    expect(document.activeElement).toBe(box().element())
  })

  it('stays expanded after a blur with text, and collapses after the text is cleared and the box blurs', async () => {
    await openChat(size)
    await userEvent.click(box())
    await userEvent.type(box(), 'half a thought')
    await blurBox()
    expect(collapsed()).toBe(false)
    await userEvent.click(box())
    await userEvent.clear(box())
    expect(collapsed()).toBe(false)
    await blurBox()
    await expect.poll(collapsed).toBe(true)
  })

  it("opens expanded with the chat's draft from the draft book", async () => {
    await openChat(size)
    await expect.poll(collapsed).toBe(true)
    await userEvent.click(box())
    await userEvent.type(box(), 'keep this draft')
    await blurBox()
    // Back to the list, then the chat again: its composer mounts from the page's draft book.
    await userEvent.click(chatOf().getByRole('button', { name: 'Workspaces', exact: true }))
    await expect.element(page.getByRole('heading', { name: title })).not.toBeInTheDocument()
    await openFromList()
    await expect.element(box()).toHaveValue('keep this draft')
    expect(collapsed()).toBe(false)
  })

  it('opens the picker on one tap of the paperclip from the row, and keeps the chip expanded', async () => {
    await openChat(size)
    await expect.poll(collapsed).toBe(true)
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined)
    tap(paperclip().element())
    expect(click).toHaveBeenCalledTimes(1)
    expect(click.mock.contexts[0]).toBe(fileInput())
    click.mockRestore()
    await userEvent.upload(fileInput(), [new File(['notes'], 'notes.txt', { type: 'text/plain' })])
    await expect.element(chatOf().getByRole('group', { name: 'Attached files' })).toBeVisible()
    await blurBox()
    expect(collapsed()).toBe(false)
    await userEvent.click(chatOf().getByRole('button', { name: 'Remove notes.txt' }))
    await blurBox()
    await expect.poll(collapsed).toBe(true)
  })

  it('sends from the expanded composer', async () => {
    const fake = await openChat(size)
    await expect.poll(collapsed).toBe(true)
    tap(composer())
    await expect.poll(collapsed).toBe(false)
    await userEvent.type(box(), 'run the tests')
    await userEvent.click(sendButton())
    await expect.poll(() => fake.prompts).toEqual([{ chat: plan, text: 'run the tests' }])
    await expect.element(box()).toHaveValue('')
    // Send keeps the focus in the box (the keyboard stays up), so the empty box stays expanded under the pending send.
    expect(document.activeElement).toBe(box().element())
    await expect.element(chatOf().getByText('run the tests')).toBeVisible()
    expect(collapsed()).toBe(false)
    expect(height()).toBeGreaterThan(70)
  })

  it('stays expanded while the chat works, so Stop shows', async () => {
    await openChat(size, 'working')
    await expect.element(chatOf().getByRole('button', { name: 'Stop' })).toBeVisible()
    expect(collapsed()).toBe(false)
    expect(height()).toBeGreaterThan(70)
  })

  it("stays expanded while the box is disabled, as a Codex chat's is", async () => {
    await openChat(size, 'codex')
    await expect.element(box()).toBeDisabled()
    await blurBox()
    expect(collapsed()).toBe(false)
    expect(height()).toBeGreaterThan(70)
  })
})

describe('the composer on the desktop (R31)', () => {
  it('never collapses, with the box empty and blurred', async () => {
    await openChat(desktop)
    expect(collapsed()).toBe(false)
    await userEvent.click(box())
    await blurBox()
    expect(collapsed()).toBe(false)
    expect(height()).toBeGreaterThan(70)
  })
})

describe.each([
  ['phone', phone],
  ['tablet', tablet],
] as const)('the composer on the %s with the proxy focus of iOS (R37)', (_, size) => {
  it('expands at the tap while the proxy holds the focus, so the focus moves into it with no change of layout', async () => {
    await openChat(size)
    await expect.poll(collapsed).toBe(true)
    const stop = installKeyboardProxy({ proxyWaitMs: 600 })
    try {
      const field = box().element()
      field.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }))
      field.dispatchEvent(new Event('touchend', { bubbles: true, cancelable: true }))
      const proxy = document.activeElement
      expect(proxy?.hasAttribute('data-keyboard-proxy')).toBe(true)
      await expect.poll(collapsed).toBe(false)
      expect(document.activeElement).toBe(proxy)
      const expanded = height()
      const top = Math.round(composer().getBoundingClientRect().top)
      await expect.poll(() => document.activeElement, { timeout: 3000 }).toBe(field)
      expect(collapsed()).toBe(false)
      expect(height()).toBe(expanded)
      expect(Math.round(composer().getBoundingClientRect().top)).toBe(top)
    } finally {
      stop()
    }
  })
})
