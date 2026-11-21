import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender, unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Screen review R36: on the iPad mini the docked composer touched the keyboard. Figma draws the composer 16 over the
// iPad's keyboard (T4: 105:2261 ends at y 842, the keyboard 105:2293 starts at 858) and 8 over the iPhone's form bar
// (M10: 147:79 ends at 456, the keyboard 147:97 starts at 464). Through the real route, a fake keyboard opens over the
// screen's foot (window.visualViewport shrinks, as in WorkspacesChatDock.test.tsx) and the composer's border must end
// that far over it; with the keyboard closed, the composer ends where it did before R36 (the safe area under it).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

function renderWorkspaces(state: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/workspaces?state=${state}`] }),
  })
  return testRender(<RouterProvider router={router} />)
}

afterEach(async () => {
  await unmountRendered()
  resetAllStores()
  await page.viewport(1512, 982)
})

/** The render's root, made to fill the window as `#root` does in index.css. Earlier tests leave their renders. */
async function appRoot(): Promise<HTMLElement> {
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  root.style.height = '100%'
  return root
}

// A stand-in for window.visualViewport that the test moves as iOS Safari does when its keyboard opens: the layout keeps
// its height, and only the visual viewport shrinks.
class FakeViewport extends EventTarget {
  height = document.documentElement.clientHeight
  width = document.documentElement.clientWidth
  offsetTop = 0
  offsetLeft = 0
  scale = 1
  move(change: { height: number }) {
    this.height = change.height
    this.dispatchEvent(new Event('resize'))
  }
}

/** Puts `value` in place of window.visualViewport until the test ends. */
function replaceVisualViewport(value: FakeViewport) {
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value })
  onTestFinished(() => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  })
}

type GapCase = {
  name: string
  state: string
  viewport: readonly [number, number]
  /** The keyboard's top: the iPad mini's 300 pt keyboard (T4) and the iPhone's 380 pt keyboard with its form bar (M10). */
  keyboardTop: number
  /** Figma's space between the composer's border and the keyboard's top. */
  gap: number
  /** The composer's bottom with the keyboard closed, as on main before R36: over the 34 px safe area. */
  closedBottom: number
}

const cases: GapCase[] = [
  {
    name: 'the iPad mini (T4)',
    state: 'tabletOneChat',
    viewport: [744, 1133],
    keyboardTop: 833,
    gap: 16,
    closedBottom: 1099,
  },
  {
    name: 'the iPhone (M10)',
    state: 'phoneChatFull',
    viewport: [390, 844],
    keyboardTop: 464,
    gap: 8,
    closedBottom: 810,
  },
]

describe('the Workspaces composer keeps its space over the keyboard (R36)', () => {
  for (const c of cases)
    it(`ends ${c.gap} over the keyboard, and over the safe area with it closed: ${c.name}`, async () => {
      await page.viewport(c.viewport[0], c.viewport[1])
      const viewport = new FakeViewport()
      replaceVisualViewport(viewport)
      const view = await renderWorkspaces(c.state)
      onTestFinished(view.unmount)
      const root = await appRoot()
      await expect
        .poll(() => root.querySelector('.app-shell__detail .scroll-frame__footer .composer__root'))
        .not.toBeNull()
      await document.fonts.ready
      const shell = root.querySelector<HTMLElement>('.app-shell__root')
      const composer = root.querySelector<HTMLElement>('.app-shell__detail .scroll-frame__footer .composer__root')
      const field = composer?.querySelector<HTMLElement>('textarea')
      if (!shell || !composer || !field) throw new Error('no shell, composer or field')
      const bottom = () => Math.round(composer.getBoundingClientRect().bottom)
      // Closed: the composer ends over the safe area, as before R36 (no space added).
      await expect.poll(bottom).toBe(c.closedBottom)
      // A tap on the message box, and the keyboard opens over the screen's foot.
      await userEvent.click(field)
      viewport.move({ height: c.keyboardTop })
      await expect.poll(() => shell.style.getPropertyValue('--app-shell-keyboard')).not.toBe('')
      await expect.poll(() => c.keyboardTop - bottom()).toBe(c.gap)
      // The keyboard closes: the composer ends over the safe area again.
      field.blur()
      viewport.move({ height: c.viewport[1] })
      await expect.poll(bottom).toBe(c.closedBottom)
    })
})
