#!/usr/bin/env node
// Fails when the files of web/src or shared/src import each other in a
// cycle (ported from component-library-1701, brain decision d-071). The
// layer lint allows a layer to import its own folder, so `a -> b -> a`
// inside one layer passes the lint; this check does not. Type-only imports
// do not count, because TypeScript erases them. A dynamic import or a glob
// that the check cannot follow fails it too.
//   node scripts/checkCycles.ts
import { fileURLToPath } from 'node:url'
import { checkRepo } from './cyclesLib.ts'

const { ok, files, edges, cycles, unsupported } = checkRepo(fileURLToPath(new URL('..', import.meta.url)))
console.log(JSON.stringify({ ok, files, edges, cycles, unsupported }))
if (cycles.length)
  console.error('Break each cycle: move the shared code into a file that both import, or pass it in as a prop.')
if (unsupported.length)
  console.error(
    'The check cannot follow these imports: name the module in a string, or use a glob with only patterns and `eager`.',
  )
process.exit(ok ? 0 : 1)
