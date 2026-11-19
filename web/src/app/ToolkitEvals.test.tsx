import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'
import { setViewport } from '../lib/rendering.ts'

// The Evals tab of an open item through the real route (D20, `evals` 482:1894): the status panel, the chart and the
// cases side by side on the desktop and one under the other on a tablet or phone, and each tap Figma implies: the
// Overview's evals link opens the tab, writer's D5 Reviewer opens the agent on its Evals tab (D26, T25), the rule's
// ledgers open their skills (writer opens D20), the workflow's "from the file" opens its Files tab, and Open the ledger
// waits for a design. The app's styles and fonts load as in main.ts, so the test measures the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const sizes = { desktop: [1512, 982], tablet: [756, 1158], phone: [390, 844] } as const

async function renderToolkit(state: string, size: keyof typeof sizes = 'desktop', ready = '[data-figma="evals"]') {
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

function button(root: HTMLElement, name: string, within = '[data-figma="evals"]') {
  const found = [...root.querySelectorAll(`${within} button`)].find((b) => b.textContent.trim() === name)
  if (!(found instanceof HTMLButtonElement)) throw new Error(`no button ${name}`)
  return found
}

// The colour a token resolves to, as the browser computes it.
function tokenColor(token: string): string {
  const probe = document.createElement('div')
  probe.style.color = `var(--colors-${token})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

function textIn(root: HTMLElement, text: string, within = '[data-figma="evals"]') {
  const found = [...root.querySelectorAll(`${within} span, ${within} button`)].find(
    (el) => el.textContent.trim() === text,
  )
  if (!(found instanceof HTMLElement)) throw new Error(`no ${text}`)
  return found
}

const selectedTab = (root: HTMLElement, item: string) =>
  root.querySelector(`article[aria-label="${item}"] [role="tab"][aria-selected="true"]`)?.textContent

afterEach(() => {
  resetAllStores()
})

describe('the Evals tab of an open item (D20)', () => {
  it('draws the status, the chart and the cases side by side, and the rounds under them', async () => {
    const { root } = await renderToolkit('skillEvals')
    const status = box(root, '[data-figma="panel · status"]')
    const chart = box(root, '[data-figma="panel · opus by round"]')
    const cases = box(root, '[data-figma="panel · cases"]')
    const rounds = box(root, '[data-figma="panel · rounds"]')
    expect(chart.top).toBeGreaterThan(status.bottom)
    expect(cases.top).toBeCloseTo(chart.top, 0)
    expect(cases.left).toBeGreaterThan(chart.right)
    expect(chart.width).toBeCloseTo(cases.width, 0)
    expect(rounds.top).toBeGreaterThan(Math.max(chart.bottom, cases.bottom))
    // Six criteria, the five cases with their scores and three rounds.
    expect(root.querySelectorAll('[data-figma^="badge · "]')).toHaveLength(6)
    expect(root.querySelectorAll('[data-figma^="case · "]')).toHaveLength(5)
    expect(root.querySelectorAll('[data-figma^="round · "]')).toHaveLength(3)
    // The chart's data is in its table for assistive technology.
    expect(root.querySelector('[role="figure"][aria-label="Opus pass rate by round"] table')?.textContent).toContain(
      'x1',
    )
  })

  it('opens from the Overview’s evals link', async () => {
    const { root } = await renderToolkit('skillOpen', 'desktop', 'article[aria-label="writer"]')
    await userEvent.click(button(root, 'Skill evals', 'article'))
    await expect.poll(() => root.querySelector('[data-figma="evals"]')).not.toBeNull()
    expect(selectedTab(root, 'writer')).toBe('Evals')
  })

  it('opens the agent writing-reviewer on its Evals tab from D5 Reviewer (D26)', async () => {
    const { root } = await renderToolkit('skillEvals')
    await userEvent.click(button(root, 'D5 Reviewer'))
    await expect.poll(() => root.querySelector('article[aria-label="writing-reviewer"]')).not.toBeNull()
    expect(selectedTab(root, 'writing-reviewer')).toBe('Evals')
    expect(root.querySelector('[data-figma="evals"]')?.textContent).toContain('Drafts · 9')
  })

  it('opens writing-reviewer’s Evals with its results from the Overview: Skill evals, then D5 Reviewer (D3, D26)', async () => {
    const { root } = await renderToolkit('skillOpen', 'desktop', 'article[aria-label="writer"]')
    await userEvent.click(button(root, 'Skill evals', 'article'))
    await expect.poll(() => root.querySelector('[data-figma="evals"]')).not.toBeNull()
    await userEvent.click(button(root, 'D5 Reviewer'))
    await expect.poll(() => root.querySelector('article[aria-label="writing-reviewer"]')).not.toBeNull()
    expect(selectedTab(root, 'writing-reviewer')).toBe('Evals')
    await expect.poll(() => root.querySelector('[data-figma="evals"]')?.textContent).toContain('Drafts · 9')
  })

  it('keeps Open the ledger disabled: the ledger is outside the toolkit and no screen shows it', async () => {
    const { root } = await renderToolkit('skillEvals')
    const ledger = button(root, 'Open the ledger')
    expect(ledger.disabled).toBe(true)
    expect(ledger.title).not.toBe('')
  })

  it('shows the agent’s own badge as text, with nothing to open', async () => {
    const { root } = await renderToolkit('agentEvals')
    expect(root.querySelector('button[data-figma="badge · D5 Reviewer"]')).toBeNull()
    expect(root.querySelector('[data-figma="badge · D5 Reviewer"]')).not.toBeNull()
  })
})

describe('the Evals tab of an item with no eval cases (D25, D27, D28)', () => {
  it('opens a rule’s ledger: writer on its Evals tab, though the rule’s list has no skills', async () => {
    const { root } = await renderToolkit('ruleEvals')
    expect(root.querySelector('[data-figma="evals"]')?.textContent).toContain('4 ledgers')
    await userEvent.click(button(root, 'writer'))
    await expect.poll(() => root.querySelector('article[aria-label="writer"]')).not.toBeNull()
    expect(selectedTab(root, 'writer')).toBe('Evals')
    expect(root.querySelector('[data-figma="evals"]')?.textContent).toContain('Cases · 5')
  })

  it('opens a ledger’s skill with no Evals tab on its Overview', async () => {
    const { root } = await renderToolkit('ruleEvals')
    await userEvent.click(button(root, 'ambitious'))
    await expect.poll(() => root.querySelector('article[aria-label="ambitious"]')).not.toBeNull()
    expect(selectedTab(root, 'ambitious')).toBe('Overview')
  })

  it('opens the workflow’s Files tab from "from the file", on the file that holds the gates', async () => {
    const { root } = await renderToolkit('workflowEvals')
    await userEvent.click(button(root, 'from the file'))
    await expect.poll(() => selectedTab(root, 'skill-eval-round')).toBe('Files')
    await expect
      .poll(() => root.querySelector('article[aria-label="skill-eval-round"]')?.textContent)
      .toContain('Markdown · 93 lines · design doc')
  })

  it('opens the Files tab with the tree and the design doc from the Overview: Evals, then "from the file" (D8, D35)', async () => {
    const { root } = await renderToolkit('workflowOpen', 'desktop', 'article[aria-label="skill-eval-round"]')
    const tab = [...root.querySelectorAll('article[aria-label="skill-eval-round"] [role="tab"]')].find(
      (t) => t.textContent.trim() === 'Evals',
    )
    if (!(tab instanceof HTMLElement)) throw new Error('no Evals tab')
    await userEvent.click(tab)
    await expect.poll(() => root.querySelector('[data-figma="evals"]')).not.toBeNull()
    await userEvent.click(button(root, 'from the file'))
    await expect.poll(() => selectedTab(root, 'skill-eval-round')).toBe('Files')
    await expect.poll(() => root.querySelector('[data-figma="file browser"]')).not.toBeNull()
    const files = root.querySelector('[data-figma="file browser"]')?.textContent ?? ''
    expect(files).toContain('harness/')
    expect(files).toContain('Markdown · 93 lines · design doc')
  })

  it('shows a hook’s test run as a passing badge over its test groups', async () => {
    const { root } = await renderToolkit('hookEvals')
    expect(root.querySelector('[data-figma="badge · 43 of 43 pass"]')).not.toBeNull()
    expect(root.querySelectorAll('[data-figma^="case · "]')).toHaveLength(5)
    expect(root.querySelector('[data-figma="panel · opus by round"]')).toBeNull()
  })
})

describe('the accent text and the symbols of the Evals tab', () => {
  it('draws a rule’s ledger count in the accent colour, not muted (D25 492:489)', async () => {
    const { root } = await renderToolkit('ruleEvals')
    const count = textIn(root, '4 ledgers')
    expect(getComputedStyle(count).color).toBe(tokenColor('fg-accent'))
    expect(getComputedStyle(count).color).not.toBe(tokenColor('fg-muted'))
  })

  it('draws the workflow’s "from the file" link in the accent colour (D27 492:1660)', async () => {
    const { root } = await renderToolkit('workflowEvals')
    expect(getComputedStyle(button(root, 'from the file')).color).toBe(tokenColor('fg-accent'))
  })

  it('draws Figma’s ✗ and ✓ in the hook’s test line as the library’s icons, named fail and pass (D28, T27, M30)', async () => {
    const { root } = await renderToolkit('hookEvals')
    const status = root.querySelector('[data-figma="panel · status"]')
    if (!(status instanceof HTMLElement)) throw new Error('no status')
    const line = status.querySelector('p')
    expect(line?.textContent).not.toMatch(/[\u2713\u2717\u00d7]/)
    // Each mark is an icon in the line, with its accessible text.
    const fail = page.getByRole('img', { name: 'fail' }).last()
    const pass = page.getByRole('img', { name: 'pass' }).last()
    await expect.element(fail).toBeInTheDocument()
    await expect.element(pass).toBeInTheDocument()
    expect(line?.contains(fail.element())).toBe(true)
    expect(line?.contains(pass.element())).toBe(true)
    // At the text's size and in its colour.
    const text = line instanceof HTMLElement ? getComputedStyle(line) : null
    for (const icon of [fail.element(), pass.element()]) {
      expect(icon.getBoundingClientRect().width).toBeCloseTo(12, 0)
      expect(getComputedStyle(icon).color).toBe(text?.color)
    }
    expect(text?.color).toBe(tokenColor('fg-muted'))
  })
})

describe('the result of each criterion for assistive technology (D20, D26, D28)', () => {
  it('names each badge with its state: passed, failed or waits', async () => {
    await renderToolkit('skillEvals')
    const criteria = page.getByRole('list', { name: 'Criteria' }).last()
    await expect.element(criteria).toBeInTheDocument()
    const items = criteria.getByRole('listitem')
    expect(items.elements()).toHaveLength(6)
    await expect.element(items.nth(0)).toHaveTextContent('D1 Quality failed')
    await expect.element(items.nth(1)).toHaveTextContent('D2 Value passed')
    // The waiting criterion's label already says so.
    expect(items.nth(5).element().textContent).toBe('D6 Real use · waits')
    await expect.element(page.getByRole('button', { name: 'D5 Reviewer passed' }).last()).toBeInTheDocument()
  })

  it('keeps a test run’s label as its name when it states the result (D28 43 of 43 pass)', async () => {
    await renderToolkit('hookEvals')
    const run = page.getByRole('list', { name: 'Criteria' }).last().getByRole('listitem')
    await expect.element(run).toBeInTheDocument()
    expect(run.element().textContent).toBe('43 of 43 pass')
  })
})

describe('the Evals tab on a tablet and the phone', () => {
  it('stands the chart over the cases on a tablet, each as wide as the tab (T16)', async () => {
    const { root } = await renderToolkit('skillEvalsTablet', 'tablet')
    const evals = box(root, '[data-figma="evals"]')
    const chart = box(root, '[data-figma="panel · opus by round"]')
    const cases = box(root, '[data-figma="panel · cases"]')
    expect(cases.top).toBeGreaterThan(chart.bottom)
    expect(chart.width).toBeCloseTo(evals.width, 0)
    expect(cases.width).toBeCloseTo(evals.width, 0)
    // T16 names the item in the back row and leaves out the kind badge.
    expect(root.querySelector('[data-figma="back row"]')?.textContent).toContain('writer')
    expect(root.querySelector('[data-figma="kind badge"]')).toBeNull()
  })

  it('opens the agent from writer under the breadcrumb, as T25 shows it, and goes back to writer’s Evals', async () => {
    const { root } = await renderToolkit('skillEvalsTablet', 'tablet')
    await userEvent.click(button(root, 'D5 Reviewer'))
    await expect.poll(() => root.querySelector('article[aria-label="writing-reviewer"]')).not.toBeNull()
    const back = root.querySelector('[data-figma="back row"]')
    expect(back?.textContent).toMatch(/Toolkit.*writer.*writing-reviewer/)
    expect(selectedTab(root, 'writing-reviewer')).toBe('Evals')
    expect(root.querySelector('[data-figma="kind badge"]')).not.toBeNull()
    await userEvent.click(button(root, 'writer', '[data-figma="back row"]'))
    await expect.poll(() => root.querySelector('article[aria-label="writer"]')).not.toBeNull()
    expect(selectedTab(root, 'writer')).toBe('Evals')
  })

  it('wraps the criteria to two rows on the phone (M18)', async () => {
    const { root } = await renderToolkit('skillEvalsPhone', 'phone')
    const first = box(root, '[data-figma="badge · D1 Quality"]')
    const fourth = box(root, '[data-figma="badge · D4 Triggering"]')
    expect(fourth.top).toBeGreaterThan(first.bottom)
    expect(fourth.left).toBeCloseTo(first.left, 0)
    // Each panel stays inside the phone's width.
    const evals = box(root, '[data-figma="evals"]')
    for (const layer of ['panel · status', 'panel · cases', 'panel · rounds']) {
      expect(box(root, `[data-figma="${layer}"]`).right).toBeLessThanOrEqual(evals.right + 0.5)
    }
  })
})
