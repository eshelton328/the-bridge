import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Toolkit's icons drawn at Figma's size through the real route, so the fidelity check's `iconSize` diffs stay
// closed: the back row's chevron (BackRow `size="sm"`, 16 px) where Figma's trail names the open item (T10 461:245,
// M12 461:551, T14 475:769, M16 475:1118, T9 449:236, D13 446:482), and the 18 px chevron of T7's trail from another
// item (441:67) kept at BackRow's `md` 20.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const sizes = { desktop: [1512, 982], tablet: [756, 1158], phone: [390, 844] } as const

async function renderToolkit(state: string, size: keyof typeof sizes, selector: string) {
  const [width, height] = sizes[size]
  await setViewport(width, height)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/toolkit?state=${state}`] }),
  })
  const view = await testRender(<RouterProvider router={router} />)
  onTestFinished(view.unmount)
  await expect.poll(() => document.querySelector('.app-shell__root')).not.toBeNull()
  // Earlier tests leave their renders in the page, so each query looks only in this one.
  const root = [...document.body.children].filter((el) => el.querySelector('.app-shell__root') !== null).at(-1)
  if (!(root instanceof HTMLElement)) throw new Error('no root')
  await expect.poll(() => root.querySelector(selector)).not.toBeNull()
  const el = root.querySelector(selector)
  if (el === null) throw new Error(`no ${selector}`)
  return el
}

/** The width and height of an element's box, in px. */
function size(el: Element) {
  const r = el.getBoundingClientRect()
  return [r.width, r.height]
}

afterEach(async () => {
  resetAllStores()
  await setViewport(1512, 982)
})

describe('the back row chevron', () => {
  it.each([
    ['skillHowItWorksTablet', 'tablet', 'back row'],
    ['skillHowItWorksPhone', 'phone', 'back row'],
    ['toolkitActivityChatTablet', 'tablet', 'back row'],
    ['toolkitActivityChatPhone', 'phone', 'back row'],
    ['toolkitActivityTablet', 'tablet', 'back row'],
    ['workflowFullPage', 'desktop', 'breadcrumb row'],
  ] as const)('is 16 px where Figma draws it so: %s', async (state, layout, row) => {
    const icon = await renderToolkit(state, layout, `[data-figma="${row}"] svg.back-row__icon`)
    expect(size(icon)).toEqual([16, 16])
  })

  it("keeps BackRow's 20 px chevron on T7's trail from another item (Figma's 18 px, 441:67)", async () => {
    const icon = await renderToolkit('agentOpenTablet', 'tablet', '[data-figma="back row"] svg.back-row__icon')
    expect(size(icon)).toEqual([20, 20])
  })
})

// The 12 px icon kept in Open session (D11 444:541) and Open full page (D8 457:214, M21 487:1868) with Button
// `keepIconSize`, where a Button draws every icon at 16; Figma draws both at 13.
describe('the external link icons', () => {
  it("draws Open session's icon at 12 px (D11 444:541, 13 px in Figma)", async () => {
    const icon = await renderToolkit(
      'toolkitActivity',
      'desktop',
      '[data-figma="run · writing-reviewer"] .list-row__trailing button svg',
    )
    expect(size(icon)).toEqual([12, 12])
  })

  it.each([
    ['workflowOpen', 'desktop'],
    ['workflowOpenPhone', 'phone'],
  ] as const)("draws Open full page's icon at 12 px (13 px in Figma): %s", async (state, layout) => {
    const icon = await renderToolkit(state, layout, '[data-figma="button · Open full page"] svg')
    expect(size(icon)).toEqual([12, 12])
  })
})
