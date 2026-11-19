import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { setViewport } from '../lib/rendering.ts'

// The Activity tab of an open item through the real route (D17, `activity` 474:583): the key figures, the bar panels
// side by side on the desktop and one under the other on a tablet or phone, the list, and each tap Figma implies: the
// Activity tab opens from every Overview, a workflow's round opens its skill on its Evals tab (D23 to D20), and a
// chat row takes no tap until the Activity view's chat panel (D18) is drawn. On the phone the tabs scroll so Activity
// shows (M15). The app's styles and fonts load as in main.ts, so the test measures the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const sizes = { desktop: [1512, 982], tablet: [756, 1158], phone: [390, 844] } as const

async function renderToolkit(state: string, size: keyof typeof sizes = 'desktop', ready = '[data-figma="activity"]') {
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
  root.style.height = '100%'
  await expect.poll(() => root.querySelector(ready)).not.toBeNull()
  await document.fonts.ready
  return { root, router }
}

function box(root: HTMLElement, selector: string) {
  const el = root.querySelector(selector)
  if (el === null) throw new Error(`no ${selector}`)
  return el.getBoundingClientRect()
}

function tab(root: HTMLElement, item: string, name: string) {
  const found = [...root.querySelectorAll(`article[aria-label="${item}"] [role="tab"]`)].find(
    (t) => t.textContent.trim() === name,
  )
  if (!(found instanceof HTMLElement)) throw new Error(`no tab ${name}`)
  return found
}

function rowButton(root: HTMLElement, title: string) {
  return root.querySelector(`[data-figma="row · ${title}"] button`)
}

const selectedTab = (root: HTMLElement, item: string) =>
  root.querySelector(`article[aria-label="${item}"] [role="tab"][aria-selected="true"]`)?.textContent

afterEach(() => {
  resetAllStores()
})

describe('the Activity tab of an open item (D17)', () => {
  it('draws the four key figures in a row, the bar panels side by side and the chats under them', async () => {
    const { root } = await renderToolkit('skillActivity')
    const tiles = ['calls', 'headless', 'from chats', 'last used'].map((k) =>
      box(root, `[data-figma="panel · kpi ${k}"]`),
    )
    for (const t of tiles.slice(1)) expect(t.top).toBeCloseTo(tiles[0]?.top ?? 0, 0)
    const byDay = box(root, '[data-figma="panel · by day"]')
    const where = box(root, '[data-figma="panel · where"]')
    const chats = box(root, '[data-figma="panel · chats"]')
    expect(byDay.top).toBeGreaterThan(Math.max(...tiles.map((t) => t.bottom)))
    expect(where.top).toBeCloseTo(byDay.top, 0)
    expect(where.left).toBeGreaterThan(byDay.right)
    expect(byDay.width).toBeCloseTo(where.width, 0)
    expect(chats.top).toBeGreaterThan(Math.max(byDay.bottom, where.bottom))
    expect(root.querySelectorAll('[data-figma="panel · chats"] .list-row__root').length).toBe(3)
    // A screen reader reads each bar's label with its count, and each figure with its label.
    const calls = root.querySelector('ul[aria-label="Calls per day"]')
    expect(calls?.querySelectorAll('li')).toHaveLength(3)
    expect(calls?.textContent).toContain('Nov 9326')
    expect(root.querySelector('[data-figma="panel · kpi calls"] dt')?.textContent).toBe('calls')
  })

  it('gives a chat row no tap, since the chat panel (D18) is not drawn yet', async () => {
    const { root } = await renderToolkit('skillActivity')
    expect(rowButton(root, 'Linear workflow setup for NCC team')).toBeNull()
    expect(root.querySelector('[data-figma="activity"] button')).toBeNull()
  })

  for (const [state, item] of [
    ['skillOpen', 'writer'],
    ['ruleOpen', 'skills'],
    ['agentOpen', 'writing-reviewer'],
    ['workflowOpen', 'skill-eval-round'],
    ['hookOpen', 'commit-msg'],
  ] as const) {
    it(`opens from the ${item} Overview’s Activity tab`, async () => {
      const { root } = await renderToolkit(state, 'desktop', `article[aria-label="${item}"]`)
      await userEvent.click(tab(root, item, 'Activity'))
      await expect.poll(() => root.querySelector('[data-figma="activity"]')).not.toBeNull()
      expect(selectedTab(root, item)).toBe('Activity')
      expect(root.querySelectorAll('[data-figma^="panel · kpi "]')).toHaveLength(4)
    })
  }

  it('opens a round’s skill on its Evals tab: writer, as D20 draws it (D23)', async () => {
    const { root } = await renderToolkit('workflowActivity')
    const writer = rowButton(root, 'writer · cross-family x1')
    if (!(writer instanceof HTMLElement)) throw new Error('no round button')
    await userEvent.click(writer)
    await expect.poll(() => root.querySelector('article[aria-label="writer"]')).not.toBeNull()
    expect(selectedTab(root, 'writer')).toBe('Evals')
    expect(root.querySelector('[data-figma="evals"]')?.textContent).toContain('D1 Quality')
  })

  it('opens a round’s skill with no Evals tab on its Overview (D23 readme)', async () => {
    const { root } = await renderToolkit('workflowActivity')
    const readme = rowButton(root, 'readme · cross-family x1')
    if (!(readme instanceof HTMLElement)) throw new Error('no round button')
    await userEvent.click(readme)
    await expect.poll(() => root.querySelector('article[aria-label="readme"]')).not.toBeNull()
    expect(selectedTab(root, 'readme')).toBe('Overview')
  })

  it('opens writer’s Evals from the workflow’s Overview: Activity, then a round (D8, D23, D20)', async () => {
    const { root } = await renderToolkit('workflowOpen', 'desktop', 'article[aria-label="skill-eval-round"]')
    await userEvent.click(tab(root, 'skill-eval-round', 'Activity'))
    await expect.poll(() => rowButton(root, 'writer · cross-family x1')).not.toBeNull()
    const writer = rowButton(root, 'writer · cross-family x1')
    if (!(writer instanceof HTMLElement)) throw new Error('no round button')
    await userEvent.click(writer)
    await expect.poll(() => root.querySelector('article[aria-label="writer"]')).not.toBeNull()
    expect(selectedTab(root, 'writer')).toBe('Evals')
    expect(root.querySelector('[data-figma="evals"]')?.textContent).toContain('D5 Reviewer')
  })
})

// The skills a round names as the D4 list (ruleOpen, with toolkitList's Skills group) shows them: the description and
// the file count. The app layer cannot import a page's states, so the values are copied here.
const listItems = {
  'skills/readme/': { description: 'Writes and checks READMEs, then runs the quick start in a sandbox', files: 9 },
  'skills/pr-description/': { description: 'Writes a PR title and description from the final diff', files: 3 },
} as const

describe('a round opens its skill with the details the list has (D23)', () => {
  for (const [state, size] of [
    ['workflowOpen', 'desktop'],
    ['workflowActivity', 'desktop'],
    ['workflowActivityTablet', 'tablet'],
    ['workflowActivityPhone', 'phone'],
  ] as const) {
    for (const [round, name, path] of [
      ['readme · cross-family x1', 'readme', 'skills/readme/'],
      ['pr-description · round 4', 'pr-description', 'skills/pr-description/'],
    ] as const) {
      it(`opens ${name} from ${state} with its description and every file`, async () => {
        const ready = state === 'workflowOpen' ? 'article[aria-label="skill-eval-round"]' : '[data-figma="activity"]'
        const { root } = await renderToolkit(state, size, ready)
        if (state === 'workflowOpen') await userEvent.click(tab(root, 'skill-eval-round', 'Activity'))
        await expect.poll(() => rowButton(root, round)).not.toBeNull()
        const button = rowButton(root, round)
        if (!(button instanceof HTMLElement)) throw new Error('no round button')
        await userEvent.click(button)
        await expect.poll(() => root.querySelector(`article[aria-label="${name}"]`)).not.toBeNull()
        const item = listItems[path]
        const article = root.querySelector(`article[aria-label="${name}"]`)
        expect(article?.textContent).toContain(item.description)
        expect(article?.querySelector('[data-figma="files"] h3')?.textContent).toBe(`Files${String(item.files)}`)
      })
    }
  }
})

describe('the Activity tab on a tablet and the phone', () => {
  it('stands the bar panels one under the other under the back row that names writer (T13)', async () => {
    const { root } = await renderToolkit('skillActivityTablet', 'tablet')
    const byDay = box(root, '[data-figma="panel · by day"]')
    const where = box(root, '[data-figma="panel · where"]')
    expect(where.top).toBeGreaterThan(byDay.bottom)
    expect(where.left).toBeCloseTo(byDay.left, 0)
    expect(where.width).toBeCloseTo(box(root, '[data-figma="activity"]').width, 0)
    expect(root.querySelector('[data-figma="back row"]')?.textContent).toContain('writer')
    expect(root.querySelector('[data-figma="kind badge"]')).toBeNull()
  })

  it('keeps the rule’s header over the tab (T20)', async () => {
    const { root } = await renderToolkit('ruleActivityTablet', 'tablet')
    expect(root.querySelector('[data-figma="kind badge"]')).not.toBeNull()
  })

  it('shows the agent under the breadcrumb Toolkit › writer › writing-reviewer (T21)', async () => {
    const { root } = await renderToolkit('agentActivityTablet', 'tablet')
    expect(root.querySelector('[data-figma="back row"]')?.textContent).toMatch(/Toolkit.*writer.*writing-reviewer/)
  })

  it('shows the hook’s long caption whole on two lines (T23 491:8077)', async () => {
    const { root } = await renderToolkit('hookActivityTablet', 'tablet')
    const caption = root.querySelector('[data-figma="panel · kpi rejected"] dd.kpi-tile__caption')
    const text = caption?.querySelector('.truncated-text')
    if (!(caption instanceof HTMLElement) || !(text instanceof HTMLElement)) throw new Error('no caption')
    expect(caption.textContent).toBe('the message broke the rule')
    // Nothing is cut: no ellipsis, the whole text in its box.
    expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth)
    expect(text.scrollHeight).toBeLessThanOrEqual(text.clientHeight + 1)
    // Two `small` lines (16 px each), where a one-line caption is one.
    const line = Number.parseFloat(getComputedStyle(text).lineHeight)
    expect(text.getBoundingClientRect().height).toBeCloseTo(2 * line, 0)
    const commits = root.querySelector('[data-figma="panel · kpi commits"] dd.kpi-tile__caption .truncated-text')
    expect(commits?.getBoundingClientRect().height).toBeCloseTo(line, 0)
  })

  it('sets the key figures two by two with no caption and scrolls the tabs to Activity (M15)', async () => {
    const { root } = await renderToolkit('skillActivityPhone', 'phone')
    const calls = box(root, '[data-figma="panel · kpi calls"]')
    const headless = box(root, '[data-figma="panel · kpi headless"]')
    const chats = box(root, '[data-figma="panel · kpi from chats"]')
    expect(headless.top).toBeCloseTo(calls.top, 0)
    expect(chats.top).toBeGreaterThan(calls.bottom)
    expect(chats.left).toBeCloseTo(calls.left, 0)
    expect(root.querySelector('[data-figma="activity"]')?.textContent).not.toContain('since Oct 31')
    const list = box(root, '[role="tablist"]')
    const activity = tab(root, 'writer', 'Activity').getBoundingClientRect()
    expect(activity.left).toBeGreaterThanOrEqual(list.left)
    expect(activity.right).toBeLessThanOrEqual(list.right + 0.5)
  })

  it('shows Activity in the tabs when the owner taps it from the phone’s Overview (M2 to M15)', async () => {
    const { root } = await renderToolkit('skillOpenPhone', 'phone', 'article[aria-label="writer"]')
    await userEvent.click(tab(root, 'writer', 'Activity'))
    await expect.poll(() => root.querySelector('[data-figma="activity"]')).not.toBeNull()
    const list = box(root, '[role="tablist"]')
    const activity = tab(root, 'writer', 'Activity').getBoundingClientRect()
    expect(activity.right).toBeLessThanOrEqual(list.right + 0.5)
    expect(activity.left).toBeGreaterThanOrEqual(list.left)
  })

  it('keeps every panel inside the phone’s width (M23 to M26)', async () => {
    for (const state of ['ruleActivityPhone', 'agentActivityPhone', 'workflowActivityPhone', 'hookActivityPhone']) {
      const { root } = await renderToolkit(state, 'phone')
      const activity = box(root, '[data-figma="activity"]')
      for (const layer of ['kpis', 'panel · by day', 'panel · where', 'panel · chats']) {
        expect(box(root, `[data-figma="${layer}"]`).right, `${state}: ${layer}`).toBeLessThanOrEqual(
          activity.right + 0.5,
        )
      }
    }
  })
})
