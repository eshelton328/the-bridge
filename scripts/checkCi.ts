#!/usr/bin/env node
// Fails when a step of `pnpm verify` has no `run: pnpm <step>` line in
// .github/workflows/ci.yml, so CI runs every check verify runs (as the
// library's check:ci does). Prints one JSON object; exits 1 on a gap.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (path: string) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8')
const pkg: unknown = JSON.parse(read('package.json'))
const verify =
  typeof pkg === 'object' &&
  pkg !== null &&
  'scripts' in pkg &&
  typeof pkg.scripts === 'object' &&
  pkg.scripts !== null &&
  'verify' in pkg.scripts
    ? pkg.scripts.verify
    : undefined
if (typeof verify !== 'string') {
  console.error('package.json has no verify script.')
  process.exit(1)
}
const steps = verify.split('&&').map((s) => s.trim().replace(/^pnpm /, ''))
const ci = read('.github/workflows/ci.yml')
const missing = steps.filter((s) => s !== 'check:ci' && !ci.includes(`run: pnpm ${s}\n`))
console.log(JSON.stringify({ ok: missing.length === 0, steps: steps.length, missing }))
if (missing.length)
  console.error('Add a `run: pnpm <step>` line for each missing step to a job in .github/workflows/ci.yml.')
process.exit(missing.length ? 1 : 0)
