import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { chatComposerDevice } from './keyboardChatTrace.ts'
import { routeTree } from './routeTree.gen.ts'

// The chat sessions of the keyboard trace start at the focusin of a Workspaces chat's composer
// (keyboardChatTrace.ts). Through the real route, the phone's and the tablet's open chat have that composer, and the
// desktop panes and New chat do not.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The layout `chatComposerDevice` gives each textarea of the state's render. */
async function composerDevices(state: string, viewport: readonly [number, number]) {
  await page.viewport(...viewport)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/workspaces?state=${state}`] }),
  })
  const { unmount } = await testRender(<RouterProvider router={router} />)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const devices = [...document.querySelectorAll('textarea')].map(chatComposerDevice)
  await unmount()
  return devices
}

describe('the keyboard trace finds the Workspaces chat composer', () => {
  it('on the phone chat (M17) and the tablet chat (T6)', async () => {
    for (const [state, viewport, device] of [
      ['phoneChatFull', [390, 844], 'phone'],
      ['tabletOneChat', [756, 1158], 'tablet'],
    ] as const) {
      expect(await composerDevices(state, viewport), state).toContain(device)
    }
  })

  it('not in the desktop panes or New chat on the phone', async () => {
    for (const [state, viewport] of [
      ['workbench', [1512, 982]],
      ['phoneNewChat', [390, 844]],
    ] as const) {
      const devices = await composerDevices(state, viewport)
      expect(
        devices.filter((d) => d !== undefined),
        state,
      ).toEqual([])
    }
  })
})
