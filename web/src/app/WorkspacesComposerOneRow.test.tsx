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
import { fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Screen review R45: on the iPad the owner saw the chat box "sometimes closes all the way and sometimes it stays as the
// expanded form": R31 kept a working chat's composer in two rows so Stop showed. Now the phone's and the tablet's
// composer is one row at rest (no focus, no draft, no files) in every chat state; while the chat works the row draws
// Stop beside Send (Figma M3: Stop 105:2838, Send 105:2844), and a turn that starts or ends moves nothing. Each test
// takes the owner's path: the app with no URL parameters, Workspaces, then a tap on the chat, with the contract-checked
// fakes as the server. Every name and message is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const title = 'plan the slice'
const list = (status: 'idle' | 'working') => ({
  machine: 'mac-mini',
  workspaces: [
    {
      id: workspace,
      label: 'live work',
      chats: [
        {
          id: plan,
          kind: 'claude',
          title,
          model: 'claude-opus-5-5',
          contextUsed: null,
          modelId: null,
          effort: null,
          pane: `${plan}-pane`,
          status,
          parent: null,
        },
      ],
    },
  ],
})

/** The stubbed server: the workspace list, its layout and events, and the chat's transcript, stop and upload routes. */
function withChat(status: 'idle' | 'working') {
  const transcripts = fakeTranscriptServer({ uploads: { chunkSize: 4 } })
  transcripts.set(plan, [{ type: 'user', id: 'u1', text: 'Fix the build', cut: false }])
  const workspaces = fakeWorkspacesServer(transcripts, list(status))
  vi.stubGlobal('XMLHttpRequest', transcripts.uploads.XMLHttpRequest)
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = transcripts.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return { transcripts, workspaces }
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetRetries()
  queryClient.clear()
  await setViewport(1512, 982)
})

const phone = [390, 844] as const
const tablet = [744, 1133] as const

const chatOf = () => page.getByRole('region', { name: title })
const box = () => chatOf().getByRole('textbox')
const stopButton = () => chatOf().getByRole('button', { name: 'Stop', exact: true })
const sendButton = () => chatOf().getByRole('button', { name: 'Send', exact: true })

/** The library composer's root: the parent of its controls row. */
function composer(): HTMLElement {
  const root = chatOf().element().querySelector('[data-composer-controls]')?.parentElement
  if (!(root instanceof HTMLElement)) throw new Error('no composer')
  return root
}
const collapsed = () => composer().hasAttribute('data-collapsed')
const height = () => Math.round(composer().getBoundingClientRect().height)
const top = () => Math.round(composer().getBoundingClientRect().top)
const middle = (el: Element) => {
  const box = el.getBoundingClientRect()
  return Math.round(box.top + box.height / 2)
}

/** Opens the app at `size` with no URL parameters, taps Workspaces and the chat in the list. */
async function openChat(size: readonly [number, number], status: 'idle' | 'working') {
  const fakes = withChat(status)
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
  expect(router.state.location.searchStr).toBe('')
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
  await expect.element(box()).toBeVisible()
  await document.fonts.ready
  return fakes
}

/** Moves the focus out of the composer, as a tap on the transcript does, and lets the library report it. */
async function blurBox() {
  box().element().blur()
  await new Promise((resolve) => {
    window.setTimeout(resolve, 50)
  })
}

/** The hidden file input of the chat, which the paperclip opens. */
function fileInput(): HTMLInputElement {
  const input = chatOf().element().querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
  return input
}

describe.each([
  ['phone', phone],
  ['tablet', tablet],
] as const)('the composer at rest on the %s, idle or working (R45)', (_, size) => {
  it('draws one row with no Stop while the chat is idle', async () => {
    await openChat(size, 'idle')
    await expect.poll(collapsed).toBe(true)
    expect(height()).toBeGreaterThanOrEqual(46)
    expect(height()).toBeLessThanOrEqual(54)
    expect(stopButton().elements()).toHaveLength(0)
  })

  it('draws one row with Stop beside Send while the chat works, and Stop stops the chat', async () => {
    const { transcripts } = await openChat(size, 'working')
    await expect.element(stopButton()).toBeVisible()
    await expect.poll(collapsed).toBe(true)
    expect(height()).toBeGreaterThanOrEqual(46)
    expect(height()).toBeLessThanOrEqual(54)
    // Stop sits in the row, just before Send, on the same line as the text.
    const stop = stopButton().element()
    const send = sendButton().element()
    expect(middle(stop)).toBe(middle(send))
    expect(middle(box().element())).toBe(middle(send))
    expect(stop.getBoundingClientRect().right).toBeLessThan(send.getBoundingClientRect().left)
    expect(composer().contains(stop)).toBe(true)
    // A tap on Stop sends the stop and leaves the row collapsed: it does not focus the box.
    await userEvent.click(stopButton())
    await expect.poll(() => transcripts.stops).toEqual([plan])
    expect(document.activeElement).not.toBe(box().element())
    expect(collapsed()).toBe(true)
  })

  it('keeps its top and height while the chat starts and ends a turn at rest', async () => {
    const { workspaces } = await openChat(size, 'idle')
    await expect.poll(collapsed).toBe(true)
    const [restTop, restHeight] = [top(), height()]
    workspaces.setStatus(plan, 'working')
    await expect.element(stopButton()).toBeVisible()
    expect(collapsed()).toBe(true)
    expect([top(), height()]).toEqual([restTop, restHeight])
    workspaces.setStatus(plan, 'idle')
    await expect.poll(() => stopButton().elements()).toHaveLength(0)
    expect(collapsed()).toBe(true)
    expect([top(), height()]).toEqual([restTop, restHeight])
  })

  it('draws two rows with the focus, a draft or a file while the chat works', async () => {
    await openChat(size, 'working')
    await expect.poll(collapsed).toBe(true)
    // The focus: a tap on the box expands it, with Stop still shown.
    await userEvent.click(box())
    await expect.poll(collapsed).toBe(false)
    expect(height()).toBeGreaterThan(70)
    await expect.element(stopButton()).toBeVisible()
    // A draft keeps two rows after the box blurs.
    await userEvent.type(box(), 'half a thought')
    await blurBox()
    expect(collapsed()).toBe(false)
    await userEvent.click(box())
    await userEvent.clear(box())
    await blurBox()
    await expect.poll(collapsed).toBe(true)
    // A file keeps two rows too.
    await userEvent.upload(fileInput(), [new File(['notes'], 'notes.txt', { type: 'text/plain' })])
    await expect.element(chatOf().getByRole('group', { name: 'Attached files' })).toBeVisible()
    await blurBox()
    expect(collapsed()).toBe(false)
    expect(height()).toBeGreaterThan(70)
  })
})
