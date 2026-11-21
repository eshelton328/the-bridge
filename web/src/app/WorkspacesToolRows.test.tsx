import type { TranscriptEntry } from '@bridge/contract'
import Markdown from 'react-markdown'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { resetRetries } from '../errors/retryGuard.ts'
import { fakeTranscriptServer, toolCall } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { openWorkspaces } from './longLiveChat.ts'

// R32, the owner's words: "these tool messages aren't great like send message
// bash macro etc. how can we improve that". A live tool call with its kind,
// title and label (backend #371) draws its kind's icon, the title and the
// label, not the raw tool name; a run of two or more between other entries is
// one group row with a summary of its kinds and counts, which a tap opens; the
// newest run of a working chat stays open until an entry follows it; a call
// without the fields draws as before. Each test takes the owner's path (no URL
// parameters, then Workspaces, then the chat on the phone) on a stubbed server
// whose transcript routes are the contract-checked fake.
vi.mock('react-markdown', { spy: true })

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
const reply = (id: string, text: string): TranscriptEntry => ({ type: 'assistant', id, text, cut: false })
const bash = (id: string, label = '', running = false) =>
  toolCall(id, 'Bash', { kind: 'shell', title: 'Ran a command', label, running })
const read = (id: string) => toolCall(id, 'Read', { kind: 'read', title: 'Read a file' })
const edit = (id: string) => toolCall(id, 'Edit', { kind: 'edit', title: 'Edited a file' })

/** Stubs the server with one live Claude chat, "plan the slice", whose status is `status`; returns the transcript fake. */
function stubChat(status: 'working' | 'idle', entries: readonly TranscriptEntry[]) {
  const server = fakeTranscriptServer()
  server.set(plan, entries)
  const chats = [
    {
      id: plan,
      kind: 'claude',
      title: 'plan the slice',
      model: 'claude-opus-5-5',
      contextUsed: null,
      modelId: null,
      effort: null,
      pane: `${plan}-pane`,
      status,
      parent: null,
    },
  ]
  const layout = {
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
  }
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = server.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      if (path === '/api/workspaces')
        return Promise.resolve(
          new Response(
            JSON.stringify({ machine: 'mac-mini', workspaces: [{ id: workspace, label: 'live work', chats }] }),
            { status: 200 },
          ),
        )
      if (path === `/api/workspaces/${encodeURIComponent(workspace)}/layout`)
        return Promise.resolve(new Response(JSON.stringify(layout), { status: 200 }))
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
  return server
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const devices = [
  { name: 'the phone', size: [390, 844] },
  { name: 'the desktop', size: [1512, 982] },
] as const

/** Opens Workspaces at `size` on the owner's path and, on the phone, taps the chat; waits for `first` to show. */
async function openChat(size: readonly [number, number], first: string) {
  view = await openWorkspaces(size)
  if (size[0] < 600) await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
  await expect.element(page.getByText(first, { exact: true })).toBeVisible()
}

/** The group row whose summary is `summary`, after its dot's "Done" or "Running". */
const group = (summary: string) => page.getByRole('button', { name: new RegExp(`^(Done|Running) ${summary}$`) })

for (const device of devices)
  describe(`a live chat's tool calls on ${device.name} (R32)`, () => {
    it('shows a call as its title and label, with the raw tool name only as the icon title', async () => {
      stubChat('idle', [user('u1', 'Fix the build'), bash('t1', 'Run the web tests'), reply('a1', 'All green.')])
      await openChat(device.size, 'Fix the build')
      await expect.element(page.getByText('Ran a command', { exact: true })).toBeVisible()
      await expect.element(page.getByText('Run the web tests', { exact: true })).toBeVisible()
      const row = page.getByText('Ran a command', { exact: true }).element().closest('[data-tool-kind]')
      expect(row?.getAttribute('data-tool-kind')).toBe('shell')
      expect(row?.textContent).not.toContain('Bash')
      expect(row?.querySelector('[title="Bash"]')).not.toBeNull()
      expect(getReports()).toEqual([])
    })

    it('draws a run of calls as one summary row that a tap opens, and the tap renders no other entry', async () => {
      stubChat('idle', [
        user('u1', 'Fix the build'),
        bash('t1'),
        bash('t2'),
        bash('t3'),
        read('t4'),
        read('t5'),
        edit('t6'),
        reply('a1', 'All green.'),
      ])
      await openChat(device.size, 'Fix the build')
      const summary = group('Ran 3 commands, read 2 files, edited 1 file')
      await expect.element(summary).toHaveAttribute('aria-expanded', 'false')
      await expect.element(page.getByText('Read a file', { exact: true }).first()).not.toBeVisible()
      await new Promise((resolve) => setTimeout(resolve, 300))
      vi.mocked(Markdown).mockClear()
      await userEvent.click(summary)
      await expect.element(summary).toHaveAttribute('aria-expanded', 'true')
      await expect.element(page.getByText('Read a file', { exact: true }).first()).toBeVisible()
      expect(page.getByText('Ran a command', { exact: true }).elements()).toHaveLength(3)
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(vi.mocked(Markdown).mock.calls.length).toBe(0)
      await userEvent.click(summary)
      await expect.element(summary).toHaveAttribute('aria-expanded', 'false')
      // The keyboard: the row is a button, so Enter and Space open and close it.
      const button = summary.element()
      if (!(button instanceof HTMLElement)) throw new Error('no group button')
      button.focus()
      await userEvent.keyboard('{Enter}')
      await expect.element(summary).toHaveAttribute('aria-expanded', 'true')
      await userEvent.keyboard(' ')
      await expect.element(summary).toHaveAttribute('aria-expanded', 'false')
      expect(getReports()).toEqual([])
    })

    it("keeps a working chat's newest run open until a reply follows it", async () => {
      const server = stubChat('working', [user('u1', 'Fix the build'), bash('t1'), read('t2'), bash('t3', '', true)])
      await openChat(device.size, 'Fix the build')
      const summary = group('Ran 2 commands, read 1 file')
      await expect.element(summary).toHaveAttribute('aria-expanded', 'true')
      await expect.element(page.getByText('Read a file', { exact: true })).toBeVisible()
      server.push(plan, [bash('t3'), reply('a1', 'All green.')])
      await expect.element(page.getByText('All green.')).toBeVisible()
      await expect.element(summary).toHaveAttribute('aria-expanded', 'false')
      expect(getReports()).toEqual([])
    })

    it('draws a call without the fields as before, and never groups it', async () => {
      const old = (id: string): TranscriptEntry => ({ type: 'tool', id, name: 'Bash', target: 'pnpm', running: false })
      stubChat('idle', [
        user('u1', 'Fix the build'),
        old('t1'),
        old('t2'),
        reply('a1', 'Trying again.'),
        bash('t3'),
        read('t4'),
        reply('a2', 'All green.'),
      ])
      await openChat(device.size, 'Fix the build')
      await expect.element(page.getByText('Bash pnpm', { exact: true }).first()).toBeVisible()
      expect(page.getByText('Bash pnpm', { exact: true }).elements()).toHaveLength(2)
      expect(page.getByRole('button', { name: /used|commands/ }).elements()).toHaveLength(0)
      await expect.element(group('Ran 1 command, read 1 file')).toHaveAttribute('aria-expanded', 'false')
      expect(getReports()).toEqual([])
    })
  })
