// Starts the-bridge server on 127.0.0.1 with the herdr adapter. Every
// setting comes from the environment (config.ts). The log goes to a file
// for each day in BRIDGE_LOG_DIR and to the terminal: JSON lines, or
// readable lines when the terminal is a TTY (d-115).
import { homedir } from 'node:os'
import { serve } from '@hono/node-server'
import { createHerdrAgents } from './adapters/herdrAgents.ts'
import { createApp } from './app.ts'
import { readConfig } from './config.ts'
import { createLogger, dailyFiles, type LogSink, teeSinks } from './logger.ts'
import { formatEntry, parseLine } from './logs.ts'
import { handleProcessErrors } from './processErrors.ts'

const config = readConfig(process.env)
if (!config.ok) {
  process.stderr.write(`the-bridge server: set these environment variables:\n${config.error.join('\n')}\n`)
  process.exit(1)
}
const { port, machine, owner, herdrSocket, claudeProjects, logDir, logLevel } = config.value
const terminal: LogSink = {
  write: (line) => {
    const entry = process.stdout.isTTY ? parseLine(line) : undefined
    process.stdout.write(entry ? `${formatEntry(entry)}\n` : line)
  },
}
const log = createLogger(teeSinks(dailyFiles(logDir), terminal), logLevel).child({ machine })
handleProcessErrors(process, log)
const agents = createHerdrAgents({ socket: herdrSocket, machine, log, claudeProjects, home: homedir() })
const server = serve({ fetch: createApp({ agents, owner, log }).fetch, port, hostname: '127.0.0.1' }, (info) => {
  log.info('server started', { port: info.port })
})
server.on('error', (err) => {
  log.fatal('server error', { err })
  process.exitCode = 1
  process.exit(1)
})
