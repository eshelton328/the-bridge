// Shared by the live Artifacts route tests (ArtifactsLive, ArtifactsLiveWrites): made-up artifacts, the fake
// server as the page's fetch, and the owner's path to the page. Every link, title and project is made up.
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createElement } from 'react'
import { expect, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { RouteError } from '../errors/RouteError.tsx'
import { type FakeArtifactsServer, fakeArtifactsServer } from '../lib/fakeArtifactsServer.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { routeTree } from './routeTree.gen.ts'

export const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

/** A made-up artifact: a Claude artifact a chat published `age` minutes ago, or a Codex site the owner added. */
function artifact(n: number, title: string, age: number, source: 'claude' | 'codex' = 'claude') {
  const id = n.toString(16).padStart(16, '0')
  return {
    id,
    link:
      source === 'claude'
        ? `https://claude.ai/artifact/00000000-0000-0000-0000-${id.slice(4)}`
        : `https://sample-${String(n)}.example.com/`,
    source,
    title,
    description: `${title}, made up for the test`,
    project: n % 2 === 0 ? null : 'sample-project',
    chat: source === 'claude' ? `mac-mini/s${String(n)}` : null,
    publishedAt: minutesAgo(age),
    foundAt: minutesAgo(age),
    foundBy: source === 'claude' ? 'session' : 'owner',
  }
}

export const plan = artifact(1, 'Sample plan', 30)
const notes = artifact(2, 'Sample notes', 3 * 24 * 60, 'codex')
export const chart = artifact(3, 'Sample chart', 10)

/** The fake with `artifacts`, as the page's fetch; the owner last looked an hour ago. */
export function withServer(artifacts: readonly unknown[] = [plan, notes]): FakeArtifactsServer {
  const server = fakeArtifactsServer({ artifacts, lastSeenAt: minutesAgo(60) })
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const answer = server.handle(new URL(url, window.location.origin).pathname, init)
      return answer === undefined ? Promise.reject(new TypeError(`no stub for ${url}`)) : Promise.resolve(answer)
    }),
  )
  return server
}

/** A device of the owner's path: its size and what the library draws each artifact as. */
export type Device = {
  readonly name: string
  readonly size: readonly [number, number]
  readonly item: 'artifact card' | 'artifact row'
}

export const devices = [
  { name: 'the desktop', size: [1512, 982], item: 'artifact card' },
  { name: 'the phone', size: [390, 844], item: 'artifact row' },
] as const satisfies readonly Device[]

/** The tablet, which opens Artifacts from its tab bar and draws cards, as the desktop. */
export const tablet = { name: 'the tablet', size: [756, 1158], item: 'artifact card' } as const satisfies Device

/**
 * Opens the app with no URL parameters at the device's size and taps Artifacts in the rail (the tablet's tab bar), or in
 * More on the phone.
 */
export async function tapArtifacts(device: Device) {
  await setViewport(device.size[0], device.size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  const view = await testRender(createElement(RouterProvider, { router }))
  onTestFinished(view.unmount)
  await openArtifacts(device)
  await expect.poll(() => router.state.location.pathname).toBe('/artifacts')
  expect(router.state.location.searchStr).toBe('')
  return router
}

/** Taps Artifacts from the page that shows. */
export async function openArtifacts(device: Device) {
  if (device.item === 'artifact row') {
    await userEvent.click(page.getByRole('button', { name: /^More/ }))
    await userEvent.click(page.getByRole('dialog').getByRole('button', { name: /^Artifacts/ }))
  } else await userEvent.click(page.getByRole('button', { name: /^Artifacts/ }))
}

export const shown = (device: Device) =>
  [...document.querySelectorAll(`[data-figma^="${device.item} · "]`)].map((el) =>
    el.getAttribute('data-figma')?.replace(`${device.item} · `, ''),
  )
export const statusLine = (text: string) => page.getByRole('status').filter({ hasText: text })
export const quiet = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))
