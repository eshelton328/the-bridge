// Starts the-bridge server on 127.0.0.1 with the herdr adapter. Every
// setting comes from the environment (config.ts). The log goes to a file
// for each day in BRIDGE_LOG_DIR and to the terminal: JSON lines, or
// readable lines when the terminal is a TTY (d-115).
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { serve } from '@hono/node-server'
import { createDiskPushStore } from './adapters/diskPush.ts'
import { createDiskUploads } from './adapters/diskUploads.ts'
import { createWebPushSender } from './adapters/webPushSender.ts'
import { createHerdrAgents } from './adapters/herdrAgents.ts'
import { sipsConvert } from './adapters/sipsConvert.ts'
import { createApp } from './app.ts'
import { readConfig } from './config.ts'
import { createLogger, dailyFiles, type LogSink, teeSinks } from './logger.ts'
import { formatEntry, parseLine } from './logs.ts'
import { handleProcessErrors } from './processErrors.ts'
import { createPushSeen } from './services/push.ts'
import { createPushNotifier } from './services/pushNotifier.ts'

const config = readConfig(process.env)
if (!config.ok) {
  process.stderr.write(`the-bridge server: set these environment variables:\n${config.error.join('\n')}\n`)
  process.exit(1)
}
const { port, machine, owner, herdrSocket, claudeProjects, claudeSettings, logDir, logLevel, dbFile, pushSubject } =
  config.value
const terminal: LogSink = {
  write: (line) => {
    const entry = process.stdout.isTTY ? parseLine(line) : undefined
    process.stdout.write(entry ? `${formatEntry(entry)}\n` : line)
  },
}
const log = createLogger(teeSinks(dailyFiles(logDir), terminal), logLevel).child({ machine })
handleProcessErrors(process, log)
// Uploads go beside the database, in a folder only the owner reads (slice W1b).
const uploadsRoot = join(dirname(dbFile), 'uploads')
const agents = createHerdrAgents({
  socket: herdrSocket,
  machine,
  log,
  claudeProjects,
  claudeSettings,
  home: homedir(),
  uploads: uploadsRoot,
})
const uploads = createDiskUploads({ root: uploadsRoot, convert: sipsConvert })
// The VAPID keys and push subscriptions go beside the database too, 0700 and 0600 (d-118). The notifier
// watches the chats only while a subscription is stored.
const push = createDiskPushStore(join(dirname(dbFile), 'push'))
const seen = createPushSeen()
const notifier = createPushNotifier({ agents, store: push, sender: createWebPushSender(pushSubject), seen, log })
void notifier.refresh()
const pushChanged = () => void notifier.refresh()
const server = serve(
  {
    fetch: createApp({ agents, owner, log, uploads, push, seen, pushChanged }).fetch,
    port,
    hostname: '127.0.0.1',
  },
  (info) => {
    log.info('server started', { port: info.port })
  },
)
server.on('error', (err) => {
  log.fatal('server error', { err })
  process.exitCode = 1
  process.exit(1)
})
