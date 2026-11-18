import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// The Chats and Headless runs sources of the Toolkit's Activity view through the real route (D15, D16, D18, T11,
// T12, T14, M13, M14, M16): the layout on each width, the source switch, and each tap: a chat's row opens the chat
// beside the view on the desktop (D18) and on its own page on a tablet or phone, close and Back return to the view, a
// chat's or the open chat's item opens its page, an eval's row opens its skill on its Evals tab and its chip on its
// page, and Show all shows every eval or waits with a title. Hover and focus light a row's line behind its content.
// The app's styles and fonts load as in main.ts, so the test measures the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const sizes = { desktop: [1512, 982], tablet: [756, 1158], phone: [390, 844] } as const

async function renderToolkit(state: string, size: keyof typeof sizes = 'desktop', ready = '[data-figma="kpis"]') {
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
  await expect.poll(() => root.querySelector(ready)).not.toBeNull()
  await document.fonts.ready
  return { root, router }
}

function element(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return el
}

const box = (root: HTMLElement, selector: string) => element(root, selector).getBoundingClientRect()
const chatPanel = (root: HTMLElement) => root.querySelector('aside[data-figma="side panel · chat"]')
const chatTitle = (root: HTMLElement, title: string) =>
  element(root, `[data-figma="chat · ${title}"] button.list-row__title`)
const clear = 'rgba(0, 0, 0, 0)'

/** The source switch's item with that label, in this render. */
function source(root: HTMLElement, label: string): HTMLElement {
  const item = [...root.querySelectorAll('[data-figma="source · segmented"] label')].find(
    (l) => l.textContent === label,
  )
  if (!(item instanceof HTMLElement)) throw new Error(`no source ${label}`)
  return item
}

afterEach(() => {
  resetAllStores()
})

describe('the Chats and Headless runs sources on the desktop (D15, D16)', () => {
  it('puts the chats beside Most called in chats, in the log’s place, over the source line (D15)', async () => {
    const { root } = await renderToolkit('toolkitActivityChats')
    expect(page.getByRole('radio', { name: 'Chats' }).element()).toBeChecked()
    const chats = box(root, '[data-figma="panel · CHATS THAT USED THE TOOLKIT"]')
    const most = box(root, '[data-figma="panel · MOST CALLED"]')
    expect(most.top).toBeCloseTo(chats.top, 0)
    expect(most.left).toBeGreaterThan(chats.right)
    expect(root.querySelector('[data-figma="panel · LOG"]')).toBeNull()
    expect(box(root, '[data-figma="source note"]').top).toBeGreaterThan(chats.bottom)
    expect(root.querySelectorAll('[data-figma^="chat · "]')).toHaveLength(4)
    // On the desktop the line on when and where the chat ran starts the chips' line.
    const first = element(root, '[data-figma="chat · Linear workflow setup for NCC team"]')
    const meta = [...first.querySelectorAll('span')].find((s) => s.textContent === 'Nov 13 · omni-brain')
    const chip = element(first, '.map-node__root, button:not(.list-row__title)')
    const metaBox = meta?.getBoundingClientRect()
    expect(metaBox?.right ?? 0).toBeLessThan(chip.getBoundingClientRect().left)
    expect((metaBox?.top ?? 0) + (metaBox?.height ?? 0) / 2).toBeGreaterThan(chip.getBoundingClientRect().top)
  })

  it('draws the two panels of each row as tall as each other, as Figma’s rows (D15 477:238, 477:338)', async () => {
    const { root } = await renderToolkit('toolkitActivityChats')
    const card = (key: string) => box(root, `[data-figma="${key}"] .panel__root`)
    const chats = card('panel · CHATS THAT USED THE TOOLKIT')
    const most = card('panel · MOST CALLED')
    expect(most.top).toBeCloseTo(chats.top, 0)
    expect(most.height).toBeCloseTo(chats.height, 0)
    const running = card('panel · RUNNING NOW')
    expect(card('panel · CALLS PER DAY').height).toBeCloseTo(running.height, 0)
  })

  it('keeps the two panels of each row as wide as each other beside the open chat (D18)', async () => {
    const { root } = await renderToolkit('toolkitActivityChat')
    const panel = (key: string) => box(root, `[data-figma="${key}"]`)
    expect(panel('panel · CALLS PER DAY').width).toBeCloseTo(panel('panel · RUNNING NOW').width, 0)
    expect(panel('panel · MOST CALLED').width).toBeCloseTo(panel('panel · CHATS THAT USED THE TOOLKIT').width, 0)
  })

  it('switches the counts between the sources, and All sessions shows the log again', async () => {
    const { root } = await renderToolkit('toolkitActivityChats')
    await userEvent.click(source(root, 'Headless runs'))
    await expect.poll(() => root.querySelector('[data-figma="panel · BY SKILL EVAL"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="kpi · sessions"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="run · readme-cold-reader"]')).not.toBeNull()
    await userEvent.click(source(root, 'All sessions'))
    await expect.poll(() => root.querySelector('[data-figma="panel · LOG"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="panel · BY SKILL EVAL"]')).toBeNull()
  })

  it('opens a chat beside the view from its row, selects the row, and closes it (D15 to D18)', async () => {
    const { root } = await renderToolkit('toolkitActivityChats')
    await userEvent.click(chatTitle(root, 'Writer rules, skills, and agents'))
    await expect.poll(() => chatPanel(root)?.getAttribute('aria-label')).toBe('Writer rules, skills, and agents')
    expect(box(root, 'aside[data-figma="side panel · chat"]').right).toBeCloseTo(1512, 0)
    expect(root.querySelector('[data-figma="chat · Writer rules, skills, and agents"] [aria-current]')).not.toBeNull()
    expect(root.querySelectorAll('[data-figma^="tool · "]')).toHaveLength(5)
    await userEvent.click(page.getByRole('button', { name: 'Close Writer rules, skills, and agents' }))
    await expect.poll(() => chatPanel(root)).toBeNull()
  })

  it('opens a chat with no detail on what its row says, and a run in the chat’s place', async () => {
    const { root } = await renderToolkit('toolkitActivityChat')
    await userEvent.click(chatTitle(root, 'Deep research on evals'))
    await expect.poll(() => chatPanel(root)?.getAttribute('aria-label')).toBe('Deep research on evals')
    expect(chatPanel(root)?.textContent).toContain('Nov 9 · omni-brain · 2 hook blocks')
    await userEvent.click(element(root, '[data-figma="run · writing-reviewer"] .list-row__title'))
    await expect.poll(() => chatPanel(root)).toBeNull()
    expect(root.querySelector('[data-figma="side panel · run"]')).not.toBeNull()
  })

  it('opens an item a chat used on its page with one tap, from its row and from the open chat', async () => {
    const { root } = await renderToolkit('toolkitActivityChats')
    const chips = element(root, '[data-figma="chat · Brain NC1701 project"] .list-row__actions')
    const readme = [...chips.querySelectorAll('button')].find((b) => b.textContent.includes('readme'))
    if (readme === undefined) throw new Error('no readme chip')
    await userEvent.click(readme)
    await expect.poll(() => root.querySelector('article[aria-label="readme"]')).not.toBeNull()
    expect(chatPanel(root)).toBeNull()
    const { root: open } = await renderToolkit('toolkitActivityChat')
    await userEvent.click(element(open, 'aside [data-figma="478:485"] button'))
    await expect.poll(() => open.querySelector('article[aria-label="writing-reviewer"]')).not.toBeNull()
  })

  it('lights a chat’s line on hover behind its title and chips, and its focus ring', async () => {
    const { root } = await renderToolkit('toolkitActivityChats')
    const row = element(root, '[data-figma="chat · Deep research on evals"]')
    expect(getComputedStyle(row).backgroundColor).toBe(clear)
    await userEvent.hover(chatTitle(root, 'Deep research on evals'))
    await expect.poll(() => getComputedStyle(row).backgroundColor).not.toBe(clear)
    // The fill is the list item's, under the row: the title and each chip are still the top element at their centre.
    for (const part of [chatTitle(root, 'Deep research on evals'), element(row, '.list-row__actions button')]) {
      const b = part.getBoundingClientRect()
      const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
      expect(top === part || (top !== null && part.contains(top))).toBe(true)
    }
    chatTitle(root, 'Deep research on evals').focus()
    await userEvent.keyboard('{Tab}{Shift>}{Tab}{/Shift}')
    expect(getComputedStyle(element(row, '.list-row__root')).outlineStyle).toBe('solid')
  })

  it('waits on Show all 8 chats with a title, since five of the eight chats are known', async () => {
    const { root } = await renderToolkit('toolkitActivityChats')
    const show = page.getByRole('button', { name: 'Show all 8 chats' }).element()
    expect(show).toBeDisabled()
    expect(show.getAttribute('title')).toContain('5 of the 8')
    expect(root.querySelectorAll('[data-figma^="chat · "]')).toHaveLength(4)
  })

  it('opens an eval’s skill on its Evals tab from its row, and on its page from its chip (D16)', async () => {
    const { root } = await renderToolkit('toolkitActivityHeadless')
    await userEvent.click(page.getByRole('button', { name: 'Open the writer evals' }))
    await expect.poll(() => root.querySelector('article[aria-label="writer"]')).not.toBeNull()
    expect(page.getByRole('tab', { name: 'Evals' }).element()).toHaveAttribute('aria-selected', 'true')
    const { root: again } = await renderToolkit('toolkitActivityHeadless')
    await userEvent.click(element(again, '[data-figma="link · agents-md"] button'))
    await expect.poll(() => again.querySelector('article[aria-label="agents-md"]')).not.toBeNull()
  })

  it('lights an eval’s line on hover behind its chip, its count and its line', async () => {
    const { root } = await renderToolkit('toolkitActivityHeadless')
    const button = page.getByRole('button', { name: 'Open the pr-description evals' }).element()
    expect(getComputedStyle(button).backgroundColor).toBe(clear)
    await userEvent.hover(button)
    await expect.poll(() => getComputedStyle(button).backgroundColor).not.toBe(clear)
    const row = element(root, '[data-figma="eval · pr-description"]')
    const chip = element(row, '[data-figma="link · pr-description"] button')
    const b = chip.getBoundingClientRect()
    const onChip = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
    expect(onChip !== null && chip.contains(onChip)).toBe(true)
    // The text lets the pointer through to the row's button; given pointer events, it must paint above the fill.
    for (const text of ['808 calls', '855 sessions · 367 loaded an item · Nov 8–9']) {
      const span = [...row.querySelectorAll('span')].find((s) => s.textContent === text)
      if (!(span instanceof HTMLElement)) throw new Error(`no ${text}`)
      span.style.pointerEvents = 'auto'
      const s = span.getBoundingClientRect()
      const top = document.elementFromPoint(s.left + s.width / 2, s.top + s.height / 2)
      span.style.pointerEvents = ''
      expect(top, text).toBe(span)
    }
  })

  it('shows every eval once Show all 7 evals is pressed', async () => {
    const { root } = await renderToolkit('toolkitActivityHeadless')
    expect(root.querySelectorAll('[data-figma^="eval · "]')).toHaveLength(4)
    await userEvent.click(page.getByRole('button', { name: 'Show all 7 evals' }))
    await expect.poll(() => root.querySelectorAll('[data-figma^="eval · "]').length).toBe(7)
    expect(page.getByRole('button', { name: 'Show all 7 evals' }).query()).toBeNull()
    // A folder with no skill has no button and no chip.
    expect(root.querySelector('[data-figma="eval · other folders"] button')).toBeNull()
  })

  it('shows every eval of the Skills chip once Show all is pressed, readme the fifth (D16)', async () => {
    const { root } = await renderToolkit('toolkitActivityHeadless')
    await userEvent.click(page.getByRole('radio', { name: /Skills/ }))
    await expect.poll(() => root.querySelectorAll('[data-figma^="eval · "]').length).toBe(4)
    expect(root.querySelector('[data-figma="eval · readme"]')).toBeNull()
    const show = page.getByRole('button', { name: 'Show all 7 evals' }).element()
    expect(show).not.toBeDisabled()
    await userEvent.click(show)
    await expect.poll(() => root.querySelectorAll('[data-figma^="eval · "]').length).toBe(5)
    expect(root.querySelector('[data-figma="eval · readme"]')).not.toBeNull()
  })
})

describe('the sources on a tablet (T11, T12, T14) and the phone (M13, M14, M16)', () => {
  it('stands the chats over Most called in the page’s column on a tablet, with Show all under them', async () => {
    const { root } = await renderToolkit('toolkitActivityChatsTablet', 'tablet')
    const perDay = box(root, '[data-figma="panel · calls per day"]')
    const chats = box(root, '[data-figma="panel · CHATS THAT USED THE TOOLKIT"]')
    const most = box(root, '[data-figma="panel · most called"]')
    expect(chats.top).toBeGreaterThan(perDay.bottom)
    expect(most.top).toBeGreaterThan(chats.bottom)
    expect(chats.width).toBeCloseTo(perDay.width, 0)
    expect(root.querySelectorAll('[data-figma^="chat · "]')).toHaveLength(5)
    const show = page.getByRole('button', { name: 'Show all 8 chats' }).element()
    expect(show).toHaveAttribute('aria-disabled', 'true')
    expect(show.getBoundingClientRect().top).toBeGreaterThan(
      box(root, '[data-figma="chat · Harness status in omni brain"]').bottom,
    )
  })

  it('lists all seven evals on a tablet, with no Show all (T12)', async () => {
    const { root } = await renderToolkit('toolkitActivityHeadlessTablet', 'tablet')
    expect(root.querySelectorAll('[data-figma^="eval · "]')).toHaveLength(7)
    expect(page.getByRole('button', { name: 'Show all 7 evals' }).query()).toBeNull()
  })

  it('opens a chat on its own page under Activity › Chats on a tablet, and Back returns (T11 to T14)', async () => {
    const { root } = await renderToolkit('toolkitActivityChatsTablet', 'tablet')
    await userEvent.click(chatTitle(root, 'Writer rules, skills, and agents'))
    await expect.poll(() => root.querySelector('article[data-figma="side panel · chat"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="kpis"]')).toBeNull()
    expect(element(root, '[data-figma="back row"] [aria-current="page"]').textContent).toBe('Chats')
    expect(root.querySelector('[data-figma="field · Started"]')?.textContent).toContain('session file')
    await userEvent.click(page.getByRole('button', { name: 'Back to Activity' }))
    await expect.poll(() => root.querySelector('[data-figma="kpis"]')).not.toBeNull()
    expect(page.getByRole('radio', { name: 'Chats' }).element()).toBeChecked()
  })

  it('opens the chat’s item on its page from the tablet’s chat page (T14)', async () => {
    const { root } = await renderToolkit('toolkitActivityChatTablet', 'tablet', '[data-figma="side panel · chat"]')
    await userEvent.click(element(root, '[data-figma="link · writing-reviewer"] button'))
    await expect.poll(() => root.querySelector('article[aria-label="writing-reviewer"]')).not.toBeNull()
  })

  it('stands the phone’s chat header in a column, with no source column (M16)', async () => {
    const { root } = await renderToolkit('toolkitActivityChatPhone', 'phone', '[data-figma="side panel · chat"]')
    const header = element(root, '[data-figma="header"]')
    const title = element(header, 'h2').getBoundingClientRect()
    const badge = element(header, '.badge__root').getBoundingClientRect()
    expect(badge.top).toBeGreaterThan(title.bottom - 1)
    expect(root.querySelector('[data-figma="field · Started"]')?.textContent).not.toContain('session file')
    await userEvent.click(page.getByRole('button', { name: 'Back to Activity' }))
    await expect.poll(() => root.querySelector('[data-figma="kpis"]')).not.toBeNull()
  })

  it('shows one run and the evals on the phone, and Show all 7 evals shows every eval (M14)', async () => {
    const { root } = await renderToolkit('toolkitActivityHeadlessPhone', 'phone')
    expect(root.querySelectorAll('[data-figma^="run · "]')).toHaveLength(1)
    const kpis = ['sessions', 'loaded an item'].map((k) => box(root, `[data-figma="kpi · ${k}"]`))
    expect(kpis[1]?.top).toBeCloseTo(kpis[0]?.top ?? 0, 0)
    await userEvent.click(page.getByRole('button', { name: 'Show all 7 evals' }))
    await expect.poll(() => root.querySelectorAll('[data-figma^="eval · "]').length).toBe(7)
  })

  it('opens a chat on its own page on the phone (M13 to M16)', async () => {
    const { root } = await renderToolkit('toolkitActivityChatsPhone', 'phone')
    await userEvent.click(chatTitle(root, 'Linear workflow setup for NCC team'))
    await expect
      .poll(() => root.querySelector('article[aria-label="Linear workflow setup for NCC team"]'))
      .not.toBeNull()
  })
})
