import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, createElement } from 'react'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { routeTree } from './routeTree.gen.ts'

// The helpers of the Inbox route tests (InboxRoute, InboxListTools and
// InboxPhone .test.tsx), which run the Inbox through the real route, loader
// and page store. Importing this file loads the app's styles and fonts as in
// main.ts and gives the root the theme and mode of index.html, so the layout
// tests measure the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

export function renderInbox(state: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/inbox?state=${state}`] }),
  })
  return { router, rendered: testRender(createElement(RouterProvider, { router })) }
}

export async function showState(router: ReturnType<typeof renderInbox>['router'], state: string) {
  await act(async () => {
    await router.navigate({ to: '/inbox', search: { state } })
  })
}

export const dialog = () => page.getByRole('dialog', { name: 'Suggested prompt' })
export const removeDialog = () => page.getByRole('alertdialog', { name: 'Remove this task?' })
export const searchbox = () => page.getByRole('searchbox', { name: 'Search the inbox' })

/** The box of an element found by a locator. */
export const box = (el: Element) => el.getBoundingClientRect()
