import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { setViewport } from '../lib/rendering.ts'

// The Toolkit list through the real route (D1, T1, M1), as ToolkitCodeWrap.test.tsx tests the phone's code: the
// card, row, group header and Sort options of library #166 that bring the list to Figma's boxes. The app's styles
// and fonts load as in main.ts, and the root has the theme and mode of index.html, so the test measures the real
// layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

afterEach(async () => {
  resetAllStores()
  await setViewport(1512, 982)
})

/** Renders a Toolkit state and returns its root, once the layer `figma` is in it and the fonts have loaded. */
async function renderToolkit(state: string, figma: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  // Earlier tests leave their renders in the page, so each query looks only in this one.
  await expect.poll(() => document.querySelector(`[data-figma="${figma}"]`)).not.toBeNull()
  await document.fonts.ready
  const root = [...document.body.children].filter((el) => el.querySelector(`[data-figma="${figma}"]`) !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  return root
}

/** The box of the element that stands for a Figma layer: the first child of its `data-figma` wrapper. */
function layer(root: HTMLElement, figma: string) {
  const el = root.querySelector(`[data-figma="${figma}"]`)
  const box = el?.firstElementChild ?? el
  if (!(box instanceof HTMLElement)) throw new Error(`no ${figma}`)
  return box
}

/** The element whose own text is `text`, inside `el`. */
function byText(el: HTMLElement, text: string) {
  const found = [...el.querySelectorAll<HTMLElement>('*')].find(
    (node) => node.textContent === text && [...node.children].every((child) => child.textContent !== text),
  )
  if (found === undefined) throw new Error(`no ${text}`)
  return found
}

const middle = (rect: DOMRect) => rect.top + rect.height / 2

describe('the Toolkit list on the desktop (D1)', () => {
  it('draws each card 148 high with its counts after the spacer, Figma 150 (Card metaSpacer, 425:86)', async () => {
    await setViewport(1512, 982)
    const root = await renderToolkit('toolkitList', 'toolkit card · agents-md')
    const card = layer(root, 'toolkit card · agents-md').getBoundingClientRect()
    expect(card.height).toBe(148)
    const description = byText(
      layer(root, 'toolkit card · agents-md'),
      'Writes and audits the AGENTS.md context file in each folder',
    )
    const counts = byText(layer(root, 'toolkit card · agents-md'), '→ 0')
    expect(counts.getBoundingClientRect().top - description.getBoundingClientRect().bottom).toBeGreaterThanOrEqual(34)
  })

  it('draws the kind headers 32 high, Figma 31 (GroupHeader variant toolkit, 425:71)', async () => {
    await setViewport(1512, 982)
    const root = await renderToolkit('toolkitList', 'group · SKILLS')
    expect(layer(root, 'group · SKILLS').getBoundingClientRect().height).toBe(32)
    expect(layer(root, 'group · AGENTS').getBoundingClientRect().height).toBe(32)
  })

  it('pads Sort 12 at the sides, Figma 13 (Button padding compact, 425:62)', async () => {
    await setViewport(1512, 982)
    const root = await renderToolkit('toolkitList', 'button · Sort')
    const sort = root.querySelector<HTMLElement>('[data-figma="button · Sort"]')
    if (sort === null) throw new Error('no Sort')
    expect(getComputedStyle(sort).paddingInlineStart).toBe('12px')
    expect(getComputedStyle(sort).paddingInlineEnd).toBe('12px')
  })
})

describe('the Toolkit list on a tablet (T1)', () => {
  it('draws each item as a 60 px row with its counts centred at its end (Card padding compact and trailing, 428:59)', async () => {
    await setViewport(744, 1133)
    const root = await renderToolkit('toolkitListTablet', 'toolkit row · agents-md')
    const card = layer(root, 'toolkit row · agents-md')
    const row = card.getBoundingClientRect()
    expect(row.height).toBe(60)
    const counts = byText(card, '→0 ←1').getBoundingClientRect()
    // The counts end the row, 12 in from its border, and sit centred down it, not beside the name.
    expect(row.right - counts.right).toBeLessThanOrEqual(13)
    expect(Math.abs(middle(counts) - middle(row))).toBeLessThanOrEqual(1)
    const name = byText(card, 'agents-md').getBoundingClientRect()
    expect(counts.left - name.right).toBeGreaterThan(100)
  })

  it('draws the kind headers 28 high, Figma 27 (GroupHeader variant toolkitCompact, 428:53)', async () => {
    await setViewport(744, 1133)
    const root = await renderToolkit('toolkitListTablet', 'group · SKILLS')
    expect(layer(root, 'group · SKILLS').getBoundingClientRect().height).toBe(28)
  })
})

describe('the Toolkit list on the phone (M1)', () => {
  it('puts the tile 4 in, the name 12 after it and the counts centred (ListRow padding phone, 429:96)', async () => {
    await setViewport(390, 844)
    const root = await renderToolkit('toolkitListTablet', 'toolkit row · agents-md')
    const listRow = layer(root, 'toolkit row · agents-md')
    const row = listRow.getBoundingClientRect()
    const tile = listRow.querySelector('.list-row__leading')
    const trailing = listRow.querySelector('.list-row__trailing')
    if (tile === null || trailing === null) throw new Error('no tile or trailing part')
    const tileBox = tile.getBoundingClientRect()
    // padding="phone": 4 at the sides inside the 1 px border, 8 above and below.
    expect(tileBox.left - row.left).toBe(5)
    expect(tileBox.top - row.top).toBe(9)
    // leadingGap="12": the name starts 12 after the tile.
    const name = byText(listRow, 'agents-md').getBoundingClientRect()
    expect(name.left - tileBox.right).toBe(12)
    // trailingAlign="center": the counts and chevron sit centred down the row.
    expect(Math.abs(middle(trailing.getBoundingClientRect()) - middle(row))).toBeLessThanOrEqual(1)
  })
})
