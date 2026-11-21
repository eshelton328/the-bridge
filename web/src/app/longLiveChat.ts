import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { TranscriptEntry } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createElement, Fragment } from 'react'
import { expect, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { markApp } from './appMarker.ts'
import { routeTree } from './routeTree.gen.ts'

// The helpers of the long live chat tests (review R28,
// WorkspacesTypingRenders.test.tsx): two live Claude chats in one workspace,
// each with a transcript of generated messages and Markdown replies (a
// heading, a link, a list, inline code and a code block), served by a stubbed
// server whose transcript routes are the contract-checked fake. The app opens
// on the owner's path: no URL parameters, then Workspaces. Importing this file
// loads the app's styles and fonts and gives the root the theme of index.html.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'

const summary = (id: string, title: string) => ({
  id,
  kind: 'claude',
  title,
  model: 'claude-opus-5-5',
  contextUsed: null,
  status: 'idle',
  parent: null,
})
const chats = [summary(plan, 'plan the slice'), summary(review, 'review notes')]
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
      chats,
    },
  ],
})

const markdown = (i: number) =>
  [
    `## Step ${String(i)}`,
    '',
    `The build reads **file ${String(i)}** and checks it; see [the log](https://example.com/log/${String(i)}).`,
    '',
    '- the first item, with `code`',
    '- the second item',
    '',
    '```ts',
    `const value${String(i)} = compute(${String(i)})`,
    '```',
  ].join('\n')

const transcript = (tag: string, count: number): TranscriptEntry[] =>
  Array.from({ length: count }, (_, i) =>
    i % 2 === 0
      ? { type: 'user', id: `${tag}-u${String(i)}`, text: `${tag} question ${String(i)} with *emphasis*`, cut: false }
      : { type: 'assistant', id: `${tag}-a${String(i)}`, text: markdown(i), cut: false },
  )

/** Stubs the server with `count` entries in each chat's transcript; returns the transcript fake. */
export function stubLongChats(count: number) {
  const server = fakeTranscriptServer()
  server.set(plan, transcript('plan', count))
  server.set(review, transcript('review', count))
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
  return server
}

/** Opens the app at `size` with no URL parameters and taps Workspaces; returns the view's unmount. */
export async function openWorkspaces(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
  const before = new Set(document.body.children)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  const view = await testRender(
    createElement(Fragment, null, createElement(RouterProvider, { router }), createElement(ErrorTray)),
    rootErrorOptions,
  )
  const container = [...document.body.children].find((child) => !before.has(child))
  if (container === undefined) throw new Error('no view container')
  // The app gets the window's height, as main.ts gives it, so a transcript scrolls in its own box.
  container.id = 'root'
  onTestFinished(markApp())
  onTestFinished(() => {
    container.removeAttribute('id')
  })
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  return view
}

/** Waits until `count` messages and replies show as Markdown, and the renders settle. */
export async function markdownShown(count: number) {
  await expect.poll(() => document.querySelectorAll('.markdown-view').length, { timeout: 30_000 }).toBe(count)
  await new Promise((resolve) => setTimeout(resolve, 300))
}

/** The message box in `el`. */
export function boxIn(el: Element): HTMLTextAreaElement {
  const box = el.querySelector('textarea')
  if (box === null) throw new Error('no message box')
  return box
}

/**
 * Focuses `box`, lets the focus's own ui change settle (focus in another pane focuses that pane), calls `reset`, then
 * types `text` as the owner does and waits until the box holds it.
 */
export async function typeAfter(box: HTMLTextAreaElement, text: string, reset: () => void) {
  box.focus()
  await new Promise((resolve) => setTimeout(resolve, 200))
  reset()
  await userEvent.keyboard(text)
  await expect.poll(() => box.value).toBe(text)
  await new Promise((resolve) => setTimeout(resolve, 100))
}
