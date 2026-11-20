// `pnpm logs [--request <id>] [--level <level>] [--since <15m|2h|ISO>]`:
// prints the server's log lines that match, from BRIDGE_LOG_DIR or --dir.
import { parseArgs } from 'node:util'
import { logLevels } from './logger.ts'
import { formatEntry, readLogs, sinceOf } from './logs.ts'

const { values } = parseArgs({
  options: {
    dir: { type: 'string' },
    request: { type: 'string' },
    level: { type: 'string' },
    since: { type: 'string' },
  },
})
const dir = values.dir ?? process.env.BRIDGE_LOG_DIR
const level = logLevels.find((l) => l === values.level)
const since = values.since === undefined ? undefined : sinceOf(values.since, new Date())
if (dir === undefined || (values.level !== undefined && !level) || (values.since !== undefined && !since)) {
  process.stderr.write(
    `usage: pnpm logs [--dir <dir>] [--request <id>] [--level ${logLevels.join('|')}] [--since <15m|2h|3d|ISO time>]\nThe folder comes from --dir or BRIDGE_LOG_DIR.\n`,
  )
  process.exit(2)
}
for (const entry of readLogs(dir, { requestId: values.request, level, since }))
  process.stdout.write(`${formatEntry(entry)}\n`)
