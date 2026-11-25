// Shared by the live Inbox route tests (InboxLive, InboxLiveActions): made-up items, the fake server as the page's
// fetch, and the owner's path to the page. Every title, chat, project, tag and record text is made up.
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { createElement, type ReactElement } from 'react'
import { expect, onTestFinished, vi } from 'vitest'
import { page } from 'vitest/browser'
import { RouteError } from '../errors/RouteError.tsx'
import { type FakeInboxOptions, type FakeInboxServer, fakeInboxServer } from '../lib/fakeInboxServer.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { InboxFeedProvider } from './InboxFeedProvider.tsx'
import { routeTree } from './routeTree.gen.ts'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()
export const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()

/** A made-up chat item: a chat that needs the owner (a question) or finished its turn (a review). */
export function chatItem(n: number, title: string, kind: 'question' | 'review', age: number) {
  return {
    id: `c${n.toString(16).padStart(15, '0')}`,
    source: 'chat',
    kind,
    title,
    project: null,
    tags: [],
    needsYou: kind === 'question',
    snoozedUntil: null,
    createdAt: minutesAgo(age),
    chat: `mac-mini/s${String(n)}`,
    origin: null,
    workspace: null,
    actions: ['snooze', 'done', 'dismiss'],
  }
}

/** A made-up brain item: an open attention request in a made-up project, read-only here. */
export function brainItem(n: number, title: string, age: number, snoozedUntil: string | null = null) {
  return {
    id: `b${n.toString(16).padStart(15, '0')}`,
    source: 'brain',
    kind: 'action',
    title,
    project: 'sample-project',
    tags: ['global/review', 'project/sample-project/web'],
    needsYou: snoozedUntil === null,
    snoozedUntil,
    createdAt: minutesAgo(age),
    chat: null,
    origin: null,
    workspace: null,
    actions: [],
  }
}

export const question = chatItem(1, 'Sample question from a chat', 'question', 5)
export const review = chatItem(2, 'Sample chat turn to review', 'review', 30)
export const request = brainItem(3, 'Sample request in the brain', 90)

/** The fake with `items`, as the page's fetch. */
export function withServer(
  items: readonly unknown[] = [question, review, request],
  options: Omit<FakeInboxOptions, 'items'> = {},
): FakeInboxServer {
  const server = fakeInboxServer({ items, ...options })
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

export const devices = [
  { name: 'the desktop', size: [1512, 982], nav: 'rail · Inbox' },
  { name: 'the phone', size: [390, 844], nav: 'tab · Inbox' },
] as const
/** A device the Inbox opens on: its name, its window size and the `data-figma` name of its nav's Inbox item. */
export type Device = { readonly name: string; readonly size: readonly [number, number]; readonly nav: string }

/**
 * Opens the app with no URL parameters at the device's size, which shows the Inbox, and taps Inbox in the nav.
 * `meanwhile` runs while the first load may still wait, before the nav shows.
 */
export async function openInbox(device: Device, meanwhile?: () => Promise<void>) {
  await setViewport(device.size[0], device.size[1])
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  const view = await testRender(createElement(RouterProvider, { router }))
  onTestFinished(view.unmount)
  await expect.poll(() => router.state.location.pathname).toBe('/inbox')
  expect(router.state.location.searchStr).toBe('')
  await meanwhile?.()
  await expect.poll(() => navItem(device)).not.toBeNull()
  navItem(device)?.click()
  return router
}

/** The Inbox item of the device's nav: the rail's on the desktop, the tab bar's on the phone. */
const navItem = (device: Device) => {
  const el = document.querySelector(`[data-figma="${device.nav}"]`)
  return el instanceof HTMLElement ? el : null
}

/** The number the Inbox nav item's badge shows, or null with none. */
export const badge = (device: Device) => {
  const digits = /\d+/.exec(navItem(device)?.textContent ?? '')
  return digits === null ? null : Number(digits[0])
}

/** The titles of the rows the list shows, in order. */
export const shown = () =>
  [...document.querySelectorAll('section[aria-label="Inbox list"] .list-row__title')].map((el) => el.textContent)

export const liveLine = (text: string) => page.getByRole('status').filter({ hasText: text })
export const quiet = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

/** `routes` under the app's live Inbox feed, as mountApp renders them in the app that reads the live server. */
export const withInboxFeed = (routes: ReactElement): ReactElement => createElement(InboxFeedProvider, null, routes)
