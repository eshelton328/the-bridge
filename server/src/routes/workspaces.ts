// /api/workspaces: the workspaces sub-app. GET / returns the workspaces and
// their chats, and POST / makes one with one shell (W4, 201, its name
// else "untitled"); GET /:workspace/layout the tabs and panes of one workspace,
// with its ID URL-encoded; POST /:workspace/layout/ratio sets the ratio of
// one split of one of its tabs (slice W2, 204); POST /:workspace/rename
// gives it a new label and POST /order puts the workspaces in the owner's
// order (R41, 204; 409 workspace-not-ready orderStale); POST
// /:workspace/close closes it after the owner's confirm (204; 409
// workspace-not-ready). Each answer is checked against the contract;
// when herdr fails, an ErrorBody: 503 herdr-unavailable or 502
// herdr-bad-reply (d-115).
import {
  CloseWorkspaceRequest,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  RenameWorkspaceRequest,
  SetSplitRatioRequest,
  WorkspaceId,
  WorkspaceLayout,
  WorkspaceOrderRequest,
  WorkspacesResponse,
} from '@bridge/contract'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { type AppEnv, agentErrorJson, errorJson } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { AgentPort, AgentPortError } from '../services/agentPort.ts'
import {
  closeWorkspace,
  createWorkspace,
  listWorkspaces,
  orderWorkspaces,
  readLayout,
  renameWorkspace,
} from '../services/workspaces.ts'
import { setSplitRatio } from '../services/layoutWrites.ts'
import { jsonBody, jsonLimit, jsonOnly, smallJson } from './jsonBody.ts'

/** The most bytes in an order's body: a list of every workspace, so more than a small JSON object. */
const maxOrderBytes = 65_536

export function workspacesRoutes(agents: AgentPort, log: Logger) {
  const failed = (c: Context<AppEnv>, error: AgentPortError) => {
    log.warn('herdr call failed', { requestId: c.get('requestId'), reason: error.reason, detail: error.message })
    return agentErrorJson(c, error)
  }
  const invalid = (c: Context<AppEnv>) =>
    errorJson(c, 'invalid-input', {
      message: 'the workspace ID is not valid',
      issues: ['a workspace ID is <machine>/<workspace>, URL-encoded'],
    })
  return new Hono<AppEnv>()
    .get('/', async (c) => {
      const read = await listWorkspaces(agents)
      if (!read.ok) return failed(c, read.error)
      return c.json(WorkspacesResponse.parse(read.value), 200)
    })
    .get('/:workspace/layout', async (c) => {
      const id = WorkspaceId.safeParse(c.req.param('workspace'))
      if (!id.success) return invalid(c)
      const read = await readLayout(agents, id.data)
      if (!read.ok) return failed(c, read.error)
      if (read.value === null)
        return errorJson(c, 'not-found', { path: c.req.path, message: 'no workspace has this ID' })
      return c.json(WorkspaceLayout.parse(read.value), 200)
    })
    .post('/', smallJson, jsonOnly, jsonBody(CreateWorkspaceRequest), async (c) => {
      const made = await createWorkspace(agents, c.req.valid('json').name)
      if (!made.ok) return failed(c, made.error)
      return c.json(CreateWorkspaceResponse.parse({ workspace: made.value }), 201)
    })
    .post('/order', jsonLimit(maxOrderBytes), jsonOnly, jsonBody(WorkspaceOrderRequest), async (c) => {
      const done = await orderWorkspaces(agents, c.req.valid('json').workspaces)
      if (!done.ok) return failed(c, done.error)
      if (done.value === 'done') return c.body(null, 204)
      // A workspace that closed during the write reads as a stale order too: the page reads the list again.
      return errorJson(c, 'workspace-not-ready', {
        state: 'orderStale',
        message: 'the order does not name each workspace of the list once',
      })
    })
    .post('/:workspace/close', smallJson, jsonOnly, jsonBody(CloseWorkspaceRequest), async (c) => {
      const id = WorkspaceId.safeParse(c.req.param('workspace'))
      if (!id.success) return invalid(c)
      const done = await closeWorkspace(agents, id.data, c.req.valid('json'))
      if (!done.ok) return failed(c, done.error)
      switch (done.value) {
        case 'done':
          return c.body(null, 204)
        case 'notFound':
          return errorJson(c, 'not-found', { path: c.req.path, message: 'no workspace has this ID' })
        case 'notConfirmed':
          return errorJson(c, 'invalid-input', {
            message: 'the confirm does not name this workspace',
            issues: ['confirm: must be the workspace ID'],
          })
        case 'working':
          return errorJson(c, 'workspace-not-ready', { state: 'working', message: 'a chat in it works' })
        case 'needsYou':
          return errorJson(c, 'workspace-not-ready', { state: 'needsYou', message: 'a chat in it waits for you' })
        case 'panesChanged':
          return errorJson(c, 'workspace-not-ready', {
            state: 'panesChanged',
            message: 'the workspace has other chats now',
          })
        case 'holdsServer':
          return errorJson(c, 'workspace-not-ready', {
            state: 'holdsServer',
            message: 'it runs this server or the chat that started it',
          })
        case 'group':
          return errorJson(c, 'workspace-not-ready', {
            state: 'group',
            message: 'herdr groups it with worktree workspaces',
          })
      }
    })
    .post('/:workspace/rename', smallJson, jsonOnly, jsonBody(RenameWorkspaceRequest), async (c) => {
      const id = WorkspaceId.safeParse(c.req.param('workspace'))
      if (!id.success) return invalid(c)
      const done = await renameWorkspace(agents, id.data, c.req.valid('json').name)
      if (!done.ok) return failed(c, done.error)
      if (done.value === 'notFound')
        return errorJson(c, 'not-found', { path: c.req.path, message: 'no workspace has this ID' })
      return c.body(null, 204)
    })
    .post('/:workspace/layout/ratio', smallJson, jsonOnly, jsonBody(SetSplitRatioRequest), async (c) => {
      const id = WorkspaceId.safeParse(c.req.param('workspace'))
      if (!id.success) return invalid(c)
      const { tab, path, ratio } = c.req.valid('json')
      const set = await setSplitRatio(agents, id.data, tab, path, ratio)
      if (!set.ok) return failed(c, set.error)
      if (set.value === 'notFound')
        return errorJson(c, 'not-found', { path: c.req.path, message: 'the workspace has no such tab or split' })
      return c.body(null, 204)
    })
}
