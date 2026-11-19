// Starts the-bridge server on 127.0.0.1 with the herdr adapter. Every
// setting comes from the environment (config.ts).
import { serve } from '@hono/node-server'
import { createHerdrAgents } from './adapters/herdrAgents.ts'
import { createApp } from './app.ts'
import { readConfig } from './config.ts'

const config = readConfig(process.env)
if (!config.ok) {
  console.error(`the-bridge server: set these environment variables:\n${config.error.join('\n')}`)
  process.exit(1)
}
const { port, machine, owner, herdrSocket, claudeProjects } = config.value
const agents = createHerdrAgents({ socket: herdrSocket, machine, claudeProjects })
serve({ fetch: createApp({ agents, owner }).fetch, port, hostname: '127.0.0.1' }, (info) => {
  console.log(`the-bridge server on http://127.0.0.1:${String(info.port)}`)
})
