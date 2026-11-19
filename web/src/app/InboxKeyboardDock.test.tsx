import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { afterRendering, setViewport } from '../lib/rendering.ts'
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

// With the keyboard up and the list at its end, every text in the list (a message's hidden name too, which the library
// positions absolutely) scrolls with the list and ends above the reply box. Without a containing block inside the
// list, that text stays where it was and sits under the reply box (screen review R22; `pnpm keyboard:served`).
describe('the Inbox chat list at its end on the keyboard', () => {
  for (const state of ['chat', 'discussionPage', 'changeProposedPage'] as const)
    it(`keeps its lowest text above the reply box: ${state}`, async () => {
      await setViewport(393, 852)
      const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [`/inbox?state=${state}`] }),
      })
      view = await testRender(<RouterProvider router={router} />)
      const detail = page.getByRole('textbox').last()
      await expect.element(detail).toBeInTheDocument()
      const frame = detail.element().closest('.scroll-frame__root')
      const body = frame?.querySelector<HTMLElement>(':scope > .scroll-frame__body')
      const footer = frame?.querySelector(':scope > .scroll-frame__footer')
      expect(body).toBeDefined()
      expect(footer).toBeDefined()
      if (body === null || body === undefined || footer === null || footer === undefined) return
      frame?.closest<HTMLElement>('.app-shell__root')?.style.setProperty('--app-shell-keyboard', '346px')
      body.scrollTop = body.scrollHeight
      await afterRendering()
      let lowest = Number.NEGATIVE_INFINITY
      const texts = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
      const range = document.createRange()
      for (let node = texts.nextNode(); node !== null; node = texts.nextNode()) {
        if ((node.textContent ?? '').trim() === '') continue
        range.selectNodeContents(node)
        const box = range.getBoundingClientRect()
        if (box.width > 0 && box.height > 0) lowest = Math.max(lowest, box.bottom)
      }
      expect(lowest).toBeLessThanOrEqual(footer.getBoundingClientRect().top + 0.5)
      // WebKit leaves an absolute box whose containing block is outside the list where it was as the list scrolls, so
      // each one's containing block (its offsetParent) is the list or inside it.
      const escaped = [...body.querySelectorAll<HTMLElement>('*')]
        .filter((el) => getComputedStyle(el).position === 'absolute')
        .filter((el) => el.offsetParent === null || !body.contains(el.offsetParent))
        .map((el) => el.className)
      expect(escaped).toEqual([])
    })
})
