#!/usr/bin/env node
// `pnpm fidelity <page> [frameId…]`: step 4 of the fidelity loop. For each
// frame it renders the state's Storybook story in Chromium at the frame's
// size, runs the text, position and rule checks against
// references/<page>/<frameId>/, and writes reports/fidelity/<page>/:
//   <frameId>.json            the three results
//   <frameId>.render.png      the render
//   <frameId>.sideBySide.png  Figma left, render right, for the reviewer
// With no frame ids it checks every frame that a state file lists.
// Exits 1 when any check fails. Flags: --skip-build reuses
// web/storybook-static; --tolerance <px> overrides frame.json.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { chromium, type Browser } from 'playwright'
import { checkPosition } from './checkPosition.ts'
import { checkRules } from './checkRules.ts'
import { checkText } from './checkText.ts'
import { normaliseFrameId } from './figmaMetadata.ts'
import { collectPageScript, type PageMeasure } from './inPage.ts'
import {
  frameDir,
  parseTolerance,
  readExceptions,
  readFrameRef,
  referencesDir,
  repoRoot,
  reportsDir,
} from './references.ts'
import { composeSideBySide } from './sideBySide.ts'
import { serveStatic, stateForFrame, storybookDir, storyForState } from './storyServer.ts'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { 'skip-build': { type: 'boolean', default: false }, tolerance: { type: 'string' } },
})
const [page, ...requested] = positionals
if (page === undefined || !existsSync(join(referencesDir, page))) {
  console.error('Usage: pnpm fidelity <page> [frameId…] [--skip-build] [--tolerance <px>]')
  console.error(`Pages with references: ${existsSync(referencesDir) ? readdirSync(referencesDir).join(', ') : 'none'}`)
  process.exit(2)
}
let tolerance: number | undefined
try {
  tolerance = values.tolerance === undefined ? undefined : parseTolerance(values.tolerance, '--tolerance')
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
const browser = await chromium.launch()
const summary: { frameId: string; ok: boolean; text?: boolean; position?: boolean; rules?: boolean; error?: string }[] =
  []

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
      summary.push({ frameId, ok: false, error: message })
    }
  }
} finally {
  await browser.close()
  await server.close()
}

const ok = summary.length > 0 && summary.every((s) => s.ok)
console.log(JSON.stringify({ ok, page, reports: outDir, frames: summary }))
process.exit(ok ? 0 : 1)

async function runFrame(b: Browser, origin: string, frameId: string) {
  if (page === undefined) throw new Error('no page')
  const ref = readFrameRef(page, frameId)
  const exceptions = readExceptions(page, frameId)
  const state = stateForFrame(page, ref.code)
  if (state === undefined) throw new Error(`No state file in web/src/pages/${page}/states lists frame ${ref.code}`)
  const story = storyForState(page, state, indexJson)
  if (story === undefined) throw new Error(`No story renders ${page}States.${state}; run pnpm check:states`)

  const context = await b.newContext({
    viewport: { width: ref.w, height: ref.h },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    reducedMotion: 'reduce',
  })
  const tab = await context.newPage()
  const errors: string[] = []
  tab.on('pageerror', (e) => errors.push(e.message))
  await tab.goto(`${origin}/iframe.html?id=${story}&viewMode=story`)
  await tab.waitForSelector('#storybook-root > *')
  await tab.evaluate(() => document.fonts.ready.then(() => undefined))
  await tab.waitForLoadState('networkidle')
  const measured = await tab.evaluate<PageMeasure>(collectPageScript('#storybook-root'))
  const renderPng = join(outDir, `${frameId}.render.png`)
  await tab.screenshot({ path: renderPng })

  const figmaPng = join(frameDir(page, frameId), 'frame.png')
  const sideBySide = join(outDir, `${frameId}.sideBySide.png`)
  await composeSideBySide(tab, figmaPng, renderPng, sideBySide, ref.w, ref.h)
  await context.close()

  const text = checkText(ref, exceptions, measured)
  const position = checkPosition(ref, exceptions, measured.figmaBoxes, tolerance ?? ref.tolerance)
  const rules = checkRules(ref, exceptions, measured)
  const ok = text.ok && position.ok && rules.ok && errors.length === 0
  const report = {
    frameId,
    name: ref.name,
    node: ref.node,
    state: `${page}/${state}`,
    story,
    viewport: { w: ref.w, h: ref.h },
    ok,
    pageErrors: errors,
    text,
    position,
    rules,
    images: { figma: figmaPng, render: renderPng, sideBySide },
    note: join(frameDir(page, frameId), 'note.txt'),
  }
  writeFileSync(join(outDir, `${frameId}.json`), `${JSON.stringify(report, null, 2)}\n`)
  return { frameId, ok, text: text.ok, position: position.ok, rules: rules.ok }
}
