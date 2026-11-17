#!/usr/bin/env node
// Writes web/src/app/routeTree.gen.ts from the route files in
// web/src/routes, with the settings in web/tsr.config.json; the Vite plugin
// does the same while `pnpm dev` runs. The tree is committed, because the
// app runs from it (TanStack Router FAQ).
//   node scripts/genRoutes.ts          write the tree
//   node scripts/genRoutes.ts --check  fail when the committed tree is not current
// The check generates into a copy of the routes in a temporary folder, so
// it never writes to the repository.
import { Generator, getConfig } from '@tanstack/router-generator'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const web = fileURLToPath(new URL('../web/', import.meta.url))
const check = process.argv.includes('--check')
const config = getConfig({ disableLogging: true }, web)
const treeRel = relative(web, config.generatedRouteTree)
const routesRel = relative(web, config.routesDirectory)

async function generate(root: string): Promise<string> {
  const generator = new Generator({ config: getConfig({ disableLogging: true }, root), root })
  await generator.run()
  return readFileSync(join(root, treeRel), 'utf8')
}

if (!check) {
  await generate(web)
  console.log(JSON.stringify({ ok: true, wrote: `web/${treeRel}` }))
} else {
  const tmp = mkdtempSync(join(tmpdir(), 'bridge-routes-'))
  try {
    cpSync(join(web, 'tsr.config.json'), join(tmp, 'tsr.config.json'))
    cpSync(join(web, routesRel), join(tmp, routesRel), { recursive: true })
    const committed = existsSync(config.generatedRouteTree) ? readFileSync(config.generatedRouteTree, 'utf8') : ''
    mkdirSync(dirname(join(tmp, treeRel)), { recursive: true })
    const fresh = await generate(tmp)
    const ok = fresh === committed
    console.log(JSON.stringify({ ok, file: `web/${treeRel}` }))
    if (!ok) console.error('The route tree is not current. Run `pnpm gen:routes` and commit the result.')
    process.exitCode = ok ? 0 : 1
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}
