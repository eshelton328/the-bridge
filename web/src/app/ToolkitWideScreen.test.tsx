import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { setViewport } from '../lib/rendering.ts'

// The Toolkit's desktop panes on a very wide screen (screen review R9), through the real route with the app's styles.
// An open item is the library's `Container size="item"` and a full page its `size="page"`: in the 1512 px Figma frames
// they fill the detail (the item 1028 wide with 948 of content, D03 427:250; the page 1448 with 1384, D01 425:9), and
// on a screen whose detail is at least `shell.detailWideFrom` (1600) wide they stop at those widths, in its middle.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  resetAllStores()
  await setViewport(1512, 982)
})

async function measure(state: string, layer: string, width: number, height: number) {
  await setViewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  // Earlier tests leave their renders in the page, so each query looks only in this one.
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  await expect.poll(() => root.querySelector(`[data-figma="${layer}"]`)).not.toBeNull()
  await document.fonts.ready
  const pane = root.querySelector(`[data-figma="${layer}"]`)
  const detail = root.querySelector('.app-shell__detail')
  if (pane === null || detail === null) throw new Error(`no ${layer} or detail`)
  const box = pane.getBoundingClientRect()
  const space = detail.getBoundingClientRect()
  const style = getComputedStyle(pane)
  const content = box.width - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight)
  return { box, space, content }
}

describe('an open item on the desktop', () => {
  // D03, D06, D10, D17 and D05.
  it.each(['skillOpen', 'skillFiles', 'scriptExplained', 'skillActivity', 'skillDiscuss'] as const)(
    '%s keeps 948 of content in the middle of a 3540 px screen',
    async (state) => {
      const { box, space, content } = await measure(state, 'toolkit item', 3540, 1440)
      expect(content).toBeCloseTo(948, 0)
      expect(box.width).toBeCloseTo(1028, 0)
      expect(box.left - space.left).toBeCloseTo(space.right - box.right, 0)
    },
  )

  it.each([
    ['skillOpen', 484],
    ['skillFiles', 484],
    ['skillActivity', 484],
    ['skillDiscuss', 64],
  ] as const)('%s fills the detail at 1512 px, 1028 wide with 948 of content', async (state, left) => {
    const { box, space, content } = await measure(state, 'toolkit item', 1512, 982)
    expect(content).toBeCloseTo(948, 0)
    expect(box.width).toBeCloseTo(1028, 0)
    expect(box.left).toBeCloseTo(left, 0)
    expect(box.left).toBeCloseTo(space.left, 0)
  })
})

describe('a full page on the desktop', () => {
  // D01, D02, D11, D12, D15, D16, D18 and D13.
  it.each([
    'toolkitList',
    'toolkitMap',
    'toolkitActivity',
    'toolkitActivityRun',
    'toolkitActivityChats',
    'toolkitActivityHeadless',
    'toolkitActivityChat',
    'workflowFullPage',
  ] as const)('%s keeps 1384 of content in the middle of a 3540 px screen', async (state) => {
    const { box, space, content } = await measure(state, 'toolkit', 3540, 1440)
    expect(content).toBeCloseTo(1384, 0)
    expect(box.width).toBeCloseTo(1448, 0)
    expect(box.left - space.left).toBeCloseTo(space.right - box.right, 0)
  })

  it.each(['toolkitList', 'toolkitMap', 'toolkitActivity', 'workflowFullPage'] as const)(
    '%s fills the detail at 1512 px, 1448 wide with 1384 of content',
    async (state) => {
      const { box, space, content } = await measure(state, 'toolkit', 1512, 982)
      expect(content).toBeCloseTo(1384, 0)
      expect(box.width).toBeCloseTo(1448, 0)
      expect(box.left).toBeCloseTo(64, 0)
      expect(box.left).toBeCloseTo(space.left, 0)
    },
  )
})
