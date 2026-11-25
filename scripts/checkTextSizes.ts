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
import { chromium, type BrowserContext, type Page } from 'playwright'
import { waitForAnimations, waitForLayout } from './fidelity/settle.ts'
import { serveStatic, storybookDir, storyForState, storyUrl } from './fidelity/storyServer.ts'
import { repoRoot } from './fidelity/references.ts'
import { isStateFile } from './genRegistry.ts'
import {
  addCounts,
  layoutOf,
  namedLayers,
  newProblems,
  overlapPairs,
  overlapsOf,
  problemsOf,
  type SizeCounts,
  type TextMeasure,
  type TextProblem,
  type TopRun,
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
    if (field instanceof HTMLInputElement && !['text', 'search', 'email', 'url', 'password', ''].includes(field.type))
      continue
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
 * For each overlapping pair, the run painted on top at the centre of the shared box (the first of the two that the
 * hit test meets; null when an element with its own background covers both there), the layer that holds it and not
 * the other run, and that layer's pointer-events (see TopRun). A named drag-time layer takes no pointer, so the hit
 * test would pass through it: while this runs, only those named layers take the hit.
 */
function paintedOnTop(args: {
  pairs: { a: string; b: string; x: number; y: number }[]
  named: Record<string, string>
}): TopRun[] {
  const { pairs, named } = args
  const byPath = (key: string): Element | null => {
    let el: Element = document.body
    for (const part of key.split('/')) {
      const child = el.children.item(Number(part.split(':')[1]))
      if (child === null) return null
      el = child
    }
    return el
  }
  const drag = Object.entries(named).filter(([name]) => name !== 'tabBar')
  const pointerOf = new Map<Element, string>()
  for (const [, selector] of drag)
    for (const el of document.querySelectorAll(selector)) pointerOf.set(el, getComputedStyle(el).pointerEvents)
  const hits = document.createElement('style')
  hits.textContent = `${drag.map(([, selector]) => selector).join(', ')} { pointer-events: auto !important; }`
  document.head.append(hits)
  const open = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [aria-modal="true"]'
  const layerOf = (upper: Element, lower: Element): Pick<TopRun, 'layer' | 'pointerEvents'> => {
    const dialog = upper.closest(open)
    if (dialog !== null && !dialog.contains(lower)) return { layer: 'open', pointerEvents: 'auto' }
    for (const [name, selector] of Object.entries(named)) {
      const part = upper.closest(selector)
      if (part === null || part.contains(lower)) continue
      if (name === 'tabBar' || name === 'resizeReadout' || name === 'paneDropZone' || name === 'sidebarDrag')
        return { layer: name, pointerEvents: pointerOf.get(part) ?? getComputedStyle(part).pointerEvents }
    }
    for (let e: Element | null = upper; e !== null; e = e.parentElement) {
      if (e.contains(lower)) break
      const p = getComputedStyle(e).position
      if (p === 'fixed' || p === 'sticky') return { layer: 'pinned', pointerEvents: 'auto' }
      if (p === 'absolute') return { layer: 'other', pointerEvents: getComputedStyle(e).pointerEvents }
    }
    return { layer: null, pointerEvents: 'auto' }
  }
  const out = pairs.map(({ a, b, x, y }): TopRun => {
    const ea = byPath(a)
    const eb = byPath(b)
    const none: TopRun = { key: null, layer: null, pointerEvents: 'auto' }
    if (ea === null || eb === null) return none
    for (const hit of document.elementsFromPoint(x, y)) {
      if (ea === hit || ea.contains(hit) || hit.contains(ea)) return { key: a, ...layerOf(ea, eb) }
      if (eb === hit || eb.contains(hit) || hit.contains(eb)) return { key: b, ...layerOf(eb, ea) }
      const s = getComputedStyle(hit)
      if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent') return none
    }
    return none
  })
  hits.remove()
  return out
}

/**
 * Opens the story at one text size, as the app does: index.html's text-size script puts the class on <html> before
 * the first paint (d-122), so every part, an autoresize field too, renders at that size from the start. A class
 * swapped on a page already drawn leaves an autoresize field at its old height for a while, which no user sees.
 */
async function openAt(
  context: BrowserContext,
  url: string,
  className: string | null,
  onError: (message: string) => void,
): Promise<Page> {
  const tab = await context.newPage()
  tab.on('pageerror', (e) => {
    onError(e.message)
  })
  await tab.addInitScript((name) => {
    // The init script runs before <html> exists: set the class as soon as the parser adds it.
    const apply = (): boolean => {
      const root = document.querySelector('html')
      if (root === null) return false
      root.classList.remove('text-default', 'text-large')
      if (name !== null) root.classList.add(name)
      return true
    }
    if (apply()) return
    const watch = new MutationObserver(() => {
      if (apply()) watch.disconnect()
    })
    watch.observe(document, { childList: true })
  }, className)
  await tab.goto(url)
  await tab.waitForSelector('#storybook-root > *')
  await tab.evaluate(() => document.fonts.ready.then(() => undefined))
  await waitForAnimations(tab)
  await waitForLayout(tab)
  return tab
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
      let small: TextProblem[] = []
      const fresh: { default: TextProblem[]; large: TextProblem[] } = { default: [], large: [] }
      for (const [size, className] of sizes) {
        const tab = await openAt(context, storyUrl(server.origin, story), className, (message) => {
          errors.push(`${page}/${state} (${size}): ${message}`)
        })
        const measured = await tab.evaluate(measureText)
        const pairs = overlapPairs(measured)
        const tops = await tab.evaluate(paintedOnTop, {
          pairs: pairs.map((p) => ({ a: p.a.key, b: p.b.key, x: p.x, y: p.y })),
          named: namedLayers,
        })
        const found = [...problemsOf(measured), ...overlapsOf(pairs, tops)]
        await tab.close()
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
