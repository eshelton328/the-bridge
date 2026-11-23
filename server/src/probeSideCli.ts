// `pnpm probe:side --real [--root <folder>]`: runs the side run probe (probeSide.ts) with a real, billed `claude`,
// in a new folder under the root (an already trusted folder; ~/ncc-1701 when not given). It prints the claude
// version, the sessions it made (kept on record) and pass or the failures.
import { homedir } from 'node:os'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { probeSide } from './probeSide.ts'

const { values } = parseArgs({ options: { real: { type: 'boolean' }, root: { type: 'string' } } })
if (values.real !== true) {
  process.stderr.write('usage: pnpm probe:side --real [--root <trusted folder>]\nIt runs a real, billed claude.\n')
  process.exit(2)
}
const home = homedir()
const env = Object.fromEntries(
  ['PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'LANG'].flatMap((key) => {
    const value = process.env[key]
    return value === undefined ? [] : [[key, value]]
  }),
)
const report = await probeSide(values.root ?? join(home, 'ncc-1701'), home, env)
process.stdout.write(`${JSON.stringify({ ...report, pass: report.failures.length === 0 }, null, 2)}\n`)
process.exit(report.failures.length === 0 ? 0 : 1)
