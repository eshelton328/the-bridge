// /api/artifacts (R26, R27): the Artifacts library. A URL names an artifact
// by its `ArtifactId`, never by its link. A link, a title or a description
// goes only into a 200 or 201 body, never into a log line or an error
// body; a store fault logs its errno code only.
import {
  AddArtifactRequest,
  AddArtifactResponse,
  type ArtifactMadeIn,
  ArtifactDetailResponse,
  ArtifactId,
  ArtifactsResponse,
  ArtifactsSeenRequest,
  type ChatId,
  FileArtifactRequest,
} from '@bridge/contract'
import { type Context, Hono } from 'hono'
import { type AppEnv, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { AgentPort } from '../services/agentPort.ts'
import type { Artifacts } from '../services/artifacts.ts'
import { jsonBody, jsonOnly, smallJson } from './jsonBody.ts'

export function artifactsRoutes(artifacts: Artifacts, agents: AgentPort, log: Logger) {
  const failed = (c: Context<AppEnv>, error: { readonly code: string }) => {
    log.error('artifacts store failed', { requestId: c.get('requestId'), code: error.code })
    return errorJson(c, 'internal', { message: internalMessage })
  }
  const idOf = (c: Context<AppEnv>) => ArtifactId.safeParse(c.req.param('artifact'))
  const invalid = (c: Context<AppEnv>) =>
    errorJson(c, 'invalid-input', {
      message: 'the artifact ID is not valid',
      issues: ['an artifact ID is 16 hex characters'],
    })
  const notFound = (c: Context<AppEnv>) =>
    errorJson(c, 'not-found', { path: c.req.path, message: 'no artifact has this ID' })
  /** The chat that published the artifact, when the workspace list has it now; null when herdr does not answer. */
  const madeIn = async (chat: ChatId | null): Promise<ArtifactMadeIn | null> => {
    if (chat === null) return null
    const listed = await agents.listWorkspaces()
    if (!listed.ok) return null
    for (const workspace of listed.value)
      for (const summary of workspace.chats)
        if (summary.id === chat) return { chat, workspace: workspace.id, title: summary.title, model: summary.model }
    return null
  }
  return new Hono<AppEnv>()
    .get('/', async (c) => {
      const listed = await artifacts.list()
      if (!listed.ok) return failed(c, listed.error)
      return c.json(ArtifactsResponse.parse(listed.value), 200)
    })
    .post('/', smallJson, jsonOnly, jsonBody(AddArtifactRequest), async (c) => {
      const added = await artifacts.add(c.req.valid('json'))
      if (!added.ok) return failed(c, added.error)
      const body = AddArtifactResponse.parse({ artifact: added.value.artifact })
      return added.value.added ? c.json(body, 201) : c.json(body, 200)
    })
    .post('/seen', smallJson, jsonOnly, jsonBody(ArtifactsSeenRequest), async (c) => {
      const seen = await artifacts.seen()
      if (!seen.ok) return failed(c, seen.error)
      return c.body(null, 204)
    })
    .get('/:artifact', async (c) => {
      const id = idOf(c)
      if (!id.success) return invalid(c)
      const found = await artifacts.get(id.data)
      if (!found.ok) return failed(c, found.error)
      if (found.value === 'notFound') return notFound(c)
      const body = ArtifactDetailResponse.parse({ artifact: found.value, madeIn: await madeIn(found.value.chat) })
      return c.json(body, 200)
    })
    .patch('/:artifact', smallJson, jsonOnly, jsonBody(FileArtifactRequest), async (c) => {
      const id = idOf(c)
      if (!id.success) return invalid(c)
      const filed = await artifacts.file(id.data, c.req.valid('json').project)
      if (!filed.ok) return failed(c, filed.error)
      if (filed.value === 'notFound') return notFound(c)
      return c.body(null, 204)
    })
    .delete('/:artifact', async (c) => {
      const id = idOf(c)
      if (!id.success) return invalid(c)
      const removed = await artifacts.remove(id.data)
      if (!removed.ok) return failed(c, removed.error)
      if (removed.value === 'notFound') return notFound(c)
      return c.body(null, 204)
    })
}
