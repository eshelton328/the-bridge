#!/usr/bin/env node
// `pnpm fidelity <page> [frameId…]`: step 4 of the fidelity loop. For each
// frame it renders the state's Storybook story in Chromium at the frame's
// size, runs the text, position and rule checks against
// references/<page>/<frameId>/, and writes reports/fidelity/<page>/:
//   <frameId>.json            the three results
//   <frameId>.render.png      the render the checks measured (below the status bar on a tablet or phone)
//   <frameId>.sideBySide.png  Figma left, render right, for the reviewer
// With no frame ids it checks every frame that a state file lists.
// A page with no Figma frame has PNG references (reference.json, d-119):
// they run the rule check and pass only with a fidelity-reviewer record of
// the render with no P1 or P2 finding (--review <file>, one frame); the
// report adds a pixel diff and its picture (<frameId>.diff.png) for the
// reviewer. Text, position and icons need Figma layers, so naming one in
// --checks fails the frame.
// Exits 1 when any check fails. Flags: --skip-build reuses
// web/storybook-static; --tolerance <px> overrides frame.json;
// --checks text,rules makes only those checks decide the result (CI runs
// text and rules); the report still holds all three.
// A PNG frame that passes with --review saves the reviewer's record as
// references/<page>/<frameId>/review.json, sealed with the hash of its
// inputs (reviewSeal.ts); commit it, as `pnpm check:reviews` (CI) fails a
// built PNG frame without a current one.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { checkPosition, renderViewport } from './checkPosition.ts'
import { checkRules } from './checkRules.ts'
import { checkText } from './checkText.ts'
import { normaliseFrameId } from './figmaMetadata.ts'
import { collectPageScript, type PageMeasure } from './inPage.ts'
import { waitForAnimations, waitForLayout } from './settle.ts'
import {
  checksForPng,
  frameDir,
  frameKind,
  fidelityChecks,
  gateResults,
  parseChecks,
  parseTolerance,
  readExceptions,
  type GateCheck,
  readFrameRef,
  readPngRef,
  referencesDir,
  repoRoot,
  reportsDir,
} from './references.ts'
import { comparePngs } from './pixelDiff.ts'
import { parseReview, pngLabel, pngReviewGate } from './pngReview.ts'
import { inputsDigest, reviewFileName, reviewInputs, sealReview } from './reviewSeal.ts'
import { composeSideBySide } from './sideBySide.ts'
import { serveStatic, stateForFrame, storybookDir, storyForState, storyUrl } from './storyServer.ts'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'skip-build': { type: 'boolean', default: false },
    tolerance: { type: 'string' },
    checks: { type: 'string' },
    review: { type: 'string' },
  },
})
const [page, ...requested] = positionals
if (page === undefined || !existsSync(join(referencesDir, page))) {
  console.error(
    'Usage: pnpm fidelity <page> [frameId…] [--skip-build] [--tolerance <px>] [--checks text,rules[,icons]] [--review <file>]',
  )
  console.error(`Pages with references: ${existsSync(referencesDir) ? readdirSync(referencesDir).join(', ') : 'none'}`)
  process.exit(2)
}
let tolerance: number | undefined
let checks: GateCheck[] = [...fidelityChecks]
let picked: GateCheck[] | undefined
try {
  tolerance = values.tolerance === undefined ? undefined : parseTolerance(values.tolerance, '--tolerance')
  if (values.checks !== undefined) checks = picked = parseChecks(values.checks, '--checks')
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(2)
}

const allFrames = readdirSync(join(referencesDir, page)).filter((d) => frameKind(frameDir(page, d)) !== undefined)
const codeOf = (id: string) =>
  frameKind(frameDir(page, id)) === 'png' ? readPngRef(page, id).code : readFrameRef(page, id).code
const frameIds =
  requested.length > 0
    ? requested.map(normaliseFrameId)
    : allFrames.filter((id) => stateForFrame(page, codeOf(id)) !== undefined)
// A reviewer record is for one frame's render, so --review takes exactly one frame id.
if (values.review !== undefined && requested.length !== 1) {
  console.error('--review <file> takes one frame id: pnpm fidelity <page> <frameId> --review <file>')
  process.exit(2)
}
const reviewFile = values.review === undefined ? undefined : resolve(values.review)

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
  review?: boolean
  label?: string
  error?: string
}[] = []

try {
  for (const frameId of frameIds) {
    // A PNG frame carries its label in the report and the summary, also when it stops with an error.
    const png = existsSync(join(frameDir(page, frameId), 'reference.json'))
    const label = png ? { label: pngLabel } : {}
    try {
      summary.push(
        frameKind(frameDir(page, frameId)) === 'png'
          ? await runPngFrame(browser, server.origin, frameId)
          : await runFrame(browser, server.origin, frameId),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      writeFileSync(
        join(outDir, `${frameId}.json`),
        `${JSON.stringify({ frameId, ...label, ok: false, error: message }, null, 2)}\n`,
      )
      summary.push({ frameId, ...label, ok: false, gate: false, error: message })
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
  if (frameKind(frameDir(page, frameId)) === undefined)
    throw new Error(`references/${page}/${frameId} has no frame.json or reference.json`)
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
  const url = storyUrl(origin, story)
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
  const position = checkPosition(ref, exceptions, measured.figmaBoxes, tolerance ?? ref.tolerance, measured.iconBoxes)
  const rules = checkRules(ref, exceptions, measured)
  const results = gateResults({ text, position, rules })
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

/**
 * A frame with a PNG reference (reference.json, d-119): the rule check
 * decides it, as no Figma layers exist for the text, position and icon
 * checks. The report names those as not run, never as passed, and adds the
 * pixel diff of the render against frame.png for the reviewer.
 */
async function runPngFrame(b: Browser, origin: string, frameId: string) {
  if (page === undefined) throw new Error('no page')
  const ref = readPngRef(page, frameId)
  const pngGate = checksForPng(picked)
  const exceptions = readExceptions(page, frameId)
  const state = stateForFrame(page, ref.code)
  if (state === undefined) throw new Error(`No state file in web/src/pages/${page}/states lists frame ${ref.code}`)
  const story = storyForState(page, state, indexJson)
  if (story === undefined) throw new Error(`No story renders ${page}States.${state}; run pnpm check:states`)

  // A PNG reference has no status bar layer, so the render is the frame's full size.
  const flat = { ...ref, layers: [], exclude: [] }
  // The story draws the reference's mode, as the browser reports it.
  const url = storyUrl(origin, story, ref.mode)
  const errors: string[] = []
  const renderPng = join(outDir, `${frameId}.render.png`)
  // The render the reviewer saw: the one the last run left, read before this run replaces it.
  const reviewed = reviewFile !== undefined && existsSync(renderPng) ? readFileSync(renderPng) : undefined
  const reviewData: unknown = reviewFile === undefined ? undefined : JSON.parse(readFileSync(reviewFile, 'utf8'))
  const review = reviewFile === undefined ? undefined : parseReview(reviewData, reviewFile)
  const shown = await openStory(b, url, ref.w, ref.h, errors, ref.mode)
  const measured = await shown.tab.evaluate<PageMeasure>(collectPageScript('#storybook-root'))
  await shown.tab.screenshot({ path: renderPng })
  const sameRender = reviewed?.equals(readFileSync(renderPng)) === true

  const referencePng = join(frameDir(page, frameId), 'frame.png')
  const sideBySide = join(outDir, `${frameId}.sideBySide.png`)
  const diffPng = join(outDir, `${frameId}.diff.png`)
  await composeSideBySide(shown.tab, referencePng, renderPng, sideBySide, ref.w, ref.h, 0, 'Reference')
  const pixels = await comparePngs(shown.tab, referencePng, renderPng, diffPng, ref.w, ref.h)
  await shown.context.close()

  const rules = checkRules(flat, exceptions, measured)
  const reviewGate = pngReviewGate(review, sameRender)
  // checksForPng allows only the rule check, and the reviewer's gate always applies, so the gate is the frame's result.
  const ok = rules.ok && reviewGate.ok && errors.length === 0
  const gate = ok
  // A passing review is committed beside the reference, sealed with the hash of what it saw.
  const sealed = ok && reviewFile !== undefined ? join(frameDir(page, frameId), reviewFileName) : undefined
  if (sealed !== undefined) {
    const inputs = reviewInputs(repoRoot, page, frameId)
    const seal = sealReview(frameId, inputsDigest(inputs.files, inputs.library), inputs.library, reviewData)
    writeFileSync(sealed, `${JSON.stringify(seal, null, 2)}\n`)
  }
  const report = {
    frameId,
    name: ref.name,
    label: pngLabel,
    reference: 'png',
    source: ref.source,
    state: `${page}/${state}`,
    story,
    viewport: { w: ref.w, h: ref.h },
    mode: ref.mode,
    checks: pngGate,
    notRun: { checks: ['text', 'position', 'icons'], reason: 'a PNG reference has no Figma layers' },
    ok,
    gate,
    pageErrors: errors,
    rules,
    review: { ...reviewGate, file: reviewFile ?? null, sealed: sealed ?? null },
    pixels,
    images: { reference: referencePng, render: renderPng, sideBySide, diff: diffPng },
    note: join(frameDir(page, frameId), 'note.txt'),
  }
  writeFileSync(join(outDir, `${frameId}.json`), `${JSON.stringify(report, null, 2)}\n`)
  return { frameId, label: pngLabel, ok, gate, rules: rules.ok, review: reviewGate.ok }
}

/**
 * Opens the story in a new context of `w` × `h`, with the browser in the
 * colour scheme `mode`, and waits until it has drawn; page errors go to
 * `errors`.
 */
async function openStory(
  b: Browser,
  url: string,
  w: number,
  h: number,
  errors: string[],
  mode: 'light' | 'dark' = 'dark',
): Promise<{ context: BrowserContext; tab: Page }> {
  const context = await b.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    colorScheme: mode,
    reducedMotion: 'reduce',
  })
  const tab = await context.newPage()
  tab.on('pageerror', (e) => errors.push(e.message))
  await tab.goto(url)
  await tab.waitForSelector('#storybook-root > *')
  await tab.evaluate(() => document.fonts.ready.then(() => undefined))
  await tab.waitForLoadState('networkidle')
  await waitForAnimations(tab)
  await waitForLayout(tab)
  return { context, tab }
}
