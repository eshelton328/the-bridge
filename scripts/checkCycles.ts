#!/usr/bin/env node
// Fails when the files of web/src or shared/src import each other in a
// cycle (ported from component-library-1701, brain decision d-071). The
// layer lint allows a layer to import its own folder, so `a -> b -> a`
// inside one layer passes the lint; this check does not. Type-only imports
// do not count, because TypeScript erases them. A dynamic import or a glob
// that the check cannot follow fails it too.
//   node scripts/checkCycles.ts
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { findCycles, importGraph, sourceFiles } from './cyclesLib.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const config = ts.getParsedCommandLineOfConfigFile(
  join(root, 'web', 'tsconfig.json'),
  {},
  { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined },
)
const files = [...sourceFiles(join(root, 'web', 'src')), ...sourceFiles(join(root, 'shared', 'src'))]
const { graph, unsupported } = importGraph(files, config?.options ?? {}, root)
const cycles = findCycles(graph).map((c) => c.map((f) => relative(root, f)))
const edges = [...graph.values()].reduce((n, t) => n + t.length, 0)
const ok = cycles.length === 0 && unsupported.length === 0
console.log(
  JSON.stringify({ ok, files: graph.size, edges, cycles, unsupported: unsupported.map((u) => relative(root, u)) }),
)
if (cycles.length)
  console.error('Break each cycle: move the shared code into a file that both import, or pass it in as a prop.')
if (unsupported.length)
  console.error(
    'The check cannot follow these imports: name the module in a string, or use a glob with only patterns and `eager`.',
  )
process.exit(ok ? 0 : 1)
