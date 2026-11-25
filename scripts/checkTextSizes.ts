// `pnpm check:text-sizes` (d-122): renders the story of every page state in
// the window of its layout (390, 744 or 1512 px wide) at Small, Default and
// Large, and fails when a larger size cuts text or lets it spill out of its
// box where Small does not. Small is the designs' size, which the fidelity
// tools check; only type grows, so a new cut is the text size's. It serves
// the built Storybook as `pnpm fidelity` does; pass --skip-build to reuse
// web/storybook-static. Heavy: run it through the bridge-verify lock.
// Prints one JSON line, with each page's counts at Small (every problem)
// and at Default and Large (the new ones), and exits 1 on a new problem.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { chromium, type Page } from 'playwright'
import { waitForAnimations, waitForLayout } from './fidelity/settle.ts'
import { serveStatic, storybookDir, storyForState, storyUrl } from './fidelity/storyServer.ts'
import { repoRoot } from './fidelity/references.ts'
import { isStateFile } from './genRegistry.ts'
import {
  addCounts,
  layoutOf,
  newProblems,
  overlapPairs,
  overlapsOf,
  problemsOf,
  type SizeCounts,
  type TextMeasure,
  type TextProblem,
  windows,
} from './textSizesLib.ts'

const { values } = parseArgs({ options: { 'skip-build': { type: 'boolean' }, page: { type: 'string' } } })
const pagesDir = join(repoRoot, 'web', 'src', 'pages')

// The library's textSizeClass (d-122): Small has no class. Kept here as plain names, as this script runs in Node
// without the library's React build.
const sizes = [
  ['small', null],
  ['default', 'text-default'],
  ['large', 'text-large'],
] as const

/** Every state of every page (or of `--page`), with its layout. */
function states(): { page: string; state: string; layout: keyof typeof windows }[] {
  const out: { page: string; state: string; layout: keyof typeof windows }[] = []
  for (const page of readdirSync(pagesDir).sort()) {
    if (values.page !== undefined && page !== values.page) continue
    const dir = join(pagesDir, page, 'states')
    if (!existsSync(dir)) continue
    for (const file of readdirSync(dir).filter(isStateFile).sort()) {
      const layout = layoutOf(readFileSync(join(dir, file), 'utf8'))
      if (layout !== undefined) out.push({ page, state: file.replace(/\.ts$/, ''), layout })
    }
  }
  return out
}

/** Measures every run of text on the page, in the browser (see TextMeasure). */
function measureText(): TextMeasure[] {
  const box = (r: DOMRect) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })
  const path = (el: Element): string => {
    const parts: string[] = []
    for (let e: Element | null = el; e !== null && e !== document.body; e = e.parentElement) {
      const index = e.parentElement === null ? 0 : [...e.parentElement.children].indexOf(e)
      parts.unshift(`${e.tagName.toLowerCase()}:${String(index)}`)
    }
    return parts.join('/')
  }
  const out: TextMeasure[] = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? ''
    const holder = node.parentElement
    if (text === '' || holder?.closest('script, style, noscript') !== null) continue
    const style = getComputedStyle(holder)
    if (style.visibility === 'hidden' || style.display === 'none') continue
    const range = document.createRange()
    range.selectNodeContents(node)
    const rect = range.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    let truncated = false
    let truncatedCuts = false
    const clippers: TextMeasure['clippers'] = []
    let scroller: TextMeasure['scroller']
    for (let a: Element | null = holder; a !== null && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a)
      const ellipsis = s.textOverflow === 'ellipsis'
      const clamp = s.webkitLineClamp !== '' && s.webkitLineClamp !== 'none'
      if (ellipsis || clamp) {
        truncated = true
        if (ellipsis && a.scrollWidth > a.clientWidth + 1) truncatedCuts = true
        if (clamp && a.scrollHeight > a.clientHeight + 1) truncatedCuts = true
      }
      const scrolls = [s.overflowX, s.overflowY].some((o) => o === 'auto' || o === 'scroll')
      if (scrolls) {
        scroller = box(a.getBoundingClientRect())
        break
      }
      if ([s.overflowX, s.overflowY].some((o) => o === 'hidden' || o === 'clip'))
        clippers.push(box(a.getBoundingClientRect()))
    }
    // A word that breaks across lines (see TextMeasure.brokenWords). A break after a hyphen or a slash is a normal
    // break point, so those split the words. A long path that Small already breaks is the design's, as newProblems
    // keeps only the holders that break a word at a larger size and not at Small.
    let brokenWords = 0
    const source = node.textContent ?? ''
    for (const match of source.matchAll(/[^\s\-/]+/g)) {
      const word = document.createRange()
      word.setStart(node, match.index)
      word.setEnd(node, match.index + match[0].length)
      const tops = new Set([...word.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)))
      if (tops.size > 1) brokenWords += 1
    }
    out.push({
      key: path(holder),
      text: text.slice(0, 60),
      box: box(rect),
      brokenWords,
      scroller,
      holder: box(holder.getBoundingClientRect()),
      holderVisible: style.overflowX === 'visible' && style.overflowY === 'visible',
      clippers,
      truncated,
      truncatedCuts,
    })
  }
  // Form fields: their placeholder or value is no text node, so measure the line against the content box.
  for (const field of document.querySelectorAll('input, textarea')) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) continue
    if (field instanceof HTMLInputElement && !['text', 'search', 'email', 'url', 'password', ''].includes(field.type)) continue
    const shown = field.value !== '' ? field.value : field.placeholder
    const s = getComputedStyle(field)
    if (shown.trim() === '' || s.visibility === 'hidden' || s.display === 'none') continue
    const rect = field.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) continue
    const content = field.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)
    const line = s.lineHeight === 'normal' ? parseFloat(s.fontSize) * 1.2 : parseFloat(s.lineHeight)
    out.push({
      key: path(field),
      text: shown.trim().slice(0, 60),
      box: box(rect),
      holder: box(rect),
      holderVisible: false,
      clippers: [],
      truncated: false,
      truncatedCuts: false,
      fieldShort: Math.max(0, line - content),
    })
  }
  return out
}

/**
 * For each overlapping pair, the key of the holder painted on top at the centre of the shared box: the first of the
 * two that the hit test meets. Null when an element with its own background is on top of both there, or when the
 * run on top is in a dialog, a sheet, a menu or a bar placed over the page (fixed, sticky or absolute) and the other
 * is not: the page under an open layer or a bar is behind it by design.
 */
function paintedOnTop(pairs: { a: string; b: string; x: number; y: number }[]): (string | null)[] {
  const byPath = (key: string): Element | null => {
    let el: Element = document.body
    for (const part of key.split('/')) {
      const child = el.children.item(Number(part.split(':')[1]))
      if (child === null) return null
      el = child
    }
    return el
  }
  return pairs.map(({ a, b, x, y }) => {
    const ea = byPath(a)
    const eb = byPath(b)
    if (ea === null || eb === null) return null
    const layer = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [aria-modal="true"]'
    // A bar placed over the page (fixed, sticky or absolute, as the tab bar is): the page scrolls under it by design.
    const pinned = (el: Element): Element | null => {
      for (let e: Element | null = el; e !== null; e = e.parentElement) {
        const p = getComputedStyle(e).position
        if (p === 'fixed' || p === 'sticky' || p === 'absolute') return e
      }
      return null
    }
    const onTop = (upper: Element, lower: Element, key: string): string | null => {
      const open = upper.closest(layer)
      if (open !== null && !open.contains(lower)) return null
      const bar = pinned(upper)
      return bar !== null && !bar.contains(lower) ? null : key
    }
    for (const hit of document.elementsFromPoint(x, y)) {
      if (ea === hit || ea.contains(hit) || hit.contains(ea)) return onTop(ea, eb, a)
      if (eb === hit || eb.contains(hit) || hit.contains(eb)) return onTop(eb, ea, b)
      const s = getComputedStyle(hit)
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent') return null
    }
    return null
  })
}

/** Puts the class of one text size on <html>, as the app does, and waits for the layout to settle. */
async function useSize(tab: Page, className: string | null): Promise<void> {
  await tab.evaluate((name) => {
    const root = document.documentElement
    root.classList.remove('text-default', 'text-large')
    if (name !== null) root.classList.add(name)
  }, className)
  await waitForAnimations(tab)
  await waitForLayout(tab)
}

if (values['skip-build'] !== true || !existsSync(join(storybookDir, 'index.json'))) {
  console.error('Building Storybook (pass --skip-build to reuse web/storybook-static)…')
  execFileSync('pnpm', ['--filter', '@bridge/web', 'build-storybook', '--quiet'], { cwd: repoRoot, stdio: 'inherit' })
}
const indexJson = readFileSync(join(storybookDir, 'index.json'), 'utf8')
const server = await serveStatic(storybookDir)
const browser = await chromium.launch({ args: ['--font-render-hinting=none'] })
const problems: (TextProblem & { state: string; size: string })[] = []
const errors: string[] = []
const counts: Record<string, SizeCounts> = {}
let checked = 0
try {
  for (const { page, state, layout } of states()) {
    const story = storyForState(page, state, indexJson)
    if (story === undefined) {
      errors.push(`${page}/${state}: no story`)
      continue
    }
    const context = await browser.newContext({
      viewport: windows[layout],
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    try {
      const tab = await context.newPage()
      tab.on('pageerror', (e) => errors.push(`${page}/${state}: ${e.message}`))
      await tab.goto(storyUrl(server.origin, story))
      await tab.waitForSelector('#storybook-root > *')
      await tab.evaluate(() => document.fonts.ready.then(() => undefined))
      let small: TextProblem[] = []
      const fresh: { default: TextProblem[]; large: TextProblem[] } = { default: [], large: [] }
      for (const [size, className] of sizes) {
        await useSize(tab, className)
        const measured = await tab.evaluate(measureText)
        const pairs = overlapPairs(measured)
        const onTop = await tab.evaluate(paintedOnTop, pairs.map((p) => ({ a: p.a.key, b: p.b.key, x: p.x, y: p.y })))
        const found = [...problemsOf(measured), ...overlapsOf(pairs, onTop)]
        if (size === 'small') small = found
        else {
          fresh[size] = newProblems(small, found)
          for (const p of fresh[size]) problems.push({ ...p, state: `${page}/${state}`, size })
        }
      }
      addCounts(counts, page, small, fresh)
      checked += 1
    } catch (error) {
      errors.push(`${page}/${state}: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
  await server.close()
}
const ok = problems.length === 0 && errors.length === 0 && checked > 0
console.log(JSON.stringify({ ok, checked, counts, problems, errors }))
process.exitCode = ok ? 0 : 1
