// /api/workspaces: the workspaces sub-app. GET / returns the workspaces and
// their chats, checked against the contract; 502 when herdr does not answer.
import { WorkspacesResponse } from '@bridge/contract'
import { Hono } from 'hono'
import type { AgentPort } from '../services/agentPort.ts'
import { listWorkspaces } from '../services/workspaces.ts'

export function workspacesRoutes(agents: AgentPort) {
  return new Hono().get('/', async (c) => {
    const read = await listWorkspaces(agents)
    if (!read.ok) return c.json({ error: read.error.message, reason: read.error.reason }, 502)
    return c.json(WorkspacesResponse.parse(read.value), 200)
  })
}
