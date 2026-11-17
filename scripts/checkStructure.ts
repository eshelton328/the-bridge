#!/usr/bin/env node
// Fails when web/src does not have the shape web/src/structure.ts and
// web/AGENTS.md describe:
// - each folder in web/src is a layer, and each page folder is a listed page;
// - a page folder has index.ts, types.ts, <Page>Page.tsx, AGENTS.md,
//   screens/ and states/index.ts;
// - a component file (.tsx, not a route, story or test) exports a
//   component with its own name, such as `export function InboxScreen`;
// - each store file (`*Store.ts`) has a test beside it (rule R12).
// Prints one JSON object; exits 1 on any problem.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { layerPaths, pages } from '../web/src/structure.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const src = join(root, 'web', 'src')
const problems: string[] = []
const rel = (p: string) => relative(root, p)
const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const topLayers = new Set(
  Object.values(layerPaths)
    .map((p) => p.split('/')[2])
    .filter((p): p is string => p !== undefined),
)
for (const d of readdirSync(src, { withFileTypes: true })) {
  if (d.isDirectory() && !topLayers.has(d.name))
    problems.push(`web/src/${d.name}/ is not a layer in web/src/structure.ts`)
}

const knownPages: readonly string[] = pages
const pagesDir = join(src, 'pages')
for (const d of existsSync(pagesDir) ? readdirSync(pagesDir, { withFileTypes: true }) : []) {
  if (!d.isDirectory()) continue
  const page = d.name
  if (!knownPages.includes(page))
    problems.push(`web/src/pages/${page}/ is not a page in structure.ts (${knownPages.join(', ')})`)
  for (const need of [
    'index.ts',
    'types.ts',
    `${pascal(page)}Page.tsx`,
    'AGENTS.md',
    'CLAUDE.md',
    'screens',
    join('states', 'index.ts'),
  ]) {
    if (!existsSync(join(pagesDir, page, need))) problems.push(`web/src/pages/${page}/ has no ${need}`)
  }
}

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
  )

const files = walk(src)
for (const file of files) {
  const name = basename(file)
  if (name.endsWith('.tsx') && !file.includes(join('src', 'routes')) && !/\.(stories|test)\.tsx$/.test(name)) {
    const component = name.slice(0, -4)
    const text = readFileSync(file, 'utf8')
    if (!new RegExp(`export (function|const) ${component}\\b`).test(text))
      problems.push(`${rel(file)} must export a component named ${component}`)
  }
  if (/Store\.tsx?$/.test(name) && name !== 'createAppStore.ts') {
    const test = file.replace(/\.tsx?$/, '.test.ts')
    if (!existsSync(test))
      problems.push(`${rel(file)} has no test beside it (${basename(test)}); test its actions through getState()`)
  }
}

console.log(JSON.stringify({ ok: problems.length === 0, files: files.length, problems }))
process.exit(problems.length ? 1 : 0)
