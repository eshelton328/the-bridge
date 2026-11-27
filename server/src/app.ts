// The-bridge server app: the auth check, then one sub-app for each area.
// Tests call it in process with app.request() (d-113); main.ts serves it.
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { err, toAppError } from '@bridge/shared'
import { type Access, access } from './auth.ts'
import { type AppEnv, errorJson, internalMessage, isPlainErrorKind } from './errors.ts'
import type { Logger } from './logger.ts'
import { createRateLimit } from './rateLimit.ts'
import { artifactsRoutes } from './routes/artifacts.ts'
import { filesRoutes } from './routes/files.ts'
import { inboxRoutes } from './routes/inbox.ts'
import { projectsRoutes } from './routes/projects.ts'
import { chatsRoutes } from './routes/chats.ts'
import { sidesRoutes } from './routes/sides.ts'
import { createSideAnswers } from './services/sideAnswers.ts'
import { clientErrorsRoutes } from './routes/clientErrors.ts'
import { eventsRoutes } from './routes/events.ts'
import { pushRoutes } from './routes/push.ts'
import { uploadsRoutes } from './routes/uploads.ts'
import { workspacesRoutes } from './routes/workspaces.ts'
import type { AgentPort } from './services/agentPort.ts'
import { type Artifacts, createArtifacts } from './services/artifacts.ts'
import { createFiles, type Files } from './services/files.ts'
import { createInbox, type Inbox } from './services/inbox.ts'
import { noProjects, type Projects } from './services/projects.ts'
import { createLiveEvents, type InboxWatch } from './services/liveEvents.ts'
import { createPushSeen, type PushSeen, type PushStore } from './services/push.ts'
import { defaultChunkBytes, type UploadStore } from './services/uploadStore.ts'

export type AppDeps = {
  readonly agents: AgentPort
  /** The Tailscale login of the owner, the only viewer let in through Tailscale Serve. */
  readonly owner: string
  readonly log: Logger
  /** Where uploaded files wait for a chat; with none, each upload route answers 500. main.ts gives the disk store. */
  readonly uploads?: UploadStore
  /** The push keys and subscriptions (d-118); with none, each push route but `seen` answers 500. main.ts gives the disk store. */
  readonly push?: PushStore
  /** When a page of the owner was last visible; the push sender reads it. */
  readonly seen?: PushSeen
  /** Runs after a push subscription is saved or removed. */
  readonly pushChanged?: () => void
  /** The Artifacts library (R26, R27); with none, each artifacts route answers 500. main.ts gives the disk store. */
  readonly artifacts?: Artifacts
  /** The Inbox (R20); with none, each inbox route answers 500. main.ts gives the brain and the disk marks. */
  readonly inbox?: Inbox
  /** Watches the brain's inbox folders while a client of `/api/events` is open; main.ts gives the disk watch. */
  readonly watchInbox?: InboxWatch
  /** The files a message can link to; with none, each files route answers 500. main.ts gives git's index of the brain. */
  readonly files?: Files
  /** The Projects app (f-008); with none, each projects route answers 500. main.ts gives the brain, gh, ncc and the disk stores. */
  readonly projects?: Projects
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

/** The artifacts library of an app with none: its store fails each call, and its finder finds nothing. */
const noArtifacts = (agents: AgentPort) =>
  createArtifacts({
    store: {
      load: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
      save: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
    },
    finder: { scan: () => Promise.resolve({ found: [], partial: false }) },
    machine: agents.machine,
  })

/** The Inbox of an app with none: its brain and its marks fail each call. */
const noInbox = (agents: AgentPort) =>
  createInbox({
    agents,
    brain: {
      list: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
      body: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
    },
    marks: {
      load: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
      save: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
    },
  })

/** The files of an app with none: its store fails each call. */
const noFiles = createFiles({
  list: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
  read: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
  locate: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
})

/** The push store of an app with none: each call fails. */
const noPush: PushStore = {
  keys: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
  subscriptions: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
  save: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
  remove: () => Promise.resolve(err({ reason: 'failed', code: 'no-store' })),
}

export function createApp({
  agents,
  owner,
  log,
  uploads = noUploads,
  push = noPush,
  seen = createPushSeen(),
  pushChanged,
  artifacts = noArtifacts(agents),
  inbox = noInbox(agents),
  watchInbox,
  files = noFiles,
  projects = noProjects,
}: AppDeps) {
  const live = createLiveEvents(agents, watchInbox)
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
      .route('/api/chats', sidesRoutes(createSideAnswers(agents), log))
      .route('/api/uploads', uploadsRoutes(uploads, log))
      .route('/api/events', eventsRoutes(live, log))
      .route('/api/push', pushRoutes(push, seen, log, pushChanged))
      .route('/api/artifacts', artifactsRoutes(artifacts, agents, log))
      .route('/api/inbox', inboxRoutes(inbox, log, live.inboxChanged))
      .route('/api/files', filesRoutes(files, log))
      .route('/api/projects', projectsRoutes(projects, log))
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
