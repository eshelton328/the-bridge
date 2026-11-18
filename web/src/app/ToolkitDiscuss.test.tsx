import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { routeTree } from './routeTree.gen.ts'

// An open item's discussion through the real route (D5, T5, M7): on the desktop a side panel at the window's end in
// the list's place, with the item beside it; on a tablet or phone a page of its own in the item's place, with no tab
// bar. Discuss opens it from the item (D3, T3, M2), close and Back return to the item, and the card returns to it too.
// The panel's header and the page's nav and card stay at the top and the reply box at the bottom while only the
// messages scroll (d-107). Open in Workbench is disabled with a title: no Workbench state takes a toolkit chat. The
// app's styles and fonts load as in main.ts, so the test measures the real layout.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const sizes = { desktop: [1512, 982], tablet: [756, 1158], phone: [390, 844] } as const

async function renderToolkit(state: string, size: keyof typeof sizes, ready: string) {
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
  return root
}

function find(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector)
  if (!(el instanceof HTMLElement)) throw new Error(`no ${selector}`)
  return el
}

const box = (el: Element) => el.getBoundingClientRect()
const panel = '[data-figma="side panel · Discuss writer"]'

/** Makes the messages overflow, scrolls them to their end and checks what stays put. */
async function scrollMessages(root: HTMLElement, area: HTMLElement, fixed: readonly HTMLElement[]) {
  const bodies = [...root.querySelectorAll<HTMLElement>('.scroll-frame__body')].filter((b) => b.contains(area))
  const body = bodies.at(-1)
  if (body === undefined) throw new Error('no scroll body')
  const long = document.createElement('div')
  long.style.height = '3000px'
  long.style.flexShrink = '0'
  area.append(long)
  expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
  const before = fixed.map((el) => box(el).top)
  const areaTop = box(area).top
  body.scrollTop = body.scrollHeight
  await expect.poll(() => body.scrollTop).toBeGreaterThan(0)
  expect(box(area).top).toBeLessThan(areaTop)
  fixed.forEach((el, i) => {
    expect(box(el).top).toBe(before[i])
  })
}

/** Sends messages until the list overflows, then checks the last one sent shows inside the scroll body. */
async function sendUntilOverflow(root: HTMLElement, scope: string, composer: string) {
  const message = `${scope} [data-figma="message · Erik"]`
  for (let n = 1; n <= 12; n++) {
    const before = root.querySelectorAll(message).length
    await userEvent.click(find(root, `${composer} textarea`))
    await userEvent.keyboard(`Message ${String(n)}: why does the review run after the draft and not before it?{Enter}`)
    await expect.poll(() => root.querySelectorAll(message).length).toBe(before + 1)
  }
  const last = [...root.querySelectorAll<HTMLElement>(message)].at(-1)
  const body = last?.closest<HTMLElement>('.scroll-frame__body')
  if (last === undefined || body === null || body === undefined) throw new Error('no sent message or scroll body')
  expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
  await expect.poll(() => box(last).bottom <= box(body).bottom && box(last).top >= box(body).top).toBe(true)
  expect(last.textContent).toContain('Message 12:')
}

afterEach(async () => {
  resetAllStores()
  await page.viewport(1512, 982)
})

describe('the discussion on the desktop (D5)', () => {
  it('sits at the window’s end in the list’s place, 420 wide, with the item beside it', async () => {
    const root = await renderToolkit('skillDiscuss', 'desktop', panel)
    const side = find(root, panel)
    const item = find(root, 'article[aria-label="writer"]')
    expect(root.querySelector('[data-figma="toolkit list"]')).toBeNull()
    expect(box(side).width).toBe(420)
    expect(box(side).right).toBe(1512)
    expect(box(item).right).toBeLessThanOrEqual(box(side).left)
    // The item keeps D3's Overview, starting 40 in from the rail.
    expect(box(find(root, '[data-figma="432:1461"]')).left).toBe(104)
  })

  it('keeps the header and the reply box in view while the messages scroll (d-107)', async () => {
    const root = await renderToolkit('skillDiscuss', 'desktop', panel)
    const header = find(root, `${panel} [data-figma="header"]`)
    const composer = find(root, `${panel} [data-figma="composer"]`)
    const message = find(root, `${panel} [data-figma="message · Claude"]`)
    const area = message.parentElement?.parentElement
    if (!(area instanceof HTMLElement)) throw new Error('no message area')
    await scrollMessages(root, area, [header, composer])
    expect(box(composer).bottom).toBeLessThanOrEqual(982)
  })

  it('opens from Discuss on the item (D3), closes with close and opens again', async () => {
    const root = await renderToolkit('skillOpen', 'desktop', 'article[aria-label="writer"]')
    expect(root.querySelector(panel)).toBeNull()
    expect(root.querySelector('[data-figma="toolkit list"]')).not.toBeNull()
    await userEvent.click(find(root, '[data-figma="button · Discuss"]'))
    await expect.poll(() => root.querySelector(panel)).not.toBeNull()
    expect(root.querySelector('[data-figma="toolkit list"]')).toBeNull()
    await userEvent.click(find(root, `${panel} button[aria-label="Close the discussion"]`))
    await expect.poll(() => root.querySelector(panel)).toBeNull()
    expect(root.querySelector('[data-figma="toolkit list"]')).not.toBeNull()
    // Discuss toggles the panel on the desktop.
    await userEvent.click(find(root, '[data-figma="button · Discuss"]'))
    await expect.poll(() => root.querySelector(panel)).not.toBeNull()
    await userEvent.click(find(root, '[data-figma="button · Discuss"]'))
    await expect.poll(() => root.querySelector(panel)).toBeNull()
  })

  it('sends a message after the answer and empties the reply box; Open in Workbench waits', async () => {
    const root = await renderToolkit('skillDiscuss', 'desktop', panel)
    const input = find(root, `${panel} textarea`)
    await userEvent.click(input)
    await userEvent.keyboard('What does step 3 do?{Enter}')
    // The sent message follows the entries; a user Message names its author "You" for screen readers only.
    await expect
      .poll(() =>
        [...root.querySelectorAll(`${panel} [data-figma="message · Erik"]`)].some((m) =>
          m.textContent.includes('What does step 3 do?'),
        ),
      )
      .toBe(true)
    expect(find(root, `${panel} textarea`)).toHaveProperty('value', '')
    const workbench = find(root, `${panel} [data-figma="button · Open in Workbench"]`)
    expect(workbench.getAttribute('aria-disabled')).toBe('true')
    expect(workbench.title).not.toBe('')
  })

  it('keeps the line breaks and indents of a sent message', async () => {
    const root = await renderToolkit('skillDiscuss', 'desktop', panel)
    await userEvent.click(find(root, `${panel} textarea`))
    await userEvent.keyboard('a{Shift>}{Enter}{/Shift}  b{Enter}')
    await expect.poll(() => root.querySelectorAll(`${panel} [data-figma="message · Erik"]`).length).toBe(2)
    const sent = [...root.querySelectorAll<HTMLElement>(`${panel} [data-figma="message · Erik"]`)].at(-1)
    if (sent === undefined) throw new Error('no sent message')
    const text = [...sent.querySelectorAll<HTMLElement>('*')].find((el) => el.textContent === 'a\n  b')
    if (text === undefined) throw new Error('no message text')
    expect(text.innerText).toBe('a\n  b')
  })

  it('scrolls to each message sent once the messages overflow', async () => {
    const root = await renderToolkit('skillDiscuss', 'desktop', panel)
    await sendUntilOverflow(root, panel, `${panel} [data-figma="composer"]`)
  })

  it('closes when another item opens, so it opens without the last one’s discussion', async () => {
    const root = await renderToolkit('skillDiscuss', 'desktop', panel)
    await userEvent.click(find(root, '[data-figma="button · Show on map"]'))
    await expect.poll(() => root.querySelector(panel)).toBeNull()
  })
})

describe('the discussion on a tablet (T5)', () => {
  it('opens from Discuss on T3 as a page with no tab bar; Back returns to the item', async () => {
    const root = await renderToolkit('skillOpenTablet', 'tablet', 'article[aria-label="writer"]')
    expect(root.querySelector('[data-figma="tab bar"]')).not.toBeNull()
    await userEvent.click(find(root, '[data-figma="button · Discuss"]'))
    await expect.poll(() => root.querySelector('[data-figma="task · discussing"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="tab bar"]')).toBeNull()
    expect(root.querySelector('article[aria-label="writer"]')).toBeNull()
    await userEvent.click(find(root, '[data-figma="nav"] button[aria-label="Back to writer"]'))
    await expect.poll(() => root.querySelector('article[aria-label="writer"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="tab bar"]')).not.toBeNull()
  })

  it('returns to the item from its card, and a suggestion goes in the reply box', async () => {
    const root = await renderToolkit('skillDiscussTablet', 'tablet', '[data-figma="task · discussing"]')
    await userEvent.click(find(root, '[data-figma="button · What does scripts/check test?"]'))
    await expect
      .poll(() => find(root, '[data-figma="composer · discussion"] textarea'))
      .toHaveProperty('value', 'What does scripts/check test?')
    await userEvent.click(find(root, '[data-figma="chevron · open task"]'))
    await expect.poll(() => root.querySelector('article[aria-label="writer"]')).not.toBeNull()
  })

  it('keeps the nav, the card and the reply box in view while the messages scroll (d-107)', async () => {
    const root = await renderToolkit('skillDiscussTablet', 'tablet', '[data-figma="task · discussing"]')
    const nav = find(root, '[data-figma="nav"]')
    const card = find(root, '[data-figma="task · discussing"]')
    const composer = find(root, '[data-figma="composer · discussion"]')
    await scrollMessages(root, find(root, '[data-figma="discussion"]'), [nav, card, composer])
    expect(box(composer).bottom).toBeLessThanOrEqual(1158)
  })
})

describe('the discussion on the phone (M7)', () => {
  it('opens from the Discuss icon button on M2 full screen; Back returns to the item', async () => {
    const root = await renderToolkit('skillOpenPhone', 'phone', 'article[aria-label="writer"]')
    await userEvent.click(find(root, 'button[aria-label="Discuss"]'))
    await expect.poll(() => root.querySelector('[data-figma="task · discussing"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="tab bar"]')).toBeNull()
    // The model and context sit in the card, and the suggestions stack under Try.
    expect(
      find(root, '[data-figma="task · discussing"]').querySelector('[data-figma="model and context"]'),
    ).not.toBeNull()
    const suggestions = [...root.querySelectorAll('[data-figma="suggestions"] button')].map((b) => box(b))
    expect(suggestions).toHaveLength(3)
    for (const s of suggestions) expect(s.width).toBe(366)
    await userEvent.click(find(root, '[data-figma="nav"] button[aria-label="Back to writer"]'))
    await expect.poll(() => root.querySelector('article[aria-label="writer"]')).not.toBeNull()
    expect(root.querySelector('[data-figma="tab bar"]')).not.toBeNull()
  })

  it('scrolls to each message sent once the messages overflow', async () => {
    const root = await renderToolkit('skillDiscussPhone', 'phone', '[data-figma="task · discussing"]')
    await sendUntilOverflow(root, '[data-figma="discussion"]', '[data-figma="composer · discussion"]')
  })

  it('fits the empty state and the reply box on the screen with no scroll, and Workbench waits', async () => {
    const root = await renderToolkit('skillDiscussPhone', 'phone', '[data-figma="task · discussing"]')
    const last = find(root, '[data-figma="button · Which skills link to writer?"]')
    const composer = find(root, '[data-figma="composer · discussion"]')
    expect(box(last).bottom).toBeLessThanOrEqual(box(composer).top)
    expect(box(composer).bottom).toBeLessThanOrEqual(844)
    const workbench = find(root, '[data-figma="button · Open in Workbench"]')
    expect(workbench.textContent.trim()).toBe('Workbench')
    expect(workbench.getAttribute('aria-disabled')).toBe('true')
  })
})

describe('the reply box on the tablet’s page (T5)', () => {
  // T5 464:379 ends at 1115, 43 over the frame's 1158 end (40 on the grid). Under a tablet page with no tab bar
  // AppShell keeps the home indicator's 34 (`shell.safeAreaBottom`, library beta.42), so the footer pads 6.
  it('ends 40 over the screen’s end', async () => {
    const root = await renderToolkit('skillDiscussTablet', 'tablet', '[data-figma="task · discussing"]')
    const reply = find(root, '[data-figma="composer · discussion"]')
    expect(sizes.tablet[1] - box(reply).bottom).toBe(40)
  })
})
