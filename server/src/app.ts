// The-bridge server app: the auth check, then one sub-app for each area.
// Tests call it in process with app.request() (d-113); main.ts serves it.
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { access } from './auth.ts'
import type { Logger } from './logger.ts'
import { eventsRoutes } from './routes/events.ts'
import { workspacesRoutes } from './routes/workspaces.ts'
import type { AgentPort } from './services/agentPort.ts'
import { createLiveEvents } from './services/liveEvents.ts'

export type AppDeps = {
  readonly agents: AgentPort
  /** The Tailscale login of the owner, the only viewer let in through Tailscale Serve. */
  readonly owner: string
  readonly log: Logger
}

export function createApp({ agents, owner, log }: AppDeps) {
  return (
    new Hono()
      // Each response carries an X-Request-Id, and the request's log line has the same ID (d-115).
      .use(requestId())
      .use(async (c, next) => {
        const start = performance.now()
        await next()
        log.info('request', {
          requestId: c.get('requestId'),
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          ms: Math.round(performance.now() - start),
        })
        return undefined
      })
      .use(async (c, next) => {
        const allowed = access((name) => c.req.header(name), owner)
        if (!allowed.ok) return c.json({ error: allowed.reason }, 403)
        await next()
        return undefined
      })
      .route('/api/workspaces', workspacesRoutes(agents))
      .route('/api/events', eventsRoutes(createLiveEvents(agents)))
  )
}

export type AppType = ReturnType<typeof createApp>
