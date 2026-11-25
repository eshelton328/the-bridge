import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type Locator, page, userEvent } from 'vitest/browser'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { settingsStore } from '../state/settingsStore.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Settings → Rich text on the owner's path (bridge-coord, 2026-11-25): the app with no URL parameters, Workspaces and
// a live chat whose reply has every rich text feature, then Settings, the switches off, and the same chat again in
// the same visit, with no reload. Each feature that is off shows its plain Markdown and no text goes. The chats and
// their text are made up.

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'

const summary = (id: string, title: string) => ({
  id,
  kind: 'claude',
  title,
  model: 'claude-opus-5-5',
  contextUsed: null,
  modelId: null,
  effort: null,
  pane: `${id}-pane`,
  status: 'idle',
  parent: null,
})
const chats = [summary(plan, 'plan the slice'), summary(review, 'review-notes')]
const layout = JSON.stringify({
  workspace,
  tabs: [
    {
      id: 'mac-mini/w-live:t1',
      label: 'main',
      active: true,
      root: {
        kind: 'split',
        direction: 'row',
        ratio: 0.5,
        first: { kind: 'pane', chat: plan },
        second: { kind: 'pane', chat: review },
      },
      focusedChat: plan,
      zoomed: false,
      chats,
    },
  ],
})

const fence = (language: string, ...lines: string[]) => ['```' + language, ...lines, '```'].join('\n')
const text = [
  'Ask review-notes for the list.',
  '> [!NOTE]\n> Keep the seal order.',
  fence('ts', 'const total: number = 2'),
  fence('mermaid', 'graph TD', '  Draft --> Seal'),
  'The area is $x^2$.',
  '![Seal chart](notes/chart.png)',
].join('\n\n')

const reply = (id: string, body: string): TranscriptEntry => ({ type: 'assistant', id, text: body, cut: false })

function fakeServer() {
  const transcripts = fakeTranscriptServer()
  transcripts.set(plan, [reply('a1', text)])
  transcripts.set(review, [reply('a2', 'The notes are ready.')])
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const transcript = transcripts.handle(path, init)
      if (transcript !== undefined) return Promise.resolve(transcript)
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

type Device = { name: string; size: readonly [number, number]; phone: boolean }
const devices: readonly Device[] = [
  { name: 'the phone', size: [390, 844], phone: true },
  { name: 'the desktop', size: [1512, 982], phone: false },
]

const features = ['Callouts', 'Code highlighting', 'Chat links', 'Mermaid diagrams', 'Math', 'Images'] as const

/** The reply's text box: the MarkdownView that holds "Ask review-notes". */
function replyBox(): Element {
  const box = [...document.querySelectorAll('.markdown-view__root, [class*="markdown"]')].find((el) =>
    el.textContent.includes('for the list.'),
  )
  if (box === undefined) throw new Error('no reply')
  return box
}

async function openChat(device: Device) {
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  if (device.phone) await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
  await expect.poll(() => document.body.textContent.includes('for the list.')).toBe(true)
}

async function openSettings(device: Device) {
  if (device.phone) {
    // The phone's chat fills the screen, with no tab bar: Back first, as the owner does.
    const back = page.getByRole('button', { name: 'Back to Workspaces' })
    if (back.query() !== null) await userEvent.click(back)
    await userEvent.click(page.getByRole('button', { name: 'More', exact: true }))
    await userEvent.click(page.getByRole('dialog', { name: 'More' }).getByRole('button', { name: /Settings/ }))
  } else await userEvent.click(page.getByRole('button', { name: 'Settings', exact: true }))
  await expect.element(page.getByRole('switch', { name: 'Math' })).toBeInTheDocument()
}

/** The Ark switch's input is hidden, so the owner taps its row. */
async function turnOff(control: Locator) {
  const row = control.element().closest('label')
  if (row === null) throw new Error('the switch has no label row')
  await userEvent.click(row)
  await expect.element(control).not.toBeChecked()
}

/** Every word of the reply, which no switch may lose; a drawn diagram shows its source only on "Show source". */
async function expectAllText(diagram: boolean) {
  const words = ['review-notes', 'Keep the seal order.', 'const total: number = 2', 'Seal chart']
  for (const word of diagram ? words : [...words, 'Draft --> Seal'])
    await expect.poll(() => replyBox().textContent.includes(word), { message: word }).toBe(true)
}

describe('the rich text switches on the owner path', () => {
  for (const device of devices)
    it(`draw each feature, then its plain Markdown once its switch is off, on ${device.name}`, async () => {
      fakeServer()
      await setViewport(device.size[0], device.size[1])
      const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
      view = await testRender(<RouterProvider router={router} />)
      await openChat(device)
      // On, the default: each feature draws.
      await expect.poll(() => replyBox().querySelector('.callout__root')).not.toBeNull()
      await expect.poll(() => replyBox().querySelector('.inline-chip__root')).not.toBeNull()
      await expect
        .poll(() => replyBox().querySelector('[data-language="ts"] [data-kind]'), { timeout: 10_000 })
        .not.toBeNull()
      await expect.poll(() => replyBox().querySelector('.katex'), { timeout: 10_000 }).not.toBeNull()
      await expect.poll(() => replyBox().querySelector('figure'), { timeout: 10_000 }).not.toBeNull()

      await openSettings(device)
      for (const feature of features) await turnOff(page.getByRole('switch', { name: feature }))
      expect(Object.values(settingsStore.getState().richText).some((on) => on)).toBe(false)
      await openChat(device)

      // Off: the plain Markdown, and every word still there.
      await expect.poll(() => replyBox().querySelector('.callout__root')).toBeNull()
      const quote = replyBox().querySelector('blockquote')
      expect(quote?.textContent).toContain('[!NOTE]')
      expect(replyBox().querySelector('.inline-chip__root')).toBeNull()
      expect(replyBox().querySelector('[data-kind]')).toBeNull()
      expect(replyBox().querySelector('[data-language="ts"] pre, pre[data-language="ts"]')?.textContent).toContain(
        'const total: number = 2',
      )
      expect(replyBox().querySelector('[data-language="mermaid"]')?.textContent).toContain('Draft --> Seal')
      expect(replyBox().querySelector('.katex, [data-math]')).toBeNull()
      expect(replyBox().textContent).toContain('$x^2$')
      expect(replyBox().querySelector('img, figure')).toBeNull()
      const link = replyBox().querySelector('a')
      expect(link?.textContent).toBe('Seal chart')
      expect(link?.getAttribute('href')).toMatch(/^\/api\/files\/raw\?/)
      await expectAllText(false)
    })

  it('turns one feature off and keeps the others on', async () => {
    fakeServer()
    await setViewport(390, 844)
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
    view = await testRender(<RouterProvider router={router} />)
    const phone = devices[0]
    if (phone === undefined) throw new Error('no phone')
    await openSettings(phone)
    await turnOff(page.getByRole('switch', { name: 'Math' }))
    await openChat(phone)
    await expect.poll(() => replyBox().querySelector('.callout__root')).not.toBeNull()
    await expect.poll(() => replyBox().querySelector('.inline-chip__root')).not.toBeNull()
    await expect.poll(() => replyBox().querySelector('figure'), { timeout: 10_000 }).not.toBeNull()
    expect(replyBox().querySelector('.katex, [data-math]')).toBeNull()
    expect(replyBox().textContent).toContain('$x^2$')
    await expectAllText(true)
  })
})
