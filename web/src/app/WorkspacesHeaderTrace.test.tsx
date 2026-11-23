import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { CHAT_TITLE, readHeaderDump } from './headerTrace.ts'
import { routeTree } from './routeTree.gen.ts'

// The chat header dump (headerTrace.ts, R57) finds the open chat's title, ChatHead's h2, through the real route on the
// phone and on the tablet at the owner's iPad size, portrait and landscape; the desktop panes are not the AppShell
// detail, so it finds none there. At rest the title draws on no layer of its own: no
// ancestor has a transform, filter, backdrop filter, will-change or animation.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await page.viewport(1512, 982)
})

describe('the chat header dump on the Workspaces chat', () => {
  it('finds no chat title in the desktop panes', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/workspaces?state=workbench'] }),
    })
    await testRender(<RouterProvider router={router} />)
    await expect.poll(() => document.querySelectorAll('textarea').length).toBeGreaterThan(0)
    expect(document.querySelector(CHAT_TITLE)).toBeNull()
  })

  for (const [state, viewport] of [
    ['phoneChatFull', [390, 844]],
    ['tabletOneChat', [756, 1158]],
    ['tabletOneChat', [1158, 756]],
  ] as const) {
    it(`finds the one chat title at rest on ${state} at ${String(viewport[0])}x${String(viewport[1])}`, async () => {
      await page.viewport(viewport[0], viewport[1])
      const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [`/workspaces?state=${state}`] }),
      })
      await testRender(<RouterProvider router={router} />)
      await expect.poll(() => document.querySelectorAll(CHAT_TITLE).length).toBe(1)
      const title = document.querySelector(CHAT_TITLE)
      if (title === null) throw new Error('no chat title')
      // The title is ChatHead's: the h2 the chat's actions button names.
      const header = title.closest('header')
      expect(header?.querySelector(`[aria-label="${title.textContent} actions"]`)).not.toBeNull()
      const dump = readHeaderDump(title, 'tick')
      expect(dump.chain.at(-1)?.el).toBe('html')
      expect(dump.title.textLength).toBe(title.textContent.length)
      for (const element of dump.chain) {
        expect(element.style.transform, element.el).toBe('none')
        expect(element.style.filter, element.el).toBe('none')
        expect(element.style['backdrop-filter'], element.el).toBe('none')
        expect(element.style['will-change'], element.el).toBe('auto')
        expect(element.animations, element.el).toEqual([])
      }
    })
  }
})
