// /api/workspaces: the workspaces sub-app. GET / returns the workspaces and
// their chats, checked against the contract; when herdr fails, an
// ErrorBody: 503 herdr-unavailable or 502 herdr-bad-reply (d-115).
import { WorkspacesResponse } from '@bridge/contract'
import { Hono } from 'hono'
import { type AppEnv, agentErrorJson } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { AgentPort } from '../services/agentPort.ts'
import { listWorkspaces } from '../services/workspaces.ts'

export function workspacesRoutes(agents: AgentPort, log: Logger) {
  return new Hono<AppEnv>().get('/', async (c) => {
    const read = await listWorkspaces(agents)
    if (!read.ok) {
      log.warn('herdr call failed', {
        requestId: c.get('requestId'),
        reason: read.error.reason,
        detail: read.error.message,
      })
      return agentErrorJson(c, read.error)
    }
    return c.json(WorkspacesResponse.parse(read.value), 200)
  })
}
