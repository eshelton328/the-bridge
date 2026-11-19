#!/usr/bin/env node
// `pnpm fidelity <page> [frameId…]`: step 4 of the fidelity loop. For each
// frame it renders the state's Storybook story in Chromium at the frame's
// size, runs the text, position and rule checks against
// references/<page>/<frameId>/, and writes reports/fidelity/<page>/:
//   <frameId>.json            the three results
//   <frameId>.render.png      the render the checks measured (below the status bar on a tablet or phone)
//   <frameId>.sideBySide.png  Figma left, render right, for the reviewer
// With no frame ids it checks every frame that a state file lists.
// Exits 1 when any check fails. Flags: --skip-build reuses
// web/storybook-static; --tolerance <px> overrides frame.json;
// --checks text,rules makes only those checks decide the result (CI runs
// text and rules); the report still holds all three.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { checkPosition, renderViewport } from './checkPosition.ts'
import { checkRules } from './checkRules.ts'
import { checkText } from './checkText.ts'
import { normaliseFrameId } from './figmaMetadata.ts'
import { collectPageScript, type PageMeasure } from './inPage.ts'
import {
  frameDir,
  fidelityChecks,
  parseChecks,
  parseTolerance,
  readExceptions,
  type FidelityCheck,
  readFrameRef,
  referencesDir,
  repoRoot,
  reportsDir,
} from './references.ts'
import { composeSideBySide } from './sideBySide.ts'
import { serveStatic, stateForFrame, storybookDir, storyForState } from './storyServer.ts'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'skip-build': { type: 'boolean', default: false },
    tolerance: { type: 'string' },
    checks: { type: 'string' },
  },
})
const [page, ...requested] = positionals
if (page === undefined || !existsSync(join(referencesDir, page))) {
  console.error('Usage: pnpm fidelity <page> [frameId…] [--skip-build] [--tolerance <px>] [--checks text,rules]')
  console.error(`Pages with references: ${existsSync(referencesDir) ? readdirSync(referencesDir).join(', ') : 'none'}`)
  process.exit(2)
}
let tolerance: number | undefined
let checks: FidelityCheck[] = [...fidelityChecks]
try {
  tolerance = values.tolerance === undefined ? undefined : parseTolerance(values.tolerance, '--tolerance')
  if (values.checks !== undefined) checks = parseChecks(values.checks, '--checks')
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(2)
}

const allFrames = readdirSync(join(referencesDir, page)).filter((d) =>
  existsSync(join(frameDir(page, d), 'frame.json')),
)
const frameIds =
  requested.length > 0
    ? requested.map(normaliseFrameId)
    : allFrames.filter((id) => stateForFrame(page, readFrameRef(page, id).code) !== undefined)

if (!values['skip-build'] || !existsSync(join(storybookDir, 'index.json'))) {
  console.error('Building Storybook (pass --skip-build to reuse web/storybook-static)…')
  execFileSync('pnpm', ['--filter', '@bridge/web', 'build-storybook', '--quiet'], { cwd: repoRoot, stdio: 'inherit' })
}
const indexJson = readFileSync(join(storybookDir, 'index.json'), 'utf8')
const outDir = join(reportsDir, page)
mkdirSync(outDir, { recursive: true })

const server = await serveStatic(storybookDir)
// Chromium on Linux hints glyphs with FreeType, which makes text a few px
// wider than on macOS, where the Figma frames were checked; with hinting
// off, text widths in CI match a Mac's more closely.
const browser = await chromium.launch({ args: ['--font-render-hinting=none'] })
const summary: {
  frameId: string
  ok: boolean
  gate: boolean
  text?: boolean
  position?: boolean
  rules?: boolean
  error?: string
}[] = []

try {
  for (const frameId of frameIds) {
    try {
      summary.push(await runFrame(browser, server.origin, frameId))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      writeFileSync(
        join(outDir, `${frameId}.json`),
        `${JSON.stringify({ frameId, ok: false, error: message }, null, 2)}\n`,
      )
      summary.push({ frameId, ok: false, gate: false, error: message })
    }
  }
} finally {
  await browser.close()
  await server.close()
}

// ok: all three checks pass; gate: the checks of --checks pass (all three
// without it). The exit code follows the gate.
const ok = summary.length > 0 && summary.every((s) => s.ok)
const gate = summary.length > 0 && summary.every((s) => s.gate)
console.log(JSON.stringify({ ok, gate, page, checks, reports: outDir, frames: summary }))
process.exit(gate ? 0 : 1)

async function runFrame(b: Browser, origin: string, frameId: string) {
  if (page === undefined) throw new Error('no page')
  const ref = readFrameRef(page, frameId)
  const exceptions = readExceptions(page, frameId)
  const state = stateForFrame(page, ref.code)
  if (state === undefined) throw new Error(`No state file in web/src/pages/${page}/states lists frame ${ref.code}`)
  const story = storyForState(page, state, indexJson)
  if (story === undefined) throw new Error(`No story renders ${page}States.${state}; run pnpm check:states`)

  // All three checks measure one render. On a tablet or phone it is below
  // Figma's status bar, which the app does not draw (d-089, d-102): a
  // viewport the bar's height shorter, whose render the side-by-side draws
  // that much lower. A desktop frame renders at its full size.
  const viewport = renderViewport(ref)
  const { statusBar } = viewport
  const url = `${origin}/iframe.html?id=${story}&viewMode=story`
  const errors: string[] = []
  const shown = await openStory(b, url, viewport.w, viewport.h, errors)
  const measured = await shown.tab.evaluate<PageMeasure>(collectPageScript('#storybook-root'))
  const renderPng = join(outDir, `${frameId}.render.png`)
  await shown.tab.screenshot({ path: renderPng })

  const figmaPng = join(frameDir(page, frameId), 'frame.png')
  const sideBySide = join(outDir, `${frameId}.sideBySide.png`)
  await composeSideBySide(shown.tab, figmaPng, renderPng, sideBySide, ref.w, ref.h, statusBar)
  await shown.context.close()

  const text = checkText(ref, exceptions, measured)
  const position = checkPosition(ref, exceptions, measured.figmaBoxes, tolerance ?? ref.tolerance)
  const rules = checkRules(ref, exceptions, measured)
  const results = { text: text.ok, position: position.ok, rules: rules.ok }
  // The report's ok stays the result of all three checks, which
  // fidelity:check-build reads; gate is the result of the checks picked.
  const ok = fidelityChecks.every((c) => results[c]) && errors.length === 0
  const gate = checks.every((c) => results[c]) && errors.length === 0
  const report = {
    frameId,
    name: ref.name,
    node: ref.node,
    state: `${page}/${state}`,
    story,
    viewport: { w: viewport.w, h: viewport.h },
    checks,
    ok,
    gate,
    pageErrors: errors,
    text,
    position,
    rules,
    images: { figma: figmaPng, render: renderPng, sideBySide },
    note: join(frameDir(page, frameId), 'note.txt'),
  }
  writeFileSync(join(outDir, `${frameId}.json`), `${JSON.stringify(report, null, 2)}\n`)
  return { frameId, ok, gate, text: text.ok, position: position.ok, rules: rules.ok }
}

/** Opens the story in a new context of `w` × `h` and waits until it has drawn; page errors go to `errors`. */
async function openStory(
  b: Browser,
  url: string,
  w: number,
  h: number,
  errors: string[],
): Promise<{ context: BrowserContext; tab: Page }> {
  const context = await b.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  })
  const tab = await context.newPage()
  tab.on('pageerror', (e) => errors.push(e.message))
  await tab.goto(url)
  await tab.waitForSelector('#storybook-root > *')
  await tab.evaluate(() => document.fonts.ready.then(() => undefined))
  await tab.waitForLoadState('networkidle')
  if (process.env.FIDELITY_DEBUG) {
    const info = await tab.evaluate(() => {
      const out: unknown[] = [document.getAnimations().map((a) => [a.playState, a.currentTime])]
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = n.textContent ?? ''
        if (!/^(Suggested prompt|Filter|Add folder|Done|Copy)$/.test(t.trim())) continue
        const chain: unknown[] = []
        for (let el = n.parentElement; el; el = el.parentElement) {
          const s = getComputedStyle(el)
          chain.push([el.tagName, el.className.toString().slice(0, 40), s.opacity, s.visibility, s.display, s.contentVisibility, el.getAttribute('data-state'), el.hidden, el.checkVisibility({ opacityProperty: true, visibilityProperty: true })])
        }
        const r = n.parentElement?.getBoundingClientRect()
        out.push({ t, r: r && [r.x, r.y, r.width, r.height], chain })
      }
      return out
    })
    console.error('FIDDEBUG', JSON.stringify(info))
  }
  return { context, tab }
}
