import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it, onTestFinished } from 'vitest'
import { testRender } from '../../lib/testRender.ts'
import { ToolkitScreen } from './screens/ToolkitScreen.tsx'
import { toolkitStates } from './states/index.ts'
import { setViewport } from '../../lib/rendering.ts'

// Sizes of the discussion's parts that the blind review measured against Figma (D5, T5, M7). The app's styles and
// fonts load as in main.ts, but each machine draws them a little differently (CI's widths differ from a Mac's), so
// a text's width is checked against the same text drawn here in Figma's font and size, and a height counts the lines
// the text wrapped to here, not Figma's.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await setViewport(1512, 982)
})

type DiscussState = 'skillDiscuss'

async function renderDiscuss(state: DiscussState, viewport: 'desktop' | 'tablet' | 'phone', ready: string) {
  const { data, ui } = toolkitStates[state]
  view = await testRender(<ToolkitScreen data={data} ui={ui} viewport={viewport} />)
  await expect.poll(() => document.querySelector(ready)).not.toBeNull()
  await document.fonts.ready
  const found = [...document.querySelectorAll<HTMLElement>(ready)].at(-1)
  if (found === undefined) throw new Error(`no ${ready}`)
  return found
}

const box = (el: Element) => el.getBoundingClientRect()

/** The width of a span's text, without its padding. */
function textWidth(el: Element) {
  const range = document.createRange()
  range.selectNodeContents(el)
  return range.getBoundingClientRect().width
}

/** Checks that `el` draws its text in Figma's mono 12: the size, the family and the width of the same text in it. */
function expectMono12(el: HTMLElement) {
  const reference = document.createElement('span')
  reference.style.cssText = `position: absolute; white-space: nowrap; font: 400 12px var(--fonts-mono)`
  reference.textContent = el.textContent
  document.body.append(reference)
  onTestFinished(() => {
    reference.remove()
  })
  const drawn = getComputedStyle(el)
  expect(drawn.fontSize).toBe('12px')
  expect(drawn.fontFamily).toBe(getComputedStyle(reference).fontFamily)
  expect(Math.abs(textWidth(el) - textWidth(reference))).toBeLessThanOrEqual(1)
}

describe('the discussion panel’s context row (D5)', () => {
  // 438:19: "toolkit/skills/writer/ attached" is Geist Mono 12, 224 × 17.
  it('draws the attached path in mono 12, as wide as Figma’s', async () => {
    await setViewport(1512, 982)
    const context = await renderDiscuss('skillDiscuss', 'desktop', '[data-figma="context"]')
    const path = [...context.querySelectorAll('span')].find((s) => s.textContent === 'toolkit/skills/writer/ attached')
    expect(path).toBeDefined()
    if (path === undefined) return
    expectMono12(path)
  })
})

type PageState = 'skillDiscussTablet' | 'skillDiscussPhone'

/** Renders the discussion's page on a tablet or the phone and returns the item's card. */
async function renderPage(state: PageState, viewport: 'tablet' | 'phone') {
  const { data, ui } = toolkitStates[state]
  view = await testRender(<ToolkitScreen data={data} ui={ui} viewport={viewport} />)
  const ready = '[data-figma="task · discussing"]'
  await expect.poll(() => document.querySelector(ready)).not.toBeNull()
  await document.fonts.ready
  const found = [...document.querySelectorAll<HTMLElement>(ready)].at(-1)
  if (found === undefined) throw new Error(`no ${ready}`)
  return found
}

/** How many lines a paragraph wrapped to. */
function lines(el: HTMLElement) {
  return Math.round(box(el).height / Number.parseFloat(getComputedStyle(el).lineHeight))
}

/** The card's height for Figma's, with the guard's lines as wrapped here in place of Figma's. */
function cardHeight(card: HTMLElement, figma: number, figmaLines: number) {
  const guard = card.querySelector<HTMLElement>('[data-figma="guard"]')
  if (guard === null) throw new Error('no guard')
  return figma + (lines(guard) - figmaLines) * Number.parseFloat(getComputedStyle(guard).lineHeight)
}

describe('the item’s card on the discussion page (T5, M7)', () => {
  // T5 464:334 is 96 high: the meta line's middle 43 under its top (464:343, 14 high at 107) and the guard's first
  // line's middle 62.5 under it (464:348, two 15 px lines at 126).
  it('keeps Figma’s height and text places on a tablet (T5)', async () => {
    await setViewport(756, 1158)
    const card = await renderPage('skillDiscussTablet', 'tablet')
    const top = box(card).top
    expect(Math.abs(box(card).height - cardHeight(card, 96, 2))).toBeLessThanOrEqual(1)
    const [meta, guard] = [...card.querySelectorAll('p')]
    if (meta === undefined || guard === undefined) throw new Error('no meta or guard')
    expect(Math.abs(box(meta).top + box(meta).height / 2 - top - 43)).toBeLessThanOrEqual(1)
    const lineHeight = Number.parseFloat(getComputedStyle(guard).lineHeight)
    expect(Math.abs(box(guard).top + lineHeight / 2 - top - 62.5)).toBeLessThanOrEqual(2)
  })

  // M7 464:150 is 138 high, its guard three 15 px lines (464:183), and the discussion area (464:184) starts 8 under it.
  it('keeps Figma’s height on the phone, with the area 8 under it (M7)', async () => {
    await setViewport(390, 844)
    const card = await renderPage('skillDiscussPhone', 'phone')
    expect(Math.abs(box(card).height - cardHeight(card, 138, 3))).toBeLessThanOrEqual(2)
    const area = [...document.querySelectorAll('[data-figma="discussion"]')].at(-1)
    if (area === undefined) throw new Error('no discussion area')
    expect(box(area).top - box(card).bottom).toBe(8)
  })
})

describe('the discussion panel’s header (D5)', () => {
  // 438:7: the item's name "writer" is violet Geist Mono 12, 44 × 17.
  it('draws the item’s name in mono 12, as wide as Figma’s', async () => {
    await setViewport(1512, 982)
    const header = await renderDiscuss('skillDiscuss', 'desktop', '[data-figma="header"]')
    const name = [...header.querySelectorAll('span')].find((s) => s.textContent === 'writer')
    expect(name).toBeDefined()
    if (name === undefined) return
    expectMono12(name)
  })
})
