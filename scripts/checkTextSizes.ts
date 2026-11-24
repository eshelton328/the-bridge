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
      if (scrolls) break
      if ([s.overflowX, s.overflowY].some((o) => o === 'hidden' || o === 'clip'))
        clippers.push(box(a.getBoundingClientRect()))
    }
    out.push({
      key: path(holder),
      text: text.slice(0, 60),
      box: box(rect),
      holder: box(holder.getBoundingClientRect()),
      holderVisible: style.overflowX === 'visible' && style.overflowY === 'visible',
      clippers,
      truncated,
      truncatedCuts,
    })
  }
  return out
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
        const found = problemsOf(await tab.evaluate(measureText))
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
