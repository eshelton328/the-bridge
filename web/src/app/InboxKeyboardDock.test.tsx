import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// AppShell docks a ScrollFrame's footer on the on-screen keyboard only when the frame is the shell detail's own child
// (screen review R21). The Inbox chat (T5, M8) and the discussion page (T17, M18) put their reply box in that footer.
let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  resetAllStores()
  await setViewport(1512, 982)
})

const sizes = [
  [390, 844],
  [756, 1158],
] as const

describe('the Inbox reply box on the keyboard', () => {
  for (const [state, box] of [
    ['chat', 'Reply'],
    ['discussionPage', 'Ask about this task'],
  ] as const)
    for (const [w, h] of sizes)
      it(`sits in a footer AppShell docks: ${state} at ${String(w)}`, async () => {
        await setViewport(w, h)
        const router = createRouter({
          routeTree,
          history: createMemoryHistory({ initialEntries: [`/inbox?state=${state}`] }),
        })
        view = await testRender(<RouterProvider router={router} />)
        const field = page.getByRole('textbox', { name: box })
        await expect.element(field).toBeInTheDocument()
        const footer = field.element().closest('.scroll-frame__footer')
        expect(footer).not.toBeNull()
        const frame = footer?.closest('.scroll-frame__root')
        expect(frame?.parentElement?.classList.contains('app-shell__detail')).toBe(true)
        // With a keyboard 300 px tall, the footer moves up by that much, less the space under it.
        frame?.closest<HTMLElement>('.app-shell__root')?.style.setProperty('--app-shell-keyboard', '300px')
        const moved = footer === null ? '' : getComputedStyle(footer).transform
        expect(moved).not.toBe('none')
      })
})
