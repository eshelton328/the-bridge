// The-bridge server app: the auth check, then one sub-app for each area.
// Tests call it in process with app.request() (d-113); main.ts serves it.
import { Hono } from 'hono'
import { access } from './auth.ts'
import { workspacesRoutes } from './routes/workspaces.ts'
import type { AgentPort } from './services/agentPort.ts'

export type AppDeps = {
  readonly agents: AgentPort
  /** The Tailscale login of the owner, the only viewer let in through Tailscale Serve. */
  readonly owner: string
}

export function createApp({ agents, owner }: AppDeps) {
  return new Hono()
    .use(async (c, next) => {
      const allowed = access((name) => c.req.header(name), owner)
      if (!allowed.ok) return c.json({ error: allowed.reason }, 403)
      await next()
      return undefined
    })
    .route('/api/workspaces', workspacesRoutes(agents))
}

export type AppType = ReturnType<typeof createApp>
