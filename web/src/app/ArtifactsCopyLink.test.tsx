import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Copy link on an open artifact puts the artifact's address on the clipboard
// at every width: the bar's button beside the list (D2), the tablet's icon
// in the Back bar (T2) and the phone's button under Open artifact (M2). The
// clipboard is swapped for a fake, as the Inbox's and Toolkit's copy tests do.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(() => {
  resetAllStores()
})

// The address the artifact's link opens (artifactOpen.ts, `https://` before the link the page shows).
const link = 'https://claude.ai/artifact/8f3c2a91-skill-evals'

describe('Copy link on an open artifact', () => {
  it.each([
    ['D2', 'artifactOpen', 1512, 982],
    ['T2', 'artifactTablet', 756, 1158],
    ['M2', 'artifactPhone', 390, 844],
  ] as const)('%s copies the artifact’s link', async (_frame, state, width, height) => {
    const copied: string[] = []
    const { clipboard } = navigator
    const writeText = clipboard.writeText.bind(clipboard)
    clipboard.writeText = (text) => {
      copied.push(text)
      return Promise.resolve()
    }
    onTestFinished(() => {
      clipboard.writeText = writeText
    })
    await page.viewport(width, height)
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: [`/artifacts?state=${state}`] }),
    })
    const view = await testRender(<RouterProvider router={router} />)
    onTestFinished(view.unmount)
    await page.getByRole('button', { name: 'Copy link' }).click()
    await expect.poll(() => copied).toEqual([link])
  })
})
