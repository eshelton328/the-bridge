import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// Screen review R20: library beta.61 docks a ScrollFrame's footer on the keyboard only when the frame is the AppShell
// detail's own child. Through the real route at a phone's and a tablet's size, the chat and New chat are that frame,
// named as their section was, and the keyboard moves only the footer. The app's styles and fonts load as in main.ts.
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

/** The box of an element. */
const box = (el: Element) => el.getBoundingClientRect()

type DockCase = {
  name: string
  state: string
  viewport: readonly [number, number]
  // The frame's name (the section's before), the footer's content and the keyboard's top (300 px of the phone, 358 of
  // the tablet).
  label: string
  footer: string
  keyboardTop: number
}

const cases: DockCase[] = [
  {
    name: 'the chat on the phone (M17)',
    state: 'phoneChatFull',
    viewport: [390, 844],
    label: 'bridge themes',
    footer: 'textarea',
    keyboardTop: 544,
  },
  {
    name: 'the chat on the tablet (T6)',
    state: 'tabletOneChat',
    viewport: [756, 1158],
    label: 'bridge themes',
    footer: 'textarea',
    keyboardTop: 800,
  },
  {
    name: 'New chat on the phone (M7)',
    state: 'phoneNewChat',
    viewport: [390, 844],
    label: 'New chat',
    footer: 'button',
    keyboardTop: 544,
  },
]

describe('the Workspaces composer docks on the keyboard (R20)', () => {
  for (const c of cases)
    it(`puts the ScrollFrame straight in the AppShell detail: ${c.name}`, async () => {
      await page.viewport(c.viewport[0], c.viewport[1])
      const view = await renderWorkspaces(c.state)
      onTestFinished(view.unmount)
      const root = await appRoot()
      await expect.poll(() => root.querySelector('.app-shell__detail .scroll-frame__footer')).not.toBeNull()
      const detail = root.querySelector('.app-shell__detail')
      if (detail === null) throw new Error('no detail')
      // The detail's only child is the frame: no section or padded box around it.
      const children = [...detail.children]
      expect(children.map((el) => el.className.includes('scroll-frame__root'))).toEqual([true])
      const [frame] = children
      if (frame === undefined) throw new Error('no frame')
      // The frame is the region the section was, with its name.
      expect(frame.getAttribute('role')).toBe('region')
      expect(frame.getAttribute('aria-label')).toBe(c.label)
      await expect.element(page.getByRole('region', { name: c.label, exact: true })).toBeVisible()
      // The header holds the chat's head or the form's title, with its name, and the footer the composer or Start chat.
      const header = frame.querySelector(':scope > .scroll-frame__header')
      const footer = frame.querySelector(':scope > .scroll-frame__footer')
      expect(header?.textContent).toContain(c.label)
      expect(footer?.querySelector(c.footer)).not.toBeNull()
    })
})

// A stand-in for window.visualViewport that the test moves as iOS Safari does when its keyboard opens: the layout keeps
// its height, and only the visual viewport shrinks (the library's Keyboard stories, src/shell/app-shell.stories.tsx).
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

describe('the Workspaces composer on the keyboard (R20)', () => {
  for (const c of cases)
    it(`rides the footer onto the keyboard and keeps the rest in place: ${c.name}`, async () => {
      await page.viewport(c.viewport[0], c.viewport[1])
      const viewport = new FakeViewport()
      replaceVisualViewport(viewport)
      const view = await renderWorkspaces(c.state)
      onTestFinished(view.unmount)
      const root = await appRoot()
      await expect.poll(() => root.querySelector('.app-shell__detail .scroll-frame__footer')).not.toBeNull()
      await document.fonts.ready
      const shell = root.querySelector<HTMLElement>('.app-shell__root')
      const frame = root.querySelector('.app-shell__detail > *')
      const header = frame?.firstElementChild
      const footer = frame?.querySelector('.scroll-frame__footer')
      const field =
        footer?.querySelector<HTMLElement>('textarea, input') ?? frame?.querySelector<HTMLElement>('textarea')
      if (!shell || !frame || !header || !footer || !field) throw new Error('no shell, frame, header, footer or field')
      const before = { header: box(header).top, frame: box(frame).height }
      // A field takes the focus and the keyboard opens over the screen's foot.
      await userEvent.click(field)
      viewport.move({ height: c.keyboardTop })
      await expect.poll(() => shell.style.getPropertyValue('--app-shell-keyboard')).not.toBe('')
      // The footer, the composer or Start chat, ends on the keyboard's top, in view.
      await expect.poll(() => Math.round(box(footer).bottom)).toBe(c.keyboardTop)
      // The header stays at the top, and the chat keeps its size: only the footer moves, so the transcript does not
      // lay out again under the owner's finger (the jump of R20).
      expect(box(header).top).toBe(before.header)
      expect(box(frame).height).toBe(before.frame)
    })
})
