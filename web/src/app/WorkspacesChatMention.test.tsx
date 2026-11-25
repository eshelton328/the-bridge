import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// A live chat's name in a message opens that chat (remarkChatMentions.ts), on the owner's path: the app with no URL
// parameters, Workspaces, a live chat, then the mention in its reply. The chats and their text are made up.

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
  status: 'working',
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

const reply = (id: string, text: string): TranscriptEntry => ({ type: 'assistant', id, text, cut: false })

function fakeServer() {
  const transcripts = fakeTranscriptServer()
  transcripts.set(plan, [reply('a1', 'Ask review-notes for the list; routing and @backend-coord stay text.')])
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

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the tablet', size: [756, 1129] },
] as const

describe('a mention of a live chat in a message', () => {
  for (const device of devices)
    it(`opens that chat on ${device.name}`, async () => {
      fakeServer()
      await setViewport(device.size[0], device.size[1])
      const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
      view = await testRender(<RouterProvider router={router} />)
      await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
      await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
      await expect.element(page.getByRole('heading', { name: 'plan the slice' })).toBeVisible()
      // Only the known, hyphenated title links; a one-word word and an unknown @name stay text.
      const mention = page.getByRole('link', { name: 'review-notes', exact: true })
      await expect.element(mention).toBeVisible()
      await expect.element(page.getByRole('link', { name: 'routing' })).not.toBeInTheDocument()
      await expect.element(page.getByRole('link', { name: 'backend-coord' })).not.toBeInTheDocument()
      await userEvent.click(mention)
      await expect.element(page.getByRole('heading', { name: 'review-notes' })).toBeVisible()
      await expect.element(page.getByText('The notes are ready.')).toBeVisible()
      await expect.poll(() => router.state.location.search).toEqual({})
    })
})
