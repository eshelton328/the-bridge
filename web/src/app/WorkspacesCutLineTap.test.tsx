import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { resetRetries } from '../errors/retryGuard.ts'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { openWorkspaces } from './longLiveChat.ts'
import { applyTextSize } from './textSize.ts'

// NCC-147: d-131 lets a tool-call line stay one line because "it expands on tap". A live chat's tool line without a
// kind and its event line (a slash command's error) are the library's ToolLine, which expands only with
// onOpenChange and output. On the phone at Large both lines are cut, so a tap on a cut line must show its full text;
// a line that fits stays as Figma draws it, with no chevron and no button. Each test takes the owner's path: the app
// with no URL, then Workspaces, then the chat, on a stubbed server whose transcript routes are the contract's fake.
const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'

const user = (id: string, text: string): TranscriptEntry => ({ type: 'user', id, text, cut: false })
const tool = (id: string, name: string, target: string): TranscriptEntry => ({
  type: 'tool',
  id,
  name,
  target,
  running: false,
})
const error = (id: string, text: string): TranscriptEntry => ({ type: 'error', id, text, cut: false })

const longTarget = 'projects/ncc-1701/product/features/f-005-the-bridge/requirements-for-the-phone-layout.md'
const longError = 'Unknown skill: plan-the-slice-with-the-phone-layout-and-the-tablet-layout-in-one-pass'
const shortTarget = 'a.md'

/** Stubs the server with one live Claude chat, "plan the slice", that shows `entries`. */
function stubChat(entries: readonly TranscriptEntry[]) {
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
      status: 'idle',
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
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  applyTextSize('small')
  await setViewport(1512, 982)
})

/** Opens the chat at `size` on the owner's path (on the phone, a tap on its row) and waits for its first message. */
async function openChat(size: readonly [number, number]) {
  view = await openWorkspaces(size)
  if (size[0] < 600) await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
  await expect.element(page.getByText('Fix the build', { exact: true })).toBeVisible()
}

/** The one-line text of the tool line that reads `text`. */
function lineText(text: string): HTMLElement {
  const line = [...document.querySelectorAll<HTMLElement>('.tool-line__text .truncated-text')].find(
    (el) => el.textContent === text,
  )
  if (line === undefined) throw new Error(`no tool line reads ${text}`)
  return line
}

/** The toggle of the tool line that reads `text`, after its dot's state name. */
const toggle = (state: string, text: string) => page.getByRole('button', { name: `${state} ${text}`, exact: true })

/** The full text under the line, as the output shows it: no cut, on as many lines as it needs. */
function output(text: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>('.tool-line__output')].find((el) => el.textContent === text)
}

const entries = [
  user('u1', 'Fix the build'),
  tool('t1', 'Read', longTarget),
  tool('t2', 'Read', shortTarget),
  error('e1', longError),
]

describe('a cut tool line and event line on the phone at Large (NCC-147)', () => {
  for (const line of [
    { what: 'tool line', state: 'Done', text: `Read ${longTarget}` },
    { what: 'event line', state: 'Error', text: longError },
  ])
    it(`opens the full text of a cut ${line.what} on a tap, and closes it on a second tap`, async () => {
      applyTextSize('large')
      stubChat(entries)
      await openChat([390, 844])
      const cut = lineText(line.text)
      await expect.poll(() => cut.scrollWidth > cut.clientWidth).toBe(true)
      const button = toggle(line.state, line.text)
      await expect.element(button).toHaveAttribute('aria-expanded', 'false')
      expect(output(line.text)?.hidden ?? true).toBe(true)

      await userEvent.click(button)
      await expect.element(button).toHaveAttribute('aria-expanded', 'true')
      const full = output(line.text)
      if (full === undefined) throw new Error('no full text under the line')
      expect(full.hidden).toBe(false)
      expect(full.scrollWidth).toBeLessThanOrEqual(full.clientWidth)
      const box = full.getBoundingClientRect()
      expect(box.right).toBeLessThanOrEqual(390)

      await userEvent.click(button)
      await expect.element(button).toHaveAttribute('aria-expanded', 'false')
      expect(full.hidden).toBe(true)
      expect(getReports()).toEqual([])
    })

  it('keeps a line that fits as Figma draws it: no button and no chevron', async () => {
    applyTextSize('large')
    stubChat(entries)
    await openChat([390, 844])
    const fits = lineText(`Read ${shortTarget}`)
    expect(fits.scrollWidth).toBeLessThanOrEqual(fits.clientWidth)
    expect(fits.closest('button')).toBeNull()
    expect(fits.closest('.tool-line__root')?.querySelector('.tool-line__chevron')).toBeNull()
  })
})

describe('a tool line on the desktop at Small', () => {
  it('shows the whole line, with no button and no chevron', async () => {
    stubChat(entries)
    await openChat([1512, 982])
    for (const text of [`Read ${longTarget}`, longError]) {
      const line = lineText(text)
      expect(line.scrollWidth).toBeLessThanOrEqual(line.clientWidth)
      expect(line.closest('button')).toBeNull()
    }
  })
})
