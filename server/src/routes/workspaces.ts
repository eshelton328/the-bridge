// /api/workspaces: the workspaces sub-app. GET / returns the workspaces and
// their chats; GET /:workspace/layout the tabs and panes of one workspace,
// with its ID URL-encoded. Each answer is checked against the contract;
// when herdr fails, an ErrorBody: 503 herdr-unavailable or 502
// herdr-bad-reply (d-115).
import { WorkspaceId, WorkspaceLayout, WorkspacesResponse } from '@bridge/contract'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { type AppEnv, agentErrorJson, errorJson } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { AgentPort, AgentPortError } from '../services/agentPort.ts'
import { listWorkspaces, readLayout } from '../services/workspaces.ts'

export function workspacesRoutes(agents: AgentPort, log: Logger) {
  const failed = (c: Context<AppEnv>, error: AgentPortError) => {
    log.warn('herdr call failed', { requestId: c.get('requestId'), reason: error.reason, detail: error.message })
    return agentErrorJson(c, error)
  }
  return new Hono<AppEnv>()
    .get('/', async (c) => {
      const read = await listWorkspaces(agents)
      if (!read.ok) return failed(c, read.error)
      return c.json(WorkspacesResponse.parse(read.value), 200)
    })
    .get('/:workspace/layout', async (c) => {
      const id = WorkspaceId.safeParse(c.req.param('workspace'))
      if (!id.success)
        return errorJson(c, 'invalid-input', {
          message: 'the workspace ID is not valid',
          issues: ['a workspace ID is <machine>/<workspace>, URL-encoded'],
        })
      const read = await readLayout(agents, id.data)
      if (!read.ok) return failed(c, read.error)
      if (read.value === null)
        return errorJson(c, 'not-found', { path: c.req.path, message: 'no workspace has this ID' })
      return c.json(WorkspaceLayout.parse(read.value), 200)
    })
}
