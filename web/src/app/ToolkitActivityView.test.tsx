import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Activity view of the Toolkit through the real route (D11 `activity` 444:498, D12, T9, M10): the layout on each
// width and each tap: a run's row or its Open session opens its panel beside the view on the desktop (D12) and its own
// page on a tablet or phone, close and Back return to the view, a Most called item opens on its page, Open the session
// in Workbench waits with a title, Chats and Headless runs wait for their frames, and the tablet's Back to Toolkit goes
// to the list. The app's styles and fonts load as in main.ts, so the test measures the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const sizes = { desktop: [1512, 982], tablet: [756, 1158], phone: [390, 844] } as const

async function renderToolkit(state: string, size: keyof typeof sizes = 'desktop') {
  const [width, height] = sizes[size]
  await page.viewport(width, height)
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
  await expect.poll(() => root.querySelector('[data-figma="kpis"]')).not.toBeNull()
  await document.fonts.ready
  return { root, router }
}

function box(root: HTMLElement, selector: string) {
  const el = root.querySelector(selector)
  if (el === null) throw new Error(`no ${selector}`)
  return el.getBoundingClientRect()
}

function element(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return el
}

const runButton = (root: HTMLElement, name: string) =>
  element(root, `[data-figma="run · ${name}"] .list-row__title button, [data-figma="run · ${name}"] button`)

const panel = (root: HTMLElement) => root.querySelector('[data-figma="side panel · run"]')

afterEach(() => {
  resetAllStores()
})

describe('the Activity view on the desktop (D11)', () => {
  it('draws the key figures in a row, the two rows of two panels and the source line under them', async () => {
    const { root } = await renderToolkit('toolkitActivity')
    const tiles = ['toolkit calls', 'from headless runs', 'from chats', 'hook blocks'].map((k) =>
      box(root, `[data-figma="kpi · ${k}"]`),
    )
    for (const t of tiles.slice(1)) expect(t.top).toBeCloseTo(tiles[0]?.top ?? 0, 0)
    const running = box(root, '[data-figma="panel · RUNNING NOW"]')
    const perDay = box(root, '[data-figma="panel · CALLS PER DAY"]')
    const most = box(root, '[data-figma="panel · MOST CALLED"]')
    const log = box(root, '[data-figma="panel · LOG"]')
    expect(running.top).toBeGreaterThan(Math.max(...tiles.map((t) => t.bottom)))
    expect(perDay.top).toBeCloseTo(running.top, 0)
    expect(perDay.height).toBeCloseTo(running.height, 0)
    expect(perDay.left).toBeGreaterThan(running.right)
    expect(most.top).toBeGreaterThan(running.bottom)
    expect(log.top).toBeCloseTo(most.top, 0)
    expect(box(root, '[data-figma="source note"]').top).toBeGreaterThan(most.bottom)
    expect(root.querySelectorAll('[data-figma^="log · "]')).toHaveLength(8)
    // Each run's Open session sits on its title's line, beside the time, not on a line of its own.
    const time = [...root.querySelectorAll('[data-figma="run · writing-reviewer"] span')].find(
      (s) => s.textContent === '1m 42s',
    )
    const open = element(root, '[data-figma="run · writing-reviewer"] .list-row__trailing button')
    expect(time?.getBoundingClientRect().right ?? 0).toBeLessThan(open.getBoundingClientRect().left)
    expect(panel(root)).toBeNull()
  })

  it('opens a run beside the view from its row, closes it, and opens it again from Open session (D12)', async () => {
    const { root } = await renderToolkit('toolkitActivity')
    await userEvent.click(element(root, '[data-figma="run · writing-reviewer"] .list-row__title'))
    await expect.poll(() => panel(root)).not.toBeNull()
    expect(box(root, '[data-figma="side panel · run"]').right).toBeCloseTo(1512, 0)
    expect(root.querySelector('[data-figma="run · writing-reviewer"] [aria-current]')).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: 'Close writing-reviewer' }))
    await expect.poll(() => panel(root)).toBeNull()
    // The row's title covers the row for the pointer (ListRow), so a click on Open session opens the run through the
    // row; the keyboard reaches the button itself.
    element(root, '[data-figma="run · skill-eval-round"] .list-row__trailing button').focus()
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => panel(root)?.getAttribute('aria-label')).toBe('skill-eval-round')
  })

  it('opens a Most called item on its page, and lights its line on hover', async () => {
    const { root } = await renderToolkit('toolkitActivity')
    const writer = element(root, '[data-figma="bar · writer"]')
    expect(getComputedStyle(writer).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    await userEvent.hover(writer)
    await expect.poll(() => getComputedStyle(writer).backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    // The button spans the row of the chart it lies over.
    const row = [...root.querySelectorAll('.horizontal-bar-chart__row')][2]
    expect(writer.getBoundingClientRect().top).toBeCloseTo(row?.getBoundingClientRect().top ?? 0, 0)
    await userEvent.click(writer)
    await expect.poll(() => root.querySelector('article[aria-label="writer"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="kpis"]')).toBeNull()
  })

  it('keeps Chats and Headless runs disabled, and Open the session in Workbench waits with a title', async () => {
    const { root } = await renderToolkit('toolkitActivityRun')
    expect(page.getByRole('radio', { name: 'All sessions' }).element()).toBeChecked()
    expect(page.getByRole('radio', { name: 'Chats' }).element()).toBeDisabled()
    expect(page.getByRole('radio', { name: 'Headless runs' }).element()).toBeDisabled()
    const open = element(root, '[data-figma="445:478"]')
    expect(open.getAttribute('aria-disabled')).toBe('true')
    expect(open.title).not.toBe('')
    // aria-disabled keeps it in the tab order; a press does nothing, so the panel stays.
    open.click()
    expect(panel(root)).not.toBeNull()
  })

  it('narrows the runs, Most called and the log by the kind chip', async () => {
    const { root } = await renderToolkit('toolkitActivity')
    await userEvent.click(page.getByRole('radio', { name: /Workflows/ }))
    await expect.poll(() => root.querySelectorAll('[data-figma^="run · "]').length).toBe(1)
    expect(root.querySelectorAll('[data-figma^="bar · "]')).toHaveLength(0)
    expect(root.querySelectorAll('[data-figma^="log · "]')).toHaveLength(2)
  })

  it('leaves the view, and the run, for the List', async () => {
    const { root } = await renderToolkit('toolkitActivityRun')
    await userEvent.click(page.getByText('List', { exact: true }))
    await expect.poll(() => root.querySelector('[data-figma="kpis"]')).toBeNull()
    expect(panel(root)).toBeNull()
  })
})

describe('the Activity view on a tablet (T9) and the phone (M10)', () => {
  it('stands the parts in one column under Back to Toolkit on a tablet, with no log', async () => {
    const { root } = await renderToolkit('toolkitActivityTablet', 'tablet')
    const back = box(root, '[data-figma="back row"]')
    const kpis = box(root, '[data-figma="kpis"]')
    const perDay = box(root, '[data-figma="panel · calls per day"]')
    const most = box(root, '[data-figma="panel · most called"]')
    expect(kpis.top).toBeGreaterThan(back.bottom)
    expect(perDay.top).toBeGreaterThan(box(root, '[data-figma="run · pr-description-checker"]').bottom)
    expect(most.top).toBeGreaterThan(perDay.bottom)
    expect(most.width).toBeCloseTo(perDay.width, 0)
    expect(root.querySelector('[data-figma="panel · LOG"]')).toBeNull()
    expect(root.querySelectorAll('[data-figma^="bar · "]')).toHaveLength(5)
  })

  it('opens a run on its own page on a tablet, and Back returns to the view', async () => {
    const { root } = await renderToolkit('toolkitActivityTablet', 'tablet')
    await userEvent.click(element(root, '[data-figma="run · writing-reviewer"] .list-row__title'))
    await expect.poll(() => root.querySelector('article[aria-label="writing-reviewer"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="kpis"]')).toBeNull()
    expect(root.querySelector('[data-figma="fields"]')).not.toBeNull()
    await userEvent.click(page.getByRole('button', { name: 'Back to Activity' }))
    await expect.poll(() => root.querySelector('[data-figma="kpis"]')).not.toBeNull()
  })

  it('goes back to the list from Back to Toolkit on a tablet', async () => {
    const { root } = await renderToolkit('toolkitActivityTablet', 'tablet')
    await userEvent.click(page.getByRole('button', { name: 'Back to Toolkit' }))
    await expect.poll(() => root.querySelector('[data-figma="kpis"]')).toBeNull()
    expect(root.querySelector('[data-figma="filter · chips"]')).not.toBeNull()
  })

  it('sets the key figures two by two under the header on the phone, with two runs', async () => {
    const { root } = await renderToolkit('toolkitActivityPhone', 'phone')
    const calls = box(root, '[data-figma="kpi · toolkit calls"]')
    const headless = box(root, '[data-figma="kpi · headless runs"]')
    const chats = box(root, '[data-figma="kpi · from chats"]')
    expect(headless.top).toBeCloseTo(calls.top, 0)
    expect(chats.top).toBeGreaterThan(calls.bottom)
    expect(chats.left).toBeCloseTo(calls.left, 0)
    expect(root.querySelectorAll('[data-figma^="run · "]')).toHaveLength(2)
    expect(page.getByRole('button', { name: 'Activity', exact: true }).element()).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('opens a run on its own page on the phone, its session button waiting', async () => {
    const { root } = await renderToolkit('toolkitActivityPhone', 'phone')
    await userEvent.click(runButton(root, 'skill-eval-round'))
    await expect.poll(() => root.querySelector('article[aria-label="skill-eval-round"]')).not.toBeNull()
    const open = page.getByRole('button', { name: /Open the session in Workbench/ }).element()
    expect(open).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(page.getByRole('button', { name: 'Back to Activity' }))
    await expect.poll(() => root.querySelectorAll('[data-figma^="run · "]').length).toBe(2)
  })

  it('opens a Most called item on its page on the phone', async () => {
    const { root } = await renderToolkit('toolkitActivityPhone', 'phone')
    await userEvent.click(element(root, '[data-figma="bar · pr-description-checker"]'))
    await expect.poll(() => root.querySelector('article[aria-label="pr-description-checker"]')).not.toBeNull()
  })
})
