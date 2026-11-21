// The-bridge server app: the auth check, then one sub-app for each area.
// Tests call it in process with app.request() (d-113); main.ts serves it.
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { err, toAppError } from '@bridge/shared'
import { type Access, access } from './auth.ts'
import { type AppEnv, errorJson, internalMessage, isPlainErrorKind } from './errors.ts'
import type { Logger } from './logger.ts'
import { createRateLimit } from './rateLimit.ts'
import { chatsRoutes } from './routes/chats.ts'
import { clientErrorsRoutes } from './routes/clientErrors.ts'
import { eventsRoutes } from './routes/events.ts'
import { uploadsRoutes } from './routes/uploads.ts'
import { workspacesRoutes } from './routes/workspaces.ts'
import type { AgentPort } from './services/agentPort.ts'
import { createLiveEvents } from './services/liveEvents.ts'
import { defaultChunkBytes, type UploadStore } from './services/uploadStore.ts'

export type AppDeps = {
  readonly agents: AgentPort
  /** The Tailscale login of the owner, the only viewer let in through Tailscale Serve. */
  readonly owner: string
  readonly log: Logger
  /** Where uploaded files wait for a chat; with none, each upload route answers 500. main.ts gives the disk store. */
  readonly uploads?: UploadStore
}

/** The store of an app with none: each call fails, so an upload answers 500 and is logged. */
const noUploads: UploadStore = {
  chunkSize: defaultChunkBytes,
  start: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
  writeChunk: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
  complete: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
  remove: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
  attachment: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
}

export function createApp({ agents, owner, log, uploads = noUploads }: AppDeps) {
  return (
    new Hono<AppEnv>()
      // Each response carries an X-Request-Id, and the request's log line has the same ID (d-115).
      .use(requestId())
      .use(async (c, next) => {
        const start = performance.now()
        await next()
        // A refused error report over the rate limit writes no line, so a crash loop cannot fill the log.
        if (c.res.status === 429) return undefined
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
        if (!allowed.ok) {
          log.warn('request refused', { requestId: c.get('requestId'), reason: allowed.reason })
          return errorJson(c, 'forbidden', { message: refusal(allowed.reason) })
        }
        await next()
        return undefined
      })
      .route('/api/workspaces', workspacesRoutes(agents, log))
      .route('/api/chats', chatsRoutes(agents, log, uploads))
      .route('/api/uploads', uploadsRoutes(uploads, log))
      .route('/api/events', eventsRoutes(createLiveEvents(agents), log))
      .route('/api/client-errors', clientErrorsRoutes(log, createRateLimit(60, 60_000)))
      .notFound((c) => errorJson(c, 'not-found', { path: c.req.path, message: 'no route has this path' }))
      // A throw that no route caught: the log gets the error and its causes, the client the request ID.
      .onError((thrown, c) => {
        const error = toAppError(thrown, isPlainErrorKind, 'internal')
        log.error('route error', { requestId: c.get('requestId'), path: c.req.path, err: thrown })
        return errorJson(c, error.kind, { message: error.kind === 'internal' ? internalMessage : error.message })
      })
  )
}

/** The client message of each refusal; the login itself never goes in a body or the log. */
function refusal(reason: Extract<Access, { ok: false }>['reason']): string {
  switch (reason) {
    case 'notOwner':
      return 'only the owner may use this server'
    case 'proxiedWithoutLogin':
      return 'requests must come through Tailscale, signed in'
    case 'unknownHost':
      return 'requests must come through Tailscale'
  }
}

export type AppType = ReturnType<typeof createApp>
